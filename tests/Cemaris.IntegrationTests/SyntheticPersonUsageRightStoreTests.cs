using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Cemeteries;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.PersonUsageRights;

namespace Cemaris.IntegrationTests;

public sealed class SyntheticPersonUsageRightStoreTests
{
    [Fact]
    public async Task FullManualFlowKeepsRevisionsSnapshotEtagsAndDuplicateConfirmation()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var masterStore = new SyntheticCemeteryMasterDataStore(coordinator);
        var actor = new ActorProvider();
        var master = new CemeteryMasterDataService(masterStore, actor, TimeProvider.System);
        var cemetery = await master.SaveCemeteryAsync(null, null, new("Synthetischer 5b-Friedhof", "SYN-5B", null, null, true), CancellationToken.None);
        var type = await master.SaveGraveTypeAsync(null, null, new("Synthetische 5b-Grabart", "SYN-5B", BurialForm.Mixed, null, true), CancellationToken.None);
        await master.SaveCemeteryGraveTypeAsync(null, null, new(cemetery.Id, type.Id, true), CancellationToken.None);
        var grave = await master.SaveGraveSiteAsync(null, null, new(cemetery.Id, null, null, null, type.Id, "SYN-5B-1", GraveSiteStatus.Available, false, null, null, null, true), CancellationToken.None);
        var service = new PersonUsageRightService(new SyntheticPersonUsageRightStore(coordinator, masterStore), actor, TimeProvider.System);

        var rule = await service.SaveStartRuleAsync(null, null, new(cemetery.Id, "SYN-URKUNDE", "Synthetische Urkundenübergabe"), CancellationToken.None);
        var first = await service.CreatePartyAsync(Person("Synthetik", "Erst", false), CancellationToken.None);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, first.Outcome);
        var warning = await service.CreatePartyAsync(Person(" synthetik ", " erst ", false), CancellationToken.None);
        Assert.Equal(PersonUsageRightMutationOutcome.PossibleDuplicate, warning.Outcome);
        var second = await service.CreatePartyAsync(Person("synthetik", "erst", true), CancellationToken.None);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, second.Outcome);

        var created = await service.CreateUsageRightAsync(new(grave.Id, first.Id, new(2026, 9, 1), new(2056, 9, 1), "SYN-REF-1001"), CancellationToken.None);
        var changedRule = await service.SaveStartRuleAsync(rule.Id, rule.Version, new(cemetery.Id, "SYN-NEU", "Synthetischer neuer Bezug", "Konfiguration aktualisiert"), CancellationToken.None);
        var transferred = await service.TransferUsageRightAsync(created.Id, created.Version, new(second.Id, new(2027, 1, 1), "Synthetischer Inhaberwechsel"), CancellationToken.None);
        var stale = await service.ExtendUsageRightAsync(created.Id, created.Version, new(new(2057, 9, 1), "Veralteter Versuch"), CancellationToken.None);
        Assert.Equal(PersonUsageRightMutationOutcome.VersionConflict, stale.Outcome);
        var extended = await service.ExtendUsageRightAsync(created.Id, transferred.Version, new(new(2057, 9, 1), "Manuelle Verlängerung"), CancellationToken.None);
        var view = await service.FindUsageRightAsync(created.Id, CancellationToken.None);

        Assert.Equal(PersonUsageRightMutationOutcome.Success, changedRule.Outcome);
        Assert.Equal(extended.Version, view?.Version);
        Assert.Equal("SYN-URKUNDE", view?.StartRuleCodeSnapshot);
        Assert.Equal(2, view?.HolderPeriods.Count);
        Assert.Single(view!.HolderPeriods, x => x.ValidUntilExclusive is null);
        Assert.Equal(3, view.Revisions.Count);
    }

    private static CreatePartyCommand Person(string first, string last, bool confirm) => new(
        PartyType.NaturalPerson, first, last, null,
        [new("Synthetikweg", "1", "00000", "Teststadt", null, new(2020, 1, 1), null, true)], confirm);

    private sealed class ActorProvider : ICurrentActorProvider
    {
        public ActorIdentity Current { get; } = new("synthetic-5b-actor", "Synthetische 5b-Sachbearbeitung", SystemRole.Administration);
    }
}
