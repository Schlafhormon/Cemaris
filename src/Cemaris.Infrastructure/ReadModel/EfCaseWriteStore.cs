using Cemaris.Application.Cases;
using Cemaris.Domain.Cases;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.ReadModel;

/// <summary>
/// Writes directly into the provisional relational case/read schema. The root-version
/// update and every child change share one transaction; this is not a final domain schema.
/// </summary>
public sealed class EfCaseWriteStore(CemarisDbContext dbContext) : ICaseWriteStore
{
    public async Task CreateAsync(
        CaseRecord caseRecord,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(caseRecord);
        ValidateChange(
            caseRecord.Id,
            caseRecord.Version,
            CaseChangeOperation.CaseCreated,
            null,
            change);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var entity = new CaseReadEntity
        {
            Id = caseRecord.Id,
            IsSynthetic = true,
            Version = caseRecord.Version.Value,
            LastChangedAtUtc = change.OccurredAtUtc,
            LastChangedByActorId = change.Actor.Id,
            LastChangedByActorName = change.Actor.DisplayName,
            Grave = new GraveReadEntity
            {
                CaseId = caseRecord.Id,
                Cemetery = caseRecord.Grave.Cemetery,
                Field = caseRecord.Grave.Field,
                GraveNumber = caseRecord.Grave.GraveNumber,
                GraveSiteId = caseRecord.Grave.GraveSiteId,
            },
            DataQualityNotes =
            {
                new DataQualityNoteReadEntity
                {
                    Id = Guid.NewGuid(),
                    CaseId = caseRecord.Id,
                    Text = "Ausschließlich synthetische Development-Fallakte.",
                },
            },
        };
        entity.Changes.Add(MapChange(change));
        dbContext.Cases.Add(entity);

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public Task<CaseMutationResult> ChangeGraveAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        GraveReference grave,
        CaseChange change,
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
            CaseChangeOperation.GraveChanged,
            null,
            change,
            async () =>
            {
                var affected = await dbContext.Graves
                    .Where(item => item.CaseId == caseId)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.Cemetery, grave.Cemetery)
                            .SetProperty(item => item.Field, grave.Field)
                            .SetProperty(item => item.GraveNumber, grave.GraveNumber)
                            .SetProperty(item => item.GraveSiteId, grave.GraveSiteId),
                        cancellationToken);

                if (affected != 1)
                {
                    throw new InvalidOperationException(
                        "Die Fallakte besitzt keinen eindeutig änderbaren Grabstellenbezug.");
                }

