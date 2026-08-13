using Cemaris.Application.Cases;
using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;
using Cemaris.Domain.Cemeteries;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.ReadModel;

namespace Cemaris.IntegrationTests;

public sealed class SyntheticCaseChangeStoreTests
{
    [Fact]
    public async Task AuditPersistenceFailureLeavesCaseVersionLastChangeAndFactsUnchanged()
    {
        var store = new SyntheticCaseReadStore();
        var caseId = Guid.NewGuid();
        var occurredAtUtc = new DateTimeOffset(2026, 8, 13, 8, 0, 0, TimeSpan.Zero);
        var caseRecord = CaseRecord.CreateSynthetic(
            caseId,
            GraveReference.Create("Synthetischer Rollback-Testfriedhof", null, "SYN-RB-1"));
        var createdChange = new CaseChange(
            Guid.NewGuid(),
            caseId,
            caseRecord.Version,
            occurredAtUtc,
            SyntheticDevelopmentActorProvider.Actor,
            CaseChangeOperation.CaseCreated,
            null);
        await store.CreateAsync(caseRecord, createdChange, CancellationToken.None);

        var failingChange = new CaseChange(
            createdChange.Id,
            caseId,
            caseRecord.Version.Next(),
            occurredAtUtc.AddMinutes(1),
            SyntheticDevelopmentActorProvider.Actor,
            CaseChangeOperation.GraveChanged,
            null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => store.ChangeGraveAsync(
            caseId,
            caseRecord.Version,
            GraveReference.Create("Darf nicht gespeichert werden", null, "SYN-RB-2"),
            failingChange,
            CancellationToken.None));

        var unchanged = await store.FindAsync(caseId, CancellationToken.None);
        Assert.NotNull(unchanged);
        Assert.Equal(1, unchanged.Version);
        Assert.Equal("Synthetischer Rollback-Testfriedhof", unchanged.Grave.Cemetery);
        Assert.Equal(occurredAtUtc, unchanged.LastChange?.ChangedAtUtc);
        Assert.Single(store.GetChanges(caseId));
    }

    [Fact]
    public async Task BurialAuditFailureRollsBackGravePromotionProcessStateAndVersion()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var master = new SyntheticCemeteryMasterDataStore(coordinator);
        var cases = new SyntheticCaseReadStore(master, coordinator);
        var cemeteryId = Guid.NewGuid();
        var graveTypeId = Guid.NewGuid();
        var siteId = Guid.NewGuid();
        await master.SaveCemeteryAsync(cemeteryId, null, new("Synthetischer Rollback-Friedhof", null, null, null, true), MasterChange(CemeteryMasterDataKind.Cemetery, cemeteryId), CancellationToken.None);
        await master.SaveGraveTypeAsync(graveTypeId, null, new("Synthetische Rollback-Grabart", null, BurialForm.Mixed, null, true), MasterChange(CemeteryMasterDataKind.GraveType, graveTypeId), CancellationToken.None);
        var assignmentId = Guid.NewGuid();
        await master.SaveCemeteryGraveTypeAsync(assignmentId, null, new(cemeteryId, graveTypeId, true), MasterChange(CemeteryMasterDataKind.CemeteryGraveType, assignmentId), CancellationToken.None);
        await master.SaveGraveSiteAsync(siteId, null, new(cemeteryId, null, null, null, graveTypeId, "SYN-RB-4B", GraveSiteStatus.Available, false, null, null, null, true), MasterChange(CemeteryMasterDataKind.GraveSite, siteId), CancellationToken.None);

        var processStore = (IBurialProcessStore)cases;
        var caseId = Guid.Parse("00000000-0000-0000-0000-000000000003");
        var personId = Guid.Parse("00000000-0000-0000-0000-000000001003");
        var burial = BurialProcessRecord.Create(Guid.NewGuid(), personId, siteId, BurialProcessStatus.Draft, null, null);
        var firstChangeId = Guid.NewGuid();
        var created = await processStore.CreateBurialAsync(caseId, new CaseVersion(1), burial, new DateOnly(2026, 8, 13), CaseChange(firstChangeId, caseId, 2, CaseChangeOperation.BurialDraftCreated, burial.Id), CancellationToken.None);
        Assert.Equal(BurialProcessMutationOutcome.Success, created.Outcome);
        var planned = await processStore.TransitionBurialAsync(caseId, burial.Id, new CaseVersion(2), new(BurialProcessStatus.Planned, new DateOnly(2026, 8, 14)), new DateOnly(2026, 8, 13), CaseChange(Guid.NewGuid(), caseId, 3, CaseChangeOperation.BurialPlanned, burial.Id), CancellationToken.None);
        Assert.Equal(BurialProcessMutationOutcome.Success, planned.Outcome);

        await Assert.ThrowsAsync<InvalidOperationException>(() => processStore.TransitionBurialAsync(caseId, burial.Id, new CaseVersion(3), new(BurialProcessStatus.Confirmed), new DateOnly(2026, 8, 13), CaseChange(firstChangeId, caseId, 4, CaseChangeOperation.BurialConfirmed, burial.Id), CancellationToken.None));

        var unchanged = await cases.FindAsync(caseId, CancellationToken.None);
        var site = (await master.ReadAsync(true, CancellationToken.None)).GraveSites.Single(item => item.Id == siteId);
        Assert.NotNull(unchanged);
        Assert.Equal(3, unchanged.Version);
        Assert.Equal(BurialProcessStatus.Planned, unchanged.Burials.Single(item => item.Id == burial.Id).Status);
        Assert.Equal(GraveSiteStatus.Available, site.Status);
        Assert.Equal(3, cases.GetChanges(caseId).Count);
    }

    private static CaseChange CaseChange(Guid id, Guid caseId, long version, CaseChangeOperation operation, Guid targetId) =>
        new(id, caseId, new CaseVersion(version), new DateTimeOffset(2026, 8, 13, 8, 0, 0, TimeSpan.Zero), SyntheticDevelopmentActorProvider.Actor, operation, targetId);

    private static CemeteryMasterDataChange MasterChange(CemeteryMasterDataKind kind, Guid id) =>
        new(Guid.NewGuid(), kind, id, 1, new DateTimeOffset(2026, 8, 13, 8, 0, 0, TimeSpan.Zero), SyntheticDevelopmentActorProvider.Actor, "Create");
}
