using Cemaris.Application.Cases;
using Cemaris.Application.Identity;
using Cemaris.Domain.CaseFollowUps;

namespace Cemaris.Application.CaseFollowUps;

public sealed record CreateCaseFollowUpCommand(string? Title, string? Description, DateOnly? DueDate);
public sealed record ChangeCaseFollowUpCommand(string? Title, string? Description, DateOnly? DueDate, string? Reason);
public sealed record CaseFollowUpReasonCommand(string? Reason);
public sealed record CaseFollowUpState(Guid Id, Guid CaseId, string Title, string? Description, DateOnly DueDate,
    CaseFollowUpStatus Status, long Version, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc);
public sealed record CaseFollowUpRevision(Guid Id, CaseFollowUpState State, CaseFollowUpOperation Operation,
    string? Reason, string ActorId, string ActorDisplayName, DateTimeOffset OccurredAtUtc);
public sealed record CaseFollowUpView(CaseFollowUpState State, IReadOnlyList<CaseFollowUpRevision> Revisions);
public sealed record CaseFollowUpListItem(Guid Id, Guid CaseId, string Title, DateOnly DueDate,
    CaseFollowUpStatus Status, GraveDetails Grave);
public sealed record CaseFollowUpPage(IReadOnlyList<CaseFollowUpListItem> Items, int TotalMatches, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalMatches / PageSize);
}
public sealed record CaseFollowUpQuery(CaseFollowUpStatus? Status = CaseFollowUpStatus.Open,
    DateOnly? DueUntil = null, int Page = 1, int PageSize = 10)
{
    public int Offset => checked((Page - 1) * PageSize);
    public void Validate()
    {
        if (Status.HasValue && !Enum.IsDefined(Status.Value))
            throw new CaseFollowUpValidationException("status", "Der Status ist ungültig.");
        if (PageSize is not (10 or 25 or 50))
            throw new CaseFollowUpValidationException("pageSize", "Zulässige Seitengrößen sind 10, 25 und 50.");
        if (Page < 1 || (long)(Page - 1) * PageSize > int.MaxValue)
            throw new CaseFollowUpValidationException("page", "Die Seite liegt außerhalb des unterstützten Bereichs.");
    }
}
public sealed record CaseFollowUpMutation(Guid AuditId, Guid RevisionId, CaseFollowUpOperation Operation,
    string? Reason, ActorIdentity Actor, DateTimeOffset OccurredAtUtc);
public enum CaseFollowUpOutcome { Success, NotFound, NonSynthetic, VersionConflict, InvalidState }
public sealed record CaseFollowUpResult(CaseFollowUpOutcome Outcome, CaseFollowUpView? Value = null);

public interface ICaseFollowUpStore
{
    Task<CaseFollowUpPage?> ReadAsync(Guid? caseId, CaseFollowUpQuery query, CancellationToken token);
    Task<CaseFollowUpView?> FindAsync(Guid caseId, Guid id, CancellationToken token);
    Task<CaseFollowUpResult> CreateAsync(Guid caseId, Guid id, CaseFollowUpFacts facts, CaseFollowUpMutation mutation, CancellationToken token);
    Task<CaseFollowUpResult> ChangeAsync(Guid caseId, Guid id, long expectedVersion, CaseFollowUpFacts? facts,
        CaseFollowUpMutation mutation, CancellationToken token);
}
