using Microsoft.AspNetCore.Identity;

namespace Cemaris.Application.Identity;

public sealed class LocalAccountService(
    ILocalAccountStore store,
    IPasswordHasher<LocalAccountSnapshot> passwordHasher,
    TimeProvider timeProvider,
    LocalAccountSecurityOptions options)
{
    public async Task<LocalAuthenticationResult> AuthenticateAsync(
        string? username,
        string? password,
        CancellationToken cancellationToken)
    {
        if (!TryNormalizeUsername(username, out _, out var normalizedUsername) || password is null)
        {
            return new LocalAuthenticationResult(false);
        }

        var account = await store.FindByNormalizedUsernameAsync(normalizedUsername, cancellationToken);
        var now = timeProvider.GetUtcNow();
        if (account is null || !account.IsActive || account.LockoutEndUtc > now)
        {
            return new LocalAuthenticationResult(false);
        }

        var verification = passwordHasher.VerifyHashedPassword(account, account.PasswordHash, password);
        if (verification == PasswordVerificationResult.Failed)
        {
            await store.RegisterFailedLoginAsync(
                normalizedUsername,
                now,
                options.MaximumFailedLoginAttempts,
                options.LockoutDuration,
                cancellationToken);
            return new LocalAuthenticationResult(false);
        }

        var rehashedPassword = verification == PasswordVerificationResult.SuccessRehashNeeded
            ? passwordHasher.HashPassword(account, password)
            : null;
        var completed = await store.CompleteSuccessfulLoginAsync(
            account.Id,
            rehashedPassword,
            now,
            cancellationToken);
        return completed.Status == LocalAccountOperationStatus.Success && completed.Account is not null
            ? new LocalAuthenticationResult(true, completed.Account)
            : new LocalAuthenticationResult(false);
    }

    public async Task<LocalAccountSnapshot> CreateAsync(
        CreateLocalAccountCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var (username, normalizedUsername, displayName, role) = ValidateAccountFields(
            command.Username,
            command.DisplayName,
            command.Role);
        ValidatePassword(command.Password);

        var now = timeProvider.GetUtcNow();
        var account = new LocalAccountSnapshot(
            Guid.NewGuid(), username, normalizedUsername, displayName, role, string.Empty,
            true, 0, null, true, Guid.NewGuid(), now, now, now, null, []);
        account = account with { PasswordHash = passwordHasher.HashPassword(account, command.Password!) };

        var result = await store.CreateAsync(account, cancellationToken);
        return result.Status switch
        {
            LocalAccountOperationStatus.Success when result.Account is not null => result.Account,
            LocalAccountOperationStatus.DuplicateUsername => throw DuplicateUsername(),
            _ => throw new InvalidOperationException("Das lokale Konto konnte nicht angelegt werden."),
        };
    }

    public async Task<LocalAccountOperationResult> UpdateAsync(
        Guid actorId,
        Guid accountId,
        UpdateLocalAccountCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var (username, normalizedUsername, displayName, role) = ValidateAccountFields(
            command.Username,
            command.DisplayName,
            command.Role);
        var result = await store.UpdateAsync(
            actorId, accountId, command.ExpectedVersion, username, normalizedUsername,
            displayName, role, timeProvider.GetUtcNow(), cancellationToken);
        return result.Status == LocalAccountOperationStatus.DuplicateUsername
            ? throw DuplicateUsername()
            : result;
    }

    public Task<LocalAccountOperationResult> SetActiveAsync(
        Guid actorId,
        Guid accountId,
        byte[] expectedVersion,
        bool isActive,
        CancellationToken cancellationToken) =>
        store.SetActiveAsync(
            actorId, accountId, expectedVersion, isActive,
            timeProvider.GetUtcNow(), cancellationToken);

    public async Task<LocalAccountOperationResult> ChangeOwnPasswordAsync(
        Guid accountId,
        string? currentPassword,
        string? newPassword,
        CancellationToken cancellationToken)
    {
        ValidatePassword(newPassword);
        var account = await store.FindByIdAsync(accountId, cancellationToken);
        if (account is null || !account.IsActive || currentPassword is null
            || passwordHasher.VerifyHashedPassword(account, account.PasswordHash, currentPassword)
                == PasswordVerificationResult.Failed)
        {
            return new LocalAccountOperationResult(LocalAccountOperationStatus.NotFound);
        }

        var hash = passwordHasher.HashPassword(account, newPassword!);
        return await store.ChangePasswordAsync(
            account.Id, account.Version, hash, false, timeProvider.GetUtcNow(), cancellationToken);
    }

    public async Task<LocalAccountOperationResult> ResetPasswordAsync(
        Guid accountId,
        byte[] expectedVersion,
        string? temporaryPassword,
        CancellationToken cancellationToken)
    {
        ValidatePassword(temporaryPassword);
        var account = await store.FindByIdAsync(accountId, cancellationToken);
        if (account is null)
        {
            return new LocalAccountOperationResult(LocalAccountOperationStatus.NotFound);
        }

        var hash = passwordHasher.HashPassword(account, temporaryPassword!);
        return await store.ChangePasswordAsync(
            accountId, expectedVersion, hash, true, timeProvider.GetUtcNow(), cancellationToken);
    }

    public Task<IReadOnlyList<LocalAccountSnapshot>> ListAsync(CancellationToken cancellationToken) =>
        store.ListAsync(cancellationToken);

    public Task<LocalAccountSnapshot?> FindByIdAsync(Guid id, CancellationToken cancellationToken) =>
        store.FindByIdAsync(id, cancellationToken);

    public async Task<LocalAccountSnapshot> BootstrapFirstAdministratorAsync(
        string? username,
        string? displayName,
        string? password,
        CancellationToken cancellationToken)
    {
        var (validatedUsername, normalizedUsername, validatedDisplayName, role) =
            ValidateAccountFields(username, displayName, SystemRole.Administration.Value);
        ValidatePassword(password);
        var now = timeProvider.GetUtcNow();
        var account = new LocalAccountSnapshot(
            Guid.NewGuid(), validatedUsername, normalizedUsername, validatedDisplayName, role,
            string.Empty, true, 0, null, false, Guid.NewGuid(), now, now, now, null, []);
        account = account with { PasswordHash = passwordHasher.HashPassword(account, password!) };
        var result = await store.CreateFirstAdministratorAsync(account, cancellationToken);
        return result.Status switch
        {
            LocalAccountOperationStatus.Success when result.Account is not null => result.Account,
            LocalAccountOperationStatus.AccountsAlreadyExist => throw new InvalidOperationException(
                "Bootstrap is permitted only while no local account exists."),
            _ => throw new InvalidOperationException("The first local administrator could not be created."),
        };
    }

    public static LocalAccountSummary ToSummary(LocalAccountSnapshot account) => new(
        account.Id, account.Username, account.DisplayName, account.Role, account.IsActive,
        account.MustChangePassword, account.CreatedAtUtc, account.UpdatedAtUtc,
        LocalAccountVersion.Encode(account.Version));

    private void ValidatePassword(string? password)
    {
        if (password is null
            || password.Length < options.PasswordMinimumLength
            || password.Length > options.PasswordMaximumLength)
        {
            throw new LocalAccountValidationException(
                new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
                {
                    ["password"] =
                    [$"Das Passwort muss {options.PasswordMinimumLength} bis {options.PasswordMaximumLength} Zeichen lang sein."],
                });
        }
    }

    private static (string Username, string NormalizedUsername, string DisplayName, SystemRole Role)
        ValidateAccountFields(string? usernameValue, string? displayNameValue, string? roleValue)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        if (!TryNormalizeUsername(usernameValue, out var username, out var normalizedUsername))
        {
            errors["username"] = ["Der Benutzername muss 1 bis 100 Zeichen lang sein."];
        }

        var displayName = displayNameValue?.Trim() ?? string.Empty;
        if (displayName.Length is 0 or > LocalAccountLimits.DisplayNameMaximumLength)
        {
            errors["displayName"] = ["Der Anzeigename muss 1 bis 200 Zeichen lang sein."];
        }

        SystemRole? role = null;
        try
        {
            role = roleValue is null ? null : SystemRole.Parse(roleValue);
        }
        catch (ArgumentOutOfRangeException)
        {
            // Converted into a field error below.
        }

        if (role is null)
        {
            errors["role"] = ["Die Rolle muss Sachbearbeitung oder Administration sein."];
        }

        if (errors.Count > 0)
        {
            throw new LocalAccountValidationException(errors);
        }

        return (username, normalizedUsername, displayName, role!);
    }

    private static bool TryNormalizeUsername(
        string? value,
        out string username,
        out string normalizedUsername)
    {
        username = value?.Trim() ?? string.Empty;
        normalizedUsername = username.Length > 0
            ? LocalAccountNormalizer.NormalizeUsername(username)
            : string.Empty;
        return username.Length is > 0 and <= LocalAccountLimits.UsernameMaximumLength;
    }

    private static LocalAccountValidationException DuplicateUsername() =>
        new(new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["username"] = ["Dieser Benutzername ist bereits vergeben."],
        });
}
