namespace Cemaris.Infrastructure.Persistence.NoticeGeneration;

public sealed class LegalBasisVersionEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly VersionDate { get; set; }
    public bool IsActive { get; set; }
    public long Version { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class LegalBasisVersionAuditEntity
{
    public Guid Id { get; set; }
    public Guid LegalBasisVersionId { get; set; }
    public long ResultingVersion { get; set; }
    public string Operation { get; set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
}

public sealed class NoticeGenerationAuditEntity
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid NoticeDraftId { get; set; }
    public long ExpectedNoticeDraftVersion { get; set; }
    public Guid ActorId { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string Format { get; set; } = string.Empty;
    public Guid LegalBasisVersionId { get; set; }
    public long LegalBasisInternalVersion { get; set; }
    public bool Succeeded { get; set; }
    public string? ErrorCode { get; set; }
}
