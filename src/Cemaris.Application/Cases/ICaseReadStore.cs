namespace Cemaris.Application.Cases;

public interface ICaseReadStore
{
    Task<CaseSearchStoreResult> SearchAsync(
        SearchCriteria criteria,
        int maximumResults,
        CancellationToken cancellationToken);

    Task<CaseOverview?> FindAsync(Guid id, CancellationToken cancellationToken);
}
