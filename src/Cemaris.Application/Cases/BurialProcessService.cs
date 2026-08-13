using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;

namespace Cemaris.Application.Cases;

public sealed class BurialProcessService(
    IBurialProcessStore store,
    ICaseReadStore readStore,
    ICurrentActorProvider currentActorProvider,
    TimeProvider timeProvider)
{
    public async Task<CaseOverview> AddDeceasedPersonAsync(
        Guid caseId,
        long expectedVersion,
        SaveDeceasedPersonCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        BurialProcessRules.ValidatePersonDates(command.BirthDate, command.DeathDate);
        var person = DeceasedPerson.Create(
            Guid.NewGuid(),
            command.FirstName,
            command.LastName,
            command.BirthDate,
            command.DeathDate);
        var version = new CaseVersion(expectedVersion);
        var result = await store.AddDeceasedPersonAsync(
            caseId,
            version,
            person,
            command.ConfirmPossibleDuplicate,
            CreateChange(caseId, version.Next(), CaseChangeOperation.DeceasedPersonAdded, person.Id),
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
        BurialProcessRules.ValidatePersonDates(command.BirthDate, command.DeathDate);
        var person = DeceasedPerson.Create(
            personId,
            command.FirstName,
            command.LastName,
            command.BirthDate,
            command.DeathDate);
        var version = new CaseVersion(expectedVersion);
        var result = await store.ChangeDeceasedPersonAsync(
            caseId,
            personId,
            version,
            person,
            Today,
            CreateChange(caseId, version.Next(), CaseChangeOperation.DeceasedPersonChanged, personId),
            cancellationToken);
        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    public async Task<CaseOverview> CreateBurialDraftAsync(
        Guid caseId,
        long expectedVersion,
        CreateBurialDraftCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var burial = BurialProcessRecord.Create(
            Guid.NewGuid(),
            command.DeceasedPersonId,
            command.GraveSiteId,
            BurialProcessStatus.Draft,
            command.PlanningDate,
            null);
        var version = new CaseVersion(expectedVersion);
        var result = await store.CreateBurialAsync(
            caseId,
            version,
            burial,
            Today,
            CreateChange(caseId, version.Next(), CaseChangeOperation.BurialDraftCreated, burial.Id),
            cancellationToken);
        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    public async Task<CaseOverview> ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        long expectedVersion,
        ChangeBurialProcessCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var version = new CaseVersion(expectedVersion);
        var result = await store.ChangeBurialAsync(
            caseId,
            burialId,
            version,
            command,
            Today,
            CreateChange(caseId, version.Next(), CaseChangeOperation.BurialFactsChanged, burialId),
            cancellationToken);
        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    public async Task<CaseOverview> TransitionBurialAsync(
        Guid caseId,
        Guid burialId,
        long expectedVersion,
        TransitionBurialCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        if (!Enum.IsDefined(command.TargetStatus))
        {
            throw new BurialProcessValidationException("targetStatus", "Der Zielstatus ist ungültig.");
        }

        var version = new CaseVersion(expectedVersion);
        var currentCase = await readStore.FindAsync(caseId, cancellationToken);
        var currentBurial = currentCase?.Burials.SingleOrDefault(item => item.Id == burialId);
        var operation = currentBurial?.Status is { } currentStatus
            ? OperationFor(currentStatus, command.TargetStatus)
            : CaseChangeOperation.BurialPlanned;
        var result = await store.TransitionBurialAsync(
            caseId,
            burialId,
            version,
            command,
            Today,
            CreateChange(caseId, version.Next(), operation, burialId),
            cancellationToken);
        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    public async Task<CaseOverview> AdoptLegacyBurialAsync(
        Guid caseId,
        Guid burialId,
        long expectedVersion,
        AdoptLegacyBurialCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var version = new CaseVersion(expectedVersion);
        var result = await store.AdoptLegacyBurialAsync(
            caseId,
            burialId,
            version,
            command,
            Today,
            CreateChange(caseId, version.Next(), CaseChangeOperation.LegacyBurialAdopted, burialId),
            cancellationToken);
        return await CompleteMutationAsync(caseId, result, cancellationToken);
    }

    private DateOnly Today => DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);

    private async Task<CaseOverview> CompleteMutationAsync(
        Guid caseId,
        BurialProcessMutationResult result,
        CancellationToken cancellationToken)
    {
        switch (result.Outcome)
        {
            case BurialProcessMutationOutcome.CaseNotFound:
                throw new CaseRecordNotFoundException();
            case BurialProcessMutationOutcome.ChildNotFound:
                throw new CaseChildNotFoundException();
            case BurialProcessMutationOutcome.VersionConflict:
                throw new CaseVersionConflictException();
            case BurialProcessMutationOutcome.InvalidDeceasedPersonReference:
                throw new CaseReferenceValidationException();
            case BurialProcessMutationOutcome.InvalidGraveSiteReference:
                throw new GraveSiteReferenceValidationException();
            case BurialProcessMutationOutcome.DeceasedPersonAlreadyHasBurial:
                throw new DeceasedPersonAlreadyHasBurialException();
            case BurialProcessMutationOutcome.InvalidProcessState:
                throw new BurialProcessStateConflictException();
            case BurialProcessMutationOutcome.PossibleDuplicate:
                throw new PossibleDeceasedDuplicateException(result.DuplicateCandidates ?? []);
            case BurialProcessMutationOutcome.Success:
                return await readStore.FindAsync(caseId, cancellationToken)
                    ?? throw new InvalidOperationException(
                        "Die gespeicherte Fallakte ist nicht unmittelbar lesbar.");
            default:
                throw new InvalidOperationException("Unbekanntes Ergebnis einer Beisetzungsprozessmutation.");
        }
    }

    private CaseChange CreateChange(
        Guid caseId,
        CaseVersion resultingVersion,
        CaseChangeOperation operation,
        Guid targetEntityId) =>
        new(
            Guid.NewGuid(),
            caseId,
            resultingVersion,
            timeProvider.GetUtcNow(),
            currentActorProvider.Current,
            operation,
            targetEntityId);

    private static CaseChangeOperation OperationFor(
        BurialProcessStatus current,
        BurialProcessStatus target) => (current, target) switch
        {
            (BurialProcessStatus.Draft, BurialProcessStatus.Planned) => CaseChangeOperation.BurialPlanned,
            (BurialProcessStatus.Planned, BurialProcessStatus.Draft) => CaseChangeOperation.BurialPlanningWithdrawn,
            (BurialProcessStatus.Planned, BurialProcessStatus.Confirmed) => CaseChangeOperation.BurialConfirmed,
            (BurialProcessStatus.Confirmed, BurialProcessStatus.Planned) => CaseChangeOperation.BurialConfirmationWithdrawn,
            (BurialProcessStatus.Confirmed, BurialProcessStatus.Performed) => CaseChangeOperation.BurialPerformed,
            (BurialProcessStatus.Performed, BurialProcessStatus.Completed) => CaseChangeOperation.BurialCompleted,
            (BurialProcessStatus.Completed, BurialProcessStatus.Performed) => CaseChangeOperation.BurialReopened,
            _ => CaseChangeOperation.BurialPlanned,
        };
}
