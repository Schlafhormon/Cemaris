namespace Cemaris.Application.Documents;

/// <summary>
/// Carries a generated document to a future DMS adapter without exposing vendor-specific concepts.
/// </summary>
/// <param name="FileName">The technical file name.</param>
/// <param name="ContentType">The media type of the content.</param>
/// <param name="Content">The readable document content.</param>
public sealed record DocumentArchiveRequest(
    string FileName,
    string ContentType,
    Stream Content);