                return null;
            },
            cancellationToken);

    public Task<CaseMutationResult> AddDeceasedPersonAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        CaseChange change,
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
            CaseChangeOperation.DeceasedPersonAdded,
            deceasedPerson.Id,
            change,
            async () =>
            {
                dbContext.DeceasedPersons.Add(new DeceasedReadEntity
                {
                    Id = deceasedPerson.Id,
                    CaseId = caseId,
                    FirstName = deceasedPerson.FirstName,
                    LastName = deceasedPerson.LastName,
                    BirthDate = deceasedPerson.BirthDate,
                    DeathDate = deceasedPerson.DeathDate,
                });
                await dbContext.SaveChangesAsync(cancellationToken);
                return null;
            },
            cancellationToken);

    public Task<CaseMutationResult> ChangeDeceasedPersonAsync(
        Guid caseId,
        Guid personId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        CaseChange change,
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
            CaseChangeOperation.DeceasedPersonChanged,
            personId,
            change,
            async () =>
            {
                var affected = await dbContext.DeceasedPersons
                    .Where(item => item.CaseId == caseId && item.Id == personId)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.FirstName, deceasedPerson.FirstName)
                            .SetProperty(item => item.LastName, deceasedPerson.LastName)
                            .SetProperty(item => item.BirthDate, deceasedPerson.BirthDate)
                            .SetProperty(item => item.DeathDate, deceasedPerson.DeathDate),
                        cancellationToken);

                return affected == 1 ? null : CaseMutationOutcome.ChildNotFound;
            },
            cancellationToken);

    public Task<CaseMutationResult> AddBurialAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        Burial burial,
        CaseChange change,
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
            CaseChangeOperation.BurialAdded,
            burial.Id,
            change,
            async () =>
            {
                if (!await IsDeceasedReferenceValidAsync(
                        caseId,
                        burial.DeceasedPersonId,
                        cancellationToken))
                {
                    return CaseMutationOutcome.InvalidDeceasedPersonReference;
                }

                dbContext.Burials.Add(new BurialReadEntity
                {
                    Id = burial.Id,
                    CaseId = caseId,
                    DeceasedPersonId = burial.DeceasedPersonId,
                    BurialDate = burial.BurialDate,
                });
                await dbContext.SaveChangesAsync(cancellationToken);
                return null;
            },
            cancellationToken);

    public Task<CaseMutationResult> ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        Burial burial,
        CaseChange change,
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
            CaseChangeOperation.BurialChanged,
            burialId,
            change,
            async () =>
            {
                if (!await IsDeceasedReferenceValidAsync(
                        caseId,
                        burial.DeceasedPersonId,
                        cancellationToken))
                {
                    return CaseMutationOutcome.InvalidDeceasedPersonReference;
                }

                var affected = await dbContext.Burials
                    .Where(item => item.CaseId == caseId && item.Id == burialId)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.DeceasedPersonId, burial.DeceasedPersonId)
                            .SetProperty(item => item.BurialDate, burial.BurialDate),
                        cancellationToken);

                return affected == 1 ? null : CaseMutationOutcome.ChildNotFound;
            },
            cancellationToken);

    private async Task<CaseMutationResult> ExecuteMutationAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        CaseChangeOperation operation,
        Guid? targetEntityId,
        CaseChange change,
        Func<Task<CaseMutationOutcome?>> applyMutationAsync,
        CancellationToken cancellationToken)
    {
        var nextVersion = expectedVersion.Next();
        ValidateChange(caseId, nextVersion, operation, targetEntityId, change);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var affectedRoots = await dbContext.Cases
            .Where(item => item.Id == caseId
                && item.IsSynthetic
                && item.Version == expectedVersion.Value)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(item => item.Version, nextVersion.Value)
                    .SetProperty(item => item.LastChangedAtUtc, change.OccurredAtUtc)
                    .SetProperty(item => item.LastChangedByActorId, change.Actor.Id)
                    .SetProperty(item => item.LastChangedByActorName, change.Actor.DisplayName),
                cancellationToken);

        if (affectedRoots == 0)
        {
            var exists = await dbContext.Cases
                .AsNoTracking()
                .AnyAsync(item => item.Id == caseId && item.IsSynthetic, cancellationToken);
            return CaseMutationResult.Failed(
                exists ? CaseMutationOutcome.VersionConflict : CaseMutationOutcome.CaseNotFound);
        }

        var failedOutcome = await applyMutationAsync();
        if (failedOutcome is not null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return CaseMutationResult.Failed(failedOutcome.Value);
        }

        dbContext.CaseChanges.Add(MapChange(change));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return CaseMutationResult.Succeeded(nextVersion);
    }

    private static CaseChangeEntity MapChange(CaseChange change) => new()
    {
        Id = change.Id,
        CaseId = change.CaseId,
        ResultingVersion = change.ResultingVersion.Value,
        OccurredAtUtc = change.OccurredAtUtc,
        ActorId = change.Actor.Id,
        ActorDisplayName = change.Actor.DisplayName,
        Operation = change.Operation.ToString(),
        TargetEntityId = change.TargetEntityId,
    };

    private static void ValidateChange(
        Guid caseId,
        CaseVersion resultingVersion,
        CaseChangeOperation operation,
        Guid? targetEntityId,
        CaseChange change)
    {
        ArgumentNullException.ThrowIfNull(change);
        if (change.CaseId != caseId
            || change.ResultingVersion != resultingVersion
            || change.Operation != operation
            || change.TargetEntityId != targetEntityId)
        {
            throw new InvalidOperationException(
                "Der Änderungsnachweis passt nicht zur auszuführenden Fallaktenmutation.");
        }
    }

    private Task<bool> IsDeceasedReferenceValidAsync(
        Guid caseId,
        Guid? deceasedPersonId,
        CancellationToken cancellationToken) =>
        deceasedPersonId is null
            ? Task.FromResult(true)
            : dbContext.DeceasedPersons
                .AsNoTracking()
                .AnyAsync(
                    item => item.CaseId == caseId && item.Id == deceasedPersonId,
                    cancellationToken);
}
