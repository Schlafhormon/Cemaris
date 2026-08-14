using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Cemeteries;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.PersonUsageRights;
using Cemaris.Infrastructure.PersonUsageRights;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerPersonUsageRightTests(SqlServerIntegrationFixture fixture) : IClassFixture<SqlServerIntegrationFixture>
{
    [SqlServerFact]
    public async Task CanonicalFlowIsAtomicConstrainedHistoricizedAndLeavesLegacyProjectionUntouched()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(fixture.DatabaseConnectionString).Options;
        await using var db = new CemarisDbContext(options);
        var actor = new ActorProvider();
        var master = new CemeteryMasterDataService(new EfCemeteryMasterDataStore(db), actor, TimeProvider.System);
        var cemetery = await master.SaveCemeteryAsync(null, null, new("Synthetischer SQL-5b-Friedhof", "SYN-SQL-5B", null, null, true), CancellationToken.None);
        var type = await master.SaveGraveTypeAsync(null, null, new("Synthetische SQL-5b-Grabart", "SYN-SQL-5B", BurialForm.Mixed, null, true), CancellationToken.None);
        await master.SaveCemeteryGraveTypeAsync(null, null, new(cemetery.Id, type.Id, true), CancellationToken.None);
        var grave = await master.SaveGraveSiteAsync(null, null, new(cemetery.Id, null, null, null, type.Id, "SYN-SQL-5B-1", GraveSiteStatus.Available, false, null, null, null, true), CancellationToken.None);
        var service = new PersonUsageRightService(new EfPersonUsageRightStore(db), actor, TimeProvider.System);
        var rule = await service.SaveStartRuleAsync(null, null, new(cemetery.Id, "SYN-URKUNDE", "Synthetische Urkundenübergabe"), CancellationToken.None);
        var first = await service.CreatePartyAsync(Person("Sql", "Eins"), CancellationToken.None);
        var second = await service.CreatePartyAsync(Person("Sql", "Zwei"), CancellationToken.None);
        var right = await service.CreateUsageRightAsync(new(grave.Id, first.Id, new(2026, 9, 1), new(2056, 9, 1), "SYN-SQL-REF"), CancellationToken.None);
        var changedRule = await service.SaveStartRuleAsync(rule.Id, rule.Version, new(cemetery.Id, "SYN-NEU", "Synthetischer neuer Bezug", "Synthetische Konfigurationsänderung"), CancellationToken.None);
        var transferred = await service.TransferUsageRightAsync(right.Id, right.Version, new(second.Id, new(2027, 1, 1), "Synthetische Übertragung"), CancellationToken.None);
        var extended = await service.ExtendUsageRightAsync(right.Id, transferred.Version, new(new(2057, 9, 1), "Synthetische Verlängerung"), CancellationToken.None);
        var view = await service.FindUsageRightAsync(right.Id, CancellationToken.None);

        Assert.Equal(PersonUsageRightMutationOutcome.Success, rule.Outcome);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, first.Outcome);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, second.Outcome);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, right.Outcome);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, changedRule.Outcome);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, transferred.Outcome);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, extended.Outcome);
        Assert.Equal(extended.Version, view?.Version);
        Assert.Equal("SYN-URKUNDE", view?.StartRuleCodeSnapshot);
        Assert.Equal(3, view?.Revisions.Count);
        Assert.Single(view!.HolderPeriods, x => x.ValidUntilExclusive is null);
        Assert.Equal(7, await db.PersonUsageRightAudits.CountAsync());
        Assert.All(await db.PersonUsageRightAudits.ToArrayAsync(), audit =>
        {
            Assert.DoesNotContain("Sql", audit.Operation, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("REF", audit.Operation, StringComparison.OrdinalIgnoreCase);
        });
        Assert.False(await db.Parties.AnyAsync(x => x.Id == Guid.Empty));
        Assert.True(fixture.LegacyBurialRemainedReadable);

        await using var competingDb = new CemarisDbContext(options);
        var competing = new PersonUsageRightService(new EfPersonUsageRightStore(competingDb), actor, TimeProvider.System);
        var duplicate = await competing.CreateUsageRightAsync(new(grave.Id, second.Id, new(2028, 1, 1), new(2058, 1, 1), "SYN-DUP"), CancellationToken.None);
        Assert.Equal(PersonUsageRightMutationOutcome.Duplicate, duplicate.Outcome);
        Assert.Equal(3, await db.UsageRightRevisions.CountAsync());
        Assert.Equal(7, await db.PersonUsageRightAudits.CountAsync());

        var existingAuditId = await db.PersonUsageRightAudits.Select(x => x.Id).FirstAsync();
        await using (var rollbackDb = new CemarisDbContext(options))
        {
            var rollbackStore = new EfPersonUsageRightStore(rollbackDb);
            var failed = await rollbackStore.ExtendUsageRightAsync(
                right.Id,
                extended.Version,
                new(new(2058, 9, 1), "Synthetisch erzwungener Rollback"),
                new(existingAuditId, "UsageRight", right.Id, extended.Version + 1, "Extended", DateTimeOffset.UtcNow, actor.Current),
                CancellationToken.None);
            Assert.Equal(PersonUsageRightMutationOutcome.Duplicate, failed.Outcome);
        }

        await using (var rollbackVerification = new CemarisDbContext(options))
        {
            var unchanged = await new EfPersonUsageRightStore(rollbackVerification).FindUsageRightAsync(right.Id, CancellationToken.None);
            Assert.Equal(extended.Version, unchanged?.Version);
            Assert.Equal(new DateOnly(2057, 9, 1), unchanged?.EndDate);
            Assert.Equal(3, unchanged?.Revisions.Count);
            Assert.Equal(7, await rollbackVerification.PersonUsageRightAudits.CountAsync());
        }

        var raceGrave = await master.SaveGraveSiteAsync(null, null, new(cemetery.Id, null, null, null, type.Id, "SYN-SQL-5B-RACE", GraveSiteStatus.Available, false, null, null, null, true), CancellationToken.None);
        using var ready = new CountdownEvent(2);
        var release = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var raceOne = InsertCompetingRightAsync(options, raceGrave.Id, rule.Id, second.Id, "SYN-RACE-1", ready, release.Task);
        var raceTwo = InsertCompetingRightAsync(options, raceGrave.Id, rule.Id, second.Id, "SYN-RACE-2", ready, release.Task);
        Assert.True(ready.Wait(TimeSpan.FromSeconds(10)));
        release.SetResult(true);
        var raceResults = await Task.WhenAll(raceOne, raceTwo);
        Assert.Single(raceResults, succeeded => succeeded);

        await using var raceVerification = new CemarisDbContext(options);
        Assert.Equal(1, await raceVerification.CanonicalUsageRights.CountAsync(x => x.GraveSiteId == raceGrave.Id));
        var raceRightId = await raceVerification.CanonicalUsageRights.Where(x => x.GraveSiteId == raceGrave.Id).Select(x => x.Id).SingleAsync();
        Assert.Equal(1, await raceVerification.UsageRightHolderPeriods.CountAsync(x => x.UsageRightId == raceRightId && x.ValidUntilExclusive == null));
    }

    [SqlServerFact]
    public async Task MigrationCreatesNoCanonicalBackfillAndDatabaseRejectsOpenHolderAndGraveDuplicates()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(fixture.DatabaseConnectionString).Options;
        await using var db = new CemarisDbContext(options);
        Assert.True(await db.Cases.AnyAsync());
        Assert.Equal(0, fixture.CanonicalPartiesAfterMigration);
        Assert.Equal(0, fixture.CanonicalUsageRightsAfterMigration);
        Assert.True(fixture.VerifiedPredecessorMigrations >= 6);
    }

    private static CreatePartyCommand Person(string first, string last) => new(PartyType.NaturalPerson, first, last, null, [new("SQL-Testweg", "1", "00000", "SQL-Teststadt", null, new(2020, 1, 1), null, true)]);

    private static async Task<bool> InsertCompetingRightAsync(
        DbContextOptions<CemarisDbContext> options,
        Guid graveSiteId,
        Guid startRuleId,
        Guid partyId,
        string sourceReference,
        CountdownEvent ready,
        Task release)
    {
        await using var context = new CemarisDbContext(options);
        var id = Guid.NewGuid();
        var entity = new UsageRightEntity
        {
            Id = id,
            GraveSiteId = graveSiteId,
            StartDate = new(2028, 1, 1),
            EndDate = new(2058, 1, 1),
            SourceReference = sourceReference,
            UsageRightStartRuleId = startRuleId,
            StartRuleCodeSnapshot = "SYN-NEU",
            StartRuleDisplayNameSnapshot = "Synthetischer neuer Bezug",
            Version = 1,
        };
        entity.HolderPeriods.Add(new() { Id = Guid.NewGuid(), UsageRightId = id, PartyId = partyId, ValidFromInclusive = entity.StartDate });
        context.CanonicalUsageRights.Add(entity);
        ready.Signal();
        await release;
        try
        {
            await context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException)
        {
            return false;
        }
    }

    private sealed class ActorProvider : ICurrentActorProvider { public ActorIdentity Current { get; } = new("synthetic-sql-5b-actor", "Synthetischer SQL-5b-Akteur", SystemRole.Administration); }
}
