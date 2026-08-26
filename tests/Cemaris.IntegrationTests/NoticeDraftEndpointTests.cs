using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Api.Contracts;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Infrastructure.NoticeDrafts;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.DependencyInjection;

namespace Cemaris.IntegrationTests;

public sealed class NoticeDraftEndpointTests(NoticeDraftWebApplicationFactory factory)
    : IClassFixture<NoticeDraftWebApplicationFactory>
{
    private static readonly Guid KnownCaseId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task ApiRunsCanonicalLegallyIneffectiveFlowWithEtagsRevisionsAndIsolation()
    {
        using var client = factory.CreateClient();
        var information = await client.GetFromJsonAsync<SystemInformationResponse>("/api/system/info");
        Assert.True(information?.NoticeDraftEditingEnabled);
        var readProjectionBefore = await ReadLegacyProjectionAsync(client);
        var legacySearchBefore = await client.GetStringAsync($"/api/search?noticeNumber=SYNFP.{DateTimeOffset.UtcNow.Year}000001");
        var payer = await CreatePartyAsync(client, "Synthetik", "Zahlungspflichtig");
        var replacement = await CreatePartyAsync(client, "Synthetik", "Ersatz");

        var unconfirmed = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/cases/{KnownCaseId}/notice-drafts",
            Draft(payer.Id, false, 100m));
        Assert.Equal(HttpStatusCode.BadRequest, unconfirmed.StatusCode);

        var missingConfiguration = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/cases/{KnownCaseId}/notice-drafts",
            Draft(payer.Id, true, 100m));
        await AssertProblemCodeAsync(
            missingConfiguration,
            HttpStatusCode.Conflict,
            "notice-number-configuration-missing");
        Assert.Equal((0, 0, 0, 0, 0), factory.Services.GetRequiredService<SyntheticNoticeDraftStore>().Diagnostics);

        var configurationResponse = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            "/api/program-configuration/notice-number",
            new { financialProduct = "SYNFP", runningNumberWidth = 6 });
        Assert.Equal(HttpStatusCode.Created, configurationResponse.StatusCode);
        Assert.Equal("\"1\"", configurationResponse.Headers.ETag?.ToString());
        Assert.Equal("/api/program-configuration/notice-number", configurationResponse.Headers.Location?.ToString());
        var configuration = await configurationResponse.Content.ReadFromJsonAsync<NoticeNumberConfigurationView>(JsonOptions);
        Assert.NotNull(configuration);
        Assert.Single(configuration.Revisions);

        var invalidPayer = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/cases/{KnownCaseId}/notice-drafts",
            Draft(Guid.NewGuid(), true, 100m));
        Assert.Equal(HttpStatusCode.BadRequest, invalidPayer.StatusCode);
        Assert.Equal((0, 0, 0, 1, 1), factory.Services.GetRequiredService<SyntheticNoticeDraftStore>().Diagnostics);

        var duplicateConfiguration = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            "/api/program-configuration/notice-number",
            new { financialProduct = "IGNORED", runningNumberWidth = 4 });
        await AssertProblemCodeAsync(
            duplicateConfiguration,
            HttpStatusCode.Conflict,
            "notice-number-configuration-exists");

        var createdResponse = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/cases/{KnownCaseId}/notice-drafts",
            Draft(payer.Id, true, 100.25m));
        Assert.Equal(HttpStatusCode.Created, createdResponse.StatusCode);
        Assert.Equal("\"1\"", createdResponse.Headers.ETag?.ToString());
        var created = await createdResponse.Content.ReadFromJsonAsync<NoticeDraftView>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal($"SYNFP.{DateTimeOffset.UtcNow.Year}000001", created.NoticeNumber);
        Assert.Equal(NoticeDraftStatus.Draft, created.Status);
        Assert.Equal("EUR", created.Currency);
        Assert.Equal("Synthetische Testadministration", Assert.Single(created.Revisions).ActorDisplayName);
        Assert.Equal($"/api/notice-drafts/{created.Id}", createdResponse.Headers.Location?.ToString());

        var missingEtag = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/notice-drafts/{created.Id}/corrections",
            Correction(payer.Id, false, 110m));
        Assert.Equal((HttpStatusCode)428, missingEtag.StatusCode);
        var stale = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/notice-drafts/{created.Id}/corrections",
            Correction(payer.Id, false, 110m),
            "\"99\"");
        Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);
        var changedPayerWithoutConfirmation = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/notice-drafts/{created.Id}/corrections",
            Correction(replacement.Id, false, 110m),
            "\"1\"");
        Assert.Equal(HttpStatusCode.BadRequest, changedPayerWithoutConfirmation.StatusCode);

        var correctedResponse = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/notice-drafts/{created.Id}/corrections",
            Correction(replacement.Id, true, 110m),
            "\"1\"");
        correctedResponse.EnsureSuccessStatusCode();
        Assert.Equal("\"2\"", correctedResponse.Headers.ETag?.ToString());
        var corrected = await correctedResponse.Content.ReadFromJsonAsync<NoticeDraftView>(JsonOptions);
        Assert.NotNull(corrected);
        Assert.Equal(created.NoticeNumber, corrected.NoticeNumber);
        Assert.Equal(2, corrected.Revisions.Count);
        Assert.Equal("Manuelle fachliche Korrektur", corrected.Revisions[1].Reason);

        var staleConfiguration = await client.SendWithCsrfAsync(
            HttpMethod.Put,
            $"/api/program-configuration/notice-number/{configuration.Id}",
            new { financialProduct = "SYNNEW", runningNumberWidth = 7, reason = "Prospektive Umstellung" },
            "\"99\"");
        Assert.Equal(HttpStatusCode.PreconditionFailed, staleConfiguration.StatusCode);
        var missingConfigurationEtag = await client.SendWithCsrfAsync(
            HttpMethod.Put,
            $"/api/program-configuration/notice-number/{configuration.Id}",
            new { financialProduct = "SYNNEW", runningNumberWidth = 7, reason = "Prospektive Umstellung" });
        Assert.Equal((HttpStatusCode)428, missingConfigurationEtag.StatusCode);
        var changedConfiguration = await client.SendWithCsrfAsync(
            HttpMethod.Put,
            $"/api/program-configuration/notice-number/{configuration.Id}",
            new { financialProduct = "SYNNEW", runningNumberWidth = 7, reason = "Prospektive Umstellung" },
            "\"1\"");
        changedConfiguration.EnsureSuccessStatusCode();
        Assert.Equal("\"2\"", changedConfiguration.Headers.ETag?.ToString());

        var secondResponse = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/cases/{KnownCaseId}/notice-drafts",
            Draft(payer.Id, true, 200m));
        secondResponse.EnsureSuccessStatusCode();
        var second = await secondResponse.Content.ReadFromJsonAsync<NoticeDraftView>(JsonOptions);
        Assert.NotNull(second);
        Assert.Equal($"SYNNEW.{DateTimeOffset.UtcNow.Year}0000002", second.NoticeNumber);
        Assert.Equal("SYNFP", corrected.FinancialProductSnapshot);

        var missingDiscardEtag = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/notice-drafts/{created.Id}/discard",
            new { reason = "Fehlender ETag" });
        Assert.Equal((HttpStatusCode)428, missingDiscardEtag.StatusCode);
        var staleDiscardEtag = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/notice-drafts/{created.Id}/discard",
            new { reason = "Veralteter ETag" },
            "\"1\"");
        Assert.Equal(HttpStatusCode.PreconditionFailed, staleDiscardEtag.StatusCode);

        var discardedResponse = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/notice-drafts/{created.Id}/discard",
            new { reason = "Fachlich verworfen" },
            "\"2\"");
        discardedResponse.EnsureSuccessStatusCode();
        Assert.Equal("\"3\"", discardedResponse.Headers.ETag?.ToString());
        var discarded = await discardedResponse.Content.ReadFromJsonAsync<NoticeDraftView>(JsonOptions);
        Assert.Equal(NoticeDraftStatus.Discarded, discarded?.Status);
        Assert.Equal(3, discarded?.Revisions.Count);
        var immutable = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            $"/api/notice-drafts/{created.Id}/discard",
            new { reason = "Erneuter Versuch" },
            "\"3\"");
        await AssertProblemCodeAsync(immutable, HttpStatusCode.Conflict, "notice-draft-discarded");

        var list = await client.GetFromJsonAsync<IReadOnlyList<NoticeDraftListItem>>(
            $"/api/cases/{KnownCaseId}/notice-drafts",
            JsonOptions);
        Assert.NotNull(list);
        Assert.Equal(2, list.Count);
        Assert.Equal(2, list.Select(x => x.Id).Distinct().Count());
        Assert.Equal(2, list.Select(x => x.NoticeNumber).Distinct(StringComparer.Ordinal).Count());
        Assert.Equal((2, 4, 4, 2, 2), factory.Services.GetRequiredService<SyntheticNoticeDraftStore>().Diagnostics);
        Assert.Equal(readProjectionBefore, await ReadLegacyProjectionAsync(client));
        Assert.Equal(legacySearchBefore, await client.GetStringAsync($"/api/search?noticeNumber=SYNFP.{DateTimeOffset.UtcNow.Year}000001"));

        using var openApi = JsonDocument.Parse(await client.GetStreamAsync("/openapi/v1.json"));
        var paths = openApi.RootElement.GetProperty("paths");
        Assert.True(paths.TryGetProperty("/api/cases/{caseId}/notice-drafts", out _));
        Assert.True(paths.TryGetProperty("/api/notice-drafts/{noticeDraftId}/corrections", out _));
        Assert.True(paths.TryGetProperty("/api/notice-drafts/{noticeDraftId}/discard", out _));
        Assert.True(paths.TryGetProperty("/api/program-configuration/notice-number/{configurationId}", out _));
        var openApiText = openApi.RootElement.GetRawText();
        Assert.Contains("rechtlich wirkungslos", openApiText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("draftAudits", openApiText, StringComparison.OrdinalIgnoreCase);
        var draftSchema = openApi.RootElement.GetProperty("components").GetProperty("schemas").GetProperty("NoticeDraftView").GetRawText();
        Assert.DoesNotContain("address", draftSchema, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("audit", draftSchema, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("booking", draftSchema, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("payment", draftSchema, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("dunning", draftSchema, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CapabilityPolicyAndRoleBoundariesAreClosed()
    {
        using var caseWorkerFactory = factory.WithWebHostBuilder(TestIdentity.ConfigureAutomaticCaseWorker);
        using var caseWorker = caseWorkerFactory.CreateClient();
        Assert.Equal(
            HttpStatusCode.OK,
            (await caseWorker.GetAsync($"/api/cases/{KnownCaseId}/notice-drafts")).StatusCode);
        Assert.Contains(
            (await caseWorker.GetAsync("/api/program-configuration/notice-number")).StatusCode,
            new[] { HttpStatusCode.OK, HttpStatusCode.NoContent });
        Assert.Equal(
            HttpStatusCode.Forbidden,
            (await caseWorker.SendWithCsrfAsync(
                HttpMethod.Post,
                "/api/program-configuration/notice-number",
                new { financialProduct = "FORBIDDEN", runningNumberWidth = 6 })).StatusCode);
        Assert.Equal(
            HttpStatusCode.Forbidden,
            (await caseWorker.SendWithCsrfAsync(
                HttpMethod.Put,
                $"/api/program-configuration/notice-number/{Guid.NewGuid()}",
                new { financialProduct = "FORBIDDEN", runningNumberWidth = 6, reason = "Nicht erlaubt" },
                "\"1\"")).StatusCode);
        Assert.NotEqual(
            HttpStatusCode.Forbidden,
            (await caseWorker.SendWithCsrfAsync(
                HttpMethod.Post,
                $"/api/cases/{KnownCaseId}/notice-drafts",
                Draft(Guid.NewGuid(), true, 1m))).StatusCode);
        Assert.NotEqual(
            HttpStatusCode.Forbidden,
            (await caseWorker.SendWithCsrfAsync(
                HttpMethod.Post,
                $"/api/notice-drafts/{Guid.NewGuid()}/corrections",
                Correction(Guid.NewGuid(), true, 1m),
                "\"1\"")).StatusCode);
        Assert.NotEqual(
            HttpStatusCode.Forbidden,
            (await caseWorker.SendWithCsrfAsync(
                HttpMethod.Post,
                $"/api/notice-drafts/{Guid.NewGuid()}/discard",
                new { reason = "Synthetischer Rollentest" },
                "\"1\"")).StatusCode);

        using var anonymousFactory = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            services.Configure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultForbidScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })));
        using var anonymous = anonymousFactory.CreateClient();
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await anonymous.GetAsync($"/api/cases/{KnownCaseId}/notice-drafts")).StatusCode);

        using var disabledFactory = factory.WithWebHostBuilder(builder => builder.UseSetting(
            "IntegrationTests:Overrides:Features:NoticeDraftEditingEnabled",
            "false"));
        using var disabled = disabledFactory.CreateClient();
        Assert.Equal(
            HttpStatusCode.NotFound,
            (await disabled.GetAsync($"/api/cases/{KnownCaseId}/notice-drafts")).StatusCode);
    }

    private static object Draft(Guid payerId, bool confirmed, decimal amount) => new
    {
        payerPartyId = payerId,
        payerSelectionConfirmed = confirmed,
        totalAmount = amount,
        noticeDate = "2026-08-26",
        dueDate = "2026-09-26",
        accountAssignment = "SYN-KONTO",
        feeReasonOrSource = "Synthetische manuelle Gebührenquelle",
    };

    private static object Correction(Guid payerId, bool confirmed, decimal amount) => new
    {
        payerPartyId = payerId,
        payerSelectionConfirmed = confirmed,
        totalAmount = amount,
        noticeDate = "2026-08-27",
        dueDate = "2026-09-27",
        accountAssignment = "SYN-KONTO-KORR",
        feeReasonOrSource = "Synthetisch korrigierte Gebührenquelle",
        reason = "Manuelle fachliche Korrektur",
    };

    private static async Task<PartyView> CreatePartyAsync(HttpClient client, string firstName, string lastName)
    {
        var response = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/parties", new
        {
            partyType = "NaturalPerson",
            firstName,
            lastName,
            organizationName = (string?)null,
            addresses = new[]
            {
                new
                {
                    street = "Synthetikweg",
                    houseNumber = "1",
                    postalCode = "00000",
                    city = "Teststadt",
                    additionalInformation = (string?)null,
                    validFromInclusive = "2020-01-01",
                    validUntilExclusive = (string?)null,
                    isCurrentPrimary = true,
                },
            },
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PartyView>(JsonOptions))!;
    }

    private static async Task<string> ReadLegacyProjectionAsync(HttpClient client)
    {
        using var document = JsonDocument.Parse(await client.GetStreamAsync($"/api/cases/{KnownCaseId}"));
        var root = document.RootElement;
        return root.GetProperty("notices").GetRawText();
    }

    private static async Task AssertProblemCodeAsync(
        HttpResponseMessage response,
        HttpStatusCode status,
        string code)
    {
        Assert.Equal(status, response.StatusCode);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
        Assert.Equal(code, problem.RootElement.GetProperty("code").GetString());
    }
}
