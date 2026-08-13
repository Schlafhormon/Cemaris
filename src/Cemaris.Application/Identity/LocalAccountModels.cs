namespace Cemaris.Application.Identity;

public static class LocalAccountLimits
{
    public const int UsernameMaximumLength = 100;
    public const int DisplayNameMaximumLength = 200;
    public const int PasswordMinimumLength = 12;
    public const int PasswordMaximumLength = 128;
    public const int MaximumFailedLoginAttempts = 5;
    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
}

public sealed record LocalAccountSnapshot(
    Guid Id,
    string Username,
    string NormalizedUsername,
    string DisplayName,
    SystemRole Role,
    string PasswordHash,
    bool IsActive,
    int FailedLoginAttempts,
    DateTimeOffset? LockoutEndUtc,
    bool MustChangePassword,
    Guid SecurityStamp,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset PasswordChangedAtUtc,
    DateTimeOffset? LastLoginAtUtc,
    byte[] Version);

public sealed record LocalAccountSummary(
    Guid Id,
    string Username,
    string DisplayName,
    SystemRole Role,
    bool IsActive,
    bool MustChangePassword,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    string Version);

public sealed record CreateLocalAccountCommand(
    string? Username,
    string? DisplayName,
    string? Role,
    string? Password);

public sealed record UpdateLocalAccountCommand(
    string? Username,
    string? DisplayName,
    string? Role,
    byte[] ExpectedVersion);

public enum LocalAccountOperationStatus
{
    Success,
    NotFound,
    DuplicateUsername,
    ConcurrencyConflict,
    LastActiveAdministrator,
    SelfDeactivation,
    AccountsAlreadyExist,
    ValidationFailed,
}

public sealed record LocalAccountOperationResult(
    LocalAccountOperationStatus Status,
    LocalAccountSnapshot? Account = null);

public sealed record LocalAuthenticationResult(
    bool Succeeded,
    LocalAccountSnapshot? Account = null);

public sealed class LocalAccountValidationException(
    IReadOnlyDictionary<string, string[]> errors)
    : Exception("Die Kontodaten sind ungültig.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}

public sealed class LocalAccountSecurityOptions
{
    public int PasswordMinimumLength { get; init; } = LocalAccountLimits.PasswordMinimumLength;

    public int PasswordMaximumLength { get; init; } = LocalAccountLimits.PasswordMaximumLength;

    public int MaximumFailedLoginAttempts { get; init; } = LocalAccountLimits.MaximumFailedLoginAttempts;

    public TimeSpan LockoutDuration { get; init; } = LocalAccountLimits.LockoutDuration;

    public TimeSpan SessionIdleTimeout { get; init; } = TimeSpan.FromMinutes(30);

    public void Validate()
    {
        if (PasswordMinimumLength < LocalAccountLimits.PasswordMinimumLength
            || PasswordMaximumLength > LocalAccountLimits.PasswordMaximumLength
            || PasswordMaximumLength < PasswordMinimumLength)
        {
            throw new InvalidOperationException(
                "Identity password limits must remain within the secure range of 12 through 128 characters.");
        }

        if (MaximumFailedLoginAttempts is < 1 or > LocalAccountLimits.MaximumFailedLoginAttempts)
        {
            throw new InvalidOperationException(
                "Identity maximum failed login attempts must be between 1 and 5.");
        }

        if (LockoutDuration < LocalAccountLimits.LockoutDuration)
        {
            throw new InvalidOperationException("Identity lockout duration must be at least 15 minutes.");
        }

        if (SessionIdleTimeout <= TimeSpan.Zero || SessionIdleTimeout > TimeSpan.FromHours(8))
        {
            throw new InvalidOperationException("Identity session idle timeout must be between zero and eight hours.");
        }
    }
}

public static class LocalAccountNormalizer
{
    public static string NormalizeUsername(string username) => username.Trim().ToUpperInvariant();
}

public static class LocalAccountVersion
{
    public static string Encode(byte[] version) => Convert.ToBase64String(version);

    public static bool TryDecode(string? value, out byte[] version)
    {
        version = [];
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        try
        {
            version = Convert.FromBase64String(value.Trim('"'));
            return version.Length > 0;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
