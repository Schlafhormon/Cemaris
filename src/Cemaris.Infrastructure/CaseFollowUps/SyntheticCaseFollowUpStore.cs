using System.Data.SqlTypes;
using Cemaris.Application.CaseFollowUps;
using Cemaris.Domain.CaseFollowUps;
using Cemaris.Infrastructure.ReadModel;

namespace Cemaris.Infrastructure.CaseFollowUps;

public sealed class SyntheticCaseFollowUpStore(SyntheticStoreCoordinator coordinator, SyntheticCaseReadStore cases) : ICaseFollowUpStore
{
    internal sealed record Audit(Guid Id, Guid FollowUpId, Guid CaseId, long ResultingVersion,
        CaseFollowUpOperation Operation, string ActorId, DateTimeOffset OccurredAtUtc);
    private Dictionary<Guid, CaseFollowUpView> entries = [];
    private Dictionary<Guid, Audit> audits = [];

    public Task<CaseFollowUpPage?> ReadAsync(Guid? caseId, CaseFollowUpQuery query, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            query.Validate();
            if (caseId.HasValue && cases.FindAsync(caseId.Value, token).GetAwaiter().GetResult() is null)
                return Task.FromResult<CaseFollowUpPage?>(null);
            var filtered = entries.Values.Select(x => x.State).Where(x =>
                (!caseId.HasValue || x.CaseId == caseId) && (!query.Status.HasValue || x.Status == query.Status)
                && (!query.DueUntil.HasValue || x.DueDate <= query.DueUntil));
            var count = filtered.Count();
            // SqlGuid bildet exakt die native SQL-Server-Reihenfolge von uniqueidentifier ab.
            var page = filtered.OrderBy(x => x.DueDate).ThenBy(x => x.CreatedAtUtc).ThenBy(x => new SqlGuid(x.Id))
                .Skip(query.Offset).Take(query.PageSize).ToArray();
            var graves = page.Select(x => x.CaseId).Distinct().ToDictionary(id => id,
                id => cases.FindAsync(id, token).GetAwaiter().GetResult()!.Grave);
            return Task.FromResult<CaseFollowUpPage?>(new(page.Select(x =>
                new CaseFollowUpListItem(x.Id, x.CaseId, x.Title, x.DueDate, x.Status, graves[x.CaseId])).ToArray(),
                count, query.Page, query.PageSize));
        }
    }

    public Task<CaseFollowUpView?> FindAsync(Guid caseId, Guid id, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            return Task.FromResult(entries.TryGetValue(id, out var view) && view.State.CaseId == caseId
                && cases.FindAsync(caseId, token).GetAwaiter().GetResult() is not null
                ? view with { Revisions = view.Revisions.ToArray() } : null);
        }
    }

    public Task<CaseFollowUpResult> CreateAsync(Guid caseId, Guid id, CaseFollowUpFacts facts, CaseFollowUpMutation mutation, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            var target = cases.FindAsync(caseId, token).GetAwaiter().GetResult();
            if (target is null) return Task.FromResult(new CaseFollowUpResult(CaseFollowUpOutcome.NotFound));
            if (!target.IsSynthetic) return Task.FromResult(new CaseFollowUpResult(CaseFollowUpOutcome.NonSynthetic));
            if (entries.ContainsKey(id) || mutation.Operation != CaseFollowUpOperation.Created)
                throw new InvalidOperationException("Ungültiger Anlegenachweis.");
            var state = new CaseFollowUpState(id, caseId, facts.Title, facts.Description, facts.DueDate,
                CaseFollowUpStatus.Open, 1, mutation.OccurredAtUtc, mutation.OccurredAtUtc);
            return Task.FromResult(Commit(state, [], mutation));
        }
    }

    public Task<CaseFollowUpResult> ChangeAsync(Guid caseId, Guid id, long expectedVersion, CaseFollowUpFacts? facts,
        CaseFollowUpMutation mutation, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            var target = cases.FindAsync(caseId, token).GetAwaiter().GetResult();
            if (target is null || !entries.TryGetValue(id, out var current) || current.State.CaseId != caseId)
                return Task.FromResult(new CaseFollowUpResult(CaseFollowUpOutcome.NotFound));
            if (!target.IsSynthetic) return Task.FromResult(new CaseFollowUpResult(CaseFollowUpOutcome.NonSynthetic));
            if (current.State.Version != expectedVersion)
                return Task.FromResult(new CaseFollowUpResult(CaseFollowUpOutcome.VersionConflict));
            var next = CaseFollowUpChanges.Apply(current.State, facts, mutation);
            return Task.FromResult(next is null ? new(CaseFollowUpOutcome.InvalidState) : Commit(next, current.Revisions, mutation));
        }
    }

    private CaseFollowUpResult Commit(CaseFollowUpState state, IReadOnlyList<CaseFollowUpRevision> revisions, CaseFollowUpMutation mutation)
    {
        if (audits.ContainsKey(mutation.AuditId) || entries.Values.Any(x => x.Revisions.Any(r => r.Id == mutation.RevisionId)))
            throw new InvalidOperationException("Der Änderungsnachweis ist nicht eindeutig.");
        var view = new CaseFollowUpView(state, [.. revisions, CaseFollowUpChanges.Revision(state, mutation)]);
        var nextEntries = new Dictionary<Guid, CaseFollowUpView>(entries) { [state.Id] = view };
        var nextAudits = new Dictionary<Guid, Audit>(audits)
        {
            [mutation.AuditId] = new(mutation.AuditId, state.Id, state.CaseId, state.Version,
                mutation.Operation, mutation.Actor.Id, mutation.OccurredAtUtc),
        };
        entries = nextEntries;
        audits = nextAudits;
        return new(CaseFollowUpOutcome.Success, view with { Revisions = view.Revisions.ToArray() });
    }

    internal (int Entries, int Revisions, int Audits) Diagnostics
    {
        get { lock (coordinator.Gate) return (entries.Count, entries.Values.Sum(x => x.Revisions.Count), audits.Count); }
    }
}
