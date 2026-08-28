using Cemaris.Application.Cases;
using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Application.NoticeGeneration;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.NoticeDrafts;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.NoticeGeneration;
using Cemaris.Infrastructure.PersonUsageRights;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.NoticeGeneration;

public sealed class SyntheticNoticeGenerationState(SyntheticStoreCoordinator coordinator)
{
    private readonly List<NoticeGenerationAudit> audits = [];
    internal void Add(NoticeGenerationAudit audit) { lock (coordinator.Gate) audits.Add(audit); }
    public IReadOnlyList<NoticeGenerationAudit> Audits { get { lock (coordinator.Gate) return audits.ToArray(); } }
}

public sealed class SyntheticNoticeGenerationStore(
    SyntheticStoreCoordinator coordinator,
    SyntheticNoticeDraftStore drafts,
    SyntheticCaseReadStore cases,
    SyntheticPersonUsageRightStore parties,
    SyntheticCemeteryMasterDataStore masterData,
    SyntheticLegalBasisVersionStore legalBases,
    ILocalAccountStore accounts,
    TimeProvider timeProvider,
    SyntheticNoticeGenerationState state) : INoticeGenerationStore
{
    public Task<NoticeGenerationSourceResult> ReadSourceAsync(Guid noticeDraftId, long expectedVersion, Guid burialId,
        Guid legalBasisVersionId, Guid actorId, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            var draft = drafts.FindDraftAsync(noticeDraftId, token).GetAwaiter().GetResult();
            if (draft is null) return Task.FromResult(new NoticeGenerationSourceResult(NoticeGenerationSourceOutcome.NotFound));
            if (draft.Version != expectedVersion) return Task.FromResult(new NoticeGenerationSourceResult(NoticeGenerationSourceOutcome.VersionConflict, CaseId: draft.CaseId));
            if (draft.Status != NoticeDraftStatus.Draft) return Task.FromResult(new NoticeGenerationSourceResult(NoticeGenerationSourceOutcome.NoticeDraftNotActive, CaseId: draft.CaseId));
            var currentCase = cases.FindAsync(draft.CaseId, token).GetAwaiter().GetResult();
            var burial = currentCase?.Burials.SingleOrDefault(x => x.Id == burialId);
            var deceased = burial?.DeceasedPersonId is { } deceasedId ? currentCase?.DeceasedPersons.SingleOrDefault(x => x.Id == deceasedId) : null;
            if (burial?.BurialDate is null || burial.GraveSiteId is null || deceased is null)
                return Task.FromResult(new NoticeGenerationSourceResult(NoticeGenerationSourceOutcome.InvalidBurial, CaseId: draft.CaseId));
            var payer = parties.FindPartyAsync(draft.PayerPartyId, token).GetAwaiter().GetResult();
            var address = payer?.CurrentPrimaryAddressId is { } addressId
                ? payer.Addresses.SingleOrDefault(x => x.Id == addressId && x.IsCurrentPrimary
                    && x.ValidFromInclusive <= DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime)
                    && (!x.ValidUntilExclusive.HasValue || DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime) < x.ValidUntilExclusive)) : null;
            if (payer is null || address is null)
                return Task.FromResult(new NoticeGenerationSourceResult(NoticeGenerationSourceOutcome.InvalidPayerAddress, CaseId: draft.CaseId));
            var site = burial?.GraveSiteId is { } siteId
                ? masterData.ReadAsync(true, token).GetAwaiter().GetResult().GraveSites.SingleOrDefault(x => x.Id == siteId) : null;
            var basis = legalBases.FindAsync(legalBasisVersionId, token).GetAwaiter().GetResult();
            var actor = accounts.FindByIdAsync(actorId, token).GetAwaiter().GetResult();
            if (site is null)
                return Task.FromResult(new NoticeGenerationSourceResult(NoticeGenerationSourceOutcome.InvalidGraveMasterData, CaseId: draft.CaseId, LegalBasisInternalVersion: basis?.Version ?? 0));
            if (basis is null || !basis.IsActive)
                return Task.FromResult(new NoticeGenerationSourceResult(NoticeGenerationSourceOutcome.InactiveLegalBasis, CaseId: draft.CaseId, LegalBasisInternalVersion: basis?.Version ?? 0));
            if (!ActorComplete(actor)) return Task.FromResult(new NoticeGenerationSourceResult(NoticeGenerationSourceOutcome.ActorProfileIncomplete, CaseId: draft.CaseId, LegalBasisInternalVersion: basis.Version));
            var source = Build(draft.CaseId, draft.Id, draft.Version, draft.NoticeNumber, draft.NoticeDate,
                draft.FeeReasonOrSource, draft.TotalAmount, draft.DueDate, payer, address, burial, deceased, site, basis, actor);
            return Task.FromResult(new NoticeGenerationSourceResult(source is null ? NoticeGenerationSourceOutcome.RequiredValueMissing : NoticeGenerationSourceOutcome.Found, source, draft.CaseId, basis.Version));
        }
    }

    public Task SaveAuditAsync(NoticeGenerationAudit audit, CancellationToken token)
    {
        lock (coordinator.Gate) { token.ThrowIfCancellationRequested(); state.Add(audit); return Task.CompletedTask; }
    }

    internal static NoticeGenerationSource? Build(Guid caseId, Guid draftId, long version, string noticeNumber,
        DateOnly noticeDate, string feeReason, decimal amount, DateOnly dueDate, PartyView? payer,
        PartyAddressView? address, BurialDetails? burial, DeceasedDetails? deceased, GraveSiteView? site,
        LegalBasisVersionView? basis, LocalAccountSnapshot? actor)
    {
        if (payer is null || address is null || burial?.BurialDate is null || deceased is null || site is null
            || basis is null || !basis.IsActive || actor is null || !actor.IsActive) return null;
        var payerName = payer.PartyType == PartyType.NaturalPerson
            ? Join(payer.FirstName, payer.LastName) : Required(payer.OrganizationName);
        var deceasedName = Join(deceased.FirstName, deceased.LastName);
        var values = new[] { noticeNumber, feeReason, payerName, address.Street, address.HouseNumber,
            address.PostalCode, address.City, site.CemeteryName, site.GraveTypeName, site.GraveNumber,
            deceasedName, actor.FirstName, actor.LastName, actor.ContactPoint, actor.Room, actor.Phone,
            actor.Email, basis.Name };
        if (values.Any(string.IsNullOrWhiteSpace)) return null;
        return new(caseId, draftId, version, noticeNumber.Trim(), noticeDate, payerName,
            $"{address.Street.Trim()} {address.HouseNumber.Trim()}", address.PostalCode.Trim(), address.City.Trim(),
            site.CemeteryName.Trim(), site.GraveTypeName.Trim(), site.GraveNumber.Trim(), deceasedName,
            burial.BurialDate.Value, feeReason.Trim(), amount, dueDate, actor.FirstName!.Trim(), actor.LastName!.Trim(),
            actor.ContactPoint!.Trim(), actor.Room!.Trim(), actor.Phone!.Trim(), actor.Email!.Trim(), basis.Id,
            basis.Version, basis.Name.Trim(), basis.VersionDate);
    }

    private static string Join(string? first, string? last) => $"{first?.Trim()} {last?.Trim()}".Trim();
    private static string Required(string? value) => value?.Trim() ?? string.Empty;
    internal static bool ActorComplete(LocalAccountSnapshot? actor) => actor is { IsActive: true }
        && !string.IsNullOrWhiteSpace(actor.FirstName) && !string.IsNullOrWhiteSpace(actor.LastName)
        && !string.IsNullOrWhiteSpace(actor.ContactPoint) && !string.IsNullOrWhiteSpace(actor.Room)
        && !string.IsNullOrWhiteSpace(actor.Phone) && !string.IsNullOrWhiteSpace(actor.Email);
}

