using Cemaris.Application.Cemeteries;
using Cemaris.Domain.Cemeteries;

namespace Cemaris.Infrastructure.Cemeteries;

public sealed class SyntheticCemeteryMasterDataStore : ICemeteryMasterDataStore
{
    private readonly object gate = new();
    private readonly Dictionary<Guid, CemeteryView> cemeteries = [];
    private readonly Dictionary<Guid, CemeteryLevelView> areas = [];
    private readonly Dictionary<Guid, CemeteryLevelView> fields = [];
    private readonly Dictionary<Guid, CemeteryLevelView> rows = [];
    private readonly Dictionary<Guid, GraveTypeView> graveTypes = [];
    private readonly Dictionary<Guid, CemeteryGraveTypeView> assignments = [];
    private readonly Dictionary<Guid, GraveSiteView> graveSites = [];
    private readonly List<CemeteryMasterDataChange> changes = [];
    private readonly Dictionary<Guid, int> graveSiteReferences = [];

    public Task<CemeteryMasterDataSnapshot> ReadAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            var snapshot = new CemeteryMasterDataSnapshot(
                Filter(cemeteries.Values, x => x.IsActive, includeInactive),
                Filter(areas.Values, x => x.IsActive, includeInactive),
                Filter(fields.Values, x => x.IsActive, includeInactive),
                Filter(rows.Values, x => x.IsActive, includeInactive),
                Filter(graveTypes.Values, x => x.IsActive, includeInactive),
                Filter(assignments.Values, x => x.IsActive, includeInactive),
                ProjectGraveSites(includeInactive));
            return Task.FromResult(snapshot);
        }
    }

    private GraveSiteView[] ProjectGraveSites(bool includeInactive) => graveSites.Values
        .Where(site => includeInactive || SiteIsSelectable(site))
        .Select(site => site with
        {
            CemeteryName = cemeteries[site.CemeteryId].Name,
            AreaName = Name(areas, site.AreaId),
            FieldName = Name(fields, site.FieldId),
            RowName = Name(rows, site.RowId),
            GraveTypeName = graveTypes[site.GraveTypeId].Name,
        })
        .ToArray();

    private bool SiteIsSelectable(GraveSiteView site) =>
        site.IsActive && !site.IsBlocked && cemeteries[site.CemeteryId].IsActive && graveTypes[site.GraveTypeId].IsActive &&
        assignments.Values.Any(item => item.CemeteryId == site.CemeteryId && item.GraveTypeId == site.GraveTypeId && item.IsActive) &&
        (!site.AreaId.HasValue || areas[site.AreaId.Value].IsActive) &&
        (!site.FieldId.HasValue || fields[site.FieldId.Value].IsActive) &&
        (!site.RowId.HasValue || rows[site.RowId.Value].IsActive);

    public Task<CemeteryMasterDataMutationResult> SaveCemeteryAsync(Guid id, long? expectedVersion, SaveCemeteryCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        Mutate(() =>
        {
            var precondition = CheckVersion(cemeteries, id, expectedVersion);
            if (precondition is not null) return precondition;
            if (cemeteries.Values.Any(x => x.Id != id &&
                (Same(x.Name, command.Name!) || command.Code is not null && x.Code is not null && Same(x.Code, command.Code))))
                return Failed(CemeteryMasterDataMutationOutcome.Duplicate, id);
            var version = expectedVersion.GetValueOrDefault() + 1;
            cemeteries[id] = new(id, command.Name!, command.Code, command.Address, command.Note, command.IsActive, version);
            Add(change, id, version);
            return Success(id, version);
        });

    public Task<CemeteryMasterDataMutationResult> SaveAreaAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        SaveLevel(areas, cemeteries.ContainsKey(command.ParentId), id, expectedVersion, command, change);

    public Task<CemeteryMasterDataMutationResult> SaveFieldAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        SaveLevel(fields, areas.ContainsKey(command.ParentId), id, expectedVersion, command, change);

    public Task<CemeteryMasterDataMutationResult> SaveRowAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        SaveLevel(rows, fields.ContainsKey(command.ParentId), id, expectedVersion, command, change);

    public Task<CemeteryMasterDataMutationResult> SaveGraveTypeAsync(Guid id, long? expectedVersion, SaveGraveTypeCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        Mutate(() =>
        {
            var precondition = CheckVersion(graveTypes, id, expectedVersion);
            if (precondition is not null) return precondition;
            if (graveTypes.Values.Any(x => x.Id != id &&
                (Same(x.Name, command.Name!) || command.Code is not null && x.Code is not null && Same(x.Code, command.Code))))
                return Failed(CemeteryMasterDataMutationOutcome.Duplicate, id);
            var version = expectedVersion.GetValueOrDefault() + 1;
            graveTypes[id] = new(id, command.Name!, command.Code, command.BurialForm, command.Note, command.IsActive, version);
            Add(change, id, version);
            return Success(id, version);
        });

    public Task<CemeteryMasterDataMutationResult> SaveCemeteryGraveTypeAsync(Guid id, long? expectedVersion, SaveCemeteryGraveTypeCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        Mutate(() =>
        {
            var precondition = CheckVersion(assignments, id, expectedVersion);
            if (precondition is not null) return precondition;
            if (!cemeteries.ContainsKey(command.CemeteryId) || !graveTypes.ContainsKey(command.GraveTypeId))
                return Failed(CemeteryMasterDataMutationOutcome.InvalidReference, id);
            if (assignments.Values.Any(x => x.Id != id && x.CemeteryId == command.CemeteryId && x.GraveTypeId == command.GraveTypeId))
                return Failed(CemeteryMasterDataMutationOutcome.Duplicate, id);
            var version = expectedVersion.GetValueOrDefault() + 1;
            assignments[id] = new(id, command.CemeteryId, command.GraveTypeId, command.IsActive, version);
            Add(change, id, version);
            return Success(id, version);
        });

    public Task<CemeteryMasterDataMutationResult> SaveGraveSiteAsync(Guid id, long? expectedVersion, SaveGraveSiteCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        Mutate(() =>
        {
            var precondition = CheckVersion(graveSites, id, expectedVersion);
            if (precondition is not null) return precondition;
            if (!ValidPath(command) || !assignments.Values.Any(x => x.CemeteryId == command.CemeteryId && x.GraveTypeId == command.GraveTypeId))
                return Failed(CemeteryMasterDataMutationOutcome.InvalidReference, id);
            if (graveSites.TryGetValue(id, out var current)) CemeteryMasterDataRules.EnsureStatusTransition(current.Status, command.Status);
            if (graveSites.Values.Any(x => x.Id != id && x.CemeteryId == command.CemeteryId && x.AreaId == command.AreaId && x.FieldId == command.FieldId && x.RowId == command.RowId && Same(x.GraveNumber, command.GraveNumber!)))
                return Failed(CemeteryMasterDataMutationOutcome.Duplicate, id);
            var version = expectedVersion.GetValueOrDefault() + 1;
            graveSites[id] = new(
                id, command.CemeteryId, command.AreaId, command.FieldId, command.RowId, command.GraveTypeId,
                command.GraveNumber!, command.Status, command.IsBlocked, command.BlockNote, command.TargetCapacity,
                command.Note, command.IsActive, version, cemeteries[command.CemeteryId].Name,
                Name(areas, command.AreaId), Name(fields, command.FieldId), Name(rows, command.RowId), graveTypes[command.GraveTypeId].Name);
            Add(change, id, version);
            return Success(id, version);
        });

    public Task<CemeteryMasterDataMutationResult> DeleteAsync(CemeteryMasterDataKind kind, Guid id, long expectedVersion, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        Mutate(() =>
        {
            var inUse = kind switch
            {
                CemeteryMasterDataKind.Cemetery => areas.Values.Any(x => x.ParentId == id) || graveSites.Values.Any(x => x.CemeteryId == id) || assignments.Values.Any(x => x.CemeteryId == id),
                CemeteryMasterDataKind.Area => fields.Values.Any(x => x.ParentId == id) || graveSites.Values.Any(x => x.AreaId == id),
                CemeteryMasterDataKind.Field => rows.Values.Any(x => x.ParentId == id) || graveSites.Values.Any(x => x.FieldId == id),
                CemeteryMasterDataKind.Row => graveSites.Values.Any(x => x.RowId == id),
                CemeteryMasterDataKind.GraveType => assignments.Values.Any(x => x.GraveTypeId == id) || graveSites.Values.Any(x => x.GraveTypeId == id),
                CemeteryMasterDataKind.CemeteryGraveType => assignments.TryGetValue(id, out var a) && graveSites.Values.Any(x => x.CemeteryId == a.CemeteryId && x.GraveTypeId == a.GraveTypeId),
                CemeteryMasterDataKind.GraveSite => graveSiteReferences.GetValueOrDefault(id) > 0,
                _ => true,
            };
            if (inUse) return Failed(CemeteryMasterDataMutationOutcome.InUse, id);
            var result = Remove(kind, id, expectedVersion);
            if (result.Outcome == CemeteryMasterDataMutationOutcome.Success) Add(change, id, expectedVersion + 1);
            return result;
        });

    private Task<CemeteryMasterDataMutationResult> SaveLevel(
        Dictionary<Guid, CemeteryLevelView> target,
        bool parentExists,
        Guid id,
        long? expectedVersion,
        SaveCemeteryLevelCommand command,
        CemeteryMasterDataChange change) =>
        Mutate(() =>
        {
            var precondition = CheckVersion(target, id, expectedVersion);
            if (precondition is not null) return precondition;
            if (!parentExists) return Failed(CemeteryMasterDataMutationOutcome.InvalidReference, id);
            if (target.Values.Any(x => x.Id != id && x.ParentId == command.ParentId &&
                (Same(x.Name, command.Name!) || command.Code is not null && x.Code is not null && Same(x.Code, command.Code))))
                return Failed(CemeteryMasterDataMutationOutcome.Duplicate, id);
            var version = expectedVersion.GetValueOrDefault() + 1;
            target[id] = new(id, command.ParentId, command.Name!, command.Code, command.Note, command.IsActive, version);
            Add(change, id, version);
            return Success(id, version);
        });

    private bool ValidPath(SaveGraveSiteCommand command) =>
        cemeteries.ContainsKey(command.CemeteryId) && graveTypes.ContainsKey(command.GraveTypeId) &&
        (!command.AreaId.HasValue || areas.TryGetValue(command.AreaId.Value, out var area) && area.ParentId == command.CemeteryId) &&
        (!command.FieldId.HasValue || command.AreaId.HasValue && fields.TryGetValue(command.FieldId.Value, out var field) && field.ParentId == command.AreaId) &&
        (!command.RowId.HasValue || command.FieldId.HasValue && rows.TryGetValue(command.RowId.Value, out var row) && row.ParentId == command.FieldId);

    private CemeteryMasterDataMutationResult Remove(CemeteryMasterDataKind kind, Guid id, long expectedVersion)
    {
        bool removed = kind switch
        {
            CemeteryMasterDataKind.Cemetery => Remove(cemeteries, id, expectedVersion),
            CemeteryMasterDataKind.Area => Remove(areas, id, expectedVersion),
            CemeteryMasterDataKind.Field => Remove(fields, id, expectedVersion),
            CemeteryMasterDataKind.Row => Remove(rows, id, expectedVersion),
            CemeteryMasterDataKind.GraveType => Remove(graveTypes, id, expectedVersion),
            CemeteryMasterDataKind.CemeteryGraveType => Remove(assignments, id, expectedVersion),
            CemeteryMasterDataKind.GraveSite => Remove(graveSites, id, expectedVersion),
            _ => false,
        };
        return removed ? Success(id, expectedVersion) : Failed(CemeteryMasterDataMutationOutcome.Conflict, id);
    }

    private static bool Remove<T>(Dictionary<Guid, T> source, Guid id, long expectedVersion) where T : notnull =>
        source.TryGetValue(id, out var value) && Version(value) == expectedVersion && source.Remove(id);

    private static CemeteryMasterDataMutationResult? CheckVersion<T>(Dictionary<Guid, T> source, Guid id, long? expectedVersion) where T : notnull
    {
        if (!source.TryGetValue(id, out var current))
            return expectedVersion.HasValue ? Failed(CemeteryMasterDataMutationOutcome.NotFound, id) : null;
        return expectedVersion.HasValue && Version(current) == expectedVersion.Value
            ? null
            : Failed(CemeteryMasterDataMutationOutcome.Conflict, id, Version(current));
    }

    private void Add(CemeteryMasterDataChange change, Guid id, long version) => changes.Add(change with { EntityId = id, ResultingVersion = version });
    private static long Version<T>(T item) => (long)(item!.GetType().GetProperty("Version")?.GetValue(item) ?? 0L);
    private static string? Name(Dictionary<Guid, CemeteryLevelView> source, Guid? id) => id.HasValue && source.TryGetValue(id.Value, out var item) ? item.Name : null;
    private static bool Same(string left, string right) => CemeteryMasterDataRules.UniqueKey(left) == CemeteryMasterDataRules.UniqueKey(right);
    private static T[] Filter<T>(IEnumerable<T> source, Func<T, bool> active, bool includeInactive) => source.Where(x => includeInactive || active(x)).ToArray();
    private static CemeteryMasterDataMutationResult Success(Guid id, long version) => new(CemeteryMasterDataMutationOutcome.Success, id, version);
    private static CemeteryMasterDataMutationResult Failed(CemeteryMasterDataMutationOutcome outcome, Guid id, long version = 0) => new(outcome, id, version);

    private Task<CemeteryMasterDataMutationResult> Mutate(Func<CemeteryMasterDataMutationResult> action)
    {
        lock (gate) return Task.FromResult(action());
    }

    internal void ChangeGraveSiteReference(Guid? previous, Guid? current)
    {
        lock (gate)
        {
            if (previous.HasValue && graveSiteReferences.TryGetValue(previous.Value, out var count))
            {
                if (count <= 1) graveSiteReferences.Remove(previous.Value);
                else graveSiteReferences[previous.Value] = count - 1;
            }
            if (current.HasValue)
            {
                graveSiteReferences[current.Value] = graveSiteReferences.GetValueOrDefault(current.Value) + 1;
            }
        }
    }
}
