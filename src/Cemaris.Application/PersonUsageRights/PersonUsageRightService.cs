using Cemaris.Application.Identity;
using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;

namespace Cemaris.Application.PersonUsageRights;

public sealed class PersonUsageRightService(IPersonUsageRightStore store, ICurrentActorProvider actors, TimeProvider timeProvider)
{
    private DateOnly Today => DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);
    public Task<IReadOnlyList<PartySearchItem>> SearchPartiesAsync(string? query, CancellationToken token) => store.SearchPartiesAsync(PartyRules.Required(query, 200, "query"), token);
    public Task<PartyView?> FindPartyAsync(Guid id, CancellationToken token) => store.FindPartyAsync(id, token);
    public Task<UsageRightView?> FindUsageRightAsync(Guid id, CancellationToken token) => store.FindUsageRightAsync(id, token);
    public Task<UsageRightView?> FindUsageRightByGraveSiteAsync(Guid id, CancellationToken token) => store.FindUsageRightByGraveSiteAsync(id, token);
    public Task<IReadOnlyList<UsageRightStartRuleView>> ReadStartRulesAsync(CancellationToken token) => store.ReadStartRulesAsync(token);

    public Task<PersonUsageRightMutationResult> CreatePartyAsync(CreatePartyCommand command, CancellationToken token)
    {
        ValidateParty(command.PartyType, command.FirstName, command.LastName, command.OrganizationName);
        foreach (var address in command.Addresses) ValidateAddress(address);
        if (command.Addresses.Count(x => x.IsCurrentPrimary) > 1) throw new PartyValidationException("addresses", "Höchstens eine aktuelle Hauptanschrift ist zulässig.");
        var id = Guid.NewGuid(); return store.CreatePartyAsync(id, command, Audit("Party", id, 1, "Created"), Today, token);
    }

    public Task<PersonUsageRightMutationResult> CorrectPartyAsync(Guid id, long version, CorrectPartyCommand command, CancellationToken token)
    {
        RequireReason(command.Reason); return store.CorrectPartyAsync(id, version, command, Audit("Party", id, version + 1, "Corrected"), Today, token);
    }

    public Task<PersonUsageRightMutationResult> AddPartyAddressAsync(Guid id, long version, AddPartyAddressCommand command, CancellationToken token)
    {
        ValidateAddress(command.Address); RequireReason(command.Reason); return store.AddPartyAddressAsync(id, version, command, Guid.NewGuid(), Audit("Party", id, version + 1, "AddressAdded"), Today, token);
    }

    public Task<PersonUsageRightMutationResult> CorrectPartyAddressAsync(Guid id, Guid addressId, long version, CorrectPartyAddressCommand command, CancellationToken token)
    {
        ValidateAddress(command.Address); RequireReason(command.Reason); return store.CorrectPartyAddressAsync(id, addressId, version, command, Audit("Party", id, version + 1, "AddressCorrected"), Today, token);
    }

    public Task<PersonUsageRightMutationResult> CreateUsageRightAsync(CreateUsageRightCommand command, CancellationToken token)
    {
        UsageRightRules.ValidateFacts(command.GraveSiteId, command.StartDate, command.EndDate, command.SourceReference);
        var id = Guid.NewGuid(); return store.CreateUsageRightAsync(id, command with { SourceReference = command.SourceReference!.Trim() }, Guid.NewGuid(), Audit("UsageRight", id, 1, "Created"), token);
    }

    public Task<PersonUsageRightMutationResult> TransferUsageRightAsync(Guid id, long version, TransferUsageRightCommand command, CancellationToken token)
    { RequireReason(command.Reason); return store.TransferUsageRightAsync(id, version, command, Guid.NewGuid(), Audit("UsageRight", id, version + 1, "Transferred"), token); }
    public Task<PersonUsageRightMutationResult> ExtendUsageRightAsync(Guid id, long version, ExtendUsageRightCommand command, CancellationToken token)
    { RequireReason(command.Reason); return store.ExtendUsageRightAsync(id, version, command, Audit("UsageRight", id, version + 1, "Extended"), token); }
    public Task<PersonUsageRightMutationResult> CorrectUsageRightAsync(Guid id, long version, CorrectUsageRightCommand command, CancellationToken token)
    { RequireReason(command.Reason); UsageRightRules.ValidateFacts(command.GraveSiteId, command.StartDate, command.EndDate, command.SourceReference); return store.CorrectUsageRightAsync(id, version, command with { SourceReference = command.SourceReference!.Trim() }, Audit("UsageRight", id, version + 1, "Corrected"), token); }

    public Task<PersonUsageRightMutationResult> SaveStartRuleAsync(Guid? id, long? version, SaveUsageRightStartRuleCommand command, CancellationToken token)
    {
        var clean = command with { Code = PartyRules.Required(command.Code, 50, "code"), DisplayName = PartyRules.Required(command.DisplayName, 200, "displayName") };
        if (id.HasValue) RequireReason(clean.Reason);
        var entityId = id ?? Guid.NewGuid(); return store.SaveStartRuleAsync(entityId, version, clean, Audit("UsageRightStartRule", entityId, version.GetValueOrDefault() + 1, version.HasValue ? "Changed" : "Created"), token);
    }

    private static void ValidateParty(PartyType type, string? first, string? last, string? organization) => PartyName.Create(type, first, last, organization);
    private static void ValidateAddress(PostalAddressInput input) { PostalAddress.Create(input.Street, input.HouseNumber, input.PostalCode, input.City, input.AdditionalInformation); PartyRules.ValidatePeriod(input.ValidFromInclusive, input.ValidUntilExclusive); }
    private static void RequireReason(string? value) => PartyRules.Required(value, 1000, "reason");
    private PersonUsageRightAudit Audit(string type, Guid id, long version, string operation) => new(Guid.NewGuid(), type, id, version, operation, timeProvider.GetUtcNow(), actors.Current);
}
