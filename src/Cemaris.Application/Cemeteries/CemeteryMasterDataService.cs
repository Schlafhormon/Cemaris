using Cemaris.Application.Identity;
using Cemaris.Domain.Cemeteries;

namespace Cemaris.Application.Cemeteries;

public sealed class CemeteryMasterDataService(
    ICemeteryMasterDataStore store,
    ICurrentActorProvider currentActorProvider,
    TimeProvider timeProvider)
{
    public Task<CemeteryMasterDataSnapshot> ReadAsync(bool includeInactive, CancellationToken cancellationToken) =>
        store.ReadAsync(includeInactive, cancellationToken);

    public Task<CemeteryMasterDataMutationResult> SaveCemeteryAsync(Guid? id, long? version, SaveCemeteryCommand command, CancellationToken cancellationToken)
    {
        var clean = command with
        {
            Name = CemeteryMasterDataRules.Required(command.Name, "name", CemeteryMasterDataRules.NameMaximumLength),
            Code = CemeteryMasterDataRules.Optional(command.Code, CemeteryMasterDataRules.CodeMaximumLength),
            Address = CemeteryMasterDataRules.Optional(command.Address, CemeteryMasterDataRules.AddressMaximumLength),
            Note = CemeteryMasterDataRules.Optional(command.Note, CemeteryMasterDataRules.NoteMaximumLength),
        };
        var entityId = id ?? Guid.NewGuid();
        return store.SaveCemeteryAsync(entityId, version, clean, Change(CemeteryMasterDataKind.Cemetery, entityId, version), cancellationToken);
    }

    public Task<CemeteryMasterDataMutationResult> SaveAreaAsync(Guid? id, long? version, SaveCemeteryLevelCommand command, CancellationToken cancellationToken) =>
        SaveLevelAsync(CemeteryMasterDataKind.Area, id, version, command, store.SaveAreaAsync, cancellationToken);

    public Task<CemeteryMasterDataMutationResult> SaveFieldAsync(Guid? id, long? version, SaveCemeteryLevelCommand command, CancellationToken cancellationToken) =>
        SaveLevelAsync(CemeteryMasterDataKind.Field, id, version, command, store.SaveFieldAsync, cancellationToken);

    public Task<CemeteryMasterDataMutationResult> SaveRowAsync(Guid? id, long? version, SaveCemeteryLevelCommand command, CancellationToken cancellationToken) =>
        SaveLevelAsync(CemeteryMasterDataKind.Row, id, version, command, store.SaveRowAsync, cancellationToken);

    public Task<CemeteryMasterDataMutationResult> SaveGraveTypeAsync(Guid? id, long? version, SaveGraveTypeCommand command, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(command.BurialForm)) throw new CemeteryMasterDataValidationException("burialForm", "Die Beisetzungsform ist ungültig.");
        var clean = command with
        {
            Name = CemeteryMasterDataRules.Required(command.Name, "name", CemeteryMasterDataRules.NameMaximumLength),
            Code = CemeteryMasterDataRules.Optional(command.Code, CemeteryMasterDataRules.CodeMaximumLength),
            Note = CemeteryMasterDataRules.Optional(command.Note, CemeteryMasterDataRules.NoteMaximumLength),
        };
        var entityId = id ?? Guid.NewGuid();
        return store.SaveGraveTypeAsync(entityId, version, clean, Change(CemeteryMasterDataKind.GraveType, entityId, version), cancellationToken);
    }

    public Task<CemeteryMasterDataMutationResult> SaveCemeteryGraveTypeAsync(Guid? id, long? version, SaveCemeteryGraveTypeCommand command, CancellationToken cancellationToken)
    {
        var entityId = id ?? Guid.NewGuid();
        return store.SaveCemeteryGraveTypeAsync(entityId, version, command, Change(CemeteryMasterDataKind.CemeteryGraveType, entityId, version), cancellationToken);
    }

    public Task<CemeteryMasterDataMutationResult> SaveGraveSiteAsync(Guid? id, long? version, SaveGraveSiteCommand command, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(command.Status)) throw new CemeteryMasterDataValidationException("status", "Der Grabstellenstatus ist ungültig.");
        if (command.TargetCapacity is <= 0) throw new CemeteryMasterDataValidationException("targetCapacity", "Die Soll-Kapazität muss positiv sein.");
        var clean = command with
        {
            GraveNumber = CemeteryMasterDataRules.Required(command.GraveNumber, "graveNumber", CemeteryMasterDataRules.CodeMaximumLength),
            BlockNote = CemeteryMasterDataRules.Optional(command.BlockNote, CemeteryMasterDataRules.NoteMaximumLength),
            Note = CemeteryMasterDataRules.Optional(command.Note, CemeteryMasterDataRules.NoteMaximumLength),
        };
        var entityId = id ?? Guid.NewGuid();
        return store.SaveGraveSiteAsync(entityId, version, clean, Change(CemeteryMasterDataKind.GraveSite, entityId, version), cancellationToken);
    }

    public Task<CemeteryMasterDataMutationResult> DeleteAsync(CemeteryMasterDataKind kind, Guid id, long version, CancellationToken cancellationToken) =>
        store.DeleteAsync(kind, id, version, Change(kind, id, version) with { Operation = "Deleted" }, cancellationToken);

    private Task<CemeteryMasterDataMutationResult> SaveLevelAsync(
        CemeteryMasterDataKind kind,
        Guid? id,
        long? version,
        SaveCemeteryLevelCommand command,
        Func<Guid, long?, SaveCemeteryLevelCommand, CemeteryMasterDataChange, CancellationToken, Task<CemeteryMasterDataMutationResult>> save,
        CancellationToken cancellationToken)
    {
        var clean = command with
        {
            Name = CemeteryMasterDataRules.Required(command.Name, "name", CemeteryMasterDataRules.NameMaximumLength),
            Code = CemeteryMasterDataRules.Optional(command.Code, CemeteryMasterDataRules.CodeMaximumLength),
            Note = CemeteryMasterDataRules.Optional(command.Note, CemeteryMasterDataRules.NoteMaximumLength),
        };
        var entityId = id ?? Guid.NewGuid();
        return save(entityId, version, clean, Change(kind, entityId, version), cancellationToken);
    }

    private CemeteryMasterDataChange Change(CemeteryMasterDataKind kind, Guid id, long? version) =>
        new(Guid.NewGuid(), kind, id, (version ?? 0) + 1, timeProvider.GetUtcNow(), currentActorProvider.Current, version.HasValue ? "Changed" : "Created");
}
