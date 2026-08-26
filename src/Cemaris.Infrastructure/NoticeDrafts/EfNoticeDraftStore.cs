using System.Data;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Domain.Parties;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.NoticeDrafts;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.NoticeDrafts;

public sealed class EfNoticeDraftStore(CemarisDbContext db) : INoticeDraftStore
{
    public async Task<IReadOnlyList<NoticeDraftListItem>?> ReadForCaseAsync(
        Guid caseId,
        CancellationToken token)
    {
        if (!await db.Cases.AsNoTracking().AnyAsync(x => x.Id == caseId, token))
            return null;
        return (await db.NoticeDrafts
            .AsNoTracking()
            .Where(x => x.CaseId == caseId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ThenBy(x => x.Id)
            .ToArrayAsync(token))
            .Select(ListItem)
            .ToArray();
    }

    public async Task<NoticeDraftView?> FindDraftAsync(Guid id, CancellationToken token) =>
        await db.NoticeDrafts.AsNoTracking().Include(x => x.Revisions)
            .SingleOrDefaultAsync(x => x.Id == id, token) is { } entity
                ? View(entity)
                : null;

    public async Task<NoticeNumberConfigurationView?> FindConfigurationAsync(CancellationToken token) =>
        await db.NoticeNumberConfigurations.AsNoTracking().Include(x => x.Revisions)
            .SingleOrDefaultAsync(token) is { } entity
                ? View(entity)
                : null;

    public Task<NoticeDraftMutationResult> CreateDraftAsync(
        Guid id,
        Guid caseId,
        CreateNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => InTransactionAsync(async () =>
    {
        var configuration = await db.NoticeNumberConfigurations.AsNoTracking().SingleOrDefaultAsync(token);
        if (configuration is null)
            return Result(NoticeDraftMutationOutcome.ConfigurationMissing, id);
        if (!await db.Cases.AsNoTracking().AnyAsync(x => x.Id == caseId, token))
            return Result(NoticeDraftMutationOutcome.InvalidReference, id);
        var payer = await db.Parties.AsNoTracking().SingleOrDefaultAsync(x => x.Id == command.PayerPartyId, token);
        if (payer is null)
            return Result(NoticeDraftMutationOutcome.InvalidReference, id);

        var year = mutation.OccurredAtUtc.UtcDateTime.Year;
        var sequence = await db.NoticeNumberSequences
            .FromSqlInterpolated($"SELECT * FROM [NoticeNumberSequences] WITH (UPDLOCK, HOLDLOCK) WHERE [Year] = {year}")
            .SingleOrDefaultAsync(token);
        sequence ??= new NoticeNumberSequenceEntity { Year = year, LastIssuedNumber = 0 };
        if (sequence.LastIssuedNumber >= NoticeDraftRules.MaximumRunningNumber(configuration.RunningNumberWidth))
            return Result(NoticeDraftMutationOutcome.SequenceExhausted, id);
        if (db.Entry(sequence).State == EntityState.Detached)
            db.NoticeNumberSequences.Add(sequence);
        sequence.LastIssuedNumber++;

        var entity = new NoticeDraftEntity
        {
            Id = id,
            CaseId = caseId,
            PayerPartyId = payer.Id,
            PayerDisplayNameSnapshot = Display(payer),
            NoticeNumber = NoticeDraftRules.FormatNoticeNumber(
                configuration.FinancialProduct,
                year,
                sequence.LastIssuedNumber,
                configuration.RunningNumberWidth),
            AssignmentYear = year,
            RunningNumber = sequence.LastIssuedNumber,
            NoticeNumberConfigurationId = configuration.Id,
            NoticeNumberConfigurationVersion = configuration.Version,
            FinancialProductSnapshot = configuration.FinancialProduct,
            RunningNumberWidthSnapshot = configuration.RunningNumberWidth,
            TotalAmount = command.TotalAmount,
            Currency = NoticeDraftRules.Currency,
            NoticeDate = command.NoticeDate,
            DueDate = command.DueDate,
            AccountAssignment = command.AccountAssignment!,
            FeeReasonOrSource = command.FeeReasonOrSource!,
            Status = nameof(NoticeDraftStatus.Draft),
            Version = 1,
            CreatedAtUtc = mutation.OccurredAtUtc,
            UpdatedAtUtc = mutation.OccurredAtUtc,
        };
        db.NoticeDrafts.Add(entity);
        AddRevision(entity, mutation);
        AddDraftAudit(entity, mutation);
        await db.SaveChangesAsync(token);
        return Result(NoticeDraftMutationOutcome.Success, id, 1);
    }, id, NoticeDraftMutationOutcome.InvalidReference, token);

    public Task<NoticeDraftMutationResult> CorrectDraftAsync(
        Guid id,
        long expectedVersion,
        CorrectNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => InTransactionAsync(async () =>
    {
        var entity = await db.NoticeDrafts.Include(x => x.Revisions)
            .SingleOrDefaultAsync(x => x.Id == id, token);
        if (entity is null) return Result(NoticeDraftMutationOutcome.NotFound, id);
        if (entity.Version != expectedVersion)
            return Result(NoticeDraftMutationOutcome.VersionConflict, id, entity.Version);
        if (entity.Status == nameof(NoticeDraftStatus.Discarded))
            return Result(NoticeDraftMutationOutcome.Discarded, id, entity.Version);
        if (entity.PayerPartyId != command.PayerPartyId && !command.PayerSelectionConfirmed)
            return Result(NoticeDraftMutationOutcome.PayerConfirmationRequired, id, entity.Version);
        var payer = await db.Parties.AsNoTracking().SingleOrDefaultAsync(x => x.Id == command.PayerPartyId, token);
        if (payer is null) return Result(NoticeDraftMutationOutcome.InvalidReference, id, entity.Version);

        entity.PayerPartyId = payer.Id;
        entity.PayerDisplayNameSnapshot = Display(payer);
        entity.TotalAmount = command.TotalAmount;
        entity.NoticeDate = command.NoticeDate;
        entity.DueDate = command.DueDate;
        entity.AccountAssignment = command.AccountAssignment!;
        entity.FeeReasonOrSource = command.FeeReasonOrSource!;
        entity.Version++;
        entity.UpdatedAtUtc = mutation.OccurredAtUtc;
        AddRevision(entity, mutation);
        AddDraftAudit(entity, mutation);
        await db.SaveChangesAsync(token);
        return Result(NoticeDraftMutationOutcome.Success, id, entity.Version);
    }, id, NoticeDraftMutationOutcome.InvalidReference, token);

    public Task<NoticeDraftMutationResult> DiscardDraftAsync(
        Guid id,
        long expectedVersion,
        DiscardNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => InTransactionAsync(async () =>
    {
        var entity = await db.NoticeDrafts.Include(x => x.Revisions)
            .SingleOrDefaultAsync(x => x.Id == id, token);
        if (entity is null) return Result(NoticeDraftMutationOutcome.NotFound, id);
        if (entity.Version != expectedVersion)
            return Result(NoticeDraftMutationOutcome.VersionConflict, id, entity.Version);
        if (entity.Status == nameof(NoticeDraftStatus.Discarded))
            return Result(NoticeDraftMutationOutcome.Discarded, id, entity.Version);
        entity.Status = nameof(NoticeDraftStatus.Discarded);
        entity.Version++;
        entity.UpdatedAtUtc = mutation.OccurredAtUtc;
        AddRevision(entity, mutation);
        AddDraftAudit(entity, mutation);
        await db.SaveChangesAsync(token);
        return Result(NoticeDraftMutationOutcome.Success, id, entity.Version);
    }, id, NoticeDraftMutationOutcome.InvalidReference, token);

    public Task<NoticeDraftMutationResult> CreateConfigurationAsync(
        Guid id,
        SaveNoticeNumberConfigurationCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => InTransactionAsync(async () =>
    {
        if (await db.NoticeNumberConfigurations.AnyAsync(token))
            return Result(NoticeDraftMutationOutcome.ConfigurationAlreadyExists, id);
        var entity = new NoticeNumberConfigurationEntity
        {
            Id = id,
            SingletonKey = 1,
            FinancialProduct = command.FinancialProduct!,
            RunningNumberWidth = command.RunningNumberWidth,
            Version = 1,
            CreatedAtUtc = mutation.OccurredAtUtc,
            UpdatedAtUtc = mutation.OccurredAtUtc,
        };
        db.NoticeNumberConfigurations.Add(entity);
        AddConfigurationRevision(entity, mutation);
        AddConfigurationAudit(entity, mutation);
        await db.SaveChangesAsync(token);
        return Result(NoticeDraftMutationOutcome.Success, id, 1);
    }, id, NoticeDraftMutationOutcome.ConfigurationAlreadyExists, token);

    public Task<NoticeDraftMutationResult> ChangeConfigurationAsync(
        Guid id,
        long expectedVersion,
        SaveNoticeNumberConfigurationCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => InTransactionAsync(async () =>
    {
        var entity = await db.NoticeNumberConfigurations.Include(x => x.Revisions)
            .SingleOrDefaultAsync(x => x.Id == id, token);
        if (entity is null) return Result(NoticeDraftMutationOutcome.NotFound, id);
        if (entity.Version != expectedVersion)
            return Result(NoticeDraftMutationOutcome.VersionConflict, id, entity.Version);
        entity.FinancialProduct = command.FinancialProduct!;
        entity.RunningNumberWidth = command.RunningNumberWidth;
        entity.Version++;
        entity.UpdatedAtUtc = mutation.OccurredAtUtc;
        AddConfigurationRevision(entity, mutation);
        AddConfigurationAudit(entity, mutation);
        await db.SaveChangesAsync(token);
        return Result(NoticeDraftMutationOutcome.Success, id, entity.Version);
    }, id, NoticeDraftMutationOutcome.ConfigurationAlreadyExists, token);

    private async Task<NoticeDraftMutationResult> InTransactionAsync(
        Func<Task<NoticeDraftMutationResult>> action,
        Guid id,
        NoticeDraftMutationOutcome updateFailure,
        CancellationToken token)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, token);
        try
        {
            var result = await action();
            if (result.Outcome == NoticeDraftMutationOutcome.Success)
                await transaction.CommitAsync(token);
            else
                await transaction.RollbackAsync(token);
            db.ChangeTracker.Clear();
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(token);
            db.ChangeTracker.Clear();
            return Result(NoticeDraftMutationOutcome.VersionConflict, id);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(token);
            db.ChangeTracker.Clear();
            return Result(updateFailure, id);
        }
    }

    private void AddRevision(NoticeDraftEntity entity, NoticeDraftMutation mutation) =>
        db.NoticeDraftRevisions.Add(new NoticeDraftRevisionEntity
        {
            Id = Guid.NewGuid(),
            NoticeDraftId = entity.Id,
            ResultingVersion = mutation.ResultingVersion,
            MutationType = mutation.Operation,
            Reason = mutation.Reason,
            OccurredAtUtc = mutation.OccurredAtUtc,
            ActorId = mutation.Actor.Id,
            ActorDisplayName = mutation.Actor.DisplayName,
            CaseId = entity.CaseId,
            PayerPartyId = entity.PayerPartyId,
            PayerDisplayNameSnapshot = entity.PayerDisplayNameSnapshot,
            NoticeNumber = entity.NoticeNumber,
            AssignmentYear = entity.AssignmentYear,
            RunningNumber = entity.RunningNumber,
            NoticeNumberConfigurationId = entity.NoticeNumberConfigurationId,
            NoticeNumberConfigurationVersion = entity.NoticeNumberConfigurationVersion,
            FinancialProductSnapshot = entity.FinancialProductSnapshot,
            RunningNumberWidthSnapshot = entity.RunningNumberWidthSnapshot,
            TotalAmount = entity.TotalAmount,
            Currency = entity.Currency,
            NoticeDate = entity.NoticeDate,
            DueDate = entity.DueDate,
            AccountAssignment = entity.AccountAssignment,
            FeeReasonOrSource = entity.FeeReasonOrSource,
            Status = entity.Status,
            CreatedAtUtc = entity.CreatedAtUtc,
            UpdatedAtUtc = entity.UpdatedAtUtc,
        });

    private void AddDraftAudit(NoticeDraftEntity entity, NoticeDraftMutation mutation) =>
        db.NoticeDraftAudits.Add(new NoticeDraftAuditEntity
        {
            Id = mutation.AuditId,
            NoticeDraftId = entity.Id,
            CaseId = entity.CaseId,
            ResultingVersion = mutation.ResultingVersion,
            Operation = mutation.Operation,
            OccurredAtUtc = mutation.OccurredAtUtc,
            ActorId = mutation.Actor.Id,
            ActorDisplayName = mutation.Actor.DisplayName,
        });

    private void AddConfigurationRevision(
        NoticeNumberConfigurationEntity entity,
        NoticeDraftMutation mutation) => db.NoticeNumberConfigurationRevisions.Add(
            new NoticeNumberConfigurationRevisionEntity
            {
                Id = Guid.NewGuid(),
                NoticeNumberConfigurationId = entity.Id,
                ResultingVersion = mutation.ResultingVersion,
                MutationType = mutation.Operation,
                Reason = mutation.Reason,
                OccurredAtUtc = mutation.OccurredAtUtc,
                ActorId = mutation.Actor.Id,
                ActorDisplayName = mutation.Actor.DisplayName,
                FinancialProduct = entity.FinancialProduct,
                RunningNumberWidth = entity.RunningNumberWidth,
            });

    private void AddConfigurationAudit(
        NoticeNumberConfigurationEntity entity,
        NoticeDraftMutation mutation) => db.NoticeNumberConfigurationAudits.Add(
            new NoticeNumberConfigurationAuditEntity
            {
                Id = mutation.AuditId,
                NoticeNumberConfigurationId = entity.Id,
                ResultingVersion = mutation.ResultingVersion,
                Operation = mutation.Operation,
                OccurredAtUtc = mutation.OccurredAtUtc,
                ActorId = mutation.Actor.Id,
                ActorDisplayName = mutation.Actor.DisplayName,
            });

    private static NoticeDraftView View(NoticeDraftEntity entity) => new(
        entity.Id, entity.CaseId, entity.PayerPartyId, entity.PayerDisplayNameSnapshot,
        entity.NoticeNumber, entity.AssignmentYear, entity.RunningNumber,
        entity.NoticeNumberConfigurationId, entity.NoticeNumberConfigurationVersion,
        entity.FinancialProductSnapshot, entity.RunningNumberWidthSnapshot,
        entity.TotalAmount, entity.Currency, entity.NoticeDate, entity.DueDate,
        entity.AccountAssignment, entity.FeeReasonOrSource,
        Enum.Parse<NoticeDraftStatus>(entity.Status), entity.Version,
        entity.CreatedAtUtc, entity.UpdatedAtUtc,
        entity.Revisions.OrderBy(x => x.ResultingVersion).Select(Revision).ToArray());

    private static NoticeDraftRevisionView Revision(NoticeDraftRevisionEntity entity) => new(
        entity.Id, entity.ResultingVersion, entity.MutationType, entity.Reason,
        entity.OccurredAtUtc, entity.ActorId, entity.ActorDisplayName,
        entity.CaseId, entity.PayerPartyId, entity.PayerDisplayNameSnapshot,
        entity.NoticeNumber, entity.AssignmentYear, entity.RunningNumber,
        entity.NoticeNumberConfigurationId, entity.NoticeNumberConfigurationVersion,
        entity.FinancialProductSnapshot, entity.RunningNumberWidthSnapshot,
        entity.TotalAmount, entity.Currency, entity.NoticeDate, entity.DueDate,
        entity.AccountAssignment, entity.FeeReasonOrSource,
        Enum.Parse<NoticeDraftStatus>(entity.Status), entity.CreatedAtUtc,
        entity.UpdatedAtUtc);

    private static NoticeDraftListItem ListItem(NoticeDraftEntity entity) => new(
        entity.Id, entity.CaseId, entity.PayerPartyId, entity.PayerDisplayNameSnapshot,
        entity.NoticeNumber, entity.TotalAmount, entity.Currency, entity.NoticeDate,
        entity.DueDate, entity.AccountAssignment, entity.FeeReasonOrSource,
        Enum.Parse<NoticeDraftStatus>(entity.Status), entity.Version,
        entity.CreatedAtUtc, entity.UpdatedAtUtc);

    private static NoticeNumberConfigurationView View(NoticeNumberConfigurationEntity entity) => new(
        entity.Id, entity.FinancialProduct, entity.RunningNumberWidth, entity.Version,
        entity.CreatedAtUtc, entity.UpdatedAtUtc,
        entity.Revisions.OrderBy(x => x.ResultingVersion).Select(x =>
            new NoticeNumberConfigurationRevisionView(
                x.Id, x.ResultingVersion, x.MutationType, x.Reason, x.OccurredAtUtc,
                x.ActorId, x.ActorDisplayName, x.FinancialProduct, x.RunningNumberWidth)).ToArray());

    private static string Display(Persistence.PersonUsageRights.PartyEntity entity) =>
        entity.PartyType == nameof(PartyType.Organization)
            ? entity.OrganizationName!
            : $"{entity.FirstName} {entity.LastName}";

    private static NoticeDraftMutationResult Result(
        NoticeDraftMutationOutcome outcome,
        Guid id,
        long version = 0) => new(outcome, id, version);
}
