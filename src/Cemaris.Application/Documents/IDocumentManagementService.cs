namespace Cemaris.Application.Documents;

/// <summary>
/// Defines the vendor-neutral boundary for archiving a generated document in an external DMS.
/// The contract may be extended only after the DMS requirements and the available Winyard API are known.
/// </summary>
public interface IDocumentManagementService
{
    Task<DocumentArchiveResult> ArchiveAsync(
        DocumentArchiveRequest request,
        CancellationToken cancellationToken = default);
}
