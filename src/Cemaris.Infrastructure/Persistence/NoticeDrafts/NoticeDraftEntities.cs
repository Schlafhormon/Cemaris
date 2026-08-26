namespace Cemaris.Infrastructure.Persistence.NoticeDrafts;

public sealed class NoticeDraftEntity
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid PayerPartyId { get; set; }
    public string PayerDisplayNameSnapshot { get; set; } = string.Empty;
    public string NoticeNumber { get; set; } = string.Empty;
    public int AssignmentYear { get; set; }
    public int RunningNumber { get; set; }
    public Guid NoticeNumberConfigurationId { get; set; }
    public long NoticeNumberConfigurationVersion { get; set; }
    public string FinancialProductSnapshot { get; set; } = string.Empty;
    public int RunningNumberWidthSnapshot { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateOnly NoticeDate { get; set; }
    public DateOnly DueDate { get; set; }
    public string AccountAssignment { get; set; } = string.Empty;
    public string FeeReasonOrSource { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public long Version { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public ICollection<NoticeDraftRevisionEntity> Revisions { get; } = [];
}

public sealed class NoticeDraftRevisionEntity
{
    public Guid Id { get; set; }
    public Guid NoticeDraftId { get; set; }
    public long ResultingVersion { get; set; }
    public string MutationType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
    public Guid CaseId { get; set; }
    public Guid PayerPartyId { get; set; }
    public string PayerDisplayNameSnapshot { get; set; } = string.Empty;
    public string NoticeNumber { get; set; } = string.Empty;
    public int AssignmentYear { get; set; }
    public int RunningNumber { get; set; }
    public Guid NoticeNumberConfigurationId { get; set; }
    public long NoticeNumberConfigurationVersion { get; set; }
    public string FinancialProductSnapshot { get; set; } = string.Empty;
    public int RunningNumberWidthSnapshot { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateOnly NoticeDate { get; set; }
    public DateOnly DueDate { get; set; }
    public string AccountAssignment { get; set; } = string.Empty;
    public string FeeReasonOrSource { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class NoticeDraftAuditEntity
{
    public Guid Id { get; set; }
    public Guid NoticeDraftId { get; set; }
    public Guid CaseId { get; set; }
    public long ResultingVersion { get; set; }
    public string Operation { get; set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
}

public sealed class NoticeNumberConfigurationEntity
{
    public Guid Id { get; set; }
    public byte SingletonKey { get; set; }
    public string FinancialProduct { get; set; } = string.Empty;
    public int RunningNumberWidth { get; set; }
    public long Version { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public ICollection<NoticeNumberConfigurationRevisionEntity> Revisions { get; } = [];
}

public sealed class NoticeNumberConfigurationRevisionEntity
{
    public Guid Id { get; set; }
    public Guid NoticeNumberConfigurationId { get; set; }
    public long ResultingVersion { get; set; }
    public string MutationType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
    public string FinancialProduct { get; set; } = string.Empty;
    public int RunningNumberWidth { get; set; }
}

public sealed class NoticeNumberConfigurationAuditEntity
{
    public Guid Id { get; set; }
    public Guid NoticeNumberConfigurationId { get; set; }
    public long ResultingVersion { get; set; }
    public string Operation { get; set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
}

public sealed class NoticeNumberSequenceEntity
{
    public int Year { get; set; }
    public int LastIssuedNumber { get; set; }
    public byte[] Version { get; set; } = [];
}
