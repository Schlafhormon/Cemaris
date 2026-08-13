namespace Cemaris.Infrastructure.Persistence.Cemeteries;

public abstract class VersionedMasterDataEntity
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
    public long Version { get; set; }
}

public sealed class CemeteryEntity : VersionedMasterDataEntity
{
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? NormalizedCode { get; set; }
    public string? Address { get; set; }
    public string? Note { get; set; }
}

public abstract class CemeteryLevelEntity : VersionedMasterDataEntity
{
    public Guid ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? NormalizedCode { get; set; }
    public string? Note { get; set; }
}

public sealed class CemeteryAreaEntity : CemeteryLevelEntity;
public sealed class CemeteryFieldEntity : CemeteryLevelEntity;
public sealed class CemeteryRowEntity : CemeteryLevelEntity;

public sealed class GraveTypeEntity : VersionedMasterDataEntity
{
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? NormalizedCode { get; set; }
    public string BurialForm { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public sealed class CemeteryGraveTypeEntity : VersionedMasterDataEntity
{
    public Guid CemeteryId { get; set; }
    public Guid GraveTypeId { get; set; }
}

public sealed class GraveSiteEntity : VersionedMasterDataEntity
{
    public Guid CemeteryId { get; set; }
    public Guid? AreaId { get; set; }
    public Guid? FieldId { get; set; }
    public Guid? RowId { get; set; }
    public Guid GraveTypeId { get; set; }
    public string GraveNumber { get; set; } = string.Empty;
    public string NormalizedGraveNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsBlocked { get; set; }
    public string? BlockNote { get; set; }
    public int? TargetCapacity { get; set; }
    public string? Note { get; set; }
    public CemeteryEntity Cemetery { get; set; } = null!;
    public CemeteryAreaEntity? Area { get; set; }
    public CemeteryFieldEntity? Field { get; set; }
    public CemeteryRowEntity? Row { get; set; }
    public GraveTypeEntity GraveType { get; set; } = null!;
}

public sealed class CemeteryMasterDataChangeEntity
{
    public Guid Id { get; set; }
    public string EntityKind { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public long ResultingVersion { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
}
