namespace Cemaris.Application.NoticeDrafts;

public interface INoticeDraftStore
{
    Task<IReadOnlyList<NoticeDraftListItem>?> ReadForCaseAsync(Guid caseId, CancellationToken token);
    Task<NoticeDraftView?> FindDraftAsync(Guid id, CancellationToken token);
    Task<NoticeNumberConfigurationView?> FindConfigurationAsync(CancellationToken token);
    Task<NoticeDraftMutationResult> CreateDraftAsync(
        Guid id,
        Guid caseId,
        CreateNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token);
    Task<NoticeDraftMutationResult> CorrectDraftAsync(
        Guid id,
        long expectedVersion,
        CorrectNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token);
    Task<NoticeDraftMutationResult> DiscardDraftAsync(
        Guid id,
        long expectedVersion,
        DiscardNoticeDraftCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token);
    Task<NoticeDraftMutationResult> CreateConfigurationAsync(
        Guid id,
        SaveNoticeNumberConfigurationCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token);
    Task<NoticeDraftMutationResult> ChangeConfigurationAsync(
        Guid id,
        long expectedVersion,
        SaveNoticeNumberConfigurationCommand command,
        NoticeDraftMutation mutation,
        CancellationToken token);
}
