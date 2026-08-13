namespace Cemaris.Infrastructure.Persistence.Identity;

public sealed class LocalAccountEntity
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string NormalizedUsername { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTimeOffset? LockoutEndUtc { get; set; }
    public bool MustChangePassword { get; set; }
    public Guid SecurityStamp { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset PasswordChangedAtUtc { get; set; }
    public DateTimeOffset? LastLoginAtUtc { get; set; }
    public byte[] Version { get; set; } = [];
}
