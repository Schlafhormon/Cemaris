using Cemaris.Application.Cases;
using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;
using Cemaris.Domain.Cemeteries;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Cemeteries;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerBurialProcessTests(SqlServerIntegrationFixture fixture)
    : IClassFixture<SqlServerIntegrationFixture>
{
    [SqlServerFact]
    public async Task ProcessMutationIsAtomicAcrossBurialGraveCaseAndSparseAudit()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(fixture.DatabaseConnectionString).Options;
        var cemeteryId = Guid.NewGuid();
        var graveTypeId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var siteId = Guid.NewGuid();
        var caseId = Guid.Parse("00000000-0000-0000-0000-000000000015");
        var personId = Guid.Parse("00000000-0000-0000-0000-000000001015");

        await using (var seed = new CemarisDbContext(options))
        {
            seed.Cemeteries.Add(new CemeteryEntity { Id = cemeteryId, Name = "Synthetischer SQL-4b-Friedhof", NormalizedName = "SYNTHETISCHER SQL-4B-FRIEDHOF", IsActive = true, Version = 1 });
            seed.GraveTypes.Add(new GraveTypeEntity { Id = graveTypeId, Name = "Synthetische SQL-4b-Grabart", NormalizedName = "SYNTHETISCHE SQL-4B-GRABART", BurialForm = "Mixed", IsActive = true, Version = 1 });
            seed.CemeteryGraveTypes.Add(new CemeteryGraveTypeEntity { Id = assignmentId, CemeteryId = cemeteryId, GraveTypeId = graveTypeId, IsActive = true, Version = 1 });
            seed.GraveSites.Add(new GraveSiteEntity { Id = siteId, CemeteryId = cemeteryId, GraveTypeId = graveTypeId, GraveNumber = "SQL-4B-1", NormalizedGraveNumber = "SQL-4B-1", Status = GraveSiteStatus.Available.ToString(), IsActive = true, Version = 1 });
            await seed.SaveChangesAsync();
        }

        Guid draftChangeId;
        Guid burialId;
        await using (var context = new CemarisDbContext(options))
        {
            var service = new BurialProcessService(new EfBurialProcessStore(context), new EfCaseReadStore(context), new ActorProvider(), new FixedTimeProvider());
            var created = await service.CreateBurialDraftAsync(caseId, 1, new CreateBurialDraftCommand(personId, siteId), CancellationToken.None);
            var burial = created.Burials.Single(item => item.Status == BurialProcessStatus.Draft);
            burialId = burial.Id;
            draftChangeId = await context.CaseChanges.Where(item => item.CaseId == caseId && item.TargetEntityId == burialId).Select(item => item.Id).SingleAsync();
        }

        await using (var failingContext = new CemarisDbContext(options))
        {
            var store = new EfBurialProcessStore(failingContext);
            var duplicateAudit = new CaseChange(draftChangeId, caseId, new CaseVersion(3), new DateTimeOffset(2026, 8, 13, 10, 0, 0, TimeSpan.Zero), ActorProvider.Identity, CaseChangeOperation.BurialPlanned, burialId);
            await Assert.ThrowsAsync<DbUpdateException>(() => store.TransitionBurialAsync(caseId, burialId, new CaseVersion(2), new TransitionBurialCommand(BurialProcessStatus.Planned, new DateOnly(2026, 8, 14)), new DateOnly(2026, 8, 13), duplicateAudit, CancellationToken.None));
        }

        await using (var verify = new CemarisDbContext(options))
        {
            var burial = await verify.Burials.AsNoTracking().SingleAsync(item => item.Id == burialId);
            var site = await verify.GraveSites.AsNoTracking().SingleAsync(item => item.Id == siteId);
            var record = await verify.Cases.AsNoTracking().SingleAsync(item => item.Id == caseId);
            Assert.Equal(BurialProcessStatus.Draft.ToString(), burial.ProcessStatus);
            Assert.Equal(GraveSiteStatus.Available.ToString(), site.Status);
            Assert.Equal(2, record.Version);
            Assert.Single(await verify.CaseChanges.Where(item => item.CaseId == caseId && item.TargetEntityId == burialId).ToArrayAsync());
        }

        await using (var context = new CemarisDbContext(options))
        {
            var service = new BurialProcessService(new EfBurialProcessStore(context), new EfCaseReadStore(context), new ActorProvider(), new FixedTimeProvider());
            var planned = await service.TransitionBurialAsync(caseId, burialId, 2, new TransitionBurialCommand(BurialProcessStatus.Planned, new DateOnly(2026, 8, 14)), CancellationToken.None);
            var confirmed = await service.TransitionBurialAsync(caseId, burialId, planned.Version, new TransitionBurialCommand(BurialProcessStatus.Confirmed), CancellationToken.None);
            var performed = await service.TransitionBurialAsync(caseId, burialId, confirmed.Version, new TransitionBurialCommand(BurialProcessStatus.Performed, ActualBurialDate: new DateOnly(2026, 8, 13)), CancellationToken.None);
            Assert.Equal(BurialProcessStatus.Performed, performed.Burials.Single(item => item.Id == burialId).Status);
        }

        await using (var verify = new CemarisDbContext(options))
        {
            Assert.Equal(GraveSiteStatus.Occupied.ToString(), (await verify.GraveSites.SingleAsync(item => item.Id == siteId)).Status);
            Assert.Equal(5, (await verify.Cases.SingleAsync(item => item.Id == caseId)).Version);
            Assert.Equal(4, await verify.CaseChanges.CountAsync(item => item.CaseId == caseId && item.TargetEntityId == burialId));
        }
    }

    private sealed class ActorProvider : ICurrentActorProvider
    {
        internal static ActorIdentity Identity { get; } = new("sql-4b-test", "Synthetische SQL-4b-Testsachbearbeitung", SystemRole.Sachbearbeitung);
        public ActorIdentity Current => Identity;
    }

    private sealed class FixedTimeProvider : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 8, 13, 10, 0, 0, TimeSpan.Zero);
    }
}
