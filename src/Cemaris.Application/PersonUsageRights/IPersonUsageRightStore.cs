namespace Cemaris.Application.PersonUsageRights;

public interface IPersonUsageRightStore
{
    Task<IReadOnlyList<PartySearchItem>> SearchPartiesAsync(string query, CancellationToken token);
    Task<PartyView?> FindPartyAsync(Guid id, CancellationToken token);
    Task<PersonUsageRightMutationResult> CreatePartyAsync(Guid id, CreatePartyCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token);
    Task<PersonUsageRightMutationResult> CorrectPartyAsync(Guid id, long expected, CorrectPartyCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token);
    Task<PersonUsageRightMutationResult> AddPartyAddressAsync(Guid id, long expected, AddPartyAddressCommand command, Guid addressId, PersonUsageRightAudit audit, DateOnly today, CancellationToken token);
    Task<PersonUsageRightMutationResult> CorrectPartyAddressAsync(Guid id, Guid addressId, long expected, CorrectPartyAddressCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token);
    Task<UsageRightView?> FindUsageRightAsync(Guid id, CancellationToken token);
    Task<UsageRightView?> FindUsageRightByGraveSiteAsync(Guid id, CancellationToken token);
    Task<PersonUsageRightMutationResult> CreateUsageRightAsync(Guid id, CreateUsageRightCommand command, Guid holderId, PersonUsageRightAudit audit, CancellationToken token);
    Task<PersonUsageRightMutationResult> TransferUsageRightAsync(Guid id, long expected, TransferUsageRightCommand command, Guid holderId, PersonUsageRightAudit audit, CancellationToken token);
    Task<PersonUsageRightMutationResult> ExtendUsageRightAsync(Guid id, long expected, ExtendUsageRightCommand command, PersonUsageRightAudit audit, CancellationToken token);
    Task<PersonUsageRightMutationResult> CorrectUsageRightAsync(Guid id, long expected, CorrectUsageRightCommand command, PersonUsageRightAudit audit, CancellationToken token);
    Task<IReadOnlyList<UsageRightStartRuleView>> ReadStartRulesAsync(CancellationToken token);
    Task<PersonUsageRightMutationResult> SaveStartRuleAsync(Guid id, long? expected, SaveUsageRightStartRuleCommand command, PersonUsageRightAudit audit, CancellationToken token);
}
