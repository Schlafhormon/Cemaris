using Cemaris.Application.CaseFollowUps;
using Cemaris.Application.Cases;
using Cemaris.Domain.CaseFollowUps;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.CaseFollowUps;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.CaseFollowUps;

public sealed class EfCaseFollowUpStore(CemarisDbContext db) : ICaseFollowUpStore
{
    public async Task<CaseFollowUpPage?> ReadAsync(Guid? caseId, CaseFollowUpQuery query, CancellationToken token)
    {
        query.Validate();
        if (caseId.HasValue && !await db.Cases.AnyAsync(x => x.Id == caseId, token)) return null;
        var filtered = db.CaseFollowUps.AsNoTracking().Where(x => !caseId.HasValue || x.CaseId == caseId);
        if (query.Status.HasValue)
        {
            var status = query.Status.Value.ToString();
            filtered = filtered.Where(x => x.Status == status);
        }
        if (query.DueUntil.HasValue) filtered = filtered.Where(x => x.DueDate <= query.DueUntil);
        var count = await filtered.CountAsync(token);
        // SQL Server sortiert uniqueidentifier wie SqlGuid im synthetischen Provider.
        var items = await filtered.OrderBy(x => x.DueDate).ThenBy(x => x.CreatedAtUtc).ThenBy(x => x.Id)
            .Skip(query.Offset).Take(query.PageSize).Select(x => new
            {
                x.Id,
                x.CaseId,
                x.Title,
                x.DueDate,
                x.Status,
                Cemetery = x.Case.Grave == null ? null : x.Case.Grave.GraveSite == null ? x.Case.Grave.Cemetery : x.Case.Grave.GraveSite.Cemetery.Name,
                Field = x.Case.Grave == null ? null : x.Case.Grave.GraveSite == null ? x.Case.Grave.Field : x.Case.Grave.GraveSite.Field == null ? null : x.Case.Grave.GraveSite.Field.Name,
                GraveNumber = x.Case.Grave == null ? null : x.Case.Grave.GraveSite == null ? x.Case.Grave.GraveNumber : x.Case.Grave.GraveSite.GraveNumber,
                GraveSiteId = x.Case.Grave == null ? null : x.Case.Grave.GraveSiteId,
            }).ToArrayAsync(token);
        return new(items.Select(x => new CaseFollowUpListItem(x.Id, x.CaseId, x.Title, x.DueDate,
            Enum.Parse<CaseFollowUpStatus>(x.Status), new GraveDetails(x.Cemetery, x.Field, x.GraveNumber, x.GraveSiteId))).ToArray(),
            count, query.Page, query.PageSize);
    }

    public async Task<CaseFollowUpView?> FindAsync(Guid caseId, Guid id, CancellationToken token)
    {
        var entity = await db.CaseFollowUps.AsNoTracking().Include(x => x.Revisions)
            .SingleOrDefaultAsync(x => x.Id == id && x.CaseId == caseId && x.Case.Id == caseId, token);
        return entity is null ? null : View(entity);
    }

    public Task<CaseFollowUpResult> CreateAsync(Guid caseId, Guid id, CaseFollowUpFacts facts, CaseFollowUpMutation mutation, CancellationToken token) =>
        Transaction(async () =>
        {
            var synthetic = await db.Cases.Where(x => x.Id == caseId).Select(x => (bool?)x.IsSynthetic).SingleOrDefaultAsync(token);
            if (synthetic is null) return new(CaseFollowUpOutcome.NotFound);
            if (!synthetic.Value) return new(CaseFollowUpOutcome.NonSynthetic);
            if (mutation.Operation != CaseFollowUpOperation.Created) throw new InvalidOperationException("Ungültiger Anlegenachweis.");
            var entity = new CaseFollowUpEntity { Id = id, CaseId = caseId };
            var state = new CaseFollowUpState(id, caseId, facts.Title, facts.Description, facts.DueDate,
                CaseFollowUpStatus.Open, 1, mutation.OccurredAtUtc, mutation.OccurredAtUtc);
            Set(entity, state);
            db.CaseFollowUps.Add(entity);
            AddEvidence(entity, mutation);
            await db.SaveChangesAsync(token);
            return new(CaseFollowUpOutcome.Success, View(entity));
        }, token);

