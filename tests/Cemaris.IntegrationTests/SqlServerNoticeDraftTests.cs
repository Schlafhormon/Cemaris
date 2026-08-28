using Cemaris.Application.Identity;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Application.NoticeGeneration;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure.NoticeDrafts;
using Cemaris.Infrastructure.NoticeGeneration;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Cemeteries;
using Cemaris.Infrastructure.Persistence.Identity;
using Cemaris.Infrastructure.Persistence.NoticeDrafts;
using Cemaris.Infrastructure.Persistence.PersonUsageRights;
using Cemaris.Infrastructure.Persistence.ReadModel;
using Cemaris.Infrastructure.PersonUsageRights;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerNoticeDraftTests(SqlServerIntegrationFixture fixture)
    : IClassFixture<SqlServerIntegrationFixture>
{
    [SqlServerFact]
    public async Task EfProviderReadsOneCompleteCanonicalGenerationSourceAndStoresOnlyAuditWhitelist()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(fixture.DatabaseConnectionString).Options;
        await using var db = new CemarisDbContext(options);
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
        var store = new EfNoticeGenerationStore(db, new ManualTimeProvider(now));
        var source = await store.ReadSourceAsync(draftId, 1, burialId, legal.Id, actorId, CancellationToken.None);
        Assert.Equal(NoticeGenerationSourceOutcome.Found, source.Outcome); Assert.Equal("SQL-Teststadt", source.Source?.PayerCity);
        var audit = new NoticeGenerationAudit(Guid.NewGuid(), caseId, draftId, 1, actorId, now, NoticeGenerationFormat.Docx, legal.Id, 2, true, null);
        await store.SaveAuditAsync(audit, CancellationToken.None);
        var saved = await db.NoticeGenerationAudits.SingleAsync(x => x.Id == audit.Id);
        Assert.True(saved.Succeeded); Assert.Null(saved.ErrorCode); Assert.Equal("docx", saved.Format);
    }

    [SqlServerFact]
    public async Task CanonicalFlowAllocatesConcurrentlyAndAtomicallyWithoutChangingLegacyProjection()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer(fixture.DatabaseConnectionString)
            .Options;
        var actor = new ActorProvider();
        var clock = new ManualTimeProvider(new(2026, 8, 26, 12, 0, 0, TimeSpan.Zero));
        Guid caseId;
        Guid payerId;
        Guid configurationId;
        int legacyNoticesBefore;

        await using (var setup = new CemarisDbContext(options))
        {
            caseId = await setup.Cases.AsNoTracking().OrderBy(x => x.Id).Select(x => x.Id).FirstAsync();
            legacyNoticesBefore = await setup.Notices.CountAsync();
            var party = await new PersonUsageRightService(new EfPersonUsageRightStore(setup), actor, clock)
                .CreatePartyAsync(Person(), CancellationToken.None);
            Assert.Equal(PersonUsageRightMutationOutcome.Success, party.Outcome);
            payerId = party.Id;
            var configuration = await new NoticeDraftService(new EfNoticeDraftStore(setup), actor, clock)
                .CreateConfigurationAsync(new("SYN-SQL-6B", 6), CancellationToken.None);
            Assert.Equal(NoticeDraftMutationOutcome.Success, configuration.Outcome);
            configurationId = configuration.Id;
        }

        var competing = await Task.WhenAll(
            CreateDraftAsync(options, actor, clock, caseId, payerId, 100m),
            CreateDraftAsync(options, actor, clock, caseId, payerId, 200m));
        Assert.All(competing, result => Assert.Equal(NoticeDraftMutationOutcome.Success, result.Outcome));

        await using (var verification = new CemarisDbContext(options))
        {
            var drafts = await verification.NoticeDrafts.AsNoTracking().OrderBy(x => x.RunningNumber).ToArrayAsync();
            Assert.Equal([1, 2], drafts.Select(x => x.RunningNumber));
            Assert.Equal(2, drafts.Select(x => x.NoticeNumber).Distinct(StringComparer.Ordinal).Count());
            Assert.All(drafts, x =>
            {
                Assert.Equal("SYN-SQL-6B", x.FinancialProductSnapshot);
                Assert.Equal(NoticeDraftRules.Currency, x.Currency);
                Assert.Equal(1, x.Version);
            });
            Assert.Equal(2, await verification.NoticeDraftRevisions.CountAsync());
            Assert.Equal(2, await verification.NoticeDraftAudits.CountAsync());
            Assert.Equal(2, (await verification.NoticeNumberSequences.SingleAsync(x => x.Year == 2026)).LastIssuedNumber);
            Assert.Equal(legacyNoticesBefore, await verification.Notices.CountAsync());
        }

        Guid firstId;
        string firstNumber;
        await using (var mutations = new CemarisDbContext(options))
        {
            var service = new NoticeDraftService(new EfNoticeDraftStore(mutations), actor, clock);
            var first = await mutations.NoticeDrafts.AsNoTracking().OrderBy(x => x.RunningNumber).FirstAsync();
            firstId = first.Id;
            firstNumber = first.NoticeNumber;
            var changedConfiguration = await service.ChangeConfigurationAsync(
                configurationId,
                1,
                new("SYN-SQL-NEU", 7, "Prospektive SQL-Teständerung"),
                CancellationToken.None);
            Assert.Equal(NoticeDraftMutationOutcome.Success, changedConfiguration.Outcome);
            var corrected = await service.CorrectDraftAsync(
                first.Id,
                first.Version,
                new(payerId, false, 125m, new(2026, 8, 27), new(2026, 9, 27), "SYN-SQL-KORR", "Synthetische korrigierte Quelle", "Synthetische SQL-Korrektur"),
                CancellationToken.None);
            Assert.Equal(NoticeDraftMutationOutcome.Success, corrected.Outcome);
            var third = await service.CreateDraftAsync(caseId, Draft(payerId, 300m), CancellationToken.None);
            Assert.Equal(NoticeDraftMutationOutcome.Success, third.Outcome);
        }

        await using (var verification = new CemarisDbContext(options))
        {
            var first = await new EfNoticeDraftStore(verification).FindDraftAsync(firstId, CancellationToken.None);
            Assert.Equal(firstNumber, first?.NoticeNumber);
            Assert.Equal("SYN-SQL-6B", first?.FinancialProductSnapshot);
            Assert.Equal(2, first?.Revisions.Count);
            var third = await verification.NoticeDrafts.AsNoTracking().SingleAsync(x => x.RunningNumber == 3);
            Assert.Equal("SYN-SQL-NEU", third.FinancialProductSnapshot);
            Assert.EndsWith("0000003", third.NoticeNumber, StringComparison.Ordinal);
            Assert.Equal(4, await verification.NoticeDraftAudits.CountAsync());
            Assert.Equal(4, await verification.NoticeDraftRevisions.CountAsync());
            Assert.Equal(2, await verification.NoticeNumberConfigurationRevisions.CountAsync());
            Assert.Equal(2, await verification.NoticeNumberConfigurationAudits.CountAsync());
            Assert.Equal(legacyNoticesBefore, await verification.Notices.CountAsync());

            await Assert.ThrowsAsync<SqlException>(() => verification.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE [NoticeDrafts] SET [Currency] = N'USD' WHERE [Id] = {firstId}"));
        }

        await using (var final = new CemarisDbContext(options))
        {
            Assert.Equal("EUR", (await final.NoticeDrafts.AsNoTracking().SingleAsync(x => x.Id == firstId)).Currency);
            Assert.Equal(legacyNoticesBefore, await final.Notices.CountAsync());
        }
    }

    private static async Task<NoticeDraftMutationResult> CreateDraftAsync(
        DbContextOptions<CemarisDbContext> options,
        ActorProvider actor,
        TimeProvider clock,
        Guid caseId,
        Guid payerId,
        decimal amount)
    {
        await using var context = new CemarisDbContext(options);
        return await new NoticeDraftService(new EfNoticeDraftStore(context), actor, clock)
            .CreateDraftAsync(caseId, Draft(payerId, amount), CancellationToken.None);
    }

    private static CreateNoticeDraftCommand Draft(Guid payerId, decimal amount) => new(
        payerId,
        true,
        amount,
        new(2026, 8, 26),
        new(2026, 9, 26),
        "SYN-SQL-KONTO",
        "Synthetische SQL-Gebührenquelle");

    private static CreatePartyCommand Person() => new(
        PartyType.NaturalPerson,
        "Synthetik",
        "SQL-Zahlungspflichtig",
        null,
        [new("SQL-Synthetikweg", "1", "00000", "SQL-Teststadt", null, new(2020, 1, 1), null, true)]);

    private sealed class ActorProvider : ICurrentActorProvider
    {
        public ActorIdentity Current { get; } = new(
            "synthetic-sql-6b-actor",
            "Synthetische SQL-6b-Administration",
            SystemRole.Administration);
    }

    private sealed class ManualTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
