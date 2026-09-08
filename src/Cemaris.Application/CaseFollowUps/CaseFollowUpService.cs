using Cemaris.Application.Identity;
using Cemaris.Domain.CaseFollowUps;

namespace Cemaris.Application.CaseFollowUps;

public sealed class CaseFollowUpService(ICaseFollowUpStore store, ICurrentActorProvider actors, TimeProvider time)
{
    public Task<CaseFollowUpPage?> ReadAsync(Guid? caseId, CaseFollowUpQuery query, CancellationToken token)
    {
        query.Validate();
        return store.ReadAsync(caseId, query, token);
    }

    public Task<CaseFollowUpView?> FindAsync(Guid caseId, Guid id, CancellationToken token) => store.FindAsync(caseId, id, token);

    public Task<CaseFollowUpResult> CreateAsync(Guid caseId, CreateCaseFollowUpCommand command, CancellationToken token) =>
        store.CreateAsync(caseId, Guid.NewGuid(), CaseFollowUpFacts.Create(command.Title, command.Description, command.DueDate),
            Mutation(CaseFollowUpOperation.Created, null), token);

    public Task<CaseFollowUpResult> ChangeAsync(Guid caseId, Guid id, long version, ChangeCaseFollowUpCommand command, CancellationToken token) =>
        store.ChangeAsync(caseId, id, version, CaseFollowUpFacts.Create(command.Title, command.Description, command.DueDate),
            Mutation(CaseFollowUpOperation.Changed, CaseFollowUpRules.Reason(command.Reason)), token);

    public Task<CaseFollowUpResult> TransitionAsync(Guid caseId, Guid id, long version, CaseFollowUpOperation operation,
        CaseFollowUpReasonCommand command, CancellationToken token)
    {
        if (operation is not (CaseFollowUpOperation.Completed or CaseFollowUpOperation.Cancelled or CaseFollowUpOperation.Reopened))
            throw new CaseFollowUpValidationException("operation", "Die Aktion ist ungültig.");
        return store.ChangeAsync(caseId, id, version, null, Mutation(operation, CaseFollowUpRules.Reason(command.Reason)), token);
    }

    private CaseFollowUpMutation Mutation(CaseFollowUpOperation operation, string? reason) =>
        new(Guid.NewGuid(), Guid.NewGuid(), operation, reason, actors.Current, time.GetUtcNow());
}