    public Task<CaseFollowUpResult> ChangeAsync(Guid caseId, Guid id, long expectedVersion, CaseFollowUpFacts? facts,
        CaseFollowUpMutation mutation, CancellationToken token) => Transaction(async () =>
    {
        var entity = await db.CaseFollowUps.Include(x => x.Case).Include(x => x.Revisions)
            .SingleOrDefaultAsync(x => x.Id == id && x.CaseId == caseId, token);
        if (entity is null) return new(CaseFollowUpOutcome.NotFound);
        if (!entity.Case.IsSynthetic) return new(CaseFollowUpOutcome.NonSynthetic);
        if (entity.Version != expectedVersion) return new(CaseFollowUpOutcome.VersionConflict);
        var next = CaseFollowUpChanges.Apply(State(entity), facts, mutation);
        if (next is null) return new(CaseFollowUpOutcome.InvalidState);
        Set(entity, next);
        // Zuerst den Versionsvergleich durchsetzen; die Transaktion hält die Zeilensperre
        // bis auch Revision und Audit gespeichert sind. Nachweisfehler rollen alles zurück.
        await db.SaveChangesAsync(token);
        AddEvidence(entity, mutation);
        await db.SaveChangesAsync(token);
        return new(CaseFollowUpOutcome.Success, View(entity));
    }, token);

    private async Task<CaseFollowUpResult> Transaction(Func<Task<CaseFollowUpResult>> action, CancellationToken token)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(token);
        try
        {
            var result = await action();
            if (result.Outcome == CaseFollowUpOutcome.Success) await transaction.CommitAsync(token);
            else await transaction.RollbackAsync(token);
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return new(CaseFollowUpOutcome.VersionConflict);
        }
        finally { db.ChangeTracker.Clear(); }
    }

    private void AddEvidence(CaseFollowUpEntity x, CaseFollowUpMutation m)
    {
        var revision = new CaseFollowUpRevisionEntity
        {
            Id = m.RevisionId,
            FollowUpId = x.Id,
            CaseId = x.CaseId,
            Title = x.Title,
            Description = x.Description,
            DueDate = x.DueDate,
            Status = x.Status,
            Version = x.Version,
            CreatedAtUtc = x.CreatedAtUtc,
            UpdatedAtUtc = x.UpdatedAtUtc,
            Operation = m.Operation.ToString(),
            Reason = m.Reason,
            ActorId = m.Actor.Id,
            ActorDisplayName = m.Actor.DisplayName,
            OccurredAtUtc = m.OccurredAtUtc,
        };
        x.Revisions.Add(revision);
        // Die serverseitig vergebene GUID kennzeichnet eine neue Revision, keinen vorhandenen Datensatz.
        db.CaseFollowUpRevisions.Add(revision);
        db.CaseFollowUpAudits.Add(new CaseFollowUpAuditEntity
        {
            Id = m.AuditId,
            FollowUpId = x.Id,
            CaseId = x.CaseId,
            ResultingVersion = x.Version,
            Operation = m.Operation.ToString(),
            ActorId = m.Actor.Id,
            OccurredAtUtc = m.OccurredAtUtc,
        });
    }

    private static void Set(CaseFollowUpEntity x, CaseFollowUpState s)
    {
        x.Title = s.Title; x.Description = s.Description; x.DueDate = s.DueDate; x.Status = s.Status.ToString();
        x.Version = s.Version; x.CreatedAtUtc = s.CreatedAtUtc; x.UpdatedAtUtc = s.UpdatedAtUtc;
    }
    private static CaseFollowUpState State(CaseFollowUpEntity x) => new(x.Id, x.CaseId, x.Title, x.Description,
        x.DueDate, Enum.Parse<CaseFollowUpStatus>(x.Status), x.Version, x.CreatedAtUtc, x.UpdatedAtUtc);
    private static CaseFollowUpView View(CaseFollowUpEntity x) => new(State(x), x.Revisions.OrderBy(r => r.Version)
        .Select(r => new CaseFollowUpRevision(r.Id, new(r.FollowUpId, r.CaseId, r.Title, r.Description, r.DueDate,
            Enum.Parse<CaseFollowUpStatus>(r.Status), r.Version, r.CreatedAtUtc, r.UpdatedAtUtc),
            Enum.Parse<CaseFollowUpOperation>(r.Operation), r.Reason, r.ActorId, r.ActorDisplayName, r.OccurredAtUtc)).ToArray());
}
