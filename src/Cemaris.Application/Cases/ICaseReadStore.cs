namespace Cemaris.Application.Cases;

public interface ICaseReadStore
{
    Task<IReadOnlyList<CaseOverview>> ListAsync(CancellationToken cancellationToken);

    Task<CaseOverview?> FindAsync(Guid id, CancellationToken cancellationToken);
}
