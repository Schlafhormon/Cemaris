using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Application.Identity;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.NoticeDrafts;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.PersonUsageRights;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Cemaris.IntegrationTests;

public sealed class NoticeDraftLineItemTests
{
    internal static readonly Guid CaseId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    internal static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    internal sealed class Actor : ICurrentActorProvider
    {
        public ActorIdentity Current { get; } = new(TestIdentity.AdministratorId.ToString("D"), "Synthetische M3a-Prüfung", SystemRole.Administration);
    }
    internal static CreatePartyCommand Person() => new(PartyType.NaturalPerson, "M3a", "Synthetik", null,
        [new("Testweg", "1", "00000", "Teststadt", null, new(2020, 1, 1), null, true)]);
    internal static SaveNoticeDraftLineItemsCommand Input(Guid payer, string? reason = null) => new(payer, true,
        new(2026, 9, 9), new(2026, 10, 9), "SYN-M3A", "Manuell geprüfte Quelle",
        [new(null, "  Erste  ", "0.10"), new(null, "Zweite", "0.20")], reason);
    internal static CreateNoticeDraftCommand Legacy(Guid payer) => new(payer, true, NoticeDraftRules.MaximumAmount,
        new(2026, 9, 9), new(2026, 10, 9), "SYN-ALT", "Bestandsquelle");
    internal static CorrectNoticeDraftCommand LegacyCorrection(Guid payer) => new(payer, false, 12,
        new(2026, 9, 9), new(2026, 10, 9), "SYN-ALT", "Bestandsquelle", "Alte Korrektur");

