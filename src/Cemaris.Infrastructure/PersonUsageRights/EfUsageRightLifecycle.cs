using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.UsageRights;
using Cemaris.Infrastructure.Persistence.PersonUsageRights;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.PersonUsageRights;

public sealed partial class EfPersonUsageRightStore
{
    public async Task<UsageRightPage> ReadUsageRightsAsync(Guid graveSiteId, int page, int pageSize, CancellationToken token)
    {
        var query = db.CanonicalUsageRights.AsNoTracking().Where(x => x.GraveSiteId == graveSiteId);
        var count = await query.CountAsync(token);
        var rows = await query.OrderByDescending(x => x.StartDate).ThenByDescending(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new { x.Id, x.GraveSiteId, x.StartDate, x.EndDate, x.Status, x.PredecessorId, x.Version }).ToArrayAsync(token);
        return new(rows.Select(x => new UsageRightListItem(x.Id, x.GraveSiteId, x.StartDate, x.EndDate, Enum.Parse<UsageRightStatus>(x.Status), x.PredecessorId, x.Version)).ToArray(), count, page, pageSize, (count + pageSize - 1) / pageSize);
    }

    public async Task<IReadOnlyList<UsageRightListItem>?> ReadUsageRightSequenceAsync(Guid id, CancellationToken token)
    {
        var current = await db.CanonicalUsageRights.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, token);
        if (current is null) return null;
        var rows = await db.CanonicalUsageRights.AsNoTracking().Where(x => x.GraveSiteId == current.GraveSiteId).ToArrayAsync(token);
        return UsageRightLifecycleChanges.Sequence(id, rows.Select(View).ToArray()).Select(UsageRightLifecycleChanges.ListItem).ToArray();
    }

    public Task<PersonUsageRightMutationResult> ChangeLifecycleAsync(UsageRightLifecycleChange change, CancellationToken token) => TransactionAsync(async () =>
    {
        var current = await LoadRightTrackedAsync(change.Id, token);
        if (current is null) return Missing(change.Id);
        var entities = await db.CanonicalUsageRights.Include(x => x.HolderPeriods).Include(x => x.Revisions)
            .Where(x => x.GraveSiteId == current.GraveSiteId).ToArrayAsync(token);
        var views = entities.Select(View).ToArray();
        if (!UsageRightLifecycleChanges.Matches(change, views)) return Conflict(change.Id, current.Version);
        UsageRightView? successor = null;
        if (change.Successor is { } input)
        {
            if (!await db.Parties.AnyAsync(x => x.Id == input.HolderPartyId, token)) return Invalid(change.Id);
            var cemeteryId = await db.GraveSites.Where(x => x.Id == current.GraveSiteId).Select(x => x.CemeteryId).SingleAsync(token);
            var rule = await db.UsageRightStartRules.AsNoTracking().SingleOrDefaultAsync(x => x.CemeteryId == cemeteryId, token);
            if (rule is null) return Invalid(change.Id);
            successor = new(Guid.NewGuid(), current.GraveSiteId, input.StartDate, input.EndDate, input.SourceReference!, rule.Id, rule.Code, rule.DisplayName, 1,
                [new(Guid.NewGuid(), input.HolderPartyId, input.StartDate, null)], [], PredecessorId: current.Id, OperationId: change.Audit.OperationId, ManualGrantReviewConfirmed: true);
        }
        var prepared = UsageRightLifecycleChanges.Prepare(change, views, successor);
        // Zuerst offene Nachfolger freigeben; der gefilterte Index gilt bereits innerhalb der Transaktion.
        foreach (var view in prepared.Where(x => x.Status == UsageRightStatus.Voided)) ApplyLifecycle(entities.Single(x => x.Id == view.Id), view);
        if (prepared.Any(x => x.Status == UsageRightStatus.Voided)) await db.SaveChangesAsync(token);
        foreach (var view in prepared.Where(x => x.Status != UsageRightStatus.Voided))
        {
            var entity = entities.SingleOrDefault(x => x.Id == view.Id);
            if (entity is null)
            {
                entity = new UsageRightEntity
                {
                    Id = view.Id,
                    GraveSiteId = view.GraveSiteId,
                    StartDate = view.StartDate,
                    EndDate = view.EndDate,
                    SourceReference = view.SourceReference,
                    UsageRightStartRuleId = view.UsageRightStartRuleId,
                    StartRuleCodeSnapshot = view.StartRuleCodeSnapshot,
                    StartRuleDisplayNameSnapshot = view.StartRuleDisplayNameSnapshot
                };
                foreach (var h in view.HolderPeriods) entity.HolderPeriods.Add(new() { Id = h.Id, UsageRightId = view.Id, PartyId = h.PartyId, ValidFromInclusive = h.ValidFromInclusive });
                db.CanonicalUsageRights.Add(entity);
            }
            ApplyLifecycle(entity, view);
        }
        // Versionsvergleich vor Nachweisen, weiterhin innerhalb derselben äußeren Transaktion.
        await db.SaveChangesAsync(token);
        var response = new List<UsageRightView>();
        foreach (var view in prepared)
        {
            var audit = change.Audit with { Id = view.Id == change.Id ? change.Audit.Id : Guid.NewGuid(), EntityId = view.Id, ResultingVersion = view.Version };
            var evidence = UsageRightLifecycleChanges.Evidence(view, audit, change.Reason);
            var revision = evidence.Revisions[^1];
            db.UsageRightRevisions.Add(new()
            {
                Id = revision.Id,
                UsageRightId = view.Id,
                ResultingVersion = view.Version,
                MutationType = audit.Operation,
                Reason = change.Reason,
                OccurredAtUtc = audit.OccurredAtUtc,
                ActorId = audit.Actor.Id,
                ActorDisplayName = audit.Actor.DisplayName,
                StateJson = System.Text.Json.JsonSerializer.Serialize(view with { Revisions = [] }, JsonOptions)
            });
            AddAudit(audit);
            response.Add(evidence);
        }
        await db.SaveChangesAsync(token);
        var saved = response.Single(x => x.Id == (successor?.Id ?? change.Id));
        return new(PersonUsageRightMutationOutcome.Success, saved.Id, saved.Version, Right: saved);
    }, change.Id, token);

    private static void ApplyLifecycle(UsageRightEntity entity, UsageRightView view)
    {
        entity.ManualGrantReviewConfirmed = view.ManualGrantReviewConfirmed;
        entity.Status = view.Status.ToString(); entity.PredecessorId = view.PredecessorId; entity.Version = view.Version; entity.OperationId = view.OperationId;
        entity.TerminationDate = view.Termination?.TerminationDate; entity.TerminationKind = view.Termination?.Kind.ToString();
        entity.TerminationReason = view.Termination?.Reason; entity.TerminationSourceReference = view.Termination?.SourceReference; entity.ManualReviewConfirmed = view.Termination?.ManualReviewConfirmed;
        foreach (var holder in entity.HolderPeriods) holder.ValidUntilExclusive = view.HolderPeriods.Single(x => x.Id == holder.Id).ValidUntilExclusive;
    }

    private static UsageRightTerminationView? Termination(UsageRightEntity entity) => entity.TerminationDate is { } date
        ? new(date, Enum.Parse<UsageRightTerminationKind>(entity.TerminationKind!), entity.TerminationReason!, entity.TerminationSourceReference!, entity.ManualReviewConfirmed == true) : null;
}
