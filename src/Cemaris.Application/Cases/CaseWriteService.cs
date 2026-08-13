using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;

namespace Cemaris.Application.Cases;

public sealed class CaseWriteService(
    ICaseWriteStore writeStore,
    ICaseReadStore readStore,
    ICurrentActorProvider currentActorProvider,
    TimeProvider timeProvider)
{
    public async Task<CaseOverview> CreateAsync(
        CreateCaseCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var caseRecord = CaseRecord.CreateSynthetic(
            Guid.NewGuid(),
            GraveReference.Create(command.Cemetery, command.Field, command.GraveNumber));

        await writeStore.CreateAsync(
            caseRecord,
            CreateChange(
                caseRecord.Id,
                caseRecord.Version,
                CaseChangeOperation.CaseCreated),
            cancellationToken);
        return await GetWrittenCaseAsync(caseRecord.Id, cancellationToken);
    }

    public async Task<CaseOverview> ChangeGraveAsync(
        Guid caseId,
        long expectedVersion,
        ChangeGraveCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var result = await writeStore.ChangeGraveAsync(
            caseId,
            new CaseVersion(expectedVersion),
            GraveReference.Create(command.Cemetery, command.Field, command.GraveNumber),
            CreateChange(
                caseId,
                new CaseVersion(expectedVersion).Next(),
                CaseChangeOperation.GraveChanged),
            cancellationToken);

        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    public async Task<CaseOverview> AddDeceasedPersonAsync(
        Guid caseId,
        long expectedVersion,
        SaveDeceasedPersonCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var deceasedPerson = DeceasedPerson.Create(
            Guid.NewGuid(),
            command.FirstName,
            command.LastName,
            command.BirthDate,
            command.DeathDate);
        var result = await writeStore.AddDeceasedPersonAsync(
            caseId,
            new CaseVersion(expectedVersion),
            deceasedPerson,
            CreateChange(
                caseId,
                new CaseVersion(expectedVersion).Next(),
                CaseChangeOperation.DeceasedPersonAdded,
                deceasedPerson.Id),
            cancellationToken);

        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    public async Task<CaseOverview> ChangeDeceasedPersonAsync(
        Guid caseId,
        Guid personId,
        long expectedVersion,
        SaveDeceasedPersonCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var deceasedPerson = DeceasedPerson.Create(
            personId,
            command.FirstName,
            command.LastName,
            command.BirthDate,
            command.DeathDate);
        var result = await writeStore.ChangeDeceasedPersonAsync(
            caseId,
            personId,
            new CaseVersion(expectedVersion),
            deceasedPerson,
            CreateChange(
                caseId,
                new CaseVersion(expectedVersion).Next(),
                CaseChangeOperation.DeceasedPersonChanged,
                personId),
            cancellationToken);

        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    public async Task<CaseOverview> AddBurialAsync(
        Guid caseId,
        long expectedVersion,
        SaveBurialCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var burial = Burial.Create(Guid.NewGuid(), command.DeceasedPersonId, command.BurialDate);
        var result = await writeStore.AddBurialAsync(
            caseId,
            new CaseVersion(expectedVersion),
            burial,
            CreateChange(
                caseId,
                new CaseVersion(expectedVersion).Next(),
                CaseChangeOperation.BurialAdded,
                burial.Id),
            cancellationToken);

        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    public async Task<CaseOverview> ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        long expectedVersion,
        SaveBurialCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var burial = Burial.Create(burialId, command.DeceasedPersonId, command.BurialDate);
        var result = await writeStore.ChangeBurialAsync(
            caseId,
            burialId,
            new CaseVersion(expectedVersion),
            burial,
            CreateChange(
                caseId,
                new CaseVersion(expectedVersion).Next(),
                CaseChangeOperation.BurialChanged,
                burialId),
            cancellationToken);

        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    private async Task<CaseOverview> CompleteMutationAsync(
        Guid caseId,
        CaseMutationResult result,
        CancellationToken cancellationToken)
    {
        switch (result.Outcome)
        {
            case CaseMutationOutcome.CaseNotFound:
                throw new CaseRecordNotFoundException();
            case CaseMutationOutcome.ChildNotFound:
                throw new CaseChildNotFoundException();
            case CaseMutationOutcome.VersionConflict:
                throw new CaseVersionConflictException();
            case CaseMutationOutcome.InvalidDeceasedPersonReference:
                throw new CaseReferenceValidationException();
            case CaseMutationOutcome.Success:
                return await GetWrittenCaseAsync(caseId, cancellationToken);
            default:
                throw new InvalidOperationException("Unbekanntes Ergebnis einer Fallaktenmutation.");
        }
    }

    private async Task<CaseOverview> GetWrittenCaseAsync(
        Guid caseId,
        CancellationToken cancellationToken) =>
        await readStore.FindAsync(caseId, cancellationToken)
        ?? throw new InvalidOperationException("Die gespeicherte Fallakte ist nicht unmittelbar lesbar.");

    private CaseChange CreateChange(
        Guid caseId,
        CaseVersion resultingVersion,
        CaseChangeOperation operation,
        Guid? targetEntityId = null) =>
        new(
            Guid.NewGuid(),
            caseId,
            resultingVersion,
            timeProvider.GetUtcNow(),
            currentActorProvider.Current,
            operation,
            targetEntityId);
}
