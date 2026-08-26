using Cemaris.Application.Identity;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.NoticeDrafts;
using Cemaris.Infrastructure.PersonUsageRights;
using Cemaris.Infrastructure.ReadModel;

namespace Cemaris.IntegrationTests;

public sealed class SyntheticNoticeDraftStoreTests
{
    private static readonly Guid KnownCaseId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    [Fact]
    public async Task FullFlowKeepsNumbersSnapshotsRevisionsAuditsAndYearlySequence()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var master = new SyntheticCemeteryMasterDataStore(coordinator);
        var parties = new SyntheticPersonUsageRightStore(coordinator, master);
        var store = new SyntheticNoticeDraftStore(
            coordinator,
            new SyntheticCaseReadStore(master, coordinator),
            parties);
        var actor = new ActorProvider();
        var clock = new ManualTimeProvider(new(2026, 8, 26, 10, 0, 0, TimeSpan.Zero));
        var partyService = new PersonUsageRightService(parties, actor, clock);
        var service = new NoticeDraftService(store, actor, clock);
        var payer = await partyService.CreatePartyAsync(Person("Synthetik", "Zahlungspflichtig"), CancellationToken.None);
        var otherPayer = await partyService.CreatePartyAsync(Person("Synthetik", "Ersatz"), CancellationToken.None);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, payer.Outcome);
        Assert.Equal(PersonUsageRightMutationOutcome.Success, otherPayer.Outcome);

        var missing = await service.CreateDraftAsync(KnownCaseId, Draft(payer.Id, true, 100m), CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.ConfigurationMissing, missing.Outcome);
        Assert.Equal((0, 0, 0, 0, 0), store.Diagnostics);

        var configured = await service.CreateConfigurationAsync(new("SYNFP", 6), CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, configured.Outcome);
        var invalidReference = await service.CreateDraftAsync(KnownCaseId, Draft(Guid.NewGuid(), true, 100m), CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.InvalidReference, invalidReference.Outcome);

        var created = await service.CreateDraftAsync(KnownCaseId, Draft(payer.Id, true, 100.25m), CancellationToken.None);
        var initial = await service.FindDraftAsync(created.Id, CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, created.Outcome);
        Assert.Equal("SYNFP.2026000001", initial?.NoticeNumber);
        Assert.Equal(1, initial?.Version);
        Assert.Equal(NoticeDraftStatus.Draft, initial?.Status);
        Assert.Single(initial!.Revisions);

        var changedConfiguration = await service.ChangeConfigurationAsync(
            configured.Id,
            configured.Version,
            new("SYNNEW", 7, "Prospektive Umstellung"),
            CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, changedConfiguration.Outcome);

        var confirmationRequired = await service.CorrectDraftAsync(
            created.Id,
            created.Version,
            Correction(otherPayer.Id, false, 120m),
            CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.PayerConfirmationRequired, confirmationRequired.Outcome);

        var corrected = await service.CorrectDraftAsync(
            created.Id,
            created.Version,
            Correction(otherPayer.Id, true, 120m),
            CancellationToken.None);
        var correctedView = await service.FindDraftAsync(created.Id, CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, corrected.Outcome);
        Assert.Equal("SYNFP.2026000001", correctedView?.NoticeNumber);
        Assert.Equal("SYNFP", correctedView?.FinancialProductSnapshot);
        Assert.Equal(6, correctedView?.RunningNumberWidthSnapshot);
        Assert.Equal(120m, correctedView?.TotalAmount);
        Assert.Equal(2, correctedView?.Revisions.Count);

        var second = await service.CreateDraftAsync(KnownCaseId, Draft(payer.Id, true, 200m), CancellationToken.None);
        var secondView = await service.FindDraftAsync(second.Id, CancellationToken.None);
        Assert.Equal("SYNNEW.20260000002", secondView?.NoticeNumber);

        var stale = await service.DiscardDraftAsync(
            created.Id,
            created.Version,
            new("Veralteter Versuch"),
            CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.VersionConflict, stale.Outcome);
        var discarded = await service.DiscardDraftAsync(
            created.Id,
            corrected.Version,
            new("Fachlich verworfen"),
            CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Success, discarded.Outcome);
        var immutable = await service.CorrectDraftAsync(
            created.Id,
            discarded.Version,
            Correction(otherPayer.Id, true, 130m),
            CancellationToken.None);
        Assert.Equal(NoticeDraftMutationOutcome.Discarded, immutable.Outcome);

        clock.SetUtcNow(new(2027, 1, 1, 0, 0, 0, TimeSpan.Zero));
        var followingYear = await service.CreateDraftAsync(KnownCaseId, Draft(payer.Id, true, 300m), CancellationToken.None);
        var followingYearView = await service.FindDraftAsync(followingYear.Id, CancellationToken.None);
        Assert.Equal("SYNNEW.20270000001", followingYearView?.NoticeNumber);
        Assert.Equal((3, 5, 5, 2, 2), store.Diagnostics);
    }

    [Fact]
    public async Task ExhaustedWidthRejectsTheWholeTenthCreationWithoutSequenceOrHistoryEffect()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var master = new SyntheticCemeteryMasterDataStore(coordinator);
        var parties = new SyntheticPersonUsageRightStore(coordinator, master);
        var store = new SyntheticNoticeDraftStore(
            coordinator,
            new SyntheticCaseReadStore(master, coordinator),
            parties);
        var actor = new ActorProvider();
        var clock = new ManualTimeProvider(new(2026, 8, 26, 10, 0, 0, TimeSpan.Zero));
        var payer = await new PersonUsageRightService(parties, actor, clock)
            .CreatePartyAsync(Person("Synthetik", "Sequenz"), CancellationToken.None);
        var service = new NoticeDraftService(store, actor, clock);
        await service.CreateConfigurationAsync(new("SYN", 1), CancellationToken.None);

        for (var index = 1; index <= 9; index++)
        {
            var result = await service.CreateDraftAsync(KnownCaseId, Draft(payer.Id, true, index), CancellationToken.None);
            Assert.Equal(NoticeDraftMutationOutcome.Success, result.Outcome);
        }

        var exhausted = await service.CreateDraftAsync(KnownCaseId, Draft(payer.Id, true, 10m), CancellationToken.None);

        Assert.Equal(NoticeDraftMutationOutcome.SequenceExhausted, exhausted.Outcome);
        Assert.Equal((9, 9, 9, 1, 1), store.Diagnostics);
        var list = await service.ReadForCaseAsync(KnownCaseId, CancellationToken.None);
        Assert.Equal(9, list?.Count);
        Assert.Contains(list!, item => item.NoticeNumber == "SYN.20269");
    }

    private static CreateNoticeDraftCommand Draft(Guid payerId, bool confirmed, decimal amount) => new(
        payerId,
        confirmed,
        amount,
        new DateOnly(2026, 8, 26),
        new DateOnly(2026, 9, 26),
        "SYN-KONTO",
        "Synthetische manuelle Gebührenquelle");

    private static CorrectNoticeDraftCommand Correction(Guid payerId, bool confirmed, decimal amount) => new(
        payerId,
        confirmed,
        amount,
        new DateOnly(2026, 8, 27),
        new DateOnly(2026, 9, 27),
        "SYN-KONTO-KORR",
        "Synthetisch korrigierte Gebührenquelle",
        "Manuelle fachliche Korrektur");

    private static CreatePartyCommand Person(string firstName, string lastName) => new(
        PartyType.NaturalPerson,
        firstName,
        lastName,
        null,
        [new("Synthetikweg", "1", "00000", "Teststadt", null, new(2020, 1, 1), null, true)]);

    private sealed class ActorProvider : ICurrentActorProvider
    {
        public ActorIdentity Current { get; } = new(
            "synthetic-6b-actor",
            "Synthetische 6b-Sachbearbeitung",
            SystemRole.Administration);
    }

    private sealed class ManualTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        private DateTimeOffset current = utcNow;
        public override DateTimeOffset GetUtcNow() => current;
        internal void SetUtcNow(DateTimeOffset value) => current = value;
    }
}
