using Cemaris.Domain.Cases;

namespace Cemaris.Application.Cases;

public interface IBurialProcessStore
{
    Task<BurialProcessMutationResult> AddDeceasedPersonAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        bool confirmPossibleDuplicate,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<BurialProcessMutationResult> ChangeDeceasedPersonAsync(
        Guid caseId,
        Guid personId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<BurialProcessMutationResult> CreateBurialAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        BurialProcessRecord burial,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<BurialProcessMutationResult> ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        ChangeBurialProcessCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<BurialProcessMutationResult> TransitionBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        TransitionBurialCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<BurialProcessMutationResult> AdoptLegacyBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        AdoptLegacyBurialCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken);
}
