using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Api.Contracts;
using Cemaris.Application.Cases;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Application.NoticeGeneration;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Infrastructure.NoticeGeneration;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.DependencyInjection;

namespace Cemaris.IntegrationTests;

public sealed class NoticeGenerationEndpointTests(NoticeGenerationWebApplicationFactory factory)
    : IClassFixture<NoticeGenerationWebApplicationFactory>
{
    private static readonly Guid CaseId = Guid.Parse("00000000-0000-0000-0000-000000000003");
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    private static readonly string[] AuditPropertyNames = ["ActorId", "CaseId", "ErrorCode", "ExpectedNoticeDraftVersion", "Format", "Id", "LegalBasisInternalVersion", "LegalBasisVersionId", "NoticeDraftId", "OccurredAtUtc", "Succeeded"];

    [Fact]
    public async Task RunsLegallyIneffectiveDocxAndPdfFlowWithEtagsHeadersAndContentFreeAudit()
    {
        using var client = factory.CreateClient();
        var setup = await PrepareAsync(client);
        var state = factory.Services.GetRequiredService<SyntheticNoticeGenerationState>();
        var before = state.Audits.Count;

        var missingEtag = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"));
        Assert.Equal((HttpStatusCode)428, missingEtag.StatusCode);
        var weakEtag = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"), "W/\"1\"");
        Assert.Equal(HttpStatusCode.BadRequest, weakEtag.StatusCode);
        var stale = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"), "\"99\"");
        Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);

        var docx = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"), setup.DraftEtag);
        docx.EnsureSuccessStatusCode();
        Assert.Equal("application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx.Content.Headers.ContentType?.MediaType);
        Assert.Equal("no-store", docx.Headers.CacheControl?.ToString());
        Assert.Contains("attachment", docx.Content.Headers.ContentDisposition?.ToString(), StringComparison.OrdinalIgnoreCase);
        Assert.Equal("nosniff", Assert.Single(docx.Headers.GetValues("X-Content-Type-Options")));
        var docxBytes = await docx.Content.ReadAsByteArrayAsync();
        Assert.True(docxBytes.AsSpan(0, 2).SequenceEqual("PK"u8));
        using (var document = WordprocessingDocument.Open(new MemoryStream(docxBytes), false))
        {
            var text = string.Concat(document.MainDocumentPart!.Document!.Descendants<Text>().Select(x => x.Text));
            Assert.DoesNotContain("{{", text, StringComparison.Ordinal);
        }

        var pdf = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Pdf"), setup.DraftEtag);
        pdf.EnsureSuccessStatusCode();
        Assert.Equal("application/pdf", pdf.Content.Headers.ContentType?.MediaType);
        Assert.True((await pdf.Content.ReadAsByteArrayAsync()).AsSpan(0, 5).SequenceEqual("%PDF-"u8));

        var newAudits = state.Audits.Skip(before).ToArray();
        Assert.Equal(3, newAudits.Length);
        Assert.Contains(newAudits, item => !item.Succeeded && item.ErrorCode == "notice_draft_version_conflict");
        Assert.Equal(2, newAudits.Count(item => item.Succeeded));
        Assert.Equal(AuditPropertyNames,
            typeof(NoticeGenerationAudit).GetProperties().Select(x => x.Name).Order().ToArray());
    }

    [Fact]
    public async Task EnforcesAuthenticationAntiforgeryBothRolesCapabilityAndOpenApiContract()
    {
        using var client = factory.CreateClient();
        var setup = await PrepareAsync(client);

        using var withoutCsrf = await client.PostAsJsonAsync($"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"));
        Assert.Equal(HttpStatusCode.BadRequest, withoutCsrf.StatusCode);

        using var worker = factory.CreateClient();
        worker.DefaultRequestHeaders.Add("X-Cemaris-Test-Role", "Sachbearbeitung");
        Assert.Equal(HttpStatusCode.Forbidden,
            (await worker.GetAsync("/api/master-data/legal-basis-versions?activeOnly=false")).StatusCode);
        (await worker.GetAsync("/api/master-data/legal-basis-versions?activeOnly=true")).EnsureSuccessStatusCode();
        var workerResponse = await worker.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"), setup.DraftEtag);
        workerResponse.EnsureSuccessStatusCode();

        using var anonymousFactory = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultForbidScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })));
        using var anonymous = anonymousFactory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"), setup.DraftEtag)).StatusCode);

        using var disabledFactory = factory.WithWebHostBuilder(builder => builder.UseSetting(
            "IntegrationTests:Overrides:Features:NoticeGenerationEnabled", "false"));
        using var disabled = disabledFactory.CreateClient();
        Assert.Equal(HttpStatusCode.NotFound, (await disabled.PostAsJsonAsync(
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"))).StatusCode);

        using var openApi = JsonDocument.Parse(await client.GetStreamAsync("/openapi/v1.json"));
        Assert.True(openApi.RootElement.GetProperty("paths").TryGetProperty("/api/notice-drafts/{noticeDraftId}/generate", out var operation));
        Assert.Contains("rechtlich wirkungslosen", operation.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task LegalBasisMasterDataIsAdminVersionedImmutableAndPreservesOlderRows()
    {
        using var client = factory.CreateClient();
        var first = await CreateLegalBasisAsync(client, "Synthetische Satzung A", "2026-01-01");
        var second = await CreateLegalBasisAsync(client, "Synthetische Satzung A", "2026-07-01");
        Assert.NotEqual(first.Id, second.Id);
        Assert.False(first.IsActive);
        var activated = await client.SendWithCsrfAsync(HttpMethod.Put,
            $"/api/master-data/legal-basis-versions/{first.Id}/active", new { isActive = true }, "\"1\"");
        activated.EnsureSuccessStatusCode(); Assert.Equal("\"2\"", activated.Headers.ETag?.ToString());
        var stale = await client.SendWithCsrfAsync(HttpMethod.Put,
            $"/api/master-data/legal-basis-versions/{first.Id}/active", new { isActive = false }, "\"1\"");
        Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);
        var all = await client.GetFromJsonAsync<LegalBasisVersionView[]>("/api/master-data/legal-basis-versions?activeOnly=false");
        Assert.Contains(all!, item => item.Id == first.Id && item.Name == "Synthetische Satzung A" && item.VersionDate == new DateOnly(2026, 1, 1));
        Assert.Contains(all!, item => item.Id == second.Id && item.VersionDate == new DateOnly(2026, 7, 1));
    }

    [Fact]
    public async Task RejectsInvalidFormatForeignBurialInactiveBasisAndDiscardedDraftWithoutArtifact()
    {
        using var client = factory.CreateClient();
        var setup = await PrepareAsync(client);
        var state = factory.Services.GetRequiredService<SyntheticNoticeGenerationState>();
        var before = state.Audits.Count;

        var invalidFormat = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate",
            new { burialId = setup.BurialId, legalBasisVersionId = setup.LegalBasisId, format = 99 }, setup.DraftEtag);
        await AssertProblemCodeAsync(invalidFormat, HttpStatusCode.BadRequest, "notice_generation_format_invalid");
        Assert.NotEqual("application/pdf", invalidFormat.Content.Headers.ContentType?.MediaType);

        var foreignBurial = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate",
            new { burialId = Guid.NewGuid(), legalBasisVersionId = setup.LegalBasisId, format = "Docx" }, setup.DraftEtag);
        await AssertProblemCodeAsync(foreignBurial, HttpStatusCode.Conflict, "notice_generation_burial_invalid");

        var inactive = await CreateLegalBasisAsync(client, $"Synthetische inaktive Satzung {Guid.NewGuid():N}", "2026-02-01");
        var inactiveBasis = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate",
            new { burialId = setup.BurialId, legalBasisVersionId = inactive.Id, format = "Docx" }, setup.DraftEtag);
        await AssertProblemCodeAsync(inactiveBasis, HttpStatusCode.Conflict, "notice_generation_legal_basis_inactive");

        var discard = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/discard", new { reason = "Synthetischer 6c-Test" }, setup.DraftEtag);
        discard.EnsureSuccessStatusCode();
        var discarded = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"), discard.Headers.ETag!.ToString());
        await AssertProblemCodeAsync(discarded, HttpStatusCode.Conflict, "notice_draft_not_active");

        var audits = state.Audits.Skip(before).ToArray();
        Assert.Equal(3, audits.Length);
        Assert.All(audits, audit =>
        {
            Assert.False(audit.Succeeded);
            Assert.Equal(CaseId, audit.CaseId);
        });
        Assert.Contains(audits, audit => audit.ErrorCode == "notice_generation_burial_invalid");
        Assert.Contains(audits, audit => audit.ErrorCode == "notice_generation_legal_basis_inactive");
        Assert.Contains(audits, audit => audit.ErrorCode == "notice_draft_not_active");
    }

    [Fact]
    public async Task IncompleteCurrentContactProfileReturnsStableConflictAndContentFreeAudit()
    {
        using var isolatedFactory = factory.WithWebHostBuilder(_ => { });
        var accounts = isolatedFactory.Services.GetRequiredService<TestLocalAccountStore>();
        var account = await accounts.FindByIdAsync(TestIdentity.AdministratorId, CancellationToken.None);
        Assert.NotNull(account);
        var changed = await accounts.UpdateAsync(TestIdentity.AdministratorId, account.Id, account.Version,
            account.Username, account.NormalizedUsername, account.DisplayName, account.Role,
            account.FirstName, account.LastName, account.ContactPoint, account.Room, account.Phone, null,
            new DateTimeOffset(2026, 8, 28, 12, 0, 0, TimeSpan.Zero), CancellationToken.None);
        Assert.Equal(Cemaris.Application.Identity.LocalAccountOperationStatus.Success, changed.Status);

        using var client = isolatedFactory.CreateClient();
        var setup = await PrepareAsync(client);
        var state = isolatedFactory.Services.GetRequiredService<SyntheticNoticeGenerationState>();
        var response = await client.SendWithCsrfAsync(HttpMethod.Post,
            $"/api/notice-drafts/{setup.DraftId}/generate", Body(setup, "Docx"), setup.DraftEtag);

        await AssertProblemCodeAsync(response, HttpStatusCode.Conflict, "notice_generation_contact_profile_incomplete");
        var audit = Assert.Single(state.Audits);
        Assert.False(audit.Succeeded);
        Assert.Equal(CaseId, audit.CaseId);
        Assert.Equal("notice_generation_contact_profile_incomplete", audit.ErrorCode);
    }

    [Fact]
    public async Task ExistingPositionsRemainFullyRenderableWhenLineItemEditingIsDisabled()
    {
        using var isolated = factory.WithWebHostBuilder(_ => { });
        using var client = isolated.CreateClient();
        var setup = await PrepareAsync(client);
        var current = (await client.GetFromJsonAsync<NoticeDraftView>($"/api/notice-drafts/{setup.DraftId}", JsonOptions))!;
        var service = new NoticeDraftService(isolated.Services.GetRequiredService<Cemaris.Application.NoticeDrafts.INoticeDraftStore>(), new NoticeDraftLineItemTests.Actor(), TimeProvider.System);
        var converted = await service.CorrectLineItemsAsync(current.Id, 1, NoticeDraftLineItemTests.Input(current.PayerPartyId, "Synthetische vorbereitete Bestandsumstellung") with { ConversionConfirmed = true }, true, CancellationToken.None);
        Assert.Equal(Cemaris.Domain.NoticeDrafts.NoticeDraftAmountMode.LineItems, converted.Snapshot!.AmountMode);
        var info = await client.GetFromJsonAsync<Cemaris.Api.Contracts.SystemInformationResponse>("/api/system/info");
        Assert.False(info!.NoticeDraftLineItemsEnabled); Assert.True(info.NoticeGenerationEnabled);
        Assert.Equal(HttpStatusCode.NotFound, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/notice-drafts/{current.Id}/line-item-corrections", NoticeDraftLineItemTests.Input(current.PayerPartyId, "Aus"), "\"2\"")).StatusCode);
        var response = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/notice-drafts/{current.Id}/generate", Body(setup, "Docx"), "\"2\"");
        response.EnsureSuccessStatusCode();
        using var document = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(new MemoryStream(await response.Content.ReadAsByteArrayAsync()), false);
        var text = document.MainDocumentPart!.Document!.InnerText;
        Assert.Contains("Erste", text, StringComparison.Ordinal); Assert.Contains("Zweite", text, StringComparison.Ordinal);
        Assert.Contains("0,10 EUR", text, StringComparison.Ordinal); Assert.Contains("0,20 EUR", text, StringComparison.Ordinal); Assert.Contains("0,30 EUR", text, StringComparison.Ordinal);
        var after = (await client.GetFromJsonAsync<NoticeDraftView>($"/api/notice-drafts/{setup.DraftId}", JsonOptions))!;
        Assert.Equal(2, after.Version); Assert.Equal(2, after.Revisions.Count);
    }

    private static object Body(Setup setup, string format) => new { burialId = setup.BurialId, legalBasisVersionId = setup.LegalBasisId, format };

    private static async Task<Setup> PrepareAsync(HttpClient client)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var cemetery = await CreateMasterAsync(client, "cemeteries", new { name = $"Synthetischer 6c-Friedhof {suffix}", code = $"C{suffix}", isActive = true });
        var graveType = await CreateMasterAsync(client, "grave-types", new { name = $"Synthetische 6c-Grabart {suffix}", code = $"G{suffix}", burialForm = "Mixed", isActive = true });
        await CreateMasterAsync(client, "cemetery-grave-types", new { cemeteryId = cemetery, graveTypeId = graveType, isActive = true });
        var site = await CreateMasterAsync(client, "grave-sites", new { cemeteryId = cemetery, graveTypeId = graveType, graveNumber = $"SYN-6C-{suffix}", status = "Available", isBlocked = false, isActive = true });
        var current = await client.GetAsync($"/api/cases/{CaseId}"); current.EnsureSuccessStatusCode(); var etag = current.Headers.ETag!.ToString();
        var personResponse = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/deceased-persons", new { firstName = "Emil", lastName = $"Synthetik-{suffix}", birthDate = "1940-01-01", deathDate = "2026-08-01" }, etag);
        personResponse.EnsureSuccessStatusCode(); var person = (await personResponse.Content.ReadFromJsonAsync<CaseResponse>(JsonOptions))!.DeceasedPersons[^1];
        var burialResponse = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/burials", new { deceasedPersonId = person.Id, graveSiteId = site }, personResponse.Headers.ETag!.ToString());
        burialResponse.EnsureSuccessStatusCode(); var burial = (await burialResponse.Content.ReadFromJsonAsync<CaseResponse>(JsonOptions))!.Burials.Single(x => x.DeceasedPersonId == person.Id);
        var planned = await Transition(client, burial.Id, burialResponse.Headers.ETag!.ToString(), "Planned", "2026-08-20", null);
        var confirmed = await Transition(client, burial.Id, planned.Headers.ETag!.ToString(), "Confirmed", null, null);
        var performed = await Transition(client, burial.Id, confirmed.Headers.ETag!.ToString(), "Performed", null, "2026-08-20");
        performed.EnsureSuccessStatusCode();
        var payer = await CreatePartyAsync(client, suffix);
        var existingConfiguration = await client.GetAsync("/api/program-configuration/notice-number");
        if (existingConfiguration.StatusCode == HttpStatusCode.NoContent) (await client.SendWithCsrfAsync(HttpMethod.Post, "/api/program-configuration/notice-number", new { financialProduct = "SYN6C", runningNumberWidth = 6 })).EnsureSuccessStatusCode();
        var draftResponse = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/notice-drafts", new { payerPartyId = payer, payerSelectionConfirmed = true, totalAmount = 125.50m, noticeDate = "2026-08-28", dueDate = "2026-09-28", accountAssignment = "SYN-6C", feeReasonOrSource = "Synthetische manuelle Beisetzungsgebühr" });
        draftResponse.EnsureSuccessStatusCode(); var draft = (await draftResponse.Content.ReadFromJsonAsync<NoticeDraftView>(JsonOptions))!;
        var legal = await CreateLegalBasisAsync(client, $"Synthetische 6c-Satzung {suffix}", "2026-01-01");
        var activate = await client.SendWithCsrfAsync(HttpMethod.Put, $"/api/master-data/legal-basis-versions/{legal.Id}/active", new { isActive = true }, "\"1\""); activate.EnsureSuccessStatusCode();
        return new(draft.Id, draftResponse.Headers.ETag!.ToString(), burial.Id, legal.Id);
    }

    private static Task<HttpResponseMessage> Transition(HttpClient client, Guid burialId, string etag, string target, string? planning, string? actual) => client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/burials/{burialId}/transitions", new { targetStatus = target, planningDate = planning, actualBurialDate = actual }, etag);
    private static async Task<Guid> CreateMasterAsync(HttpClient client, string route, object body) { var response = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/master-data/{route}", body); response.EnsureSuccessStatusCode(); using var json = JsonDocument.Parse(await response.Content.ReadAsStreamAsync()); return json.RootElement.GetProperty("id").GetGuid(); }
    private static async Task<Guid> CreatePartyAsync(HttpClient client, string suffix) { var response = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/parties", new { partyType = "NaturalPerson", firstName = "Erika", lastName = $"Zahlungspflichtig-{suffix}", organizationName = (string?)null, addresses = new[] { new { street = "Synthetikweg", houseNumber = "1", postalCode = "00000", city = "Teststadt", additionalInformation = (string?)null, validFromInclusive = "2020-01-01", validUntilExclusive = (string?)null, isCurrentPrimary = true } } }); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<PartyView>(JsonOptions))!.Id; }
    private static async Task<LegalBasisVersionView> CreateLegalBasisAsync(HttpClient client, string name, string date) { var response = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/master-data/legal-basis-versions", new { name, versionDate = date }); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<LegalBasisVersionView>())!; }
    private static async Task AssertProblemCodeAsync(HttpResponseMessage response, HttpStatusCode status, string code) { Assert.Equal(status, response.StatusCode); using var json = JsonDocument.Parse(await response.Content.ReadAsStreamAsync()); Assert.Equal(code, json.RootElement.GetProperty("code").GetString()); }
    private sealed record Setup(Guid DraftId, string DraftEtag, Guid BurialId, Guid LegalBasisId);
}
