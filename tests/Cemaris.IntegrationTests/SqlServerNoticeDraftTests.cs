using Cemaris.Application.Identity;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure.NoticeDrafts;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.PersonUsageRights;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerNoticeDraftTests(SqlServerIntegrationFixture fixture)
    : IClassFixture<SqlServerIntegrationFixture>
{
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
