using Cemaris.Application.Cemeteries;
using Cemaris.Domain.Cemeteries;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Cemeteries;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.Cemeteries;

public sealed class EfCemeteryMasterDataStore(CemarisDbContext dbContext) : ICemeteryMasterDataStore
{
    public async Task<CemeteryMasterDataSnapshot> ReadAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        var cemeteries = await dbContext.Cemeteries.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);
        var areas = await dbContext.CemeteryAreas.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);
        var fields = await dbContext.CemeteryFields.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);
        var rows = await dbContext.CemeteryRows.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);
        var graveTypes = await dbContext.GraveTypes.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);
        var assignments = await dbContext.CemeteryGraveTypes.AsNoTracking().ToListAsync(cancellationToken);
        var sites = await dbContext.GraveSites.AsNoTracking().OrderBy(x => x.GraveNumber).ToListAsync(cancellationToken);

        return new(
            cemeteries.Where(x => includeInactive || x.IsActive).Select(x => new CemeteryView(x.Id, x.Name, x.Code, x.Address, x.Note, x.IsActive, x.Version)).ToArray(),
            areas.Where(x => includeInactive || x.IsActive).Select(Level).ToArray(), fields.Where(x => includeInactive || x.IsActive).Select(Level).ToArray(), rows.Where(x => includeInactive || x.IsActive).Select(Level).ToArray(),
            graveTypes.Where(x => includeInactive || x.IsActive).Select(x => new GraveTypeView(x.Id, x.Name, x.Code, Enum.Parse<BurialForm>(x.BurialForm), x.Note, x.IsActive, x.Version)).ToArray(),
            assignments.Where(x => includeInactive || x.IsActive).Select(x => new CemeteryGraveTypeView(x.Id, x.CemeteryId, x.GraveTypeId, x.IsActive, x.Version)).ToArray(),
            sites.Where(x => includeInactive || SiteIsSelectable(x, cemeteries, areas, fields, rows, graveTypes, assignments)).Select(x => new GraveSiteView(
                x.Id, x.CemeteryId, x.AreaId, x.FieldId, x.RowId, x.GraveTypeId, x.GraveNumber,
                Enum.Parse<GraveSiteStatus>(x.Status), x.IsBlocked, x.BlockNote, x.TargetCapacity, x.Note, x.IsActive, x.Version,
                cemeteries.Single(c => c.Id == x.CemeteryId).Name,
                areas.SingleOrDefault(a => a.Id == x.AreaId)?.Name,
                fields.SingleOrDefault(f => f.Id == x.FieldId)?.Name,
                rows.SingleOrDefault(r => r.Id == x.RowId)?.Name,
                graveTypes.Single(g => g.Id == x.GraveTypeId).Name)).ToArray());
    }

    private static bool SiteIsSelectable(
        GraveSiteEntity site,
        IReadOnlyCollection<CemeteryEntity> cemeteries,
        IReadOnlyCollection<CemeteryAreaEntity> areas,
        IReadOnlyCollection<CemeteryFieldEntity> fields,
        IReadOnlyCollection<CemeteryRowEntity> rows,
        IReadOnlyCollection<GraveTypeEntity> graveTypes,
        IReadOnlyCollection<CemeteryGraveTypeEntity> assignments) =>
        site.IsActive && !site.IsBlocked && cemeteries.Any(x => x.Id == site.CemeteryId && x.IsActive) &&
        graveTypes.Any(x => x.Id == site.GraveTypeId && x.IsActive) &&
        assignments.Any(x => x.CemeteryId == site.CemeteryId && x.GraveTypeId == site.GraveTypeId && x.IsActive) &&
        (!site.AreaId.HasValue || areas.Any(x => x.Id == site.AreaId && x.IsActive)) &&
        (!site.FieldId.HasValue || fields.Any(x => x.Id == site.FieldId && x.IsActive)) &&
        (!site.RowId.HasValue || rows.Any(x => x.Id == site.RowId && x.IsActive));

    public async Task<CemeteryMasterDataMutationResult> SaveCemeteryAsync(Guid id, long? expectedVersion, SaveCemeteryCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken)
    {
        var current = await dbContext.Cemeteries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        var failed = Check(current, expectedVersion, id); if (failed is not null) return failed;
        var name = Key(command.Name!); var code = Key(command.Code);
        if (await dbContext.Cemeteries.AnyAsync(x => x.Id != id && (x.NormalizedName == name || code != null && x.NormalizedCode == code), cancellationToken)) return Duplicate(id);
        current ??= Add(dbContext.Cemeteries, new CemeteryEntity { Id = id });
        current.Name = command.Name!; current.NormalizedName = name!; current.Code = command.Code; current.NormalizedCode = code;
        current.Address = command.Address; current.Note = command.Note; current.IsActive = command.IsActive;
        return await SaveAsync(current, expectedVersion, change, cancellationToken);
    }

    public Task<CemeteryMasterDataMutationResult> SaveAreaAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        SaveLevelAsync(dbContext.CemeteryAreas, dbContext.Cemeteries.Any(x => x.Id == command.ParentId), id, expectedVersion, command, change, cancellationToken);
    public Task<CemeteryMasterDataMutationResult> SaveFieldAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        SaveLevelAsync(dbContext.CemeteryFields, dbContext.CemeteryAreas.Any(x => x.Id == command.ParentId), id, expectedVersion, command, change, cancellationToken);
    public Task<CemeteryMasterDataMutationResult> SaveRowAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) =>
        SaveLevelAsync(dbContext.CemeteryRows, dbContext.CemeteryFields.Any(x => x.Id == command.ParentId), id, expectedVersion, command, change, cancellationToken);

    public async Task<CemeteryMasterDataMutationResult> SaveGraveTypeAsync(Guid id, long? expectedVersion, SaveGraveTypeCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken)
    {
        var current = await dbContext.GraveTypes.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        var failed = Check(current, expectedVersion, id); if (failed is not null) return failed;
        var name = Key(command.Name!); var code = Key(command.Code);
        if (await dbContext.GraveTypes.AnyAsync(x => x.Id != id && (x.NormalizedName == name || code != null && x.NormalizedCode == code), cancellationToken)) return Duplicate(id);
        current ??= Add(dbContext.GraveTypes, new GraveTypeEntity { Id = id });
        current.Name = command.Name!; current.NormalizedName = name!; current.Code = command.Code; current.NormalizedCode = code;
        current.BurialForm = command.BurialForm.ToString(); current.Note = command.Note; current.IsActive = command.IsActive;
        return await SaveAsync(current, expectedVersion, change, cancellationToken);
    }

    public async Task<CemeteryMasterDataMutationResult> SaveCemeteryGraveTypeAsync(Guid id, long? expectedVersion, SaveCemeteryGraveTypeCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken)
    {
        var current = await dbContext.CemeteryGraveTypes.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        var failed = Check(current, expectedVersion, id); if (failed is not null) return failed;
        if (!await dbContext.Cemeteries.AnyAsync(x => x.Id == command.CemeteryId, cancellationToken) || !await dbContext.GraveTypes.AnyAsync(x => x.Id == command.GraveTypeId, cancellationToken)) return Invalid(id);
        if (await dbContext.CemeteryGraveTypes.AnyAsync(x => x.Id != id && x.CemeteryId == command.CemeteryId && x.GraveTypeId == command.GraveTypeId, cancellationToken)) return Duplicate(id);
        current ??= Add(dbContext.CemeteryGraveTypes, new CemeteryGraveTypeEntity { Id = id });
        current.CemeteryId = command.CemeteryId; current.GraveTypeId = command.GraveTypeId; current.IsActive = command.IsActive;
        return await SaveAsync(current, expectedVersion, change, cancellationToken);
    }

    public async Task<CemeteryMasterDataMutationResult> SaveGraveSiteAsync(Guid id, long? expectedVersion, SaveGraveSiteCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken)
    {
        var current = await dbContext.GraveSites.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        var failed = Check(current, expectedVersion, id); if (failed is not null) return failed;
        if (!await ValidPathAsync(command, cancellationToken)) return Invalid(id);
        if (current is not null) CemeteryMasterDataRules.EnsureStatusTransition(Enum.Parse<GraveSiteStatus>(current.Status), command.Status);
        var number = Key(command.GraveNumber!)!;
        if (await dbContext.GraveSites.AnyAsync(x => x.Id != id && x.CemeteryId == command.CemeteryId && x.AreaId == command.AreaId && x.FieldId == command.FieldId && x.RowId == command.RowId && x.NormalizedGraveNumber == number, cancellationToken)) return Duplicate(id);
        current ??= Add(dbContext.GraveSites, new GraveSiteEntity { Id = id });
        current.CemeteryId = command.CemeteryId; current.AreaId = command.AreaId; current.FieldId = command.FieldId; current.RowId = command.RowId;
        current.GraveTypeId = command.GraveTypeId; current.GraveNumber = command.GraveNumber!; current.NormalizedGraveNumber = number;
        current.Status = command.Status.ToString(); current.IsBlocked = command.IsBlocked; current.BlockNote = command.BlockNote;
        current.TargetCapacity = command.TargetCapacity; current.Note = command.Note; current.IsActive = command.IsActive;
        return await SaveAsync(current, expectedVersion, change, cancellationToken);
    }

    public async Task<CemeteryMasterDataMutationResult> DeleteAsync(CemeteryMasterDataKind kind, Guid id, long expectedVersion, CemeteryMasterDataChange change, CancellationToken cancellationToken)
    {
        var inUse = kind switch
        {
            CemeteryMasterDataKind.Cemetery => await dbContext.CemeteryAreas.AnyAsync(x => x.ParentId == id, cancellationToken) || await dbContext.GraveSites.AnyAsync(x => x.CemeteryId == id, cancellationToken) || await dbContext.CemeteryGraveTypes.AnyAsync(x => x.CemeteryId == id, cancellationToken),
            CemeteryMasterDataKind.Area => await dbContext.CemeteryFields.AnyAsync(x => x.ParentId == id, cancellationToken) || await dbContext.GraveSites.AnyAsync(x => x.AreaId == id, cancellationToken),
            CemeteryMasterDataKind.Field => await dbContext.CemeteryRows.AnyAsync(x => x.ParentId == id, cancellationToken) || await dbContext.GraveSites.AnyAsync(x => x.FieldId == id, cancellationToken),
            CemeteryMasterDataKind.Row => await dbContext.GraveSites.AnyAsync(x => x.RowId == id, cancellationToken),
            CemeteryMasterDataKind.GraveType => await dbContext.CemeteryGraveTypes.AnyAsync(x => x.GraveTypeId == id, cancellationToken) || await dbContext.GraveSites.AnyAsync(x => x.GraveTypeId == id, cancellationToken),
            CemeteryMasterDataKind.CemeteryGraveType => await AssignmentUsedAsync(id, cancellationToken),
            CemeteryMasterDataKind.GraveSite => await dbContext.Graves.AnyAsync(x => x.GraveSiteId == id, cancellationToken),
            _ => true,
        };
        if (inUse) return new(CemeteryMasterDataMutationOutcome.InUse, id, expectedVersion);

        VersionedMasterDataEntity? entity = kind switch
        {
            CemeteryMasterDataKind.Cemetery => await dbContext.Cemeteries.FindAsync([id], cancellationToken),
            CemeteryMasterDataKind.Area => await dbContext.CemeteryAreas.FindAsync([id], cancellationToken),
            CemeteryMasterDataKind.Field => await dbContext.CemeteryFields.FindAsync([id], cancellationToken),
            CemeteryMasterDataKind.Row => await dbContext.CemeteryRows.FindAsync([id], cancellationToken),
            CemeteryMasterDataKind.GraveType => await dbContext.GraveTypes.FindAsync([id], cancellationToken),
            CemeteryMasterDataKind.CemeteryGraveType => await dbContext.CemeteryGraveTypes.FindAsync([id], cancellationToken),
            CemeteryMasterDataKind.GraveSite => await dbContext.GraveSites.FindAsync([id], cancellationToken),
            _ => null,
        };
        if (entity is null) return new(CemeteryMasterDataMutationOutcome.NotFound, id, 0);
        if (entity.Version != expectedVersion) return new(CemeteryMasterDataMutationOutcome.Conflict, id, entity.Version);
        dbContext.Remove(entity);
        dbContext.CemeteryMasterDataChanges.Add(ToEntity(change with { ResultingVersion = expectedVersion + 1, Operation = "Deleted" }));
        await dbContext.SaveChangesAsync(cancellationToken);
        return new(CemeteryMasterDataMutationOutcome.Success, id, expectedVersion + 1);
    }

    private async Task<CemeteryMasterDataMutationResult> SaveLevelAsync<T>(DbSet<T> set, bool parentExists, Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken) where T : CemeteryLevelEntity, new()
    {
        var current = await set.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        var failed = Check(current, expectedVersion, id); if (failed is not null) return failed;
        if (!parentExists) return Invalid(id);
        var name = Key(command.Name!); var code = Key(command.Code);
        if (await set.AnyAsync(x => x.Id != id && x.ParentId == command.ParentId && (x.NormalizedName == name || code != null && x.NormalizedCode == code), cancellationToken)) return Duplicate(id);
        current ??= Add(set, new T { Id = id });
        current.ParentId = command.ParentId; current.Name = command.Name!; current.NormalizedName = name!; current.Code = command.Code; current.NormalizedCode = code;
        current.Note = command.Note; current.IsActive = command.IsActive;
        return await SaveAsync(current, expectedVersion, change, cancellationToken);
    }

    private async Task<bool> ValidPathAsync(SaveGraveSiteCommand command, CancellationToken cancellationToken)
    {
        if (!await dbContext.Cemeteries.AnyAsync(x => x.Id == command.CemeteryId, cancellationToken) ||
            !await dbContext.GraveTypes.AnyAsync(x => x.Id == command.GraveTypeId, cancellationToken) ||
            !await dbContext.CemeteryGraveTypes.AnyAsync(x => x.CemeteryId == command.CemeteryId && x.GraveTypeId == command.GraveTypeId, cancellationToken)) return false;
        if (command.AreaId.HasValue && !await dbContext.CemeteryAreas.AnyAsync(x => x.Id == command.AreaId && x.ParentId == command.CemeteryId, cancellationToken)) return false;
        if (command.FieldId.HasValue && (!command.AreaId.HasValue || !await dbContext.CemeteryFields.AnyAsync(x => x.Id == command.FieldId && x.ParentId == command.AreaId, cancellationToken))) return false;
        return !command.RowId.HasValue || command.FieldId.HasValue && await dbContext.CemeteryRows.AnyAsync(x => x.Id == command.RowId && x.ParentId == command.FieldId, cancellationToken);
    }

    private async Task<bool> AssignmentUsedAsync(Guid id, CancellationToken cancellationToken)
    {
        var a = await dbContext.CemeteryGraveTypes.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return a is not null && await dbContext.GraveSites.AnyAsync(x => x.CemeteryId == a.CemeteryId && x.GraveTypeId == a.GraveTypeId, cancellationToken);
    }

    private async Task<CemeteryMasterDataMutationResult> SaveAsync(VersionedMasterDataEntity entity, long? expectedVersion, CemeteryMasterDataChange change, CancellationToken cancellationToken)
    {
        entity.Version = expectedVersion.GetValueOrDefault() + 1;
        dbContext.CemeteryMasterDataChanges.Add(ToEntity(change with { ResultingVersion = entity.Version }));
        try { await dbContext.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return new(CemeteryMasterDataMutationOutcome.Conflict, entity.Id, entity.Version); }
        catch (DbUpdateException) { return Duplicate(entity.Id); }
        return new(CemeteryMasterDataMutationOutcome.Success, entity.Id, entity.Version);
    }

    private static T Add<T>(DbSet<T> set, T entity) where T : class { set.Add(entity); return entity; }
    private static CemeteryLevelView Level(CemeteryLevelEntity x) => new(x.Id, x.ParentId, x.Name, x.Code, x.Note, x.IsActive, x.Version);
    private static string? Key(string? value) => value is null ? null : CemeteryMasterDataRules.UniqueKey(value);
    private static CemeteryMasterDataMutationResult? Check(VersionedMasterDataEntity? entity, long? expected, Guid id) => entity is null ? expected.HasValue ? new(CemeteryMasterDataMutationOutcome.NotFound, id, 0) : null : expected == entity.Version ? null : new(CemeteryMasterDataMutationOutcome.Conflict, id, entity.Version);
    private static CemeteryMasterDataMutationResult Duplicate(Guid id) => new(CemeteryMasterDataMutationOutcome.Duplicate, id, 0);
    private static CemeteryMasterDataMutationResult Invalid(Guid id) => new(CemeteryMasterDataMutationOutcome.InvalidReference, id, 0);
    private static CemeteryMasterDataChangeEntity ToEntity(CemeteryMasterDataChange x) => new() { Id = x.Id, EntityKind = x.Kind.ToString(), EntityId = x.EntityId, ResultingVersion = x.ResultingVersion, OccurredAtUtc = x.ChangedAtUtc, ActorId = x.Actor.Id, ActorDisplayName = x.Actor.DisplayName, Operation = x.Operation };
}
