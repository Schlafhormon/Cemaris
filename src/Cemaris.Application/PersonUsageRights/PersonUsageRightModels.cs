using Cemaris.Domain.Parties;

namespace Cemaris.Application.PersonUsageRights;

public sealed record PostalAddressInput(string? Street, string? HouseNumber, string? PostalCode, string? City, string? AdditionalInformation, DateOnly ValidFromInclusive, DateOnly? ValidUntilExclusive, bool IsCurrentPrimary = false);
public sealed record CreatePartyCommand(PartyType PartyType, string? FirstName, string? LastName, string? OrganizationName, IReadOnlyList<PostalAddressInput> Addresses, bool ConfirmPossibleDuplicate = false);
public sealed record CorrectPartyCommand(string? FirstName, string? LastName, string? OrganizationName, string? Reason);
public sealed record AddPartyAddressCommand(PostalAddressInput Address, string? Reason);
public sealed record CorrectPartyAddressCommand(PostalAddressInput Address, string? Reason);

public sealed record PartyAddressView(Guid Id, string Street, string HouseNumber, string PostalCode, string City, string? AdditionalInformation, DateOnly ValidFromInclusive, DateOnly? ValidUntilExclusive, bool IsCurrentPrimary);
public sealed record PartyRevisionView(Guid Id, long ResultingVersion, string MutationType, string? Reason, DateTimeOffset OccurredAtUtc, string ActorDisplayName, PartyType PartyType, string? FirstName, string? LastName, string? OrganizationName, IReadOnlyList<PartyAddressView> Addresses);
public sealed record PartyView(Guid Id, PartyType PartyType, string? FirstName, string? LastName, string? OrganizationName, Guid? CurrentPrimaryAddressId, long Version, IReadOnlyList<PartyAddressView> Addresses, IReadOnlyList<PartyRevisionView> Revisions);
public sealed record PartySearchItem(Guid Id, PartyType PartyType, string DisplayName, string? CurrentPrimaryAddress);
public sealed record PossiblePartyDuplicate(Guid Id, string DisplayName);

public sealed record CreateUsageRightCommand(Guid GraveSiteId, Guid HolderPartyId, DateOnly StartDate, DateOnly EndDate, string? SourceReference);
public sealed record TransferUsageRightCommand(Guid NewHolderPartyId, DateOnly ValidFromInclusive, string? Reason);
public sealed record ExtendUsageRightCommand(DateOnly NewEndDate, string? Reason);
public sealed record CorrectUsageRightCommand(Guid GraveSiteId, DateOnly StartDate, DateOnly EndDate, string? SourceReference, Guid UsageRightStartRuleId, string? Reason);
public sealed record UsageRightHolderPeriodView(Guid Id, Guid PartyId, DateOnly ValidFromInclusive, DateOnly? ValidUntilExclusive);
public sealed record UsageRightRevisionView(Guid Id, long ResultingVersion, string MutationType, string? Reason, DateTimeOffset OccurredAtUtc, string ActorDisplayName, Guid GraveSiteId, DateOnly StartDate, DateOnly EndDate, string SourceReference, Guid UsageRightStartRuleId, string StartRuleCodeSnapshot, string StartRuleDisplayNameSnapshot, IReadOnlyList<UsageRightHolderPeriodView> HolderPeriods);
public sealed record UsageRightView(Guid Id, Guid GraveSiteId, DateOnly StartDate, DateOnly EndDate, string SourceReference, Guid UsageRightStartRuleId, string StartRuleCodeSnapshot, string StartRuleDisplayNameSnapshot, long Version, IReadOnlyList<UsageRightHolderPeriodView> HolderPeriods, IReadOnlyList<UsageRightRevisionView> Revisions);

public sealed record SaveUsageRightStartRuleCommand(Guid CemeteryId, string? Code, string? DisplayName, string? Reason = null);
public sealed record UsageRightStartRuleRevisionView(Guid Id, long ResultingVersion, string MutationType, string? Reason, DateTimeOffset OccurredAtUtc, string ActorDisplayName, string Code, string DisplayName);
public sealed record UsageRightStartRuleView(Guid Id, Guid CemeteryId, string Code, string DisplayName, long Version, IReadOnlyList<UsageRightStartRuleRevisionView> Revisions);

public enum PersonUsageRightMutationOutcome { Success, NotFound, VersionConflict, Duplicate, InvalidReference, PossibleDuplicate }
public sealed record PersonUsageRightMutationResult(PersonUsageRightMutationOutcome Outcome, Guid Id, long Version = 0, IReadOnlyList<PossiblePartyDuplicate>? DuplicateCandidates = null);
public sealed record PersonUsageRightAudit(Guid Id, string EntityType, Guid EntityId, long ResultingVersion, string Operation, DateTimeOffset OccurredAtUtc, Identity.ActorIdentity Actor);
