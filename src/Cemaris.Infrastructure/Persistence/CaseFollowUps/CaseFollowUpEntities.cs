using Cemaris.Infrastructure.Persistence.ReadModel;

namespace Cemaris.Infrastructure.Persistence.CaseFollowUps;

public sealed class CaseFollowUpEntity
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public CaseReadEntity Case { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public long Version { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public ICollection<CaseFollowUpRevisionEntity> Revisions { get; } = [];
}

public sealed class CaseFollowUpRevisionEntity
{
    public Guid Id { get; set; }
    public Guid FollowUpId { get; set; }
    public Guid CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public long Version { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public string Operation { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; set; }
}

public sealed class CaseFollowUpAuditEntity
{
    public Guid Id { get; set; }
    public Guid FollowUpId { get; set; }
    public Guid CaseId { get; set; }
    public long ResultingVersion { get; set; }
    public string Operation { get; set; } = string.Empty;
    public string ActorId { get; set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; set; }
}
