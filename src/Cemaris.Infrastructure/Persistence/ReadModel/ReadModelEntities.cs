namespace Cemaris.Infrastructure.Persistence.ReadModel;

/// <summary>
/// Persistence-only entities for the provisional MVP read schema.
/// </summary>
public sealed class CaseReadEntity
{
    public Guid Id { get; set; }

    public bool IsSynthetic { get; set; }

    public long Version { get; set; }

    public DateTimeOffset? LastChangedAtUtc { get; set; }

    public string? LastChangedByActorId { get; set; }

    public string? LastChangedByActorName { get; set; }

    public GraveReadEntity? Grave { get; set; }

    public ICollection<DeceasedReadEntity> DeceasedPersons { get; } = [];

    public ICollection<BurialReadEntity> Burials { get; } = [];

    public ICollection<UsageRightReadEntity> UsageRights { get; } = [];

    public ICollection<EntitledPersonReadEntity> EntitledPersons { get; } = [];

    public ICollection<NoticeReadEntity> Notices { get; } = [];

    public ICollection<DataQualityNoteReadEntity> DataQualityNotes { get; } = [];

    public ICollection<CaseChangeEntity> Changes { get; } = [];
}

public sealed class CaseChangeEntity
{
    public Guid Id { get; set; }

    public Guid CaseId { get; set; }

    public long ResultingVersion { get; set; }

    public DateTimeOffset OccurredAtUtc { get; set; }

    public string ActorId { get; set; } = string.Empty;

    public string ActorDisplayName { get; set; } = string.Empty;

    public string Operation { get; set; } = string.Empty;

    public Guid? TargetEntityId { get; set; }

    public CaseReadEntity Case { get; set; } = null!;
}

public sealed class GraveReadEntity
{
    public Guid CaseId { get; set; }

    public string Cemetery { get; set; } = string.Empty;

    public string? Field { get; set; }

    public string? GraveNumber { get; set; }

    public Guid? GraveSiteId { get; set; }

    public Cemeteries.GraveSiteEntity? GraveSite { get; set; }

    public CaseReadEntity Case { get; set; } = null!;
}

public sealed class DeceasedReadEntity
{
    public Guid Id { get; set; }

    public Guid CaseId { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public DateOnly? BirthDate { get; set; }

    public DateOnly? DeathDate { get; set; }

    public CaseReadEntity Case { get; set; } = null!;

    public ICollection<BurialReadEntity> Burials { get; } = [];
}

public sealed class BurialReadEntity
{
    public Guid Id { get; set; }

    public Guid CaseId { get; set; }

    public Guid? DeceasedPersonId { get; set; }

    public DateOnly? BurialDate { get; set; }

    public Guid? GraveSiteId { get; set; }

    public string? ProcessStatus { get; set; }

    public DateOnly? PlanningDate { get; set; }

    public CaseReadEntity Case { get; set; } = null!;

    public DeceasedReadEntity? DeceasedPerson { get; set; }

    public Cemeteries.GraveSiteEntity? GraveSite { get; set; }
}

public sealed class UsageRightReadEntity
{
    public Guid Id { get; set; }

    public Guid CaseId { get; set; }

    public string? Reference { get; set; }

    public DateOnly? ValidFrom { get; set; }

    public DateOnly? ValidUntil { get; set; }

    public CaseReadEntity Case { get; set; } = null!;

    public ICollection<UsageRightHolderReadEntity> Holders { get; } = [];
}

public sealed class UsageRightHolderReadEntity
{
    public Guid Id { get; set; }

    public Guid UsageRightId { get; set; }

    public Guid EntitledPersonId { get; set; }

    public UsageRightReadEntity UsageRight { get; set; } = null!;

    public EntitledPersonReadEntity EntitledPerson { get; set; } = null!;
}

public sealed class EntitledPersonReadEntity
{
    public Guid Id { get; set; }

    public Guid CaseId { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? OrganizationName { get; set; }

    public CaseReadEntity Case { get; set; } = null!;

    public ICollection<AddressReadEntity> Addresses { get; } = [];

    public ICollection<UsageRightHolderReadEntity> UsageRights { get; } = [];
}

public sealed class AddressReadEntity
{
    public Guid Id { get; set; }

    public Guid EntitledPersonId { get; set; }

    public string? Street { get; set; }

    public string? HouseNumber { get; set; }

    public string? PostalCode { get; set; }

    public string? City { get; set; }

    public string? AdditionalInformation { get; set; }

    public EntitledPersonReadEntity EntitledPerson { get; set; } = null!;
}

public sealed class NoticeReadEntity
{
    public Guid Id { get; set; }

    public Guid CaseId { get; set; }

    public string? NoticeNumber { get; set; }

    public DateOnly? NoticeDate { get; set; }

    public DateOnly? DueDate { get; set; }

    public decimal? AssessedAmount { get; set; }

    public string? CurrencyCode { get; set; }

    public CaseReadEntity Case { get; set; } = null!;

    public ICollection<FeeItemReadEntity> FeeItems { get; } = [];
}

public sealed class FeeItemReadEntity
{
    public Guid Id { get; set; }

    public Guid NoticeId { get; set; }

    public string? Description { get; set; }

    public decimal? Amount { get; set; }

    public string? CurrencyCode { get; set; }

    public NoticeReadEntity Notice { get; set; } = null!;
}

public sealed class DataQualityNoteReadEntity
{
    public Guid Id { get; set; }

    public Guid CaseId { get; set; }

    public string Text { get; set; } = string.Empty;

    public CaseReadEntity Case { get; set; } = null!;
}
