using System.Data.Common;
using Cemaris.Application.Identity;
using Cemaris.Application.NoticeGeneration;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure.NoticeGeneration;
using Cemaris.Infrastructure.Persistence.Cemeteries;
using Cemaris.Infrastructure.Persistence.Identity;
using Cemaris.Infrastructure.Persistence.PersonUsageRights;
using Cemaris.Infrastructure.Persistence.ReadModel;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Infrastructure.NoticeDrafts;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.NoticeDrafts;
using Cemaris.Infrastructure.PersonUsageRights;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using static Cemaris.IntegrationTests.NoticeDraftLineItemTests;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerNoticeDraftLineItemTests : IClassFixture<M3aSqlFixture>
{
    private readonly M3aSqlFixture fixture;
    public SqlServerNoticeDraftLineItemTests(M3aSqlFixture fixture) => this.fixture = fixture;
    private DbContextOptions<CemarisDbContext> Options(params IInterceptor[] interceptors) => new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(fixture.ConnectionString).AddInterceptors(interceptors).Options;
    private static NoticeDraftService Service(CemarisDbContext db) => new(new EfNoticeDraftStore(db), new Actor(), TimeProvider.System);

    [SqlServerFact]
    public async Task MigrationContractRacesRollbackRestartAndDisabledOldWritePaths()
    {
        await using var db = new CemarisDbContext(Options());
        var payer = (await new PersonUsageRightService(new EfPersonUsageRightStore(db), new Actor(), TimeProvider.System).CreatePartyAsync(Person(), CancellationToken.None)).Id;
        var service = Service(db);
        Assert.Equal(NoticeDraftMutationOutcome.Success, (await service.CreateConfigurationAsync(new("SYN-M3A", 6), CancellationToken.None)).Outcome);
        var legacy = (await service.CreateDraftAsync(CaseId, Legacy(payer), CancellationToken.None)).Snapshot!;
        var legacyJson = JsonSerializer.Serialize(legacy);
        var migrations = db.Database.GetMigrations().ToArray();
        await db.Database.MigrateAsync(migrations[^2]);
        await db.Database.MigrateAsync();
        Assert.Equal(legacyJson, JsonSerializer.Serialize(await service.FindDraftAsync(legacy.Id, CancellationToken.None)));
        var projection = JsonSerializer.Serialize(await new EfCaseReadStore(db).FindAsync(CaseId, CancellationToken.None));
        await VerifyContract(service, payer, configured: true);
        Assert.Equal(projection, JsonSerializer.Serialize(await new EfCaseReadStore(db).FindAsync(CaseId, CancellationToken.None)));

        for (var scenario = 0; scenario < 3; scenario++)
        {
            var current = scenario == 2 ? (await service.CreateDraftAsync(CaseId, Legacy(payer), CancellationToken.None)).Snapshot!
                : (await service.CreateLineItemsAsync(CaseId, Input(payer), CancellationToken.None)).Snapshot!;
            var barrier = new SaveBarrier();
            async Task<NoticeDraftMutationResult> Run(bool second)
            {
                await using var context = new CemarisDbContext(Options(barrier));
                var competing = Service(context);
                if (scenario == 1 && second) return await competing.DiscardDraftAsync(current.Id, 1, new("SYN-Rennen"), CancellationToken.None);
                if (scenario == 2 && second) return await competing.CorrectDraftAsync(current.Id, 1, LegacyCorrection(payer), CancellationToken.None);
                return await competing.CorrectLineItemsAsync(current.Id, 1, Input(payer, "SYN-Rennen") with { ConversionConfirmed = scenario == 2 }, scenario == 2, CancellationToken.None);
            }
            var results = await Task.WhenAll(Run(false), Run(true));
            Assert.Single(results, x => x.Outcome == NoticeDraftMutationOutcome.Success);
            Assert.Single(results, x => x.Outcome == NoticeDraftMutationOutcome.VersionConflict);
            var read = (await service.FindDraftAsync(current.Id, CancellationToken.None))!;
            Assert.Equal(2, read.Version); Assert.Equal(2, read.Revisions.Count);
        }

        var rollbackDraft = (await service.CreateLineItemsAsync(CaseId, Input(payer), CancellationToken.None)).Snapshot!;
        var before = await Snapshot();
        foreach (var target in new[] { "Position", "Revision", "Audit" })
        {
            await using (var broken = new CemarisDbContext(Options(new EvidenceFailure(target))))
                await Assert.ThrowsAsync<InvalidOperationException>(() => Service(broken).CorrectLineItemsAsync(rollbackDraft.Id, 1, Input(payer, "SYN-Fehler"), false, CancellationToken.None));
            Assert.Equal(before, await Snapshot());
            await using (var broken = new CemarisDbContext(Options(new EvidenceFailure(target))))
                await Assert.ThrowsAsync<InvalidOperationException>(() => Service(broken).CreateLineItemsAsync(CaseId, Input(payer), CancellationToken.None));
            Assert.Equal(before, await Snapshot());
        }
        // Ein echter SQL-Nachweisfehler wird kontrolliert klassifiziert und rollt Kopf und Liste zurück.
        var existingAudit = await db.NoticeDraftAudits.Select(x => x.Id).FirstAsync();
        await using (var broken = new CemarisDbContext(Options()))
        {
            var command = LegacyCorrection(payer) with { PreparedLineItems = [new(null, "SYN-A", 1), new(null, "SYN-B", 2)] };
            var result = await new EfNoticeDraftStore(broken).CorrectDraftAsync(rollbackDraft.Id, 1, command,
                new(existingAudit, "NoticeDraft", rollbackDraft.Id, 2, "Corrected", "SYN-Duplikat", DateTimeOffset.UtcNow, new Actor().Current), CancellationToken.None);
            Assert.Equal(NoticeDraftMutationOutcome.StorageFailure, result.Outcome);
        }
        Assert.Equal(before, await Snapshot());
        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE NoticeDrafts SET Version = {long.MaxValue} WHERE Id = {legacy.Id}");
        Assert.Equal(NoticeDraftMutationOutcome.VersionConflict, (await service.CorrectDraftAsync(legacy.Id, long.MaxValue, LegacyCorrection(payer), CancellationToken.None)).Outcome);
        await Restart(rollbackDraft.Id, payer);
        await VerifyGenerationRace(db);
    }

    private async Task VerifyGenerationRace(CemarisDbContext db)
    {
        var suffix = Guid.NewGuid().ToString("N"); var now = new DateTimeOffset(2026, 8, 28, 12, 0, 0, TimeSpan.Zero);
        var caseId = await db.Cases.OrderBy(x => x.Id).Select(x => x.Id).FirstAsync();
        var cemeteryId = Guid.NewGuid(); var graveTypeId = Guid.NewGuid(); var siteId = Guid.NewGuid();
        db.Cemeteries.Add(new CemeteryEntity { Id = cemeteryId, Name = $"Synthetischer SQL-6c-Friedhof {suffix}", NormalizedName = $"SQL6C{suffix}", IsActive = true, Version = 1 });
        db.GraveTypes.Add(new GraveTypeEntity { Id = graveTypeId, Name = $"Synthetische SQL-6c-Grabart {suffix}", NormalizedName = $"SQL6CG{suffix}", BurialForm = "Mixed", IsActive = true, Version = 1 });
        db.GraveSites.Add(new GraveSiteEntity { Id = siteId, CemeteryId = cemeteryId, GraveTypeId = graveTypeId, GraveNumber = $"SYN-{suffix[..8]}", NormalizedGraveNumber = $"SYN{suffix[..8]}", Status = "Occupied", IsActive = true, Version = 1 });
        var deceasedId = Guid.NewGuid(); var burialId = Guid.NewGuid();
        db.DeceasedPersons.Add(new DeceasedReadEntity { Id = deceasedId, CaseId = caseId, FirstName = "Emil", LastName = "SQL-Synthetik" });
        db.Burials.Add(new BurialReadEntity { Id = burialId, CaseId = caseId, DeceasedPersonId = deceasedId, BurialDate = new(2026, 8, 20), GraveSiteId = siteId, ProcessStatus = "Performed" });
        var partyId = Guid.NewGuid(); var addressId = Guid.NewGuid();
        var party = new PartyEntity { Id = partyId, PartyType = "NaturalPerson", FirstName = "Erika", LastName = "SQL-Zahlungspflichtig", NormalizedName = $"ERIKA SQL {suffix}", Version = 1 };
        db.Parties.Add(party); await db.SaveChangesAsync();
        db.PartyAddresses.Add(new PartyAddressEntity { Id = addressId, PartyId = partyId, Street = "SQL-Synthetikweg", HouseNumber = "1", PostalCode = "00000", City = "SQL-Teststadt", NormalizedAddress = $"SQL{suffix}", ValidFromInclusive = new(2020, 1, 1) });
        await db.SaveChangesAsync(); party.CurrentPrimaryAddressId = addressId; await db.SaveChangesAsync();
        var actorId = Guid.NewGuid();
        db.LocalAccounts.Add(new LocalAccountEntity { Id = actorId, Username = $"sql6c-{suffix}", NormalizedUsername = $"SQL6C-{suffix}", DisplayName = "SQL-6c-Testkonto", Role = "Sachbearbeitung", PasswordHash = "synthetic", IsActive = true, SecurityStamp = Guid.NewGuid(), CreatedAtUtc = now, UpdatedAtUtc = now, PasswordChangedAtUtc = now, FirstName = "Ada", LastName = "SQL", ContactPoint = "SQL-Teststelle", Room = "6c", Phone = "+49 000", Email = "sql@example.invalid" });
        var configuration = await db.NoticeNumberConfigurations.FirstOrDefaultAsync();
        if (configuration is null) { configuration = new NoticeNumberConfigurationEntity { Id = Guid.NewGuid(), SingletonKey = 1, FinancialProduct = "SQL6C", RunningNumberWidth = 6, Version = 1, CreatedAtUtc = now, UpdatedAtUtc = now }; db.Add(configuration); }
        var draftId = Guid.NewGuid();
        db.NoticeDrafts.Add(new NoticeDraftEntity { Id = draftId, CaseId = caseId, PayerPartyId = partyId, PayerDisplayNameSnapshot = "Erika SQL-Zahlungspflichtig", NoticeNumber = $"SQL6C.{suffix}", AssignmentYear = 2026, RunningNumber = 1, NoticeNumberConfigurationId = configuration.Id, NoticeNumberConfigurationVersion = configuration.Version, FinancialProductSnapshot = configuration.FinancialProduct, RunningNumberWidthSnapshot = configuration.RunningNumberWidth, TotalAmount = 125.50m, Currency = "EUR", NoticeDate = new(2026, 8, 28), DueDate = new(2026, 9, 28), AccountAssignment = "SQL-6C", FeeReasonOrSource = "Synthetische SQL-Beisetzungsgebühr", Status = "Draft", Version = 1, CreatedAtUtc = now, UpdatedAtUtc = now });
        await db.SaveChangesAsync();
        var legalStore = new EfLegalBasisVersionStore(db); var mutation = new LegalBasisMutation(Guid.NewGuid(), Guid.NewGuid(), 1, "Created", now, new(actorId.ToString("D"), "SQL-Test", SystemRole.Administration));
        var legal = await legalStore.CreateAsync(mutation.LegalBasisVersionId, $"Synthetische SQL-Satzung {suffix}", new(2026, 1, 1), mutation, CancellationToken.None);
        Assert.Equal(LegalBasisMutationOutcome.Success, legal.Outcome);
        var activated = await legalStore.SetActiveAsync(legal.Id, 1, true, mutation with { Id = Guid.NewGuid(), ResultingVersion = 2, Operation = "Activated" }, CancellationToken.None);
        Assert.Equal(LegalBasisMutationOutcome.Success, activated.Outcome);

        var converted = await Service(db).CorrectLineItemsAsync(draftId, 1, Input(partyId, "SYN-Ausgabeumstellung") with { ConversionConfirmed = true }, true, CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, converted.Outcome);
        var barrier = new GenerationBarrier();
        async Task<NoticeGenerationSourceResult> Read()
        { await using var reader = new CemarisDbContext(Options(barrier)); return await new EfNoticeGenerationStore(reader, TimeProvider.System).ReadSourceAsync(draftId, 2, burialId, legal.Id, actorId, CancellationToken.None); }
        async Task<NoticeDraftMutationResult> Correct()
        {
            await barrier.Reading.Task.WaitAsync(TimeSpan.FromSeconds(20));
            await using var writer = new CemarisDbContext(Options(new ReleaseGeneration(barrier)));
            return await Service(writer).CorrectLineItemsAsync(draftId, 2, Input(partyId, "SYN-Ausgaberennen") with { LineItems = [new(null, "Neuer Stand", "5.00")] }, false, CancellationToken.None);
        }
        var reading = Read(); var correcting = Correct();
        await Task.WhenAll(reading, correcting);
        var read = await reading;
        Assert.True(read.Outcome is NoticeGenerationSourceOutcome.Found or NoticeGenerationSourceOutcome.VersionConflict);
        if (read.Source is { } snapshot)
        {
            Assert.Equal(2, snapshot.NoticeDraftVersion);
            Assert.Equal(.30m, snapshot.TotalAmount);
            Assert.Equal(2, snapshot.LineItems.Count);
            Assert.Equal(snapshot.TotalAmount, snapshot.LineItems.Sum(x => x.Amount));
        }
        Assert.True((await correcting).Outcome is NoticeDraftMutationOutcome.Success or NoticeDraftMutationOutcome.VersionConflict);
    }

    private sealed class GenerationBarrier : DbCommandInterceptor
    {
        internal TaskCompletionSource Reading { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        internal TaskCompletionSource Writing { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public override async ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result, CancellationToken cancellationToken = default)
        {
            if (command.CommandText.Contains("NoticeDraftLineItems", StringComparison.Ordinal))
            { Reading.TrySetResult(); await Writing.Task.WaitAsync(TimeSpan.FromSeconds(20), cancellationToken); }
            return result;
        }
    }
    private sealed class ReleaseGeneration(GenerationBarrier barrier) : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        { barrier.Writing.TrySetResult(); return ValueTask.FromResult(result); }
    }

    private async Task<string> Snapshot()
    {
        await using var db = new CemarisDbContext(Options());
        return JsonSerializer.Serialize(new
        {
            Drafts = await db.NoticeDrafts.AsNoTracking().OrderBy(x => x.Id).Select(x => new { x.Id, x.Version, x.TotalAmount, x.AmountMode, x.AccountAssignment }).ToArrayAsync(),
            Lines = await db.NoticeDraftLineItems.AsNoTracking().OrderBy(x => x.Id).ToArrayAsync(),
            Revisions = await db.NoticeDraftRevisions.AsNoTracking().OrderBy(x => x.Id).ToArrayAsync(),
            RevisionLines = await db.NoticeDraftRevisionLineItems.AsNoTracking().OrderBy(x => x.NoticeDraftRevisionId).ThenBy(x => x.Position).ToArrayAsync(),
            Audits = await db.NoticeDraftAudits.AsNoTracking().OrderBy(x => x.Id).ToArrayAsync(),
            Sequences = await db.NoticeNumberSequences.AsNoTracking().OrderBy(x => x.Year).ToArrayAsync(),
        });
    }

    private async Task Restart(Guid id, Guid payer)
    {
        string saved;
        await using (var host = new LineItemHost(fixture.ConnectionString))
        {
            using var client = host.CreateClient(); await client.LoginAsync();
            var response = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/notice-drafts/{id}/line-item-corrections", Input(payer, "Vor Hostende"), "\"1\"");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            saved = await response.Content.ReadAsStringAsync();
        }
        await using (var host = new LineItemHost(fixture.ConnectionString, enabled: false))
        {
            using var client = host.CreateClient();
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync($"/api/notice-drafts/{id}")).StatusCode);
            await client.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
            var response = await client.GetAsync($"/api/notice-drafts/{id}");
            Assert.Equal(saved, await response.Content.ReadAsStringAsync()); Assert.Equal("\"2\"", response.Headers.ETag!.ToString());
            Assert.Equal(HttpStatusCode.Conflict, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/notice-drafts/{id}/corrections", LegacyCorrection(payer), "\"2\"")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/notice-drafts/{id}/line-item-corrections", Input(payer, "Aus"), "\"2\"")).StatusCode);
            var discard = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/notice-drafts/{id}/discard", new { reason = "Auch ohne Positionsbearbeitung verwerfen" }, "\"2\"");
            Assert.Equal(HttpStatusCode.OK, discard.StatusCode);
            Assert.Equal(2, (await discard.Content.ReadFromJsonAsync<NoticeDraftView>(Json))!.LineItems.Count);
        }
    }

    private sealed class EvidenceFailure(string target) : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            var added = eventData.Context!.ChangeTracker.Entries().Where(x => x.State == EntityState.Added).Select(x => x.Entity).ToArray();
            if (target == "Position" ? added.OfType<NoticeDraftLineItemEntity>().Count() >= 2 : target == "Revision" ? added.OfType<NoticeDraftRevisionEntity>().Any() : added.OfType<NoticeDraftAuditEntity>().Any())
                throw new InvalidOperationException("Synthetischer M3a-Nachweisfehler");
            return ValueTask.FromResult(result);
        }
    }
    private sealed class SaveBarrier : SaveChangesInterceptor
    {
        private int arrivals;
        private readonly TaskCompletionSource ready = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (Interlocked.Increment(ref arrivals) <= 2)
            {
                if (Volatile.Read(ref arrivals) == 2) ready.TrySetResult();
                await ready.Task.WaitAsync(TimeSpan.FromSeconds(20), cancellationToken);
            }
            return result;
        }
    }
}

