using System.Text.Json.Serialization;
using Cemaris.Application.Identity;
using Cemaris.Domain.NoticeDrafts;

namespace Cemaris.Application.NoticeDrafts;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record CreateNoticeDraftCommand(
    Guid PayerPartyId,
    bool PayerSelectionConfirmed,
    [property: JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)] decimal TotalAmount,
    DateOnly NoticeDate,
    DateOnly DueDate,
    string? AccountAssignment,
    string? FeeReasonOrSource)
{
    [JsonIgnore] public IReadOnlyList<PreparedNoticeDraftLineItem>? PreparedLineItems { get; init; }
}

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record CorrectNoticeDraftCommand(
    Guid PayerPartyId,
    bool PayerSelectionConfirmed,
    [property: JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)] decimal TotalAmount,
    DateOnly NoticeDate,
    DateOnly DueDate,
    string? AccountAssignment,
    string? FeeReasonOrSource,
    string? Reason)
{
    [JsonIgnore] public IReadOnlyList<PreparedNoticeDraftLineItem>? PreparedLineItems { get; init; }
    [JsonIgnore] public bool ConvertToLineItems { get; init; }
}

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record DiscardNoticeDraftCommand(string? Reason);

public sealed record SaveNoticeNumberConfigurationCommand(
    string? FinancialProduct,
    int RunningNumberWidth,
    string? Reason = null);

public sealed record NoticeDraftRevisionView(
    Guid Id,
    long ResultingVersion,
    string MutationType,
    string? Reason,
    DateTimeOffset OccurredAtUtc,
    string ActorId,
    string ActorDisplayName,
    Guid CaseId,
    Guid PayerPartyId,
    string PayerDisplayNameSnapshot,
    string NoticeNumber,
    int AssignmentYear,
    int RunningNumber,
    Guid NoticeNumberConfigurationId,
    long NoticeNumberConfigurationVersion,
    string FinancialProductSnapshot,
    int RunningNumberWidthSnapshot,
    decimal TotalAmount,
    string Currency,
    DateOnly NoticeDate,
    DateOnly DueDate,
    string AccountAssignment,
    string FeeReasonOrSource,
    NoticeDraftStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc)
{
    public NoticeDraftAmountMode AmountMode { get; init; }
    public IReadOnlyList<NoticeDraftLineItem> LineItems { get; init; } = Array.Empty<NoticeDraftLineItem>();
    public string TotalAmountExact => NoticeDraftLineItemRules.Exact(TotalAmount);
}

public sealed record NoticeDraftView(
    Guid Id,
    Guid CaseId,
    Guid PayerPartyId,
    string PayerDisplayNameSnapshot,
    string NoticeNumber,
    int AssignmentYear,
    int RunningNumber,
    Guid NoticeNumberConfigurationId,
    long NoticeNumberConfigurationVersion,
    string FinancialProductSnapshot,
    int RunningNumberWidthSnapshot,
    decimal TotalAmount,
    string Currency,
    DateOnly NoticeDate,
    DateOnly DueDate,
    string AccountAssignment,
    string FeeReasonOrSource,
    NoticeDraftStatus Status,
    long Version,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    IReadOnlyList<NoticeDraftRevisionView> Revisions)
{
    public NoticeDraftAmountMode AmountMode { get; init; }
    public IReadOnlyList<NoticeDraftLineItem> LineItems { get; init; } = Array.Empty<NoticeDraftLineItem>();
    public string TotalAmountExact => NoticeDraftLineItemRules.Exact(TotalAmount);
}

public sealed record NoticeDraftListItem(
    Guid Id,
    Guid CaseId,
    Guid PayerPartyId,
    string PayerDisplayNameSnapshot,
    string NoticeNumber,
    decimal TotalAmount,
    string Currency,
    DateOnly NoticeDate,
    DateOnly DueDate,
    string AccountAssignment,
    string FeeReasonOrSource,
    NoticeDraftStatus Status,
    long Version,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc)
{
    public NoticeDraftAmountMode AmountMode { get; init; }
    public IReadOnlyList<NoticeDraftLineItem> LineItems { get; init; } = Array.Empty<NoticeDraftLineItem>();
    public string TotalAmountExact => NoticeDraftLineItemRules.Exact(TotalAmount);
}

public sealed record NoticeNumberConfigurationRevisionView(
    Guid Id,
    long ResultingVersion,
    string MutationType,
    string? Reason,
    DateTimeOffset OccurredAtUtc,
    string ActorId,
    string ActorDisplayName,
    string FinancialProduct,
    int RunningNumberWidth);

public sealed record NoticeNumberConfigurationView(
    Guid Id,
    string FinancialProduct,
    int RunningNumberWidth,
    long Version,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    IReadOnlyList<NoticeNumberConfigurationRevisionView> Revisions);

public enum NoticeDraftMutationOutcome
{
    Success,
    NotFound,
    VersionConflict,
    InvalidReference,
    ConfigurationMissing,
    ConfigurationAlreadyExists,
    SequenceExhausted,
    Discarded,
    PayerConfirmationRequired,
    AmountModeConflict,
    StorageFailure,
}

public sealed record NoticeDraftMutationResult(
    NoticeDraftMutationOutcome Outcome,
    Guid Id,
    long Version = 0, NoticeDraftView? Snapshot = null);

public sealed record NoticeDraftMutation(
    Guid AuditId,
    string EntityType,
    Guid EntityId,
    long ResultingVersion,
    string Operation,
    string? Reason,
    DateTimeOffset OccurredAtUtc,
    ActorIdentity Actor);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record NoticeDraftLineItemInput(
    [property: JsonRequired] Guid? Id,
    [property: JsonRequired] string? Description,
    [property: JsonRequired] string? Amount);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record SaveNoticeDraftLineItemsCommand(
    [property: JsonRequired] Guid PayerPartyId,
    [property: JsonRequired] bool PayerSelectionConfirmed,
    [property: JsonRequired] DateOnly NoticeDate,
    [property: JsonRequired] DateOnly DueDate,
    [property: JsonRequired] string? AccountAssignment,
    [property: JsonRequired] string? FeeReasonOrSource,
    [property: JsonRequired] IReadOnlyList<NoticeDraftLineItemInput?>? LineItems,
    string? Reason = null,
    bool ConversionConfirmed = false);
