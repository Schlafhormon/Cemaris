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
    public async Task CreateAsync(CaseRecord caseRecord, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(caseRecord);

        dbContext.Cases.Add(new CaseReadEntity
        {
            Id = caseRecord.Id,
            IsSynthetic = true,
            Version = caseRecord.Version.Value,
            Grave = new GraveReadEntity
            {
                CaseId = caseRecord.Id,
                Cemetery = caseRecord.Grave.Cemetery,
                Field = caseRecord.Grave.Field,
                GraveNumber = caseRecord.Grave.GraveNumber,
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
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<CaseMutationResult> ChangeGraveAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        GraveReference grave,
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
            async () =>
            {
                var affected = await dbContext.Graves
                    .Where(item => item.CaseId == caseId)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.Cemetery, grave.Cemetery)
                            .SetProperty(item => item.Field, grave.Field)
                            .SetProperty(item => item.GraveNumber, grave.GraveNumber),
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
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
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
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
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
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
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
        CancellationToken cancellationToken) =>
        ExecuteMutationAsync(
            caseId,
            expectedVersion,
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
        Func<Task<CaseMutationOutcome?>> applyMutationAsync,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var nextVersion = expectedVersion.Next();
        var affectedRoots = await dbContext.Cases
            .Where(item => item.Id == caseId
                && item.IsSynthetic
                && item.Version == expectedVersion.Value)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(item => item.Version, nextVersion.Value),
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

        await transaction.CommitAsync(cancellationToken);
        return CaseMutationResult.Succeeded(nextVersion);
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
