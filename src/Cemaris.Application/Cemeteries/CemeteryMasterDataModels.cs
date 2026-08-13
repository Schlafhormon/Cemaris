using Cemaris.Domain.Cemeteries;

namespace Cemaris.Application.Cemeteries;

public sealed record CemeteryView(
    Guid Id, string Name, string? Code, string? Address, string? Note, bool IsActive, long Version);

public sealed record CemeteryLevelView(
    Guid Id, Guid ParentId, string Name, string? Code, string? Note, bool IsActive, long Version);

public sealed record GraveTypeView(
    Guid Id, string Name, string? Code, BurialForm BurialForm, string? Note, bool IsActive, long Version);

public sealed record CemeteryGraveTypeView(
    Guid Id, Guid CemeteryId, Guid GraveTypeId, bool IsActive, long Version);

public sealed record GraveSiteView(
    Guid Id,
    Guid CemeteryId,
    Guid? AreaId,
    Guid? FieldId,
    Guid? RowId,
    Guid GraveTypeId,
    string GraveNumber,
    GraveSiteStatus Status,
    bool IsBlocked,
    string? BlockNote,
    int? TargetCapacity,
    string? Note,
    bool IsActive,
    long Version,
    string CemeteryName,
    string? AreaName,
    string? FieldName,
    string? RowName,
    string GraveTypeName);

public sealed record CemeteryMasterDataSnapshot(
    IReadOnlyList<CemeteryView> Cemeteries,
    IReadOnlyList<CemeteryLevelView> Areas,
    IReadOnlyList<CemeteryLevelView> Fields,
    IReadOnlyList<CemeteryLevelView> Rows,
    IReadOnlyList<GraveTypeView> GraveTypes,
    IReadOnlyList<CemeteryGraveTypeView> CemeteryGraveTypes,
    IReadOnlyList<GraveSiteView> GraveSites);

public sealed record SaveCemeteryCommand(string? Name, string? Code, string? Address, string? Note, bool IsActive);
public sealed record SaveCemeteryLevelCommand(Guid ParentId, string? Name, string? Code, string? Note, bool IsActive);
public sealed record SaveGraveTypeCommand(string? Name, string? Code, BurialForm BurialForm, string? Note, bool IsActive);
public sealed record SaveCemeteryGraveTypeCommand(Guid CemeteryId, Guid GraveTypeId, bool IsActive);
public sealed record SaveGraveSiteCommand(
    Guid CemeteryId,
    Guid? AreaId,
    Guid? FieldId,
    Guid? RowId,
    Guid GraveTypeId,
    string? GraveNumber,
    GraveSiteStatus Status,
    bool IsBlocked,
    string? BlockNote,
    int? TargetCapacity,
    string? Note,
    bool IsActive);

public enum CemeteryMasterDataKind
{
    Cemetery,
    Area,
    Field,
    Row,
    GraveType,
    CemeteryGraveType,
    GraveSite,
}

public enum CemeteryMasterDataMutationOutcome
{
    Success,
    NotFound,
    Conflict,
    Duplicate,
    InvalidReference,
    InUse,
}

public sealed record CemeteryMasterDataMutationResult(
    CemeteryMasterDataMutationOutcome Outcome,
    Guid Id,
    long Version);

public sealed record CemeteryMasterDataChange(
    Guid Id,
    CemeteryMasterDataKind Kind,
    Guid EntityId,
    long ResultingVersion,
    DateTimeOffset ChangedAtUtc,
    Identity.ActorIdentity Actor,
    string Operation);
