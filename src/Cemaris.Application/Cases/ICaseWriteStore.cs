using Cemaris.Domain.Cases;

namespace Cemaris.Application.Cases;

public interface ICaseWriteStore
{
    Task CreateAsync(
        CaseRecord caseRecord,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<CaseMutationResult> ChangeGraveAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        GraveReference grave,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<CaseMutationResult> AddDeceasedPersonAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<CaseMutationResult> ChangeDeceasedPersonAsync(
        Guid caseId,
        Guid personId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<CaseMutationResult> AddBurialAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        Burial burial,
        CaseChange change,
        CancellationToken cancellationToken);

    Task<CaseMutationResult> ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        Burial burial,
        CaseChange change,
        CancellationToken cancellationToken);
}

public enum CaseMutationOutcome
{
    Success,
    CaseNotFound,
    ChildNotFound,
    VersionConflict,
    InvalidDeceasedPersonReference,
}

public sealed record CaseMutationResult(CaseMutationOutcome Outcome, CaseVersion? Version = null)
{
    public static CaseMutationResult Succeeded(CaseVersion version) =>
        new(CaseMutationOutcome.Success, version);

    public static CaseMutationResult Failed(CaseMutationOutcome outcome) => new(outcome);
}
