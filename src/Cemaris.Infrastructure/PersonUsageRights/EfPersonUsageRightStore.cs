using System.Data;
using System.Text.Json;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.PersonUsageRights;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.PersonUsageRights;

public sealed class EfPersonUsageRightStore(CemarisDbContext db) : IPersonUsageRightStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<PartySearchItem>> SearchPartiesAsync(string query, CancellationToken token)
    {
        var key = PartyRules.Normalize(query);
        var items = await db.Parties.AsNoTracking().Include(x => x.Addresses).Where(x => x.NormalizedName.Contains(key)).ToListAsync(token);
        return items.Select(x => new PartySearchItem(x.Id, Enum.Parse<PartyType>(x.PartyType), Display(x), x.Addresses.SingleOrDefault(a => a.Id == x.CurrentPrimaryAddressId) is { } a ? Address(a) : null)).ToArray();
    }

    public async Task<PartyView?> FindPartyAsync(Guid id, CancellationToken token) => await LoadPartyAsync(id, token) is { } x ? View(x) : null;
    public async Task<UsageRightView?> FindUsageRightAsync(Guid id, CancellationToken token) => await LoadRightAsync(id, token) is { } x ? View(x) : null;
    public async Task<UsageRightView?> FindUsageRightByGraveSiteAsync(Guid id, CancellationToken token) => await db.CanonicalUsageRights.AsNoTracking().Include(x => x.HolderPeriods).Include(x => x.Revisions).SingleOrDefaultAsync(x => x.GraveSiteId == id, token) is { } x ? View(x) : null;
    public async Task<IReadOnlyList<UsageRightStartRuleView>> ReadStartRulesAsync(CancellationToken token) => (await db.UsageRightStartRules.AsNoTracking().Include(x => x.Revisions).OrderBy(x => x.Code).ToListAsync(token)).Select(View).ToArray();

    public Task<PersonUsageRightMutationResult> CreatePartyAsync(Guid id, CreatePartyCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => TransactionAsync(async () =>
    {
        var name = PartyName.Create(command.PartyType, command.FirstName, command.LastName, command.OrganizationName);
        var addresses = command.Addresses.Select(x => ToEntity(id, x)).ToList();
        var duplicateIds = await db.Parties.AsNoTracking().Where(x => x.NormalizedName == name.NormalizedValue && x.Addresses.Any(a => addresses.Select(b => b.NormalizedAddress).Contains(a.NormalizedAddress))).Select(x => x.Id).ToArrayAsync(token);
        if (duplicateIds.Length > 0 && !command.ConfirmPossibleDuplicate)
        {
            var candidates = await db.Parties.AsNoTracking().Where(x => duplicateIds.Contains(x.Id)).Select(x => new PossiblePartyDuplicate(x.Id, x.PartyType == nameof(PartyType.Organization) ? x.OrganizationName! : x.FirstName + " " + x.LastName)).ToArrayAsync(token);
            return new(PersonUsageRightMutationOutcome.PossibleDuplicate, id, DuplicateCandidates: candidates);
        }
        var entity = new PartyEntity { Id = id, PartyType = name.Type.ToString(), FirstName = name.FirstName, LastName = name.LastName, OrganizationName = name.OrganizationName, NormalizedName = name.NormalizedValue, Version = 1 };
        foreach (var address in addresses) entity.Addresses.Add(address);
        var primaryInput = command.Addresses.Select((x, i) => (x, i)).SingleOrDefault(x => x.x.IsCurrentPrimary);
        Guid? primaryAddressId = null;
        if (primaryInput.x is not null) { var primary = addresses[primaryInput.i]; EnsureCurrent(primary, today); primaryAddressId = primary.Id; }
        db.Parties.Add(entity);
        await db.SaveChangesAsync(token);
        db.ChangeTracker.Clear();
        if (primaryAddressId.HasValue)
        {
            var affected = await db.Parties
                .Where(x => x.Id == id)
                .ExecuteUpdateAsync(update => update.SetProperty(x => x.CurrentPrimaryAddressId, primaryAddressId), token);
            if (affected != 1) throw new DbUpdateConcurrencyException();
        }
        var state = new PartyView(
            id,
            name.Type,
            name.FirstName,
            name.LastName,
            name.OrganizationName,
            primaryAddressId,
            1,
            addresses.Select(x => new PartyAddressView(x.Id, x.Street, x.HouseNumber, x.PostalCode, x.City, x.AdditionalInformation, x.ValidFromInclusive, x.ValidUntilExclusive, x.Id == primaryAddressId)).ToArray(),
            []);
        db.PartyRevisions.Add(new()
        {
            Id = Guid.NewGuid(),
            PartyId = id,
            ResultingVersion = 1,
            MutationType = audit.Operation,
            OccurredAtUtc = audit.OccurredAtUtc,
            ActorId = audit.Actor.Id,
            ActorDisplayName = audit.Actor.DisplayName,
            StateJson = JsonSerializer.Serialize(state, JsonOptions),
        });
        AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, 1);
    }, id, token);

    public Task<PersonUsageRightMutationResult> CorrectPartyAsync(Guid id, long expected, CorrectPartyCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => TransactionAsync(async () =>
    {
        var entity = await LoadPartyTrackedAsync(id, token); if (entity is null) return Missing(id); if (entity.Version != expected) return Conflict(id, entity.Version);
        var name = PartyName.Create(Enum.Parse<PartyType>(entity.PartyType), command.FirstName, command.LastName, command.OrganizationName);
        entity.FirstName = name.FirstName; entity.LastName = name.LastName; entity.OrganizationName = name.OrganizationName; entity.NormalizedName = name.NormalizedValue; entity.Version++;
        AddRevision(entity, audit, command.Reason); AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, entity.Version);
    }, id, token);

    public Task<PersonUsageRightMutationResult> AddPartyAddressAsync(Guid id, long expected, AddPartyAddressCommand command, Guid addressId, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => TransactionAsync(async () =>
    {
        var entity = await LoadPartyTrackedAsync(id, token); if (entity is null) return Missing(id); if (entity.Version != expected) return Conflict(id, entity.Version);
        var address = ToEntity(id, command.Address, addressId); entity.Addresses.Add(address); if (command.Address.IsCurrentPrimary) { EnsureCurrent(address, today); entity.CurrentPrimaryAddressId = address.Id; }
        entity.Version++;
        AddRevision(entity, audit, command.Reason); AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, entity.Version);
    }, id, token);

    public Task<PersonUsageRightMutationResult> CorrectPartyAddressAsync(Guid id, Guid addressId, long expected, CorrectPartyAddressCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => TransactionAsync(async () =>
    {
        var entity = await LoadPartyTrackedAsync(id, token); if (entity is null) return Missing(id); if (entity.Version != expected) return Conflict(id, entity.Version);
        var address = entity.Addresses.SingleOrDefault(x => x.Id == addressId); if (address is null) return Missing(id); Apply(address, command.Address); if (command.Address.IsCurrentPrimary) { EnsureCurrent(address, today); entity.CurrentPrimaryAddressId = address.Id; } else if (entity.CurrentPrimaryAddressId == address.Id) entity.CurrentPrimaryAddressId = null; entity.Version++;
        AddRevision(entity, audit, command.Reason); AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, entity.Version);
    }, id, token);

    public Task<PersonUsageRightMutationResult> CreateUsageRightAsync(Guid id, CreateUsageRightCommand command, Guid holderId, PersonUsageRightAudit audit, CancellationToken token) => TransactionAsync(async () =>
    {
        var site = await db.GraveSites.AsNoTracking().SingleOrDefaultAsync(x => x.Id == command.GraveSiteId, token); if (site is null || !await db.Parties.AnyAsync(x => x.Id == command.HolderPartyId, token)) return Invalid(id);
        var rule = await db.UsageRightStartRules.AsNoTracking().SingleOrDefaultAsync(x => x.CemeteryId == site.CemeteryId, token); if (rule is null) return Invalid(id);
        if (await db.CanonicalUsageRights.AnyAsync(x => x.GraveSiteId == command.GraveSiteId, token)) return Duplicate(id);
        var entity = new UsageRightEntity { Id = id, GraveSiteId = command.GraveSiteId, StartDate = command.StartDate, EndDate = command.EndDate, SourceReference = command.SourceReference!, UsageRightStartRuleId = rule.Id, StartRuleCodeSnapshot = rule.Code, StartRuleDisplayNameSnapshot = rule.DisplayName, Version = 1 };
        entity.HolderPeriods.Add(new() { Id = holderId, UsageRightId = id, PartyId = command.HolderPartyId, ValidFromInclusive = command.StartDate }); db.CanonicalUsageRights.Add(entity); AddRevision(entity, audit, null); AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, 1);
    }, id, token);

    public Task<PersonUsageRightMutationResult> TransferUsageRightAsync(Guid id, long expected, TransferUsageRightCommand command, Guid holderId, PersonUsageRightAudit audit, CancellationToken token) => TransactionAsync(async () =>
    {
        var entity = await LoadRightTrackedAsync(id, token); if (entity is null) return Missing(id); if (entity.Version != expected) return Conflict(id, entity.Version); if (!await db.Parties.AnyAsync(x => x.Id == command.NewHolderPartyId, token)) return Invalid(id);
        var open = entity.HolderPeriods.Single(x => x.ValidUntilExclusive == null); UsageRightRules.ValidateTransfer(command.ValidFromInclusive, open.ValidFromInclusive, entity.EndDate); open.ValidUntilExclusive = command.ValidFromInclusive;
        var holder = new UsageRightHolderPeriodEntity { Id = holderId, UsageRightId = id, PartyId = command.NewHolderPartyId, ValidFromInclusive = command.ValidFromInclusive };
        entity.HolderPeriods.Add(holder); db.UsageRightHolderPeriods.Add(holder); entity.Version++;
        AddRevision(entity, audit, command.Reason); AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, entity.Version);
    }, id, token);

    public Task<PersonUsageRightMutationResult> ExtendUsageRightAsync(Guid id, long expected, ExtendUsageRightCommand command, PersonUsageRightAudit audit, CancellationToken token) => TransactionAsync(async () =>
    {
        var entity = await LoadRightTrackedAsync(id, token); if (entity is null) return Missing(id); if (entity.Version != expected) return Conflict(id, entity.Version); UsageRightRules.ValidateExtension(entity.EndDate, command.NewEndDate); entity.EndDate = command.NewEndDate; entity.Version++; AddRevision(entity, audit, command.Reason); AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, entity.Version);
    }, id, token);

    public Task<PersonUsageRightMutationResult> CorrectUsageRightAsync(Guid id, long expected, CorrectUsageRightCommand command, PersonUsageRightAudit audit, CancellationToken token) => TransactionAsync(async () =>
    {
        var entity = await LoadRightTrackedAsync(id, token); if (entity is null) return Missing(id); if (entity.Version != expected) return Conflict(id, entity.Version);
        var site = await db.GraveSites.AsNoTracking().SingleOrDefaultAsync(x => x.Id == command.GraveSiteId, token); var rule = await db.UsageRightStartRules.AsNoTracking().SingleOrDefaultAsync(x => x.Id == command.UsageRightStartRuleId, token); if (site is null || rule is null || rule.CemeteryId != site.CemeteryId || await db.CanonicalUsageRights.AnyAsync(x => x.Id != id && x.GraveSiteId == command.GraveSiteId, token)) return Invalid(id);
        entity.GraveSiteId = command.GraveSiteId; entity.StartDate = command.StartDate; entity.EndDate = command.EndDate; entity.SourceReference = command.SourceReference!; entity.UsageRightStartRuleId = rule.Id; entity.StartRuleCodeSnapshot = rule.Code; entity.StartRuleDisplayNameSnapshot = rule.DisplayName; entity.Version++; AddRevision(entity, audit, command.Reason); AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, entity.Version);
    }, id, token);

    public Task<PersonUsageRightMutationResult> SaveStartRuleAsync(Guid id, long? expected, SaveUsageRightStartRuleCommand command, PersonUsageRightAudit audit, CancellationToken token) => TransactionAsync(async () =>
    {
        var entity = await db.UsageRightStartRules.Include(x => x.Revisions).SingleOrDefaultAsync(x => x.Id == id, token);
        if (entity is null && expected.HasValue) return Missing(id); if (entity is not null && entity.Version != expected) return Conflict(id, entity.Version); if (!await db.Cemeteries.AnyAsync(x => x.Id == command.CemeteryId, token)) return Invalid(id); if (await db.UsageRightStartRules.AnyAsync(x => x.Id != id && x.CemeteryId == command.CemeteryId, token)) return Duplicate(id);
        entity ??= new() { Id = id, CemeteryId = command.CemeteryId, Version = 0 }; if (entity.Version == 0) db.UsageRightStartRules.Add(entity); entity.Code = command.Code!; entity.DisplayName = command.DisplayName!; entity.Version++;
        var revision = new UsageRightStartRuleRevisionEntity { Id = Guid.NewGuid(), UsageRightStartRuleId = id, ResultingVersion = entity.Version, MutationType = audit.Operation, Reason = command.Reason, OccurredAtUtc = audit.OccurredAtUtc, ActorId = audit.Actor.Id, ActorDisplayName = audit.Actor.DisplayName, Code = entity.Code, DisplayName = entity.DisplayName };
        db.UsageRightStartRuleRevisions.Add(revision); AddAudit(audit); await db.SaveChangesAsync(token); return Success(id, entity.Version);
    }, id, token);

    private async Task<PersonUsageRightMutationResult> TransactionAsync(Func<Task<PersonUsageRightMutationResult>> action, Guid id, CancellationToken token)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, token);
        try
        {
            var result = await action();
            if (result.Outcome == PersonUsageRightMutationOutcome.Success) await transaction.CommitAsync(token); else await transaction.RollbackAsync(token);
            db.ChangeTracker.Clear();
            return result;
        }
        catch (DbUpdateConcurrencyException) { await transaction.RollbackAsync(token); db.ChangeTracker.Clear(); return Conflict(id, 0); }
        catch (DbUpdateException) { await transaction.RollbackAsync(token); db.ChangeTracker.Clear(); return Duplicate(id); }
    }

    private Task<PartyEntity?> LoadPartyTrackedAsync(Guid id, CancellationToken token) => db.Parties.Include(x => x.Addresses).Include(x => x.Revisions).SingleOrDefaultAsync(x => x.Id == id, token);
    private Task<PartyEntity?> LoadPartyAsync(Guid id, CancellationToken token) => db.Parties.AsNoTracking().Include(x => x.Addresses).Include(x => x.Revisions).SingleOrDefaultAsync(x => x.Id == id, token);
    private Task<UsageRightEntity?> LoadRightTrackedAsync(Guid id, CancellationToken token) => db.CanonicalUsageRights.Include(x => x.HolderPeriods).Include(x => x.Revisions).SingleOrDefaultAsync(x => x.Id == id, token);
    private Task<UsageRightEntity?> LoadRightAsync(Guid id, CancellationToken token) => db.CanonicalUsageRights.AsNoTracking().Include(x => x.HolderPeriods).Include(x => x.Revisions).SingleOrDefaultAsync(x => x.Id == id, token);
    private static PartyAddressEntity ToEntity(Guid partyId, PostalAddressInput input, Guid? id = null) { var a = PostalAddress.Create(input.Street, input.HouseNumber, input.PostalCode, input.City, input.AdditionalInformation); return new() { Id = id ?? Guid.NewGuid(), PartyId = partyId, Street = a.Street, HouseNumber = a.HouseNumber, PostalCode = a.PostalCode, City = a.City, AdditionalInformation = a.AdditionalInformation, NormalizedAddress = a.NormalizedValue, ValidFromInclusive = input.ValidFromInclusive, ValidUntilExclusive = input.ValidUntilExclusive }; }
    private static void Apply(PartyAddressEntity entity, PostalAddressInput input) { var a = PostalAddress.Create(input.Street, input.HouseNumber, input.PostalCode, input.City, input.AdditionalInformation); entity.Street = a.Street; entity.HouseNumber = a.HouseNumber; entity.PostalCode = a.PostalCode; entity.City = a.City; entity.AdditionalInformation = a.AdditionalInformation; entity.NormalizedAddress = a.NormalizedValue; entity.ValidFromInclusive = input.ValidFromInclusive; entity.ValidUntilExclusive = input.ValidUntilExclusive; }
    private static void EnsureCurrent(PartyAddressEntity x, DateOnly today) { if (x.ValidFromInclusive > today || x.ValidUntilExclusive.HasValue && x.ValidUntilExclusive <= today) throw new PartyValidationException("address", "Die Hauptanschrift muss gegenwärtig gültig sein."); }
    private void AddRevision(PartyEntity x, PersonUsageRightAudit a, string? reason) { var state = View(x); db.PartyRevisions.Add(new() { Id = Guid.NewGuid(), PartyId = x.Id, ResultingVersion = a.ResultingVersion, MutationType = a.Operation, Reason = reason, OccurredAtUtc = a.OccurredAtUtc, ActorId = a.Actor.Id, ActorDisplayName = a.Actor.DisplayName, StateJson = JsonSerializer.Serialize(state with { Revisions = [] }, JsonOptions) }); }
    private void AddRevision(UsageRightEntity x, PersonUsageRightAudit a, string? reason) { var state = View(x); db.UsageRightRevisions.Add(new() { Id = Guid.NewGuid(), UsageRightId = x.Id, ResultingVersion = a.ResultingVersion, MutationType = a.Operation, Reason = reason, OccurredAtUtc = a.OccurredAtUtc, ActorId = a.Actor.Id, ActorDisplayName = a.Actor.DisplayName, StateJson = JsonSerializer.Serialize(state with { Revisions = [] }, JsonOptions) }); }
    private void AddAudit(PersonUsageRightAudit x) => db.PersonUsageRightAudits.Add(new() { Id = x.Id, EntityType = x.EntityType, EntityId = x.EntityId, ResultingVersion = x.ResultingVersion, Operation = x.Operation, OccurredAtUtc = x.OccurredAtUtc, ActorId = x.Actor.Id, ActorDisplayName = x.Actor.DisplayName });
    private static PartyView View(PartyEntity x) { var addresses = x.Addresses.Select(a => new PartyAddressView(a.Id, a.Street, a.HouseNumber, a.PostalCode, a.City, a.AdditionalInformation, a.ValidFromInclusive, a.ValidUntilExclusive, x.CurrentPrimaryAddressId == a.Id)).ToArray(); var revisions = x.Revisions.OrderBy(r => r.ResultingVersion).Select(r => JsonSerializer.Deserialize<PartyView>(r.StateJson, JsonOptions) is { } state ? new PartyRevisionView(r.Id, r.ResultingVersion, r.MutationType, r.Reason, r.OccurredAtUtc, r.ActorDisplayName, state.PartyType, state.FirstName, state.LastName, state.OrganizationName, state.Addresses) : throw new InvalidOperationException("Ungültige Beteiligtenrevision.")).ToArray(); return new(x.Id, Enum.Parse<PartyType>(x.PartyType), x.FirstName, x.LastName, x.OrganizationName, x.CurrentPrimaryAddressId, x.Version, addresses, revisions); }
    private static UsageRightView View(UsageRightEntity x) { var holders = x.HolderPeriods.OrderBy(h => h.ValidFromInclusive).Select(h => new UsageRightHolderPeriodView(h.Id, h.PartyId, h.ValidFromInclusive, h.ValidUntilExclusive)).ToArray(); var revisions = x.Revisions.OrderBy(r => r.ResultingVersion).Select(r => JsonSerializer.Deserialize<UsageRightView>(r.StateJson, JsonOptions) is { } state ? new UsageRightRevisionView(r.Id, r.ResultingVersion, r.MutationType, r.Reason, r.OccurredAtUtc, r.ActorDisplayName, state.GraveSiteId, state.StartDate, state.EndDate, state.SourceReference, state.UsageRightStartRuleId, state.StartRuleCodeSnapshot, state.StartRuleDisplayNameSnapshot, state.HolderPeriods) : throw new InvalidOperationException("Ungültige Nutzungsrechtsrevision.")).ToArray(); return new(x.Id, x.GraveSiteId, x.StartDate, x.EndDate, x.SourceReference, x.UsageRightStartRuleId, x.StartRuleCodeSnapshot, x.StartRuleDisplayNameSnapshot, x.Version, holders, revisions); }
    private static UsageRightStartRuleView View(UsageRightStartRuleEntity x) => new(x.Id, x.CemeteryId, x.Code, x.DisplayName, x.Version, x.Revisions.OrderBy(r => r.ResultingVersion).Select(r => new UsageRightStartRuleRevisionView(r.Id, r.ResultingVersion, r.MutationType, r.Reason, r.OccurredAtUtc, r.ActorDisplayName, r.Code, r.DisplayName)).ToArray());
    private static string Display(PartyEntity x) => x.PartyType == nameof(PartyType.Organization) ? x.OrganizationName! : $"{x.FirstName} {x.LastName}";
    private static string Address(PartyAddressEntity x) => $"{x.Street} {x.HouseNumber}, {x.PostalCode} {x.City}";
    private static PersonUsageRightMutationResult Success(Guid id, long version) => new(PersonUsageRightMutationOutcome.Success, id, version);
    private static PersonUsageRightMutationResult Missing(Guid id) => new(PersonUsageRightMutationOutcome.NotFound, id);
    private static PersonUsageRightMutationResult Conflict(Guid id, long version) => new(PersonUsageRightMutationOutcome.VersionConflict, id, version);
    private static PersonUsageRightMutationResult Duplicate(Guid id) => new(PersonUsageRightMutationOutcome.Duplicate, id);
    private static PersonUsageRightMutationResult Invalid(Guid id) => new(PersonUsageRightMutationOutcome.InvalidReference, id);
}