    [Fact]
    public async Task SyntheticHonoursCompleteContractAndImmutableSnapshots()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var master = new SyntheticCemeteryMasterDataStore(coordinator);
        var parties = new SyntheticPersonUsageRightStore(coordinator, master);
        var store = new SyntheticNoticeDraftStore(coordinator, new SyntheticCaseReadStore(master, coordinator), parties);
        var payer = await new PersonUsageRightService(parties, new Actor(), TimeProvider.System).CreatePartyAsync(Person(), CancellationToken.None);
        await VerifyContract(new NoticeDraftService(store, new Actor(), TimeProvider.System), payer.Id);
        var id = Guid.NewGuid();
        var mutation = new NoticeDraftMutation(Guid.NewGuid(), "NoticeDraft", id, 1, "Created", null, DateTimeOffset.UtcNow, new Actor().Current);
        var initial = await store.CreateDraftAsync(id, CaseId, Legacy(payer.Id), mutation, CancellationToken.None);
        var before = store.Diagnostics;
        var failed = await store.CorrectDraftAsync(id, 1, LegacyCorrection(payer.Id), mutation with { ResultingVersion = 2, Operation = "Corrected" }, CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.StorageFailure, failed.Outcome);
        Assert.Equal(before, store.Diagnostics);
        Assert.Equal(JsonSerializer.Serialize(initial.Snapshot), JsonSerializer.Serialize(await store.FindDraftAsync(id, CancellationToken.None)));
    }

    internal static async Task VerifyContract(NoticeDraftService service, Guid payer, bool configured = false)
    {
        if (!configured) Assert.Equal(NoticeDraftMutationOutcome.Success, (await service.CreateConfigurationAsync(new("SYN-M3A", 6), CancellationToken.None)).Outcome);
        var legacy = (await service.CreateDraftAsync(CaseId, Legacy(payer), CancellationToken.None)).Snapshot!;
        Assert.Equal(NoticeDraftAmountMode.LegacyTotal, legacy.AmountMode);
        Assert.Empty(legacy.LineItems);
        Assert.Equal("9999999999999999.99", legacy.TotalAmountExact);
        var converted = await service.CorrectLineItemsAsync(legacy.Id, 1, Input(payer, "Bewusste Umstellung") with { ConversionConfirmed = true }, true, CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, converted.Outcome);
        Assert.Equal(legacy.NoticeNumber, converted.Snapshot!.NoticeNumber);
        Assert.Equal(NoticeDraftAmountMode.LegacyTotal, converted.Snapshot.Revisions[0].AmountMode);
        Assert.Equal(legacy.TotalAmountExact, converted.Snapshot.Revisions[0].TotalAmountExact);
        Assert.Empty(legacy.Revisions[0].LineItems);
        Assert.Single(legacy.Revisions);
        Assert.Equal(NoticeDraftMutationOutcome.AmountModeConflict, (await service.CorrectDraftAsync(legacy.Id, 2, LegacyCorrection(payer), CancellationToken.None)).Outcome);
        Assert.Equal(NoticeDraftMutationOutcome.AmountModeConflict, (await service.CorrectLineItemsAsync(legacy.Id, 2, Input(payer, "Doppelte Umstellung") with { ConversionConfirmed = true }, true, CancellationToken.None)).Outcome);

        var created = await service.CreateLineItemsAsync(CaseId, Input(payer), CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, created.Outcome);
        var first = created.Snapshot!;
        Assert.Equal("0.30", first.TotalAmountExact);
        Assert.Equal("Erste", first.LineItems[0].Description);
        Assert.Equal(NoticeDraftAmountMode.LineItems, first.AmountMode);
        var reversed = Input(payer, "Reihenfolge und Kopf korrigiert") with { AccountAssignment = "SYN-NEU", LineItems = first.LineItems.Reverse().Select(x => (NoticeDraftLineItemInput?)new NoticeDraftLineItemInput(x.Id, x.Description, x.AmountExact)).ToArray() };
        var changed = await service.CorrectLineItemsAsync(first.Id, 1, reversed, false, CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, changed.Outcome);
        Assert.Equal(first.LineItems[1].Id, changed.Snapshot!.LineItems[0].Id);
        Assert.Equal(Enumerable.Range(1, 2), changed.Snapshot.LineItems.Select(x => x.Position));
        Assert.Equal("SYN-NEU", changed.Snapshot.Revisions[1].AccountAssignment);
        Assert.Equal(first.LineItems, changed.Snapshot.Revisions[0].LineItems);
        Assert.Single(first.Revisions);
        Assert.Equal(NoticeDraftMutationOutcome.VersionConflict, (await service.CorrectLineItemsAsync(first.Id, 1, reversed, false, CancellationToken.None)).Outcome);
        await Assert.ThrowsAsync<NoticeDraftValidationException>(() => service.CorrectLineItemsAsync(first.Id, 2, reversed with { LineItems = [new(Guid.NewGuid(), "Fremd", "1.00")] }, false, CancellationToken.None));
        var removed = await service.CorrectLineItemsAsync(first.Id, 2, reversed with { LineItems = [new(first.LineItems[0].Id, "Nur eine", "9999999999999999.99")] }, false, CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, removed.Outcome);
        Assert.Single(removed.Snapshot!.LineItems);
        Assert.Equal(2, removed.Snapshot.Revisions[1].LineItems.Count);
        var discarded = await service.DiscardDraftAsync(first.Id, 3, new("Synthetisch verworfen"), CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, discarded.Outcome);
        Assert.Equal(removed.Snapshot.LineItems, discarded.Snapshot!.LineItems);
        Assert.Equal(4, discarded.Snapshot.Revisions.Count);
        Assert.Equal(NoticeDraftMutationOutcome.Discarded, (await service.CorrectLineItemsAsync(first.Id, 4, reversed, false, CancellationToken.None)).Outcome);
    }

    [Theory]
    [InlineData("test-admin", TestIdentity.AdministratorPassword)]
    [InlineData("test-sach", TestIdentity.CaseWorkerPassword)]
    public async Task CookieRolesStrictBindingCsrfEtagsAndOldWriteProtection(string username, string password)
    {
        await using var host = new LineItemHost();
        using var admin = host.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await admin.GetAsync($"/api/cases/{CaseId}/notice-drafts")).StatusCode);
        await admin.LoginAsync();
        (await admin.SendWithCsrfAsync(HttpMethod.Post, "/api/program-configuration/notice-number", new { financialProduct = "SYN-HTTP", runningNumberWidth = 6 })).EnsureSuccessStatusCode();
        var partyResponse = await admin.SendWithCsrfAsync(HttpMethod.Post, "/api/parties", Person());
        partyResponse.EnsureSuccessStatusCode();
        var party = (await partyResponse.Content.ReadFromJsonAsync<PartyView>(Json))!;
        using var client = host.CreateClient();
        await client.LoginAsync(username, password);
        var input = Input(party.Id);
        var route = $"/api/cases/{CaseId}/notice-drafts/line-items";
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(route, input)).StatusCode);
        foreach (var body in new object[] { new { }, input with { LineItems = null }, input with { LineItems = [] }, input with { LineItems = [null] }, input with { LineItems = [new(null, "Fehler", "0")] },
            new { input.PayerPartyId, input.PayerSelectionConfirmed, input.NoticeDate, input.DueDate, input.AccountAssignment, input.FeeReasonOrSource, input.LineItems, totalAmount = "4.00" },
            new { input.PayerPartyId, input.PayerSelectionConfirmed, input.NoticeDate, input.DueDate, input.AccountAssignment, input.FeeReasonOrSource, lineItems = new[] { new { id = (Guid?)null, description = "Vertraulicher Testtext", amount = 1.10 } } } })
        {
            var failed = await client.SendWithCsrfAsync(HttpMethod.Post, route, body);
            Assert.Equal(HttpStatusCode.BadRequest, failed.StatusCode);
            Assert.DoesNotContain("Vertraulicher Testtext", await failed.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        }
        var response = await client.SendWithCsrfAsync(HttpMethod.Post, route, input);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var saved = (await response.Content.ReadFromJsonAsync<NoticeDraftView>(Json))!;
        Assert.Equal($"\"{saved.Version}\"", response.Headers.ETag!.ToString());
        Assert.Equal("0.30", saved.TotalAmountExact);
        var correctionRoute = $"/api/notice-drafts/{saved.Id}/line-item-corrections";
        foreach (var (etag, status) in new (string?, HttpStatusCode)[] { (null, (HttpStatusCode)428), ("W/\"1\"", HttpStatusCode.BadRequest), ("\"99\"", HttpStatusCode.PreconditionFailed) })
            Assert.Equal(status, (await client.SendWithCsrfAsync(HttpMethod.Post, correctionRoute, input with { Reason = "Geprüft" }, etag)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/notice-drafts/{saved.Id}/corrections", LegacyCorrection(party.Id), "\"1\"")).StatusCode);
        var corrected = await client.SendWithCsrfAsync(HttpMethod.Post, correctionRoute, input with { Reason = "Geprüft" }, "\"1\"");
        Assert.Equal(HttpStatusCode.OK, corrected.StatusCode);
        Assert.Equal("\"2\"", corrected.Headers.ETag!.ToString());
        Assert.Contains("line-item-corrections", await admin.GetStringAsync("/openapi/v1.json"), StringComparison.Ordinal);
    }

    [Fact]
    public async Task DisabledCapabilityDoesNotExposeMutationRoutes()
    {
        await using var host = new LineItemHost(enabled: false);
        using var client = host.CreateClient();
        await client.LoginAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/notice-drafts/line-items", Input(Guid.NewGuid()))).StatusCode);
        Assert.DoesNotContain("line-item-corrections", await client.GetStringAsync("/openapi/v1.json"), StringComparison.Ordinal);
    }

    [Fact]
    public async Task FreshIsolatedHostKeepsAllCapabilitiesDisabled()
    {
        using var root = new CookieIdentityWebApplicationFactory();
        await using var host = root.WithWebHostBuilder(builder => builder.UseSetting("IntegrationTests:Overrides:Features:CaseEditingEnabled", "false"));
        using var client = host.CreateClient();
        (await client.GetAsync("/health")).EnsureSuccessStatusCode();
        using var info = JsonDocument.Parse(await client.GetStringAsync("/api/system/info"));
        var flags = info.RootElement.EnumerateObject().Where(x => x.Name.EndsWith("Enabled", StringComparison.Ordinal)).ToArray();
        Assert.Equal(9, flags.Length); Assert.All(flags, x => Assert.False(x.Value.GetBoolean()));
        await client.LoginAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/cases/{CaseId}/notice-drafts")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/notice-drafts/line-items", Input(Guid.NewGuid()))).StatusCode);
    }

    [Theory]
    [InlineData("Production", "true")]
    [InlineData("Development", "false")]
    public void CapabilityRequiresDevelopmentAndExistingDraftEditing(string environment, string editing)
    {
        using var root = new LineItemHost();
        using var host = root.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment(environment);
            builder.UseSetting("IntegrationTests:Overrides:Features:NoticeDraftEditingEnabled", editing);
        });
        Assert.Throws<InvalidOperationException>(() => host.CreateClient());
    }
}

internal sealed class LineItemHost(string? connectionString = null, bool enabled = true) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseIsolatedCemarisSettings(new Dictionary<string, string?>
        {
            ["ReadModel:Provider"] = connectionString is null ? "Synthetic" : "SqlServer",
            ["Features:PersonUsageRightsEditingEnabled"] = "true",
            ["Features:NoticeDraftEditingEnabled"] = "true",
            ["Features:NoticeDraftLineItemsEnabled"] = enabled.ToString(),
        });
        builder.ConfigureServices(services =>
        {
            TestIdentity.ConfigureAccounts(services);
            if (connectionString is null) return;
            services.RemoveAll<CemarisDbContext>();
            services.RemoveAll<DbContextOptions<CemarisDbContext>>();
            services.AddDbContext<CemarisDbContext>(options => options.UseSqlServer(connectionString));
        });
    }
}
