using Cemaris.Application.NoticeDrafts;
using Cemaris.Domain.NoticeDrafts;
using Cemaris.Infrastructure.PersonUsageRights;
using Cemaris.Infrastructure.ReadModel;

namespace Cemaris.Infrastructure.NoticeDrafts;

public sealed class SyntheticNoticeDraftStore(
    SyntheticStoreCoordinator coordinator,
    SyntheticCaseReadStore cases,
    SyntheticPersonUsageRightStore parties) : INoticeDraftStore
{
    private sealed record DraftState(
        Guid Id,
        Guid CaseId,
        Guid PayerPartyId,
        string PayerDisplayName,
        string NoticeNumber,
        int AssignmentYear,
        int RunningNumber,
        Guid ConfigurationId,
        long ConfigurationVersion,
        string FinancialProduct,
        int RunningNumberWidth,
        decimal TotalAmount,
        DateOnly NoticeDate,
        DateOnly DueDate,
        string AccountAssignment,
        string FeeReasonOrSource,
        NoticeDraftStatus Status,
        long Version,
        DateTimeOffset CreatedAtUtc,
        DateTimeOffset UpdatedAtUtc,
        List<NoticeDraftRevisionView> Revisions)
    {
        public NoticeDraftAmountMode AmountMode { get; init; }
        public IReadOnlyList<NoticeDraftLineItem> LineItems { get; init; } = Array.Empty<NoticeDraftLineItem>();
    }

    private sealed record ConfigurationState(
        Guid Id,
        string FinancialProduct,
        int RunningNumberWidth,
        long Version,
        DateTimeOffset CreatedAtUtc,
        DateTimeOffset UpdatedAtUtc,
        List<NoticeNumberConfigurationRevisionView> Revisions);

    private readonly Dictionary<Guid, DraftState> drafts = [];
    private readonly Dictionary<int, int> lastIssuedByYear = [];
    private readonly List<NoticeDraftMutation> draftAudits = [];
    private readonly List<NoticeDraftMutation> configurationAudits = [];
    private ConfigurationState? configuration;

    public Task<IReadOnlyList<NoticeDraftListItem>?> ReadForCaseAsync(Guid caseId, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            if (cases.FindAsync(caseId, token).GetAwaiter().GetResult() is null)
                return Task.FromResult<IReadOnlyList<NoticeDraftListItem>?>(null);
            return Task.FromResult<IReadOnlyList<NoticeDraftListItem>?>(drafts.Values
                .Where(x => x.CaseId == caseId)
                .OrderByDescending(x => x.CreatedAtUtc)
                .ThenBy(x => x.Id)
                .Select(ListItem)
                .ToArray());
        }
    }

    public Task<NoticeDraftView?> FindDraftAsync(Guid id, CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            return Task.FromResult(drafts.TryGetValue(id, out var state) ? View(state) : null);
        }
    }

    public Task<NoticeNumberConfigurationView?> FindConfigurationAsync(CancellationToken token)
    {
        lock (coordinator.Gate)
        {
            token.ThrowIfCancellationRequested();
            return Task.FromResult(configuration is null ? null : View(configuration));
        }
    }

    public Task<NoticeDraftMutationResult> CreateDraftAsync(
        Guid id,
        Guid caseId,
        CreateNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => Mutate(() =>
    {
        token.ThrowIfCancellationRequested();
        if (configuration is null)
        {
            return Result(NoticeDraftMutationOutcome.ConfigurationMissing, id);
        }
        if (drafts.ContainsKey(id) || !ValidDraftEvidence(mutation, id, 1))
            return Result(NoticeDraftMutationOutcome.StorageFailure, id);

        if (cases.FindAsync(caseId, token).GetAwaiter().GetResult() is null
            || !parties.TryGetPartyDisplayName(command.PayerPartyId, out var payerDisplayName))
        {
            return Result(NoticeDraftMutationOutcome.InvalidReference, id);
        }

        var lines = command.PreparedLineItems is { } input ? NoticeDraftLineItemRules.Materialize(input, []) : Array.Empty<NoticeDraftLineItem>();
        var amount = command.PreparedLineItems is { } prepared ? NoticeDraftLineItemRules.Total(prepared) : NoticeDraftRules.ValidateAmount(command.TotalAmount);
        var year = mutation.OccurredAtUtc.UtcDateTime.Year;
        var lastIssued = lastIssuedByYear.GetValueOrDefault(year);
        var next = checked(lastIssued + 1);
        if (next > NoticeDraftRules.MaximumRunningNumber(configuration.RunningNumberWidth))
        {
            return Result(NoticeDraftMutationOutcome.SequenceExhausted, id);
        }

        var noticeNumber = NoticeDraftRules.FormatNoticeNumber(
            configuration.FinancialProduct,
            year,
            next,
            configuration.RunningNumberWidth);
        var state = new DraftState(
            id,
            caseId,
            command.PayerPartyId,
            payerDisplayName,
            noticeNumber,
            year,
            next,
            configuration.Id,
            configuration.Version,
            configuration.FinancialProduct,
            configuration.RunningNumberWidth,
            amount,
            command.NoticeDate,
            command.DueDate,
            command.AccountAssignment!,
            command.FeeReasonOrSource!,
            NoticeDraftStatus.Draft,
            1,
            mutation.OccurredAtUtc,
            mutation.OccurredAtUtc,
            [])
        { AmountMode = command.PreparedLineItems is null ? NoticeDraftAmountMode.LegacyTotal : NoticeDraftAmountMode.LineItems, LineItems = lines };
        state.Revisions.Add(Revision(state, mutation));
        drafts.Add(id, state);
        lastIssuedByYear[year] = next;
        draftAudits.Add(mutation with { Reason = null });
        return new(NoticeDraftMutationOutcome.Success, id, 1, View(state));
    });

    public Task<NoticeDraftMutationResult> CorrectDraftAsync(
        Guid id,
        long expectedVersion,
        CorrectNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => Mutate(() =>
    {
        token.ThrowIfCancellationRequested();
        if (!drafts.TryGetValue(id, out var current)) return Result(NoticeDraftMutationOutcome.NotFound, id);
        if (current.Version != expectedVersion || current.Version == long.MaxValue) return Result(NoticeDraftMutationOutcome.VersionConflict, id, current.Version);
        if (current.Status == NoticeDraftStatus.Discarded) return Result(NoticeDraftMutationOutcome.Discarded, id, current.Version);
        if (!ValidDraftEvidence(mutation, id, current.Version + 1)) return Result(NoticeDraftMutationOutcome.StorageFailure, id, current.Version);
        if (command.PreparedLineItems is null ? current.AmountMode != NoticeDraftAmountMode.LegacyTotal
            : command.ConvertToLineItems != (current.AmountMode == NoticeDraftAmountMode.LegacyTotal))
            return Result(NoticeDraftMutationOutcome.AmountModeConflict, id, current.Version);
        var lines = command.PreparedLineItems is { } input ? NoticeDraftLineItemRules.Materialize(input, current.LineItems.Select(x => x.Id)) : current.LineItems;
        if (current.PayerPartyId != command.PayerPartyId && !command.PayerSelectionConfirmed)
            return Result(NoticeDraftMutationOutcome.PayerConfirmationRequired, id, current.Version);
        if (!parties.TryGetPartyDisplayName(command.PayerPartyId, out var payerDisplayName))
            return Result(NoticeDraftMutationOutcome.InvalidReference, id, current.Version);

        var next = current with
        {
            PayerPartyId = command.PayerPartyId,
            PayerDisplayName = payerDisplayName,
            TotalAmount = command.PreparedLineItems is { } prepared ? NoticeDraftLineItemRules.Total(prepared) : NoticeDraftRules.ValidateAmount(command.TotalAmount),
            AmountMode = command.PreparedLineItems is null ? current.AmountMode : NoticeDraftAmountMode.LineItems,
            LineItems = lines,
            NoticeDate = command.NoticeDate,
            DueDate = command.DueDate,
            AccountAssignment = command.AccountAssignment!,
            FeeReasonOrSource = command.FeeReasonOrSource!,
            Version = current.Version + 1,
            UpdatedAtUtc = mutation.OccurredAtUtc,
        };
        next = next with { Revisions = new List<NoticeDraftRevisionView>(current.Revisions) };
        next.Revisions.Add(Revision(next, mutation));
        drafts[id] = next;
        draftAudits.Add(mutation with { Reason = null });
        return new(NoticeDraftMutationOutcome.Success, id, next.Version, View(next));
    });

    public Task<NoticeDraftMutationResult> DiscardDraftAsync(
        Guid id,
        long expectedVersion,
        DiscardNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => Mutate(() =>
    {
        token.ThrowIfCancellationRequested();
        if (!drafts.TryGetValue(id, out var current)) return Result(NoticeDraftMutationOutcome.NotFound, id);
        if (current.Version != expectedVersion || current.Version == long.MaxValue) return Result(NoticeDraftMutationOutcome.VersionConflict, id, current.Version);
        if (current.Status == NoticeDraftStatus.Discarded) return Result(NoticeDraftMutationOutcome.Discarded, id, current.Version);
        if (!ValidDraftEvidence(mutation, id, current.Version + 1)) return Result(NoticeDraftMutationOutcome.StorageFailure, id, current.Version);
        var next = current with
        {
            Status = NoticeDraftStatus.Discarded,
            Version = current.Version + 1,
            UpdatedAtUtc = mutation.OccurredAtUtc,
        };
        next = next with { Revisions = new List<NoticeDraftRevisionView>(current.Revisions) };
        next.Revisions.Add(Revision(next, mutation));
        drafts[id] = next;
        draftAudits.Add(mutation with { Reason = null });
        return new(NoticeDraftMutationOutcome.Success, id, next.Version, View(next));
    });

    public Task<NoticeDraftMutationResult> CreateConfigurationAsync(
        Guid id,
        SaveNoticeNumberConfigurationCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => Mutate(() =>
    {
        token.ThrowIfCancellationRequested();
        if (configuration is not null)
            return Result(NoticeDraftMutationOutcome.ConfigurationAlreadyExists, id, configuration.Version);
        var state = new ConfigurationState(
            id,
            command.FinancialProduct!,
            command.RunningNumberWidth,
            1,
            mutation.OccurredAtUtc,
            mutation.OccurredAtUtc,
            []);
        state.Revisions.Add(ConfigurationRevision(state, mutation));
        configuration = state;
        configurationAudits.Add(mutation);
        return Result(NoticeDraftMutationOutcome.Success, id, 1);
    });

    public Task<NoticeDraftMutationResult> ChangeConfigurationAsync(
        Guid id,
        long expectedVersion,
        SaveNoticeNumberConfigurationCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token) => Mutate(() =>
    {
        token.ThrowIfCancellationRequested();
        if (configuration is null || configuration.Id != id)
            return Result(NoticeDraftMutationOutcome.NotFound, id);
        if (configuration.Version != expectedVersion || configuration.Version == long.MaxValue)
            return Result(NoticeDraftMutationOutcome.VersionConflict, id, configuration.Version);
        var next = configuration with
        {
            FinancialProduct = command.FinancialProduct!,
            RunningNumberWidth = command.RunningNumberWidth,
            Version = configuration.Version + 1,
            UpdatedAtUtc = mutation.OccurredAtUtc,
        };
        next = next with { Revisions = new List<NoticeNumberConfigurationRevisionView>(configuration.Revisions) };
        next.Revisions.Add(ConfigurationRevision(next, mutation));
        configuration = next;
        configurationAudits.Add(mutation);
        return Result(NoticeDraftMutationOutcome.Success, id, next.Version);
    });

    internal (int Drafts, int DraftRevisions, int DraftAudits, int ConfigurationRevisions, int ConfigurationAudits) Diagnostics
    {
        get
        {
            lock (coordinator.Gate)
            {
                return (
                    drafts.Count,
                    drafts.Values.Sum(x => x.Revisions.Count),
                    draftAudits.Count,
                    configuration?.Revisions.Count ?? 0,
                    configurationAudits.Count);
            }
        }
    }

    private bool ValidDraftEvidence(NoticeDraftMutation mutation, Guid id, long version) =>
        mutation.AuditId != Guid.Empty && mutation.EntityId == id && mutation.EntityType == "NoticeDraft"
        && mutation.ResultingVersion == version && !draftAudits.Any(x => x.AuditId == mutation.AuditId);

    private Task<NoticeDraftMutationResult> Mutate(Func<NoticeDraftMutationResult> action)
    {
        lock (coordinator.Gate)
        {
            return Task.FromResult(action());
        }
    }

    private static NoticeDraftRevisionView Revision(DraftState state, NoticeDraftMutation mutation) => new(
        Guid.NewGuid(), mutation.ResultingVersion, mutation.Operation, mutation.Reason,
        mutation.OccurredAtUtc, mutation.Actor.Id, mutation.Actor.DisplayName,
        state.CaseId, state.PayerPartyId, state.PayerDisplayName, state.NoticeNumber,
        state.AssignmentYear, state.RunningNumber, state.ConfigurationId,
        state.ConfigurationVersion, state.FinancialProduct, state.RunningNumberWidth,
        state.TotalAmount, NoticeDraftRules.Currency, state.NoticeDate, state.DueDate,
        state.AccountAssignment, state.FeeReasonOrSource, state.Status,
        state.CreatedAtUtc, state.UpdatedAtUtc)
    { AmountMode = state.AmountMode, LineItems = state.LineItems };

    private static NoticeNumberConfigurationRevisionView ConfigurationRevision(
        ConfigurationState state,
        NoticeDraftMutation mutation) => new(
            Guid.NewGuid(), mutation.ResultingVersion, mutation.Operation, mutation.Reason,
            mutation.OccurredAtUtc, mutation.Actor.Id, mutation.Actor.DisplayName,
            state.FinancialProduct, state.RunningNumberWidth);

    private static NoticeDraftView View(DraftState state) => new(
        state.Id, state.CaseId, state.PayerPartyId, state.PayerDisplayName,
        state.NoticeNumber, state.AssignmentYear, state.RunningNumber,
        state.ConfigurationId, state.ConfigurationVersion, state.FinancialProduct,
        state.RunningNumberWidth, state.TotalAmount, NoticeDraftRules.Currency,
        state.NoticeDate, state.DueDate, state.AccountAssignment,
        state.FeeReasonOrSource, state.Status, state.Version, state.CreatedAtUtc,
        state.UpdatedAtUtc, state.Revisions.AsReadOnly())
    { AmountMode = state.AmountMode, LineItems = state.LineItems };

    private static NoticeDraftListItem ListItem(DraftState state) => new(
        state.Id, state.CaseId, state.PayerPartyId, state.PayerDisplayName,
        state.NoticeNumber, state.TotalAmount, NoticeDraftRules.Currency,
        state.NoticeDate, state.DueDate, state.AccountAssignment,
        state.FeeReasonOrSource, state.Status, state.Version, state.CreatedAtUtc,
        state.UpdatedAtUtc)
    { AmountMode = state.AmountMode, LineItems = state.LineItems };

    private static NoticeNumberConfigurationView View(ConfigurationState state) => new(
        state.Id, state.FinancialProduct, state.RunningNumberWidth, state.Version,
        state.CreatedAtUtc, state.UpdatedAtUtc, state.Revisions.ToArray());

    private static NoticeDraftMutationResult Result(
        NoticeDraftMutationOutcome outcome,
        Guid id,
        long version = 0) => new(outcome, id, version);
}