public sealed class EfNoticeGenerationStore(CemarisDbContext db, TimeProvider timeProvider) : INoticeGenerationStore
{
    public async Task<NoticeGenerationSourceResult> ReadSourceAsync(Guid noticeDraftId, long expectedVersion, Guid burialId,
        Guid legalBasisVersionId, Guid actorId, CancellationToken token)
    {
        var today = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);
        await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, token);
        var draftState = await db.NoticeDrafts.AsNoTracking().Where(x => x.Id == noticeDraftId)
            .Select(x => new { x.CaseId, x.PayerPartyId, x.Version, x.Status }).SingleOrDefaultAsync(token);
        if (draftState is null) { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.NotFound); }
        if (draftState.Version != expectedVersion) { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.VersionConflict, CaseId: draftState.CaseId); }
        if (draftState.Status != "Draft") { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.NoticeDraftNotActive, CaseId: draftState.CaseId); }
        var basisState = await db.LegalBasisVersions.AsNoTracking().Where(x => x.Id == legalBasisVersionId)
            .Select(x => new { x.IsActive, x.Version }).SingleOrDefaultAsync(token);
        if (basisState is null || !basisState.IsActive)
        { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.InactiveLegalBasis, CaseId: draftState.CaseId, LegalBasisInternalVersion: basisState?.Version ?? 0); }
        var actorState = await db.LocalAccounts.AsNoTracking().SingleOrDefaultAsync(x => x.Id == actorId, token);
        if (actorState is null || !actorState.IsActive || string.IsNullOrWhiteSpace(actorState.FirstName)
            || string.IsNullOrWhiteSpace(actorState.LastName) || string.IsNullOrWhiteSpace(actorState.ContactPoint)
            || string.IsNullOrWhiteSpace(actorState.Room) || string.IsNullOrWhiteSpace(actorState.Phone)
            || string.IsNullOrWhiteSpace(actorState.Email))
        { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.ActorProfileIncomplete, CaseId: draftState.CaseId, LegalBasisInternalVersion: basisState.Version); }
        var burialState = await db.Burials.AsNoTracking().Where(x => x.Id == burialId && x.CaseId == draftState.CaseId)
            .Select(x => new { x.BurialDate, x.DeceasedPersonId, x.GraveSiteId }).SingleOrDefaultAsync(token);
        if (burialState?.BurialDate is null || burialState.DeceasedPersonId is null || burialState.GraveSiteId is null
            || !await db.DeceasedPersons.AsNoTracking().AnyAsync(x => x.Id == burialState.DeceasedPersonId && x.CaseId == draftState.CaseId, token))
        { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.InvalidBurial, CaseId: draftState.CaseId, LegalBasisInternalVersion: basisState.Version); }
        var addressIsCurrent = await (from party in db.Parties.AsNoTracking()
                                      join address in db.PartyAddresses.AsNoTracking() on party.CurrentPrimaryAddressId equals address.Id
                                      where party.Id == draftState.PayerPartyId && address.PartyId == party.Id
                                          && address.ValidFromInclusive <= today && (address.ValidUntilExclusive == null || today < address.ValidUntilExclusive)
                                      select address.Id).AnyAsync(token);
        if (!addressIsCurrent)
        { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.InvalidPayerAddress, CaseId: draftState.CaseId, LegalBasisInternalVersion: basisState.Version); }
        var graveMasterDataExists = await (from site in db.GraveSites.AsNoTracking()
                                           join cemetery in db.Cemeteries.AsNoTracking() on site.CemeteryId equals cemetery.Id
                                           join graveType in db.GraveTypes.AsNoTracking() on site.GraveTypeId equals graveType.Id
                                           where site.Id == burialState.GraveSiteId && site.IsActive && cemetery.IsActive && graveType.IsActive
                                           select site.Id).AnyAsync(token);
        if (!graveMasterDataExists)
        { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.InvalidGraveMasterData, CaseId: draftState.CaseId, LegalBasisInternalVersion: basisState.Version); }
        var row = await (from draft in db.NoticeDrafts.AsNoTracking()
                         join burial in db.Burials.AsNoTracking() on draft.CaseId equals burial.CaseId
                         join deceased in db.DeceasedPersons.AsNoTracking() on burial.DeceasedPersonId equals deceased.Id
                         join party in db.Parties.AsNoTracking() on draft.PayerPartyId equals party.Id
                         join address in db.PartyAddresses.AsNoTracking() on party.CurrentPrimaryAddressId equals address.Id
                         join site in db.GraveSites.AsNoTracking() on burial.GraveSiteId equals site.Id
                         join cemetery in db.Cemeteries.AsNoTracking() on site.CemeteryId equals cemetery.Id
                         join graveType in db.GraveTypes.AsNoTracking() on site.GraveTypeId equals graveType.Id
                         join basis in db.LegalBasisVersions.AsNoTracking() on legalBasisVersionId equals basis.Id
                         join actor in db.LocalAccounts.AsNoTracking() on actorId equals actor.Id
                         where draft.Id == noticeDraftId && draft.Version == expectedVersion && draft.Status == "Draft"
                             && burial.Id == burialId && address.PartyId == party.Id && address.ValidFromInclusive <= today
                             && (address.ValidUntilExclusive == null || today < address.ValidUntilExclusive) && basis.IsActive && actor.IsActive
                         select new { draft, burial, deceased, party, address, site, cemetery, graveType, basis, actor })
            .SingleOrDefaultAsync(token);
        if (row is null || row.burial.BurialDate is null) { await transaction.CommitAsync(token); return new(NoticeGenerationSourceOutcome.RequiredValueMissing, CaseId: draftState.CaseId, LegalBasisInternalVersion: basisState.Version); }
        var payer = new PartyView(row.party.Id, Enum.Parse<PartyType>(row.party.PartyType), row.party.FirstName,
            row.party.LastName, row.party.OrganizationName, row.party.CurrentPrimaryAddressId, row.party.Version, [], []);
        var addressView = new PartyAddressView(row.address.Id, row.address.Street, row.address.HouseNumber,
            row.address.PostalCode, row.address.City, row.address.AdditionalInformation, row.address.ValidFromInclusive,
            row.address.ValidUntilExclusive, true);
        var burialView = new BurialDetails(row.burial.Id, row.burial.DeceasedPersonId, row.burial.BurialDate, row.burial.GraveSiteId);
        var deceasedView = new DeceasedDetails(row.deceased.Id, row.deceased.FirstName, row.deceased.LastName, row.deceased.BirthDate, row.deceased.DeathDate);
        var siteView = new GraveSiteView(row.site.Id, row.site.CemeteryId, row.site.AreaId, row.site.FieldId,
            row.site.RowId, row.site.GraveTypeId, row.site.GraveNumber, Enum.Parse<Domain.Cemeteries.GraveSiteStatus>(row.site.Status),
            row.site.IsBlocked, row.site.BlockNote, row.site.TargetCapacity, row.site.Note, row.site.IsActive,
            row.site.Version, row.cemetery.Name, null, null, null, row.graveType.Name);
        var basisView = new LegalBasisVersionView(row.basis.Id, row.basis.Name, row.basis.VersionDate, row.basis.IsActive,
            row.basis.Version, row.basis.CreatedAtUtc, row.basis.UpdatedAtUtc);
        var actorView = new LocalAccountSnapshot(row.actor.Id, row.actor.Username, row.actor.NormalizedUsername,
            row.actor.DisplayName, SystemRole.Parse(row.actor.Role), row.actor.PasswordHash, row.actor.IsActive,
            row.actor.FailedLoginAttempts, row.actor.LockoutEndUtc, row.actor.MustChangePassword, row.actor.SecurityStamp,
            row.actor.CreatedAtUtc, row.actor.UpdatedAtUtc, row.actor.PasswordChangedAtUtc, row.actor.LastLoginAtUtc,
            row.actor.Version, row.actor.FirstName, row.actor.LastName, row.actor.ContactPoint, row.actor.Room,
            row.actor.Phone, row.actor.Email);
        var source = SyntheticNoticeGenerationStore.Build(row.draft.CaseId, row.draft.Id, row.draft.Version,
            row.draft.NoticeNumber, row.draft.NoticeDate, row.draft.FeeReasonOrSource, row.draft.TotalAmount,
            row.draft.DueDate, payer, addressView, burialView, deceasedView, siteView, basisView, actorView);
        await transaction.CommitAsync(token);
        return new(source is null ? NoticeGenerationSourceOutcome.RequiredValueMissing : NoticeGenerationSourceOutcome.Found,
            source, draftState.CaseId, basisState.Version);
    }

    public async Task SaveAuditAsync(NoticeGenerationAudit audit, CancellationToken token)
    {
        db.NoticeGenerationAudits.Add(new NoticeGenerationAuditEntity
        {
            Id = audit.Id,
            CaseId = audit.CaseId,
            NoticeDraftId = audit.NoticeDraftId,
            ExpectedNoticeDraftVersion = audit.ExpectedNoticeDraftVersion,
            ActorId = audit.ActorId,
            OccurredAtUtc = audit.OccurredAtUtc,
            Format = audit.Format.ToString().ToLowerInvariant(),
            LegalBasisVersionId = audit.LegalBasisVersionId,
            LegalBasisInternalVersion = audit.LegalBasisInternalVersion,
            Succeeded = audit.Succeeded,
            ErrorCode = audit.ErrorCode
        });
        await db.SaveChangesAsync(token);
    }
}
