using System.Data;
using Cemaris.Application.Identity;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.Maintenance;

public sealed class DevelopmentDatabaseMaintenance
{
    public const string AuthorizedDatabase = "Cemaris_Dev";
    private const string IntegrationTestDatabasePrefix = "Cemaris_IntegrationTests_";
    private readonly CemarisDbContext dbContext;
    private readonly IPasswordHasher<LocalAccountSnapshot> passwordHasher;
    private readonly LocalAccountSecurityOptions securityOptions;
    private readonly TimeProvider timeProvider;
    private readonly string authorizedDatabase;

    public DevelopmentDatabaseMaintenance(
        CemarisDbContext dbContext,
        IPasswordHasher<LocalAccountSnapshot> passwordHasher,
        LocalAccountSecurityOptions securityOptions,
        TimeProvider timeProvider)
        : this(dbContext, passwordHasher, securityOptions, timeProvider, AuthorizedDatabase)
    {
    }

    internal DevelopmentDatabaseMaintenance(
        CemarisDbContext dbContext,
        IPasswordHasher<LocalAccountSnapshot> passwordHasher,
        LocalAccountSecurityOptions securityOptions,
        TimeProvider timeProvider,
        string authorizedDatabase)
    {
        if (!string.Equals(authorizedDatabase, AuthorizedDatabase, StringComparison.Ordinal) &&
            !(authorizedDatabase.StartsWith(IntegrationTestDatabasePrefix, StringComparison.Ordinal) &&
              authorizedDatabase.Length > IntegrationTestDatabasePrefix.Length))
        {
            throw new InvalidOperationException("Der autorisierte Datenbankname ist unzulässig.");
        }

        this.dbContext = dbContext;
        this.passwordHasher = passwordHasher;
        this.securityOptions = securityOptions;
        this.timeProvider = timeProvider;
        this.authorizedDatabase = authorizedDatabase;
    }

    public async Task ApplyMigrationsAsync(
        string? expectedDatabase,
        CancellationToken cancellationToken)
    {
        await ValidateDatabaseAsync(expectedDatabase, requireCurrentSchema: false, cancellationToken);
        await dbContext.Database.MigrateAsync(cancellationToken);
    }

    public async Task<DevelopmentAccountProvisioningResult> EnsureAccountsAsync(
        string? expectedDatabase,
        string? administratorPassword,
        string? caseWorkerPassword,
        CancellationToken cancellationToken)
    {
        await ValidateDatabaseAsync(expectedDatabase, requireCurrentSchema: true, cancellationToken);
        ValidatePassword(administratorPassword, nameof(administratorPassword));
        ValidatePassword(caseWorkerPassword, nameof(caseWorkerPassword));

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var requested = new[]
        {
            new RequestedAccount(
                "admin",
                "Lokale Administration",
                SystemRole.Administration,
                administratorPassword!),
            new RequestedAccount(
                "sach",
                "Lokale Sachbearbeitung",
                SystemRole.Sachbearbeitung,
                caseWorkerPassword!),
        };
        var normalizedNames = requested
            .Select(item => LocalAccountNormalizer.NormalizeUsername(item.Username))
            .ToArray();
        var existing = await dbContext.LocalAccounts
            .AsNoTracking()
            .Where(item => normalizedNames.Contains(item.NormalizedUsername))
            .Select(item => new ExistingAccount(
                item.Username,
                item.NormalizedUsername,
                item.Role,
                item.IsActive))
            .ToArrayAsync(cancellationToken);

        foreach (var account in requested)
        {
            var normalized = LocalAccountNormalizer.NormalizeUsername(account.Username);
            var match = existing.SingleOrDefault(item => item.NormalizedUsername == normalized);
            if (match is not null &&
                (!string.Equals(match.Username, account.Username, StringComparison.Ordinal) ||
                 !string.Equals(match.Role, account.Role.Value, StringComparison.Ordinal) ||
                 !match.IsActive))
            {
                throw new InvalidOperationException(
                    "Die lokale Kontenpflege wurde wegen einer abweichenden bestehenden Kontenzuordnung vollständig abgebrochen.");
            }
        }

        var now = timeProvider.GetUtcNow();
        var created = 0;
        foreach (var account in requested)
        {
            var normalized = LocalAccountNormalizer.NormalizeUsername(account.Username);
            if (existing.Any(item => item.NormalizedUsername == normalized))
            {
                continue;
            }

            var snapshot = new LocalAccountSnapshot(
                Guid.NewGuid(),
                account.Username,
                normalized,
                account.DisplayName,
                account.Role,
                string.Empty,
                true,
                0,
                null,
                false,
                Guid.NewGuid(),
                now,
                now,
                now,
                null,
                []);
            var passwordHash = passwordHasher.HashPassword(snapshot, account.Password);
            dbContext.LocalAccounts.Add(new LocalAccountEntity
            {
                Id = snapshot.Id,
                Username = snapshot.Username,
                NormalizedUsername = snapshot.NormalizedUsername,
                DisplayName = snapshot.DisplayName,
                Role = snapshot.Role.Value,
                PasswordHash = passwordHash,
                IsActive = true,
                FailedLoginAttempts = 0,
                MustChangePassword = false,
                SecurityStamp = snapshot.SecurityStamp,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                PasswordChangedAtUtc = now,
            });
            created++;
        }

        if (created > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return new DevelopmentAccountProvisioningResult(created, requested.Length - created);
    }

    public async Task ValidateDatabaseAsync(
        string? expectedDatabase,
        bool requireCurrentSchema,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(expectedDatabase, authorizedDatabase, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Maintenance:ExpectedDatabase stimmt nicht mit der autorisierten Datenbank überein.");
        }

        if (!dbContext.Database.IsSqlServer())
        {
            throw new InvalidOperationException(
                "Die lokale Development-Wartung ist ausschließlich mit SQL Server zulässig.");
        }

        await dbContext.Database.OpenConnectionAsync(cancellationToken);
        var resolvedDatabase = dbContext.Database.GetDbConnection().Database;
        if (!string.Equals(resolvedDatabase, authorizedDatabase, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Die lokale Development-Wartung wurde wegen eines abweichend aufgelösten Datenbanknamens verweigert.");
        }

        if (requireCurrentSchema &&
            (await dbContext.Database.GetPendingMigrationsAsync(cancellationToken)).Any())
        {
            throw new InvalidOperationException(
                "Die lokale Development-Wartung erfordert ein vollständig migriertes Schema.");
        }
    }

    private void ValidatePassword(string? password, string parameterName)
    {
        if (string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException(
                $"Das lokale Secret für {parameterName} fehlt.");
        }

        if (password.Length < securityOptions.PasswordMinimumLength ||
            password.Length > securityOptions.PasswordMaximumLength)
        {
            throw new InvalidOperationException(
                $"Das lokale Secret für {parameterName} verletzt die konfigurierte Passwortlänge.");
        }
    }

    private sealed record RequestedAccount(
        string Username,
        string DisplayName,
        SystemRole Role,
        string Password);

    private sealed record ExistingAccount(
        string Username,
        string NormalizedUsername,
        string Role,
        bool IsActive);
}

public sealed record DevelopmentAccountProvisioningResult(int Created, int Preserved);
