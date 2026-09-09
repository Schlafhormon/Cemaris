using Cemaris.Application.Identity;
using Cemaris.Domain.NoticeDrafts;

namespace Cemaris.Application.NoticeDrafts;

public sealed class NoticeDraftService(
    INoticeDraftStore store,
    ICurrentActorProvider actors,
    TimeProvider timeProvider)
{
    public Task<IReadOnlyList<NoticeDraftListItem>?> ReadForCaseAsync(Guid caseId, CancellationToken token) =>
        store.ReadForCaseAsync(caseId, token);

    public Task<NoticeDraftView?> FindDraftAsync(Guid id, CancellationToken token) =>
        store.FindDraftAsync(id, token);

    public Task<NoticeNumberConfigurationView?> FindConfigurationAsync(CancellationToken token) =>
        store.FindConfigurationAsync(token);

    public Task<NoticeDraftMutationResult> CreateDraftAsync(
        Guid caseId,
        CreateNoticeDraftCommand command,
        CancellationToken token)
    {
        if (caseId == Guid.Empty)
        {
            throw new NoticeDraftValidationException("caseId", "Ein vorhandener Fall ist erforderlich.");
        }

        if (command.PayerPartyId == Guid.Empty)
        {
            throw new NoticeDraftValidationException("payerPartyId", "Ein kanonischer Zahlungspflichtiger ist erforderlich.");
        }

        if (!command.PayerSelectionConfirmed)
        {
            throw new NoticeDraftValidationException(
                "payerSelectionConfirmed",
                "Die konkrete Zahlungspflichtigenauswahl muss aktiv bestätigt werden.");
        }

        var clean = Clean(command);
        var id = Guid.NewGuid();
        return store.CreateDraftAsync(id, caseId, clean, Mutation("NoticeDraft", id, 1, "Created", null), token);
    }

    public Task<NoticeDraftMutationResult> CorrectDraftAsync(
        Guid id,
        long expectedVersion,
        CorrectNoticeDraftCommand command,
        CancellationToken token)
    {
        if (command.PayerPartyId == Guid.Empty)
        {
            throw new NoticeDraftValidationException("payerPartyId", "Ein kanonischer Zahlungspflichtiger ist erforderlich.");
        }

        var reason = NoticeDraftRules.MutationReason(command.Reason);
        var clean = Clean(command) with { Reason = reason };
        return store.CorrectDraftAsync(
            id,
            expectedVersion,
            clean,
            Mutation("NoticeDraft", id, expectedVersion == long.MaxValue ? long.MaxValue : expectedVersion + 1, clean.ConvertToLineItems ? "ConvertedToLineItems" : "Corrected", reason),
            token);
    }

    public Task<NoticeDraftMutationResult> DiscardDraftAsync(
        Guid id,
        long expectedVersion,
        DiscardNoticeDraftCommand command,
        CancellationToken token)
    {
        var reason = NoticeDraftRules.MutationReason(command.Reason);
        var clean = command with { Reason = reason };
        return store.DiscardDraftAsync(
            id,
            expectedVersion,
            clean,
            Mutation("NoticeDraft", id, expectedVersion == long.MaxValue ? long.MaxValue : expectedVersion + 1, "Discarded", reason),
            token);
    }

    public Task<NoticeDraftMutationResult> CreateConfigurationAsync(
        SaveNoticeNumberConfigurationCommand command,
        CancellationToken token)
    {
        var clean = Clean(command);
        var id = Guid.NewGuid();
        return store.CreateConfigurationAsync(
            id,
            clean,
            Mutation("NoticeNumberConfiguration", id, 1, "Created", null),
            token);
    }

    public Task<NoticeDraftMutationResult> ChangeConfigurationAsync(
        Guid id,
        long expectedVersion,
        SaveNoticeNumberConfigurationCommand command,
        CancellationToken token)
    {
        var clean = Clean(command, requireReason: true);
        return store.ChangeConfigurationAsync(
            id,
            expectedVersion,
            clean,
            Mutation("NoticeNumberConfiguration", id, expectedVersion == long.MaxValue ? long.MaxValue : expectedVersion + 1, "Changed", clean.Reason),
            token);
    }

    public Task<NoticeDraftMutationResult> CreateLineItemsAsync(Guid caseId, SaveNoticeDraftLineItemsCommand command, CancellationToken token)
    {
        var items = Prepare(command);
        if (command.Reason is not null || command.ConversionConfirmed)
            throw new NoticeDraftValidationException("reason", "Anlage und Umstellung sind getrennte Vorgänge.");
        return CreateDraftAsync(caseId, new(command.PayerPartyId, command.PayerSelectionConfirmed,
            NoticeDraftLineItemRules.Total(items), command.NoticeDate, command.DueDate,
            command.AccountAssignment, command.FeeReasonOrSource)
        { PreparedLineItems = items }, token);
    }

    public Task<NoticeDraftMutationResult> CorrectLineItemsAsync(Guid id, long version,
        SaveNoticeDraftLineItemsCommand command, bool convert, CancellationToken token)
    {
        var items = Prepare(command);
        if (convert != command.ConversionConfirmed)
            throw new NoticeDraftValidationException("conversionConfirmed", "Die ausdrückliche Umstellung muss bestätigt werden; Korrekturen sind keine Umstellung.");
        return CorrectDraftAsync(id, version, new(command.PayerPartyId, command.PayerSelectionConfirmed,
            NoticeDraftLineItemRules.Total(items), command.NoticeDate, command.DueDate,
            command.AccountAssignment, command.FeeReasonOrSource, command.Reason)
        { PreparedLineItems = items, ConvertToLineItems = convert }, token);
    }

    private static global::System.Collections.ObjectModel.ReadOnlyCollection<PreparedNoticeDraftLineItem> Prepare(SaveNoticeDraftLineItemsCommand command)
    {
        if (command.NoticeDate == default || command.DueDate == default)
            throw new NoticeDraftValidationException("noticeDate", "Bescheiddatum und manuelle Fälligkeit sind erforderlich.");
        if (command.LineItems is null || command.LineItems.Count is < 1 or > NoticeDraftLineItemRules.MaximumCount)
            throw new NoticeDraftValidationException("lineItems", "Es sind 1 bis 100 Positionen erforderlich.");
        return Array.AsReadOnly(command.LineItems.Select((item, index) => item is null
            ? throw new NoticeDraftValidationException($"lineItems[{index}]", "Die Position ist erforderlich.")
            : new PreparedNoticeDraftLineItem(item.Id,
                NoticeDraftLineItemRules.Description(item.Description, $"lineItems[{index}].description"),
                NoticeDraftLineItemRules.ParseAmount(item.Amount, $"lineItems[{index}].amount"))).ToArray());
    }

    private static CreateNoticeDraftCommand Clean(CreateNoticeDraftCommand command) => command with
    {
        TotalAmount = NoticeDraftRules.ValidateAmount(command.TotalAmount),
        AccountAssignment = NoticeDraftRules.AccountAssignment(command.AccountAssignment),
        FeeReasonOrSource = NoticeDraftRules.FeeReasonOrSource(command.FeeReasonOrSource),
    };

    private static CorrectNoticeDraftCommand Clean(CorrectNoticeDraftCommand command) => command with
    {
        TotalAmount = NoticeDraftRules.ValidateAmount(command.TotalAmount),
        AccountAssignment = NoticeDraftRules.AccountAssignment(command.AccountAssignment),
        FeeReasonOrSource = NoticeDraftRules.FeeReasonOrSource(command.FeeReasonOrSource),
    };

    private static SaveNoticeNumberConfigurationCommand Clean(
        SaveNoticeNumberConfigurationCommand command,
        bool requireReason = false) => command with
        {
            FinancialProduct = NoticeDraftRules.FinancialProduct(command.FinancialProduct),
            RunningNumberWidth = NoticeDraftRules.RunningNumberWidth(command.RunningNumberWidth),
            Reason = requireReason ? NoticeDraftRules.MutationReason(command.Reason) : null,
        };

    private NoticeDraftMutation Mutation(
        string entityType,
        Guid entityId,
        long resultingVersion,
        string operation,
        string? reason) => new(
            Guid.NewGuid(),
            entityType,
            entityId,
            resultingVersion,
            operation,
            reason,
            timeProvider.GetUtcNow(),
            actors.Current);
}
