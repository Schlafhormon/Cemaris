using System.Text.Json;
using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Cemeteries;
using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.PersonUsageRights;

namespace Cemaris.IntegrationTests;

public sealed class UsageRightLifecycleContractTests
{
    internal static readonly CancellationToken Token = CancellationToken.None;
    internal sealed class Actor : ICurrentActorProvider
    {
        public ActorIdentity Current => new("synthetic-m2a", "Synthetische M2a-Prüfung", SystemRole.Administration);
    }
    internal sealed class Clock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 9, 8, 0, 0, 0, TimeSpan.Zero);
    }

    internal static async Task<(Guid Site, Guid Party, UsageRightView Right)> Setup(ICemeteryMasterDataStore masterStore, PersonUsageRightService service)
    {
        var master = new CemeteryMasterDataService(masterStore, new Actor(), new Clock());
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var cemetery = await master.SaveCemeteryAsync(null, null, new("Synthetisch M2a " + suffix, "SYN-" + suffix, null, null, true), Token);
        var type = await master.SaveGraveTypeAsync(null, null, new("Synthetisch M2a " + suffix, "SYN-" + suffix, BurialForm.Mixed, null, true), Token);
        await master.SaveCemeteryGraveTypeAsync(null, null, new(cemetery.Id, type.Id, true), Token);
        var site = await master.SaveGraveSiteAsync(null, null, new(cemetery.Id, null, null, null, type.Id, "SYN-M2a", GraveSiteStatus.Available, false, null, null, null, true), Token);
        Success(await service.SaveStartRuleAsync(null, null, new(cemetery.Id, "SYN-START", "Synthetischer Startnachweis"), Token));
        var party = Success(await service.CreatePartyAsync(new(PartyType.Organization, null, null, "Synthetisch M2a " + suffix, []), Token));
        var result = Success(await service.CreateUsageRightAsync(new(site.Id, party.Id, new(2020, 1, 1), new(2050, 1, 1), "SYN-Ursprung"), Token));
        return (site.Id, party.Id, (await service.FindUsageRightAsync(result.Id, Token))!);
    }

    internal static PersonUsageRightMutationResult Success(PersonUsageRightMutationResult result)
    { Assert.Equal(PersonUsageRightMutationOutcome.Success, result.Outcome); return result; }
    internal static TerminateUsageRightCommand Termination(int day = 2) => new(new(2026, 9, day), UsageRightTerminationKind.Returned, "  Synthetisch beendet  ", " SYN-Beendigung ", true);
    internal static CreateUsageRightSuccessorCommand Successor(Guid party, int day = 2) => new(party, new(2026, 9, day), new(2056, 9, day), " SYN-Neuvergabe ", " Synthetisch geprüft ", true);
    internal static CorrectUsageRightSequenceCommand Correction(IReadOnlyList<UsageRightListItem> sequence) => new("Synthetische gemeinsame Korrektur", true, sequence.Select(x => new UsageRightExpectedVersion(x.Id, x.Version)).ToArray());

    [Fact]
    public async Task VollstaendigeFolgeMitKonfliktenHistorieUndNeuVerzweigung()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var master = new SyntheticCemeteryMasterDataStore(coordinator);
        var store = new SyntheticPersonUsageRightStore(coordinator, master);
        var service = new PersonUsageRightService(store, new Actor(), new Clock());
        var setup = await Setup(master, service);
        var other = await Setup(master, service);
        var masterBefore = JsonSerializer.Serialize(await master.ReadAsync(true, Token));
        var otherBefore = JsonSerializer.Serialize(await service.FindUsageRightAsync(other.Right.Id, Token));
        await RunContract(service, setup.Site, setup.Party, setup.Right);
        Assert.Equal(masterBefore, JsonSerializer.Serialize(await master.ReadAsync(true, Token)));
        Assert.Equal(otherBefore, JsonSerializer.Serialize(await service.FindUsageRightAsync(other.Right.Id, Token)));
    }

    [Fact]
    public async Task TransfergrenzeUndNachweisfehlerHinterlassenKeineTeilstaende()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var master = new SyntheticCemeteryMasterDataStore(coordinator);
        var store = new SyntheticPersonUsageRightStore(coordinator, master);
        var service = new PersonUsageRightService(store, new Actor(), new Clock());
        var setup = await Setup(master, service);
        var transferred = Success(await service.TransferUsageRightAsync(setup.Right.Id, 1, new(setup.Party, new(2026, 9, 3), "SYN-Transfer"), Token));
        var before = JsonSerializer.Serialize(await service.FindUsageRightAsync(setup.Right.Id, Token));
        await Assert.ThrowsAsync<UsageRightValidationException>(() => service.TerminateUsageRightAsync(setup.Right.Id, transferred.Version, Termination(2), Token));
        await Assert.ThrowsAsync<UsageRightValidationException>(() => service.TerminateUsageRightAsync(setup.Right.Id, transferred.Version, Termination(3), Token));
        Assert.Equal(before, JsonSerializer.Serialize(await service.FindUsageRightAsync(setup.Right.Id, Token)));
        var auditField = typeof(SyntheticPersonUsageRightStore).GetField("audits", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!;
        var audits = (List<PersonUsageRightAudit>)auditField.GetValue(store)!;
        var badAudit = audits[0] with { EntityId = setup.Right.Id, EntityType = "UsageRight", ResultingVersion = transferred.Version + 1, Operation = "Terminated" };
        await Assert.ThrowsAsync<InvalidOperationException>(() => store.ChangeLifecycleAsync(new(setup.Right.Id, transferred.Version, "Terminated", "SYN", badAudit, Termination(4)), Token));
        Assert.Equal(before, JsonSerializer.Serialize(await service.FindUsageRightAsync(setup.Right.Id, Token)));
        var ended = Success(await service.TerminateUsageRightAsync(setup.Right.Id, transferred.Version, Termination(4), Token)).Right!;
        Assert.Equal(new DateOnly(2026, 9, 3), ended.HolderPeriods[0].ValidUntilExclusive);
        Assert.Equal(new DateOnly(2026, 9, 4), ended.HolderPeriods[1].ValidUntilExclusive);
    }

    [Fact]
    public async Task UtcTageswechselBestimmtHeuteUnabhaengigVomOffset()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var master = new SyntheticCemeteryMasterDataStore(coordinator);
        var store = new SyntheticPersonUsageRightStore(coordinator, master);
        var clock = new OffsetClock();
        var service = new PersonUsageRightService(store, new Actor(), clock);
        var setup = await Setup(master, service);
        await Assert.ThrowsAsync<UsageRightValidationException>(() => service.TerminateUsageRightAsync(setup.Right.Id, 1, Termination(8), Token));
        clock.Now = clock.Now.AddMinutes(1);
        var ended = Success(await service.TerminateUsageRightAsync(setup.Right.Id, 1, Termination(8), Token)).Right!;
        Assert.Equal(new DateOnly(2026, 9, 8), ended.Termination!.TerminationDate);
    }

    private sealed class OffsetClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = new(2026, 9, 8, 1, 59, 0, TimeSpan.FromHours(2));
        public override DateTimeOffset GetUtcNow() => Now;
    }

    internal static async Task RunContract(PersonUsageRightService service, Guid site, Guid party, UsageRightView a)
    {
        var ended = Success(await service.TerminateUsageRightAsync(a.Id, a.Version, Termination(), Token)).Right!;
        Assert.Equal(a.EndDate, ended.EndDate);
        Assert.Equal(new DateOnly(2026, 9, 2), Assert.Single(ended.HolderPeriods).ValidUntilExclusive);
        Assert.Equal("SYN-Beendigung", ended.Termination!.SourceReference);
        await Assert.ThrowsAsync<UsageRightStateException>(() => service.TransferUsageRightAsync(a.Id, ended.Version, new(party, new(2026, 9, 3), "SYN"), Token));
        await Assert.ThrowsAsync<UsageRightStateException>(() => service.ExtendUsageRightAsync(a.Id, ended.Version, new(new(2060, 1, 1), "SYN"), Token));
        await Assert.ThrowsAsync<UsageRightStateException>(() => service.CorrectUsageRightAsync(a.Id, ended.Version, new(site, a.StartDate, a.EndDate, "SYN", a.UsageRightStartRuleId, "SYN"), Token));
        var reversed = Success(await service.ReverseUsageRightTerminationAsync(a.Id, ended.Version, new("SYN-Rücknahme"), Token)).Right!;
        Assert.Equal(UsageRightStatus.Ended, ended.Status);
        Assert.Equal(a.Version + 1, ended.Version);
        Assert.NotNull(Assert.Single(ended.HolderPeriods).ValidUntilExclusive);
        Assert.Null(reversed.Termination); Assert.Null(Assert.Single(reversed.HolderPeriods).ValidUntilExclusive);
        Assert.NotNull(reversed.Revisions[1].Termination);
        ended = Success(await service.TerminateUsageRightAsync(a.Id, reversed.Version, Termination(), Token)).Right!;
        await Assert.ThrowsAsync<UsageRightValidationException>(() => service.CreateUsageRightSuccessorAsync(a.Id, ended.Version, Successor(party, 1), Token));
        var b = Success(await service.CreateUsageRightSuccessorAsync(a.Id, ended.Version, Successor(party), Token)).Right!;
        Assert.NotEqual(a.Id, b.Id); Assert.Equal(a.Id, b.PredecessorId); Assert.True(b.ManualGrantReviewConfirmed);
        var preview = (await service.ReadUsageRightSequenceAsync(a.Id, Token))!;
        await Assert.ThrowsAsync<UsageRightStateException>(() => service.ReverseUsageRightTerminationAsync(a.Id, preview[0].Version, new("SYN"), Token));
        b = Success(await service.TerminateUsageRightAsync(b.Id, b.Version, Termination(3), Token)).Right!;
        var c = Success(await service.CreateUsageRightSuccessorAsync(b.Id, b.Version, Successor(party, 3), Token)).Right!;
        Assert.Equal(PersonUsageRightMutationOutcome.VersionConflict, (await service.CorrectUsageRightSequenceAsync(a.Id, preview[0].Version, Correction(preview), Token)).Outcome);
        c = Success(await service.TerminateUsageRightAsync(c.Id, c.Version, Termination(4), Token)).Right!;
        var sequence = (await service.ReadUsageRightSequenceAsync(a.Id, Token))!;
        foreach (var member in sequence)
        {
            var stale = Correction(sequence) with { Members = sequence.Select(x => new UsageRightExpectedVersion(x.Id, x.Id == member.Id ? x.Version + 1 : x.Version)).ToArray() };
            Assert.Equal(PersonUsageRightMutationOutcome.VersionConflict, (await service.CorrectUsageRightSequenceAsync(a.Id, sequence[0].Version, stale, Token)).Outcome);
        }
        foreach (var invalidMembers in new[] {
            sequence.Skip(1).Select(x => new UsageRightExpectedVersion(x.Id, x.Version)).ToArray(),
            sequence.Select(x => new UsageRightExpectedVersion(x.Id, x.Version)).Append(new(Guid.NewGuid(), 1)).ToArray(),
            sequence.Select((x, i) => new UsageRightExpectedVersion(i == 1 ? Guid.NewGuid() : x.Id, x.Version)).ToArray() })
        {
            var beforeConflict = JsonSerializer.Serialize(await service.FindUsageRightAsync(a.Id, Token));
            Assert.Equal(PersonUsageRightMutationOutcome.VersionConflict, (await service.CorrectUsageRightSequenceAsync(a.Id, sequence[0].Version, Correction(sequence) with { Members = invalidMembers }, Token)).Outcome);
            Assert.Equal(beforeConflict, JsonSerializer.Serialize(await service.FindUsageRightAsync(a.Id, Token)));
        }
        var corrected = Success(await service.CorrectUsageRightSequenceAsync(a.Id, sequence[0].Version, Correction(sequence), Token)).Right!;
        Assert.Equal(UsageRightStatus.Open, corrected.Status);
        foreach (var id in new[] { b.Id, c.Id })
        {
            var historical = (await service.FindUsageRightAsync(id, Token))!;
            Assert.Equal(UsageRightStatus.Voided, historical.Status);
            Assert.NotNull(historical.Termination);
            Assert.Equal(corrected.OperationId, historical.OperationId);
            Assert.Equal(historical.Version, historical.Revisions.Count);
            await Assert.ThrowsAsync<UsageRightStateException>(() => service.ReverseUsageRightTerminationAsync(id, historical.Version, new("SYN"), Token));
        }
        ended = Success(await service.TerminateUsageRightAsync(a.Id, corrected.Version, Termination(), Token)).Right!;
        var d = Success(await service.CreateUsageRightSuccessorAsync(a.Id, ended.Version, Successor(party), Token)).Right!;
        Assert.Equal(d.Id, (await service.FindUsageRightByGraveSiteAsync(site, Token))!.Id);
        var collected = new List<Guid>();
        for (var page = 1; page <= 4; page++)
        {
            var rows = await service.ReadUsageRightsAsync(site, page, 1, Token);
            Assert.Equal(4, rows.TotalMatches); collected.Add(Assert.Single(rows.Items).Id);
        }
        Assert.Equal(4, collected.Distinct().Count());
        Assert.Contains(b.Id, collected); Assert.Contains(c.Id, collected);
        Assert.Empty((await service.ReadUsageRightsAsync(site, 5, 1, Token)).Items);
        Assert.Equal(PersonUsageRightMutationOutcome.Duplicate, (await service.CreateUsageRightAsync(new(site, party, new(2026, 9, 5), new(2056, 9, 5), "SYN"), Token)).Outcome);
        await Assert.ThrowsAsync<UsageRightStateException>(() => service.CorrectUsageRightAsync(d.Id, d.Version, new(site, new(2026, 9, 1), d.EndDate, "SYN", d.UsageRightStartRuleId, "SYN"), Token));
    }
}
