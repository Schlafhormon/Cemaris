using System.Data;
using Cemaris.Application.Cases;
using Cemaris.Domain.Cases;
using Cemaris.Domain.Cemeteries;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Cemeteries;
using Cemaris.Infrastructure.Persistence.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.ReadModel;

/// <summary>
/// Persists one burial-process mutation, its grave-site promotion, case version and
/// change record in one serializable SQL transaction.
/// </summary>
public sealed class EfBurialProcessStore(CemarisDbContext dbContext) : IBurialProcessStore
{
    public async Task<BurialProcessMutationResult> AddDeceasedPersonAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        bool confirmPossibleDuplicate,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ValidateChange(caseId, expectedVersion.Next(), CaseChangeOperation.DeceasedPersonAdded, deceasedPerson.Id, change);
        await using var transaction = await BeginAsync(cancellationToken);
        var people = await dbContext.DeceasedPersons.AsNoTracking()
            .Where(item => item.CaseId == caseId)
            .Select(item => new DeceasedDetails(item.Id, item.FirstName, item.LastName, item.BirthDate, item.DeathDate))
            .ToArrayAsync(cancellationToken);
        var candidate = new DeceasedDetails(deceasedPerson.Id, deceasedPerson.FirstName, deceasedPerson.LastName, deceasedPerson.BirthDate, deceasedPerson.DeathDate);
        var duplicates = PossibleDuplicateMatcher.Find(people, candidate);
        if (duplicates.Count > 0 && !confirmPossibleDuplicate)
        {
            return BurialProcessMutationResult.Duplicate(duplicates);
        }

        var root = await AdvanceCaseAsync(caseId, expectedVersion, change, cancellationToken);
        if (root is not null)
        {
            return root;
        }

