using Cemaris.Domain.Cases;

namespace Cemaris.Application.Cases;

public sealed class CaseWriteService(ICaseWriteStore writeStore, ICaseReadStore readStore)
{
    public async Task<CaseOverview> CreateAsync(
        CreateCaseCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var caseRecord = CaseRecord.CreateSynthetic(
            Guid.NewGuid(),
            GraveReference.Create(command.Cemetery, command.Field, command.GraveNumber));

        await writeStore.CreateAsync(caseRecord, cancellationToken);
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
}
