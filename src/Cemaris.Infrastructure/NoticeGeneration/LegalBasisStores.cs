using Cemaris.Application.NoticeGeneration;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.NoticeGeneration;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.NoticeGeneration;

public sealed class EfLegalBasisVersionStore(CemarisDbContext db) : ILegalBasisVersionStore
{
    public async Task<IReadOnlyList<LegalBasisVersionView>> ReadAsync(bool activeOnly, CancellationToken token) =>
        (await db.LegalBasisVersions.AsNoTracking().Where(x => !activeOnly || x.IsActive)
            .OrderBy(x => x.Name).ThenByDescending(x => x.VersionDate).ToArrayAsync(token)).Select(Map).ToArray();

    public async Task<LegalBasisVersionView?> FindAsync(Guid id, CancellationToken token) =>
        await db.LegalBasisVersions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, token) is { } x ? Map(x) : null;

    public async Task<LegalBasisMutationResult> CreateAsync(Guid id, string name, DateOnly versionDate, LegalBasisMutation mutation, CancellationToken token)
    {
        var entity = new LegalBasisVersionEntity
        {
            Id = id,
            Name = name,
            VersionDate = versionDate,
            IsActive = false,
            Version = 1,
            CreatedAtUtc = mutation.OccurredAtUtc,
            UpdatedAtUtc = mutation.OccurredAtUtc
        };
        db.Add(entity); db.Add(Audit(mutation));
        try { await db.SaveChangesAsync(token); return new(LegalBasisMutationOutcome.Success, id, 1); }
        catch (DbUpdateException) { db.ChangeTracker.Clear(); return new(LegalBasisMutationOutcome.Duplicate, id); }
    }

    public async Task<LegalBasisMutationResult> SetActiveAsync(Guid id, long expectedVersion, bool isActive, LegalBasisMutation mutation, CancellationToken token)
    {
        var entity = await db.LegalBasisVersions.SingleOrDefaultAsync(x => x.Id == id, token);
        if (entity is null) return new(LegalBasisMutationOutcome.NotFound, id);
        if (entity.Version != expectedVersion) return new(LegalBasisMutationOutcome.VersionConflict, id, entity.Version);
        entity.IsActive = isActive; entity.Version++; entity.UpdatedAtUtc = mutation.OccurredAtUtc; db.Add(Audit(mutation));
        try { await db.SaveChangesAsync(token); return new(LegalBasisMutationOutcome.Success, id, entity.Version); }
        catch (DbUpdateConcurrencyException) { return new(LegalBasisMutationOutcome.VersionConflict, id); }
    }

    private static LegalBasisVersionView Map(LegalBasisVersionEntity x) => new(x.Id, x.Name, x.VersionDate, x.IsActive, x.Version, x.CreatedAtUtc, x.UpdatedAtUtc);
    private static LegalBasisVersionAuditEntity Audit(LegalBasisMutation x) => new()
    {
        Id = x.Id,
        LegalBasisVersionId = x.LegalBasisVersionId,
        ResultingVersion = x.ResultingVersion,
        Operation = x.Operation,
        OccurredAtUtc = x.OccurredAtUtc,
        ActorId = x.Actor.Id,
        ActorDisplayName = x.Actor.DisplayName
    };
}

public sealed class SyntheticLegalBasisVersionStore(SyntheticStoreCoordinator coordinator) : ILegalBasisVersionStore
{
    private readonly Dictionary<Guid, LegalBasisVersionView> values = [];
    private readonly List<LegalBasisMutation> audits = [];
    public Task<IReadOnlyList<LegalBasisVersionView>> ReadAsync(bool activeOnly, CancellationToken token) { lock (coordinator.Gate) { token.ThrowIfCancellationRequested(); return Task.FromResult<IReadOnlyList<LegalBasisVersionView>>(values.Values.Where(x => !activeOnly || x.IsActive).OrderBy(x => x.Name).ThenByDescending(x => x.VersionDate).ToArray()); } }
    public Task<LegalBasisVersionView?> FindAsync(Guid id, CancellationToken token) { lock (coordinator.Gate) { token.ThrowIfCancellationRequested(); return Task.FromResult(values.GetValueOrDefault(id)); } }
    public Task<LegalBasisMutationResult> CreateAsync(Guid id, string name, DateOnly versionDate, LegalBasisMutation mutation, CancellationToken token) { lock (coordinator.Gate) { token.ThrowIfCancellationRequested(); if (values.Values.Any(x => x.Name == name && x.VersionDate == versionDate)) return Task.FromResult(new LegalBasisMutationResult(LegalBasisMutationOutcome.Duplicate, id)); var x = new LegalBasisVersionView(id, name, versionDate, false, 1, mutation.OccurredAtUtc, mutation.OccurredAtUtc); values.Add(id, x); audits.Add(mutation); return Task.FromResult(new LegalBasisMutationResult(LegalBasisMutationOutcome.Success, id, 1)); } }
    public Task<LegalBasisMutationResult> SetActiveAsync(Guid id, long expectedVersion, bool isActive, LegalBasisMutation mutation, CancellationToken token) { lock (coordinator.Gate) { token.ThrowIfCancellationRequested(); if (!values.TryGetValue(id, out var x)) return Task.FromResult(new LegalBasisMutationResult(LegalBasisMutationOutcome.NotFound, id)); if (x.Version != expectedVersion) return Task.FromResult(new LegalBasisMutationResult(LegalBasisMutationOutcome.VersionConflict, id, x.Version)); x = x with { IsActive = isActive, Version = x.Version + 1, UpdatedAtUtc = mutation.OccurredAtUtc }; values[id] = x; audits.Add(mutation); return Task.FromResult(new LegalBasisMutationResult(LegalBasisMutationOutcome.Success, id, x.Version)); } }
    internal IReadOnlyList<LegalBasisMutation> Audits => audits;
}
