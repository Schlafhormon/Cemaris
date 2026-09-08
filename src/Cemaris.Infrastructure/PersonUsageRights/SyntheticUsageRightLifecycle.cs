using System.Data.SqlTypes;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.UsageRights;

namespace Cemaris.Infrastructure.PersonUsageRights;

public sealed partial class SyntheticPersonUsageRightStore
{
    public Task<UsageRightPage> ReadUsageRightsAsync(Guid graveSiteId, int page, int pageSize, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            var rows = rights.Values.Where(x => x.GraveSiteId == graveSiteId).OrderByDescending(x => x.Start).ThenByDescending(x => new SqlGuid(x.Id)).ToArray();
            return Task.FromResult(new UsageRightPage(rows.Skip((page - 1) * pageSize).Take(pageSize).Select(x => UsageRightLifecycleChanges.ListItem(View(x))).ToArray(), rows.Length, page, pageSize, (rows.Length + pageSize - 1) / pageSize));
        }
    }

    public Task<IReadOnlyList<UsageRightListItem>?> ReadUsageRightSequenceAsync(Guid id, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            return Task.FromResult<IReadOnlyList<UsageRightListItem>?>(rights.ContainsKey(id)
                ? UsageRightLifecycleChanges.Sequence(id, rights.Values.Select(View).ToArray()).Select(UsageRightLifecycleChanges.ListItem).ToArray() : null);
        }
    }

    public Task<PersonUsageRightMutationResult> ChangeLifecycleAsync(UsageRightLifecycleChange change, CancellationToken token) => Mutate(() =>
    {
        token.ThrowIfCancellationRequested();
        if (!rights.TryGetValue(change.Id, out var current)) return Missing(change.Id);
        var all = rights.Values.Select(View).ToArray();
        if (!UsageRightLifecycleChanges.Matches(change, all)) return Conflict(change.Id, current.Version);
        UsageRightView? successor = null;
        if (change.Successor is { } input)
        {
            if (!parties.ContainsKey(input.HolderPartyId) || !masterData.TryGetGraveSite(current.GraveSiteId, out var site) || site is null) return Invalid(change.Id);
            var rule = rules.Values.SingleOrDefault(x => x.CemeteryId == site.CemeteryId);
            if (rule is null) return Invalid(change.Id);
            successor = new(Guid.NewGuid(), current.GraveSiteId, input.StartDate, input.EndDate, input.SourceReference!, rule.Id, rule.Code, rule.Display, 1,
                [new(Guid.NewGuid(), input.HolderPartyId, input.StartDate, null)], [], PredecessorId: current.Id, OperationId: change.Audit.OperationId, ManualGrantReviewConfirmed: true);
        }
        var prepared = UsageRightLifecycleChanges.Prepare(change, all, successor);
        var evidence = prepared.Select((x, index) =>
        {
            var audit = change.Audit with { Id = index == 0 ? change.Audit.Id : Guid.NewGuid(), EntityId = x.Id, ResultingVersion = x.Version };
            if (audits.Any(a => a.Id == audit.Id || a.EntityId == x.Id && a.ResultingVersion == x.Version)) throw new InvalidOperationException("Nachweiskonflikt.");
            return (View: UsageRightLifecycleChanges.Evidence(x, audit, change.Reason), Audit: audit);
        }).ToArray();
        token.ThrowIfCancellationRequested();
        foreach (var item in evidence)
        {
            var x = item.View;
            rights[x.Id] = new(x.Id, x.GraveSiteId, x.StartDate, x.EndDate, x.SourceReference, x.UsageRightStartRuleId, x.StartRuleCodeSnapshot, x.StartRuleDisplayNameSnapshot, x.Version,
                [.. x.HolderPeriods], [.. x.Revisions], x.Status, x.PredecessorId, x.Termination, x.OperationId, x.ManualGrantReviewConfirmed);
            audits.Add(item.Audit);
        }
        var response = evidence.Single(x => x.View.Id == (successor?.Id ?? change.Id)).View;
        return new(PersonUsageRightMutationOutcome.Success, response.Id, response.Version, Right: response);
    });
}
