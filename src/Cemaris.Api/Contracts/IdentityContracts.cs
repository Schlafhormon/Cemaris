using Cemaris.Application.Identity;

namespace Cemaris.Api.Contracts;

public sealed record AntiforgeryTokenResponse(string RequestToken, string HeaderName);

public sealed record LoginRequest(string? Username, string? Password);

public sealed record ChangeOwnPasswordRequest(string? CurrentPassword, string? NewPassword);

public sealed record CurrentAccountResponse(
    Guid Id,
    string Username,
    string DisplayName,
    string Role,
    bool MustChangePassword,
    string? FirstName,
    string? LastName,
    string? ContactPoint,
    string? Room,
    string? Phone,
    string? Email);

public sealed record LocalAccountResponse(
    Guid Id,
    string Username,
    string DisplayName,
    string Role,
    bool IsActive,
    bool MustChangePassword,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    string Version,
    string? FirstName,
    string? LastName,
    string? ContactPoint,
    string? Room,
    string? Phone,
    string? Email)
{
    public static LocalAccountResponse From(LocalAccountSnapshot account)
    {
        var summary = LocalAccountService.ToSummary(account);
        return new(
            summary.Id,
            summary.Username,
            summary.DisplayName,
            summary.Role.Value,
            summary.IsActive,
            summary.MustChangePassword,
            summary.CreatedAtUtc,
            summary.UpdatedAtUtc,
            summary.Version,
            summary.FirstName,
            summary.LastName,
            summary.ContactPoint,
            summary.Room,
            summary.Phone,
            summary.Email);
    }
}

public sealed record CreateLocalAccountRequest(
    string? Username,
    string? DisplayName,
    string? Role,
    string? Password,
    string? FirstName,
    string? LastName,
    string? ContactPoint,
    string? Room,
    string? Phone,
    string? Email);

public sealed record UpdateLocalAccountRequest(
    string? Username,
    string? DisplayName,
    string? Role,
    string? Version,
    string? FirstName,
    string? LastName,
    string? ContactPoint,
    string? Room,
    string? Phone,
    string? Email);

public sealed record SetLocalAccountActiveRequest(bool IsActive, string? Version);

public sealed record ResetLocalAccountPasswordRequest(string? TemporaryPassword, string? Version);
