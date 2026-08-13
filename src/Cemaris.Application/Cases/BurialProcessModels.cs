using Cemaris.Domain.Cases;

namespace Cemaris.Application.Cases;

public sealed record CreateBurialDraftCommand(
    Guid DeceasedPersonId,
    Guid GraveSiteId,
    DateOnly? PlanningDate = null);

public sealed record ChangeBurialProcessCommand(
    Guid DeceasedPersonId,
    Guid GraveSiteId,
    DateOnly? PlanningDate,
    DateOnly? ActualBurialDate);

public sealed record TransitionBurialCommand(
    BurialProcessStatus TargetStatus,
    DateOnly? PlanningDate = null,
    DateOnly? ActualBurialDate = null);

public sealed record AdoptLegacyBurialCommand(
    Guid DeceasedPersonId,
    Guid GraveSiteId,
    BurialProcessStatus TargetStatus,
    DateOnly? PlanningDate,
    DateOnly? ActualBurialDate);

public sealed record PossibleDeceasedDuplicate(
    Guid Id,
    string DisplayName,
    DateOnly? BirthDate,
    DateOnly? DeathDate);

public enum BurialProcessMutationOutcome
{
    Success,
    CaseNotFound,
    ChildNotFound,
    VersionConflict,
    InvalidDeceasedPersonReference,
    InvalidGraveSiteReference,
    DeceasedPersonAlreadyHasBurial,
    InvalidProcessState,
    PossibleDuplicate,
}

public sealed record BurialProcessMutationResult(
    BurialProcessMutationOutcome Outcome,
    CaseVersion? Version = null,
    IReadOnlyList<PossibleDeceasedDuplicate>? DuplicateCandidates = null)
{
    public static BurialProcessMutationResult Succeeded(CaseVersion version) =>
        new(BurialProcessMutationOutcome.Success, version);

    public static BurialProcessMutationResult Failed(BurialProcessMutationOutcome outcome) =>
        new(outcome);

    public static BurialProcessMutationResult Duplicate(
        IReadOnlyList<PossibleDeceasedDuplicate> candidates) =>
        new(BurialProcessMutationOutcome.PossibleDuplicate, DuplicateCandidates: candidates);
}
