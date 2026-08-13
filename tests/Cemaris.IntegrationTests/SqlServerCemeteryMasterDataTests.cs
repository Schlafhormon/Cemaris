using Cemaris.Application.Cases;
using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Domain.Cemeteries;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerCemeteryMasterDataTests(SqlServerIntegrationFixture fixture)
    : IClassFixture<SqlServerIntegrationFixture>
{
    [SqlServerFact]
    public async Task StorePersistsHierarchyConstraintsSparseAuditAndLiveCaseProjection()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(fixture.DatabaseConnectionString).Options;
        await using var db = new CemarisDbContext(options);
        var store = new EfCemeteryMasterDataStore(db);
        var service = new CemeteryMasterDataService(store, new ActorProvider(), TimeProvider.System);

        var cemetery = await service.SaveCemeteryAsync(null, null, new("Synthetischer SQL-Friedhof", "SYN-SQL-C", null, null, true), CancellationToken.None);
        var graveType = await service.SaveGraveTypeAsync(null, null, new("Synthetische SQL-Grabart", "SYN-SQL-GT", BurialForm.Mixed, null, true), CancellationToken.None);
        var assignment = await service.SaveCemeteryGraveTypeAsync(null, null, new(cemetery.Id, graveType.Id, true), CancellationToken.None);
        var site = await service.SaveGraveSiteAsync(null, null, new(cemetery.Id, null, null, null, graveType.Id, "SYN-1", GraveSiteStatus.Available, false, null, 2, null, true), CancellationToken.None);

        Assert.All([cemetery, graveType, assignment, site], result => Assert.Equal(CemeteryMasterDataMutationOutcome.Success, result.Outcome));
        Assert.Equal(4, await db.CemeteryMasterDataChanges.CountAsync(x => x.ActorId == ActorProvider.Id));
        Assert.DoesNotContain(await db.CemeteryMasterDataChanges.ToArrayAsync(), x => x.ActorDisplayName.Contains("SYN-1", StringComparison.Ordinal));

        var duplicate = await service.SaveGraveSiteAsync(null, null, new(cemetery.Id, null, null, null, graveType.Id, " syn-1 ", GraveSiteStatus.Available, false, null, null, null, true), CancellationToken.None);
        Assert.Equal(CemeteryMasterDataMutationOutcome.Duplicate, duplicate.Outcome);
        Assert.Equal(4, await db.CemeteryMasterDataChanges.CountAsync(x => x.ActorId == ActorProvider.Id));

        var caseStore = new EfCaseWriteStore(db);
        var caseService = new CaseWriteService(caseStore, new EfCaseReadStore(db), new ActorProvider(), TimeProvider.System, store);
        var createdCase = await caseService.CreateAsync(new(null, null, null, site.Id), CancellationToken.None);
        Assert.Equal(site.Id, createdCase.Grave.GraveSiteId);

        var renamed = await service.SaveCemeteryAsync(cemetery.Id, cemetery.Version, new("Umbenannter synthetischer SQL-Friedhof", "SYN-SQL-C", null, null, true), CancellationToken.None);
        Assert.Equal(CemeteryMasterDataMutationOutcome.Success, renamed.Outcome);
        db.ChangeTracker.Clear();
        var projected = await new EfCaseReadStore(db).FindAsync(createdCase.Id, CancellationToken.None);
        Assert.Equal("Umbenannter synthetischer SQL-Friedhof", projected?.Grave.Cemetery);

        var occupied = await service.SaveGraveSiteAsync(site.Id, site.Version, new(cemetery.Id, null, null, null, graveType.Id, "SYN-1", GraveSiteStatus.Occupied, false, null, 2, null, true), CancellationToken.None);
        await Assert.ThrowsAsync<CemeteryMasterDataValidationException>(() => service.SaveGraveSiteAsync(site.Id, occupied.Version, new(cemetery.Id, null, null, null, graveType.Id, "SYN-1", GraveSiteStatus.Available, false, null, 2, null, true), CancellationToken.None));

        var deleteUsedSite = await service.DeleteAsync(CemeteryMasterDataKind.GraveSite, site.Id, occupied.Version, CancellationToken.None);
        Assert.Equal(CemeteryMasterDataMutationOutcome.InUse, deleteUsedSite.Outcome);
    }

    private sealed class ActorProvider : ICurrentActorProvider
    {
        internal const string Id = "synthetic-sql-master-data-actor";
        public ActorIdentity Current { get; } = new(Id, "Synthetischer SQL-Stammdatenakteur", SystemRole.Administration);
    }
}