        dbContext.DeceasedPersons.Add(new DeceasedReadEntity
        {
            Id = deceasedPerson.Id,
            CaseId = caseId,
            FirstName = deceasedPerson.FirstName,
            LastName = deceasedPerson.LastName,
            BirthDate = deceasedPerson.BirthDate,
            DeathDate = deceasedPerson.DeathDate,
        });
        return await CommitAsync(expectedVersion.Next(), change, transaction, cancellationToken);
    }

    public async Task<BurialProcessMutationResult> ChangeDeceasedPersonAsync(
        Guid caseId,
        Guid personId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ValidateChange(caseId, expectedVersion.Next(), CaseChangeOperation.DeceasedPersonChanged, personId, change);
        await using var transaction = await BeginAsync(cancellationToken);
        var person = await dbContext.DeceasedPersons.SingleOrDefaultAsync(
            item => item.CaseId == caseId && item.Id == personId, cancellationToken);
        if (person is null)
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.ChildNotFound);
        }

        var burials = await dbContext.Burials.AsNoTracking()
            .Where(item => item.CaseId == caseId && item.DeceasedPersonId == personId && item.ProcessStatus != null)
            .ToArrayAsync(cancellationToken);
        foreach (var burial in burials)
        {
            BurialProcessRules.Validate(ToRecord(burial), deceasedPerson.BirthDate, deceasedPerson.DeathDate, today);
        }

        var root = await AdvanceCaseAsync(caseId, expectedVersion, change, cancellationToken);
        if (root is not null)
        {
            return root;
        }

        person.FirstName = deceasedPerson.FirstName;
        person.LastName = deceasedPerson.LastName;
        person.BirthDate = deceasedPerson.BirthDate;
        person.DeathDate = deceasedPerson.DeathDate;
        return await CommitAsync(expectedVersion.Next(), change, transaction, cancellationToken);
    }

    public async Task<BurialProcessMutationResult> CreateBurialAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        BurialProcessRecord burial,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ValidateChange(caseId, expectedVersion.Next(), CaseChangeOperation.BurialDraftCreated, burial.Id, change);
        await using var transaction = await BeginAsync(cancellationToken);
        var person = await GetPersonAsync(caseId, burial.DeceasedPersonId, cancellationToken);
        if (person is null)
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidDeceasedPersonReference);
        }

        if (await HasOtherBurialAsync(caseId, burial.DeceasedPersonId, burial.Id, cancellationToken))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.DeceasedPersonAlreadyHasBurial);
        }

        BurialProcessRules.Validate(burial, person.BirthDate, person.DeathDate, today);
        if (!await CanUseGraveSiteAsync(burial.GraveSiteId, true, cancellationToken))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidGraveSiteReference);
        }

        var root = await AdvanceCaseAsync(caseId, expectedVersion, change, cancellationToken);
        if (root is not null)
        {
            return root;
        }

        dbContext.Burials.Add(Map(caseId, burial));
        return await CommitAsync(expectedVersion.Next(), change, transaction, cancellationToken);
    }

    public async Task<BurialProcessMutationResult> ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        ChangeBurialProcessCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ValidateChange(caseId, expectedVersion.Next(), CaseChangeOperation.BurialFactsChanged, burialId, change);
        await using var transaction = await BeginAsync(cancellationToken);
        var burial = await dbContext.Burials.SingleOrDefaultAsync(item => item.CaseId == caseId && item.Id == burialId, cancellationToken);
        if (burial is null)
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.ChildNotFound);
        }

        if (!TryStatus(burial, out var status) || status is not (BurialProcessStatus.Draft or BurialProcessStatus.Planned or BurialProcessStatus.Performed))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidProcessState);
        }

        if ((status is BurialProcessStatus.Draft or BurialProcessStatus.Planned && command.ActualBurialDate != burial.BurialDate)
            || (status == BurialProcessStatus.Performed && command.PlanningDate != burial.PlanningDate))
        {
            throw new BurialProcessValidationException(status == BurialProcessStatus.Performed ? "planningDate" : "actualBurialDate", "Dieses Datum ist im aktuellen Prozesszustand nicht bearbeitbar.");
        }

        var person = await GetPersonAsync(caseId, command.DeceasedPersonId, cancellationToken);
        if (person is null)
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidDeceasedPersonReference);
        }

        if (await HasOtherBurialAsync(caseId, command.DeceasedPersonId, burialId, cancellationToken))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.DeceasedPersonAlreadyHasBurial);
        }

        var proposed = BurialProcessRecord.Create(burialId, command.DeceasedPersonId, command.GraveSiteId, status, command.PlanningDate, command.ActualBurialDate);
        BurialProcessRules.Validate(proposed, person.BirthDate, person.DeathDate, today);
        var changedSite = burial.GraveSiteId != command.GraveSiteId;
        if (!await CanUseGraveSiteAsync(command.GraveSiteId, changedSite, cancellationToken))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidGraveSiteReference);
        }

        var root = await AdvanceCaseAsync(caseId, expectedVersion, change, cancellationToken);
        if (root is not null)
        {
            return root;
        }

        Apply(burial, proposed);
        if (changedSite && status == BurialProcessStatus.Performed)
        {
            await PromoteAsync(command.GraveSiteId, GraveSiteStatus.Occupied, cancellationToken);
        }

        return await CommitAsync(expectedVersion.Next(), change, transaction, cancellationToken);
    }

    public async Task<BurialProcessMutationResult> TransitionBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        TransitionBurialCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        await using var transaction = await BeginAsync(cancellationToken);
        var burial = await dbContext.Burials.SingleOrDefaultAsync(item => item.CaseId == caseId && item.Id == burialId, cancellationToken);
        if (burial is null)
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.ChildNotFound);
        }

        if (!TryStatus(burial, out var current) || !BurialProcessRules.IsTransitionAllowed(current, command.TargetStatus))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidProcessState);
        }

        ValidateChange(caseId, expectedVersion.Next(), TransitionOperation(current, command.TargetStatus), burialId, change);
        if ((current != BurialProcessStatus.Draft && command.PlanningDate.HasValue && command.PlanningDate != burial.PlanningDate)
            || (current != BurialProcessStatus.Confirmed && command.ActualBurialDate.HasValue && command.ActualBurialDate != burial.BurialDate))
        {
            throw new BurialProcessValidationException("status", "Datumsangaben dürfen nur beim jeweils vorgesehenen Vorwärtsschritt ergänzt werden.");
        }

        var proposed = BurialProcessRecord.Create(
            burialId,
            burial.DeceasedPersonId!.Value,
            burial.GraveSiteId!.Value,
            command.TargetStatus,
            current == BurialProcessStatus.Draft ? command.PlanningDate ?? burial.PlanningDate : burial.PlanningDate,
            current == BurialProcessStatus.Confirmed ? command.ActualBurialDate ?? burial.BurialDate : burial.BurialDate);
        var person = await GetPersonAsync(caseId, proposed.DeceasedPersonId, cancellationToken)
            ?? throw new InvalidOperationException("Die Prozessbeisetzung verweist auf keine Person ihrer Fallakte.");
        BurialProcessRules.Validate(proposed, person.BirthDate, person.DeathDate, today);
        var requireSelectable = command.TargetStatus == BurialProcessStatus.Confirmed;
        if (!await CanUseGraveSiteAsync(proposed.GraveSiteId, requireSelectable, cancellationToken, allowReserved: requireSelectable))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidGraveSiteReference);
        }

        var root = await AdvanceCaseAsync(caseId, expectedVersion, change, cancellationToken);
        if (root is not null)
        {
            return root;
        }

        Apply(burial, proposed);
        if (command.TargetStatus == BurialProcessStatus.Confirmed)
        {
            await PromoteAsync(proposed.GraveSiteId, GraveSiteStatus.Reserved, cancellationToken);
        }
        else if (command.TargetStatus == BurialProcessStatus.Performed && current == BurialProcessStatus.Confirmed)
        {
            await PromoteAsync(proposed.GraveSiteId, GraveSiteStatus.Occupied, cancellationToken);
        }

        return await CommitAsync(expectedVersion.Next(), change, transaction, cancellationToken);
    }

    public async Task<BurialProcessMutationResult> AdoptLegacyBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        AdoptLegacyBurialCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ValidateChange(caseId, expectedVersion.Next(), CaseChangeOperation.LegacyBurialAdopted, burialId, change);
        await using var transaction = await BeginAsync(cancellationToken);
        var burial = await dbContext.Burials.SingleOrDefaultAsync(item => item.CaseId == caseId && item.Id == burialId, cancellationToken);
        if (burial is null)
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.ChildNotFound);
        }

        if (burial.ProcessStatus is not null)
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidProcessState);
        }

        var person = await GetPersonAsync(caseId, command.DeceasedPersonId, cancellationToken);
        if (person is null)
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidDeceasedPersonReference);
        }

        if (await HasOtherBurialAsync(caseId, command.DeceasedPersonId, burialId, cancellationToken))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.DeceasedPersonAlreadyHasBurial);
        }

        var proposed = BurialProcessRecord.Create(burialId, command.DeceasedPersonId, command.GraveSiteId, command.TargetStatus, command.PlanningDate, command.ActualBurialDate ?? burial.BurialDate);
        BurialProcessRules.Validate(proposed, person.BirthDate, person.DeathDate, today);
        if (!await CanUseGraveSiteAsync(command.GraveSiteId, true, cancellationToken))
        {
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.InvalidGraveSiteReference);
        }

        var root = await AdvanceCaseAsync(caseId, expectedVersion, change, cancellationToken);
        if (root is not null)
        {
            return root;
        }

        Apply(burial, proposed);
        if (proposed.Status == BurialProcessStatus.Confirmed)
        {
            await PromoteAsync(proposed.GraveSiteId, GraveSiteStatus.Reserved, cancellationToken);
        }
        else if (proposed.Status is BurialProcessStatus.Performed or BurialProcessStatus.Completed)
        {
            await PromoteAsync(proposed.GraveSiteId, GraveSiteStatus.Occupied, cancellationToken);
        }

        return await CommitAsync(expectedVersion.Next(), change, transaction, cancellationToken);
    }

    private Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginAsync(CancellationToken cancellationToken) =>
        dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

    private async Task<BurialProcessMutationResult?> AdvanceCaseAsync(Guid caseId, CaseVersion expectedVersion, CaseChange change, CancellationToken cancellationToken)
    {
        var next = expectedVersion.Next();
        var affected = await dbContext.Cases
            .Where(item => item.Id == caseId && item.IsSynthetic && item.Version == expectedVersion.Value)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Version, next.Value)
                .SetProperty(item => item.LastChangedAtUtc, change.OccurredAtUtc)
                .SetProperty(item => item.LastChangedByActorId, change.Actor.Id)
                .SetProperty(item => item.LastChangedByActorName, change.Actor.DisplayName), cancellationToken);
        if (affected == 1)
        {
            return null;
        }

        var exists = await dbContext.Cases.AsNoTracking().AnyAsync(item => item.Id == caseId && item.IsSynthetic, cancellationToken);
        return BurialProcessMutationResult.Failed(exists ? BurialProcessMutationOutcome.VersionConflict : BurialProcessMutationOutcome.CaseNotFound);
    }

    private async Task<BurialProcessMutationResult> CommitAsync(CaseVersion version, CaseChange change, Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction, CancellationToken cancellationToken)
    {
        dbContext.CaseChanges.Add(MapChange(change));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return BurialProcessMutationResult.Succeeded(version);
    }

    private Task<DeceasedReadEntity?> GetPersonAsync(Guid caseId, Guid personId, CancellationToken cancellationToken) =>
        dbContext.DeceasedPersons.AsNoTracking().SingleOrDefaultAsync(item => item.CaseId == caseId && item.Id == personId, cancellationToken);

    private Task<bool> HasOtherBurialAsync(Guid caseId, Guid personId, Guid burialId, CancellationToken cancellationToken) =>
        dbContext.Burials.AsNoTracking().AnyAsync(item => item.CaseId == caseId && item.Id != burialId && item.DeceasedPersonId == personId && item.ProcessStatus != null, cancellationToken);

    private async Task<bool> CanUseGraveSiteAsync(Guid graveSiteId, bool requireSelectable, CancellationToken cancellationToken, bool allowReserved = false)
    {
        var site = await dbContext.GraveSites.AsNoTracking().SingleOrDefaultAsync(item => item.Id == graveSiteId, cancellationToken);
        if (site is null || requireSelectable && (!site.IsActive || site.IsBlocked
            || site.Status != GraveSiteStatus.Available.ToString()
                && (!allowReserved || site.Status != GraveSiteStatus.Reserved.ToString())))
        {
            return false;
        }

        if (!requireSelectable)
        {
            return true;
        }

        if (!await dbContext.Cemeteries.AnyAsync(item => item.Id == site.CemeteryId && item.IsActive, cancellationToken)
            || !await dbContext.GraveTypes.AnyAsync(item => item.Id == site.GraveTypeId && item.IsActive, cancellationToken)
            || !await dbContext.CemeteryGraveTypes.AnyAsync(item => item.CemeteryId == site.CemeteryId && item.GraveTypeId == site.GraveTypeId && item.IsActive, cancellationToken))
        {
            return false;
        }

        if (site.AreaId.HasValue && !await dbContext.CemeteryAreas.AnyAsync(item => item.Id == site.AreaId && item.ParentId == site.CemeteryId && item.IsActive, cancellationToken))
        {
            return false;
        }

        if (site.FieldId.HasValue && (!site.AreaId.HasValue || !await dbContext.CemeteryFields.AnyAsync(item => item.Id == site.FieldId && item.ParentId == site.AreaId && item.IsActive, cancellationToken)))
        {
            return false;
        }

        return !site.RowId.HasValue || site.FieldId.HasValue && await dbContext.CemeteryRows.AnyAsync(item => item.Id == site.RowId && item.ParentId == site.FieldId && item.IsActive, cancellationToken);
    }

    private async Task PromoteAsync(Guid graveSiteId, GraveSiteStatus minimumStatus, CancellationToken cancellationToken)
    {
        var site = await dbContext.GraveSites.SingleAsync(item => item.Id == graveSiteId, cancellationToken);
        var current = Enum.Parse<GraveSiteStatus>(site.Status);
        if (current < minimumStatus)
        {
            site.Status = minimumStatus.ToString();
            site.Version++;
        }
    }

    private static bool TryStatus(BurialReadEntity burial, out BurialProcessStatus status) =>
        Enum.TryParse(burial.ProcessStatus, out status) && Enum.IsDefined(status);

    private static BurialProcessRecord ToRecord(BurialReadEntity burial) =>
        BurialProcessRecord.Create(burial.Id, burial.DeceasedPersonId!.Value, burial.GraveSiteId!.Value, Enum.Parse<BurialProcessStatus>(burial.ProcessStatus!), burial.PlanningDate, burial.BurialDate);

    private static BurialReadEntity Map(Guid caseId, BurialProcessRecord burial) => new()
    {
        Id = burial.Id,
        CaseId = caseId,
        DeceasedPersonId = burial.DeceasedPersonId,
        GraveSiteId = burial.GraveSiteId,
        ProcessStatus = burial.Status.ToString(),
        PlanningDate = burial.PlanningDate,
        BurialDate = burial.ActualBurialDate,
    };

    private static void Apply(BurialReadEntity entity, BurialProcessRecord burial)
    {
        entity.DeceasedPersonId = burial.DeceasedPersonId;
        entity.GraveSiteId = burial.GraveSiteId;
        entity.ProcessStatus = burial.Status.ToString();
        entity.PlanningDate = burial.PlanningDate;
        entity.BurialDate = burial.ActualBurialDate;
    }

    private static CaseChangeEntity MapChange(CaseChange change) => new()
    {
        Id = change.Id,
        CaseId = change.CaseId,
        ResultingVersion = change.ResultingVersion.Value,
        OccurredAtUtc = change.OccurredAtUtc,
        ActorId = change.Actor.Id,
        ActorDisplayName = change.Actor.DisplayName,
        Operation = change.Operation.ToString(),
        TargetEntityId = change.TargetEntityId,
    };

    private static void ValidateChange(Guid caseId, CaseVersion version, CaseChangeOperation operation, Guid? targetId, CaseChange change)
    {
        ArgumentNullException.ThrowIfNull(change);
        if (change.CaseId != caseId || change.ResultingVersion != version || change.Operation != operation || change.TargetEntityId != targetId)
        {
            throw new InvalidOperationException("Der Änderungsnachweis passt nicht zur auszuführenden Fallaktenmutation.");
        }
    }

    private static CaseChangeOperation TransitionOperation(BurialProcessStatus current, BurialProcessStatus target) => (current, target) switch
    {
        (BurialProcessStatus.Draft, BurialProcessStatus.Planned) => CaseChangeOperation.BurialPlanned,
        (BurialProcessStatus.Planned, BurialProcessStatus.Draft) => CaseChangeOperation.BurialPlanningWithdrawn,
        (BurialProcessStatus.Planned, BurialProcessStatus.Confirmed) => CaseChangeOperation.BurialConfirmed,
        (BurialProcessStatus.Confirmed, BurialProcessStatus.Planned) => CaseChangeOperation.BurialConfirmationWithdrawn,
        (BurialProcessStatus.Confirmed, BurialProcessStatus.Performed) => CaseChangeOperation.BurialPerformed,
        (BurialProcessStatus.Performed, BurialProcessStatus.Completed) => CaseChangeOperation.BurialCompleted,
        (BurialProcessStatus.Completed, BurialProcessStatus.Performed) => CaseChangeOperation.BurialReopened,
        _ => throw new InvalidOperationException("Unbekannter Beisetzungsprozessübergang."),
    };
}
