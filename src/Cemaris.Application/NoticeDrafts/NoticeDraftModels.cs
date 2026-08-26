using Cemaris.Application.Identity;
using Cemaris.Domain.NoticeDrafts;

namespace Cemaris.Application.NoticeDrafts;

public sealed record CreateNoticeDraftCommand(
    Guid PayerPartyId,
    bool PayerSelectionConfirmed,
    decimal TotalAmount,
    DateOnly NoticeDate,
    DateOnly DueDate,
    string? AccountAssignment,
    string? FeeReasonOrSource);

public sealed record CorrectNoticeDraftCommand(
    Guid PayerPartyId,
    bool PayerSelectionConfirmed,
    decimal TotalAmount,
    DateOnly NoticeDate,
    DateOnly DueDate,
    string? AccountAssignment,
    string? FeeReasonOrSource,
    string? Reason);

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
    DateTimeOffset UpdatedAtUtc);

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
    IReadOnlyList<NoticeDraftRevisionView> Revisions);

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
    DateTimeOffset UpdatedAtUtc);

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
}

public sealed record NoticeDraftMutationResult(
    NoticeDraftMutationOutcome Outcome,
    Guid Id,
    long Version = 0);

public sealed record NoticeDraftMutation(
    Guid AuditId,
    string EntityType,
    Guid EntityId,
    long ResultingVersion,
    string Operation,
    string? Reason,
    DateTimeOffset OccurredAtUtc,
    ActorIdentity Actor);
