namespace Cemaris.Infrastructure.Persistence.PersonUsageRights;

public sealed class PartyEntity
{
    public Guid Id { get; set; }
    public string PartyType { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? OrganizationName { get; set; }
    public string NormalizedName { get; set; } = string.Empty;
    public Guid? CurrentPrimaryAddressId { get; set; }
    public long Version { get; set; }
    public ICollection<PartyAddressEntity> Addresses { get; } = [];
    public ICollection<PartyRevisionEntity> Revisions { get; } = [];
}

public sealed class PartyAddressEntity
{
    public Guid Id { get; set; }
    public Guid PartyId { get; set; }
    public string Street { get; set; } = string.Empty;
    public string HouseNumber { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? AdditionalInformation { get; set; }
    public string NormalizedAddress { get; set; } = string.Empty;
    public DateOnly ValidFromInclusive { get; set; }
    public DateOnly? ValidUntilExclusive { get; set; }
    public PartyEntity Party { get; set; } = null!;
}

public sealed class PartyRevisionEntity
{
    public Guid Id { get; set; }
    public Guid PartyId { get; set; }
    public long ResultingVersion { get; set; }
    public string MutationType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
    public string StateJson { get; set; } = string.Empty;
}

public sealed class UsageRightEntity
{
    public Guid Id { get; set; }
    public Guid GraveSiteId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string SourceReference { get; set; } = string.Empty;
    public Guid UsageRightStartRuleId { get; set; }
    public string StartRuleCodeSnapshot { get; set; } = string.Empty;
    public string StartRuleDisplayNameSnapshot { get; set; } = string.Empty;
    public long Version { get; set; }
    public ICollection<UsageRightHolderPeriodEntity> HolderPeriods { get; } = [];
    public ICollection<UsageRightRevisionEntity> Revisions { get; } = [];
}

public sealed class UsageRightHolderPeriodEntity
{
    public Guid Id { get; set; }
    public Guid UsageRightId { get; set; }
    public Guid PartyId { get; set; }
    public DateOnly ValidFromInclusive { get; set; }
    public DateOnly? ValidUntilExclusive { get; set; }
}

public sealed class UsageRightRevisionEntity
{
    public Guid Id { get; set; }
    public Guid UsageRightId { get; set; }
    public long ResultingVersion { get; set; }
    public string MutationType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
    public string StateJson { get; set; } = string.Empty;
}

public sealed class UsageRightStartRuleEntity
{
    public Guid Id { get; set; }
    public Guid CemeteryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public long Version { get; set; }
    public ICollection<UsageRightStartRuleRevisionEntity> Revisions { get; } = [];
}

public sealed class UsageRightStartRuleRevisionEntity
{
    public Guid Id { get; set; }
    public Guid UsageRightStartRuleId { get; set; }
    public long ResultingVersion { get; set; }
    public string MutationType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

public sealed class PersonUsageRightAuditEntity
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public long ResultingVersion { get; set; }
    public string Operation { get; set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
}