public sealed class M3aSqlFixture : IAsyncLifetime
{
    private readonly string databaseName = $"Cemaris_IntegrationTests_M3a_{Guid.NewGuid():N}";
    private bool owned;
    private string master = "";
    public string ConnectionString { get; private set; } = "";
    public async Task InitializeAsync()
    {
        var configured = Environment.GetEnvironmentVariable(SqlServerFactAttribute.ConnectionStringEnvironmentVariable)
            ?? throw new InvalidOperationException("Prozesslokale SQL-Testverbindung fehlt.");
        var builder = new SqlConnectionStringBuilder(configured) { InitialCatalog = "master", Pooling = false };
        master = builder.ConnectionString;
        builder.InitialCatalog = databaseName; ConnectionString = builder.ConnectionString;
        try
        {
            await ExecuteMaster($"CREATE DATABASE [{databaseName}]"); owned = true;
            await using var db = new CemarisDbContext(new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(ConnectionString).Options);
            await db.Database.MigrateAsync();
            await new SyntheticReadModelSeeder(db).ResetAsync(databaseName, CancellationToken.None);
        }
        catch { await DisposeAsync(); throw; }
    }
    public async Task DisposeAsync()
    {
        if (!owned) return;
        if (new SqlConnectionStringBuilder(ConnectionString).InitialCatalog != databaseName) throw new InvalidOperationException("Testdatenbankidentität verändert.");
        await ExecuteMaster($"ALTER DATABASE [{databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{databaseName}]");
        owned = false;
    }
    private async Task ExecuteMaster(string sql)
    {
        await using var connection = new SqlConnection(master); await connection.OpenAsync();
        await using var command = connection.CreateCommand(); command.CommandText = sql; command.CommandTimeout = 60;
        await command.ExecuteNonQueryAsync();
    }
}
