namespace Cemaris.Application.Documents;

/// <summary>
/// Identifies a document after it has been accepted by an external DMS.
/// </summary>
/// <param name="ExternalObjectId">The opaque identifier assigned by the external DMS.</param>
public sealed record DocumentArchiveResult(string ExternalObjectId);
