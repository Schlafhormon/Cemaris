using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;
using Cemaris.Infrastructure.Cemeteries;

namespace Cemaris.Infrastructure.PersonUsageRights;

public sealed class SyntheticPersonUsageRightStore(SyntheticStoreCoordinator coordinator, SyntheticCemeteryMasterDataStore masterData) : IPersonUsageRightStore
{
    private sealed record PartyState(Guid Id, PartyType Type, string? First, string? Last, string? Organization, Guid? Primary, long Version, List<PartyAddressView> Addresses, List<PartyRevisionView> Revisions);
    private sealed record RightState(Guid Id, Guid GraveSiteId, DateOnly Start, DateOnly End, string Reference, Guid RuleId, string RuleCode, string RuleDisplay, long Version, List<UsageRightHolderPeriodView> Holders, List<UsageRightRevisionView> Revisions);
    private sealed record RuleState(Guid Id, Guid CemeteryId, string Code, string Display, long Version, List<UsageRightStartRuleRevisionView> Revisions);
    private readonly Dictionary<Guid, PartyState> parties = [];
    private readonly Dictionary<Guid, RightState> rights = [];
    private readonly Dictionary<Guid, RuleState> rules = [];
    private readonly List<PersonUsageRightAudit> audits = [];

    public Task<IReadOnlyList<PartySearchItem>> SearchPartiesAsync(string query, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            var key = PartyRules.Normalize(query);
            return Task.FromResult<IReadOnlyList<PartySearchItem>>(parties.Values.Where(x => PartyRules.Normalize(Display(x)).Contains(key, StringComparison.Ordinal))
                .Select(x => new PartySearchItem(x.Id, x.Type, Display(x), x.Addresses.SingleOrDefault(a => a.Id == x.Primary) is { } a ? Address(a) : null)).ToArray());
        }
    }

    public Task<PartyView?> FindPartyAsync(Guid id, CancellationToken token) { lock (coordinator.Gate) return Task.FromResult(parties.TryGetValue(id, out var x) ? View(x) : null); }
    public Task<UsageRightView?> FindUsageRightAsync(Guid id, CancellationToken token) { lock (coordinator.Gate) return Task.FromResult(rights.TryGetValue(id, out var x) ? View(x) : null); }
    public Task<UsageRightView?> FindUsageRightByGraveSiteAsync(Guid id, CancellationToken token) { lock (coordinator.Gate) return Task.FromResult(rights.Values.SingleOrDefault(x => x.GraveSiteId == id) is { } x ? View(x) : null); }
    public Task<IReadOnlyList<UsageRightStartRuleView>> ReadStartRulesAsync(CancellationToken token) { lock (coordinator.Gate) return Task.FromResult<IReadOnlyList<UsageRightStartRuleView>>(rules.Values.Select(View).ToArray()); }

    public Task<PersonUsageRightMutationResult> CreatePartyAsync(Guid id, CreatePartyCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => Mutate(() =>
    {
        var name = PartyName.Create(command.PartyType, command.FirstName, command.LastName, command.OrganizationName);
        var addresses = command.Addresses.Select(x => ToAddress(x)).ToList();
        var duplicates = FindDuplicates(name, addresses);
        if (duplicates.Count > 0 && !command.ConfirmPossibleDuplicate) return new(PersonUsageRightMutationOutcome.PossibleDuplicate, id, DuplicateCandidates: duplicates);
        var primary = addresses.SingleOrDefault(x => command.Addresses[addresses.IndexOf(x)].IsCurrentPrimary)?.Id;
        if (primary.HasValue && !IsCurrent(addresses.Single(x => x.Id == primary), today)) throw new PartyValidationException("addresses", "Die Hauptanschrift muss gegenwärtig gültig sein.");
        var state = new PartyState(id, name.Type, name.FirstName, name.LastName, name.OrganizationName, primary, 1, addresses, []);
        state.Revisions.Add(Revision(state, audit, null)); parties.Add(id, state); audits.Add(audit); return Success(id, 1);
    });

    public Task<PersonUsageRightMutationResult> CorrectPartyAsync(Guid id, long expected, CorrectPartyCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => Mutate(() =>
    {
        if (!parties.TryGetValue(id, out var current)) return Missing(id); if (current.Version != expected) return Conflict(id, current.Version);
        var name = PartyName.Create(current.Type, command.FirstName, command.LastName, command.OrganizationName);
        var next = current with { First = name.FirstName, Last = name.LastName, Organization = name.OrganizationName, Version = expected + 1 };
        next.Revisions.Add(Revision(next, audit, command.Reason)); parties[id] = next; audits.Add(audit); return Success(id, next.Version);
    });

    public Task<PersonUsageRightMutationResult> AddPartyAddressAsync(Guid id, long expected, AddPartyAddressCommand command, Guid addressId, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => Mutate(() =>
    {
        if (!parties.TryGetValue(id, out var current)) return Missing(id); if (current.Version != expected) return Conflict(id, current.Version);
        var address = ToAddress(command.Address, addressId); if (command.Address.IsCurrentPrimary && !IsCurrent(address, today)) throw new PartyValidationException("address", "Die Hauptanschrift muss gegenwärtig gültig sein.");
        var next = current with { Version = expected + 1, Primary = command.Address.IsCurrentPrimary ? address.Id : current.Primary };
        next.Addresses.Add(address); next.Revisions.Add(Revision(next, audit, command.Reason)); parties[id] = next; audits.Add(audit); return Success(id, next.Version);
    });

    public Task<PersonUsageRightMutationResult> CorrectPartyAddressAsync(Guid id, Guid addressId, long expected, CorrectPartyAddressCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => Mutate(() =>
    {
        if (!parties.TryGetValue(id, out var current)) return Missing(id); if (current.Version != expected) return Conflict(id, current.Version);
        var index = current.Addresses.FindIndex(x => x.Id == addressId); if (index < 0) return Missing(id);
        var address = ToAddress(command.Address, addressId); if (command.Address.IsCurrentPrimary && !IsCurrent(address, today)) throw new PartyValidationException("address", "Die Hauptanschrift muss gegenwärtig gültig sein.");
        current.Addresses[index] = address; var next = current with { Version = expected + 1, Primary = command.Address.IsCurrentPrimary ? addressId : current.Primary == addressId ? null : current.Primary };
        next.Revisions.Add(Revision(next, audit, command.Reason)); parties[id] = next; audits.Add(audit); return Success(id, next.Version);
    });

    public Task<PersonUsageRightMutationResult> CreateUsageRightAsync(Guid id, CreateUsageRightCommand command, Guid holderId, PersonUsageRightAudit audit, CancellationToken token) => Mutate(() =>
    {
        if (rights.Values.Any(x => x.GraveSiteId == command.GraveSiteId)) return Duplicate(id);
        if (!parties.ContainsKey(command.HolderPartyId) || !masterData.TryGetGraveSite(command.GraveSiteId, out var site) || site is null) return Invalid(id);
        var rule = rules.Values.SingleOrDefault(x => x.CemeteryId == site.CemeteryId); if (rule is null) return Invalid(id);
        var state = new RightState(id, command.GraveSiteId, command.StartDate, command.EndDate, command.SourceReference!, rule.Id, rule.Code, rule.Display, 1, [new(holderId, command.HolderPartyId, command.StartDate, null)], []);
        state.Revisions.Add(Revision(state, audit, null)); rights.Add(id, state); audits.Add(audit); return Success(id, 1);
    });

    public Task<PersonUsageRightMutationResult> TransferUsageRightAsync(Guid id, long expected, TransferUsageRightCommand command, Guid holderId, PersonUsageRightAudit audit, CancellationToken token) => Mutate(() =>
    {
        if (!rights.TryGetValue(id, out var current)) return Missing(id); if (current.Version != expected) return Conflict(id, current.Version); if (!parties.ContainsKey(command.NewHolderPartyId)) return Invalid(id);
        var open = current.Holders.Single(x => x.ValidUntilExclusive is null); UsageRightRules.ValidateTransfer(command.ValidFromInclusive, open.ValidFromInclusive, current.End);
        current.Holders[current.Holders.IndexOf(open)] = open with { ValidUntilExclusive = command.ValidFromInclusive }; current.Holders.Add(new(holderId, command.NewHolderPartyId, command.ValidFromInclusive, null));
        var next = current with { Version = expected + 1 }; next.Revisions.Add(Revision(next, audit, command.Reason)); rights[id] = next; audits.Add(audit); return Success(id, next.Version);
    });

    public Task<PersonUsageRightMutationResult> ExtendUsageRightAsync(Guid id, long expected, ExtendUsageRightCommand command, PersonUsageRightAudit audit, CancellationToken token) => Mutate(() =>
    { if (!rights.TryGetValue(id, out var current)) return Missing(id); if (current.Version != expected) return Conflict(id, current.Version); UsageRightRules.ValidateExtension(current.End, command.NewEndDate); var next = current with { End = command.NewEndDate, Version = expected + 1 }; next.Revisions.Add(Revision(next, audit, command.Reason)); rights[id] = next; audits.Add(audit); return Success(id, next.Version); });

    public Task<PersonUsageRightMutationResult> CorrectUsageRightAsync(Guid id, long expected, CorrectUsageRightCommand command, PersonUsageRightAudit audit, CancellationToken token) => Mutate(() =>
    {
        if (!rights.TryGetValue(id, out var current)) return Missing(id); if (current.Version != expected) return Conflict(id, current.Version);
        if (!masterData.TryGetGraveSite(command.GraveSiteId, out var site) || site is null || rights.Values.Any(x => x.Id != id && x.GraveSiteId == command.GraveSiteId)) return Invalid(id);
        if (!rules.TryGetValue(command.UsageRightStartRuleId, out var rule) || rule.CemeteryId != site.CemeteryId) return Invalid(id);
        var next = current with { GraveSiteId = command.GraveSiteId, Start = command.StartDate, End = command.EndDate, Reference = command.SourceReference!, RuleId = rule.Id, RuleCode = rule.Code, RuleDisplay = rule.Display, Version = expected + 1 };
        next.Revisions.Add(Revision(next, audit, command.Reason)); rights[id] = next; audits.Add(audit); return Success(id, next.Version);
    });

    public Task<PersonUsageRightMutationResult> SaveStartRuleAsync(Guid id, long? expected, SaveUsageRightStartRuleCommand command, PersonUsageRightAudit audit, CancellationToken token) => Mutate(() =>
    {
        if (!expected.HasValue && rules.Values.Any(x => x.CemeteryId == command.CemeteryId)) return Duplicate(id);
        if (!masterData.TryGetGraveSite(Guid.Empty, out _) && !CemeteryExists(command.CemeteryId)) return Invalid(id);
        if (expected.HasValue && (!rules.TryGetValue(id, out var current) || current.Version != expected)) return current is null ? Missing(id) : Conflict(id, current.Version);
        var state = expected.HasValue ? rules[id] with { Code = command.Code!, Display = command.DisplayName!, Version = expected.Value + 1 } : new RuleState(id, command.CemeteryId, command.Code!, command.DisplayName!, 1, []);
        state.Revisions.Add(new(Guid.NewGuid(), state.Version, expected.HasValue ? "Changed" : "Created", command.Reason, audit.OccurredAtUtc, audit.Actor.DisplayName, state.Code, state.Display)); rules[id] = state; audits.Add(audit); return Success(id, state.Version);
    });

    private bool CemeteryExists(Guid id) => masterData.ReadAsync(true, CancellationToken.None).GetAwaiter().GetResult().Cemeteries.Any(x => x.Id == id);
    private List<PossiblePartyDuplicate> FindDuplicates(PartyName name, List<PartyAddressView> addresses) => parties.Values.Where(x => PartyRules.Normalize(Display(x)) == name.NormalizedValue && x.Addresses.Any(a => addresses.Any(b => AddressKey(a) == AddressKey(b)))).Select(x => new PossiblePartyDuplicate(x.Id, Display(x))).ToList();
    private static PartyAddressView ToAddress(PostalAddressInput x, Guid? id = null) { var a = PostalAddress.Create(x.Street, x.HouseNumber, x.PostalCode, x.City, x.AdditionalInformation); PartyRules.ValidatePeriod(x.ValidFromInclusive, x.ValidUntilExclusive); return new(id ?? Guid.NewGuid(), a.Street, a.HouseNumber, a.PostalCode, a.City, a.AdditionalInformation, x.ValidFromInclusive, x.ValidUntilExclusive, x.IsCurrentPrimary); }
    private static bool IsCurrent(PartyAddressView x, DateOnly today) => x.ValidFromInclusive <= today && (!x.ValidUntilExclusive.HasValue || x.ValidUntilExclusive > today);
    private static string Display(PartyState x) => x.Type == PartyType.Organization ? x.Organization! : $"{x.First} {x.Last}";
    private static string Address(PartyAddressView x) => $"{x.Street} {x.HouseNumber}, {x.PostalCode} {x.City}";
    private static string AddressKey(PartyAddressView x) => PartyRules.Normalize($"{x.Street}|{x.HouseNumber}|{x.PostalCode}|{x.City}|{x.AdditionalInformation}");
    private static PartyView View(PartyState x) => new(x.Id, x.Type, x.First, x.Last, x.Organization, x.Primary, x.Version, x.Addresses.ToArray(), x.Revisions.ToArray());
    private static UsageRightView View(RightState x) => new(x.Id, x.GraveSiteId, x.Start, x.End, x.Reference, x.RuleId, x.RuleCode, x.RuleDisplay, x.Version, x.Holders.ToArray(), x.Revisions.ToArray());
    private static UsageRightStartRuleView View(RuleState x) => new(x.Id, x.CemeteryId, x.Code, x.Display, x.Version, x.Revisions.ToArray());
    private static PartyRevisionView Revision(PartyState x, PersonUsageRightAudit a, string? reason) => new(Guid.NewGuid(), a.ResultingVersion, a.Operation, reason, a.OccurredAtUtc, a.Actor.DisplayName, x.Type, x.First, x.Last, x.Organization, x.Addresses.ToArray());
    private static UsageRightRevisionView Revision(RightState x, PersonUsageRightAudit a, string? reason) => new(Guid.NewGuid(), a.ResultingVersion, a.Operation, reason, a.OccurredAtUtc, a.Actor.DisplayName, x.GraveSiteId, x.Start, x.End, x.Reference, x.RuleId, x.RuleCode, x.RuleDisplay, x.Holders.ToArray());
    private Task<PersonUsageRightMutationResult> Mutate(Func<PersonUsageRightMutationResult> action) { lock (coordinator.Gate) return Task.FromResult(action()); }
    private static PersonUsageRightMutationResult Success(Guid id, long version) => new(PersonUsageRightMutationOutcome.Success, id, version);
    private static PersonUsageRightMutationResult Missing(Guid id) => new(PersonUsageRightMutationOutcome.NotFound, id);
    private static PersonUsageRightMutationResult Conflict(Guid id, long version) => new(PersonUsageRightMutationOutcome.VersionConflict, id, version);
    private static PersonUsageRightMutationResult Duplicate(Guid id) => new(PersonUsageRightMutationOutcome.Duplicate, id);
    private static PersonUsageRightMutationResult Invalid(Guid id) => new(PersonUsageRightMutationOutcome.InvalidReference, id);
}
