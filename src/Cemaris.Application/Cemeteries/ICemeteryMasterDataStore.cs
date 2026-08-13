namespace Cemaris.Application.Cemeteries;

public interface ICemeteryMasterDataStore
{
    Task<CemeteryMasterDataSnapshot> ReadAsync(bool includeInactive, CancellationToken cancellationToken);
    Task<CemeteryMasterDataMutationResult> SaveCemeteryAsync(Guid id, long? expectedVersion, SaveCemeteryCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken);
    Task<CemeteryMasterDataMutationResult> SaveAreaAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken);
    Task<CemeteryMasterDataMutationResult> SaveFieldAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken);
    Task<CemeteryMasterDataMutationResult> SaveRowAsync(Guid id, long? expectedVersion, SaveCemeteryLevelCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken);
    Task<CemeteryMasterDataMutationResult> SaveGraveTypeAsync(Guid id, long? expectedVersion, SaveGraveTypeCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken);
    Task<CemeteryMasterDataMutationResult> SaveCemeteryGraveTypeAsync(Guid id, long? expectedVersion, SaveCemeteryGraveTypeCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken);
    Task<CemeteryMasterDataMutationResult> SaveGraveSiteAsync(Guid id, long? expectedVersion, SaveGraveSiteCommand command, CemeteryMasterDataChange change, CancellationToken cancellationToken);
    Task<CemeteryMasterDataMutationResult> DeleteAsync(CemeteryMasterDataKind kind, Guid id, long expectedVersion, CemeteryMasterDataChange change, CancellationToken cancellationToken);
}
