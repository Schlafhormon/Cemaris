using System.Data;
using Cemaris.Application.Identity;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.Identity;

public sealed class EfLocalAccountStore(CemarisDbContext dbContext) : ILocalAccountStore
{
    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.LocalAccounts.CountAsync(cancellationToken);

    public async Task<IReadOnlyList<LocalAccountSnapshot>> ListAsync(CancellationToken cancellationToken) =>
        (await dbContext.LocalAccounts.AsNoTracking()
            .OrderBy(item => item.NormalizedUsername)
            .ToArrayAsync(cancellationToken))
        .Select(Map).ToArray();

    public async Task<LocalAccountSnapshot?> FindByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await dbContext.LocalAccounts.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return entity is null ? null : Map(entity);
    }

    public async Task<LocalAccountSnapshot?> FindByNormalizedUsernameAsync(
        string normalizedUsername,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.LocalAccounts.AsNoTracking()
            .SingleOrDefaultAsync(item => item.NormalizedUsername == normalizedUsername, cancellationToken);
        return entity is null ? null : Map(entity);
    }

    public async Task<LocalAccountOperationResult> CreateAsync(
        LocalAccountSnapshot account,
        CancellationToken cancellationToken)
    {
        var entity = Map(account);
        dbContext.LocalAccounts.Add(entity);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return Success(entity);
        }
        catch (DbUpdateException exception) when (IsUniqueConstraint(exception))
        {
            dbContext.Entry(entity).State = EntityState.Detached;
            return new(LocalAccountOperationStatus.DuplicateUsername);
        }
    }

    public async Task<LocalAccountOperationResult> CreateFirstAdministratorAsync(
        LocalAccountSnapshot account,
        CancellationToken cancellationToken)
    {
        if (account.Role != SystemRole.Administration)
        {
            throw new InvalidOperationException("The bootstrap account must be an administrator.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);
        await AcquireAdministratorLifecycleLockAsync(cancellationToken);
        if (await dbContext.LocalAccounts.AnyAsync(cancellationToken))
        {
            await transaction.CommitAsync(cancellationToken);
            return new(LocalAccountOperationStatus.AccountsAlreadyExist);
        }

        var entity = Map(account);
        dbContext.LocalAccounts.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Success(entity);
    }

    public async Task<LocalAccountSnapshot?> RegisterFailedLoginAsync(
        string normalizedUsername,
        DateTimeOffset occurredAtUtc,
        int maximumAttempts,
        TimeSpan lockoutDuration,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);
        var entity = await dbContext.LocalAccounts.SingleOrDefaultAsync(
            item => item.NormalizedUsername == normalizedUsername,
            cancellationToken);
        if (entity is null || !entity.IsActive || entity.LockoutEndUtc > occurredAtUtc)
        {
            await transaction.CommitAsync(cancellationToken);
            return entity is null ? null : Map(entity);
        }

        var previousAttempts = entity.LockoutEndUtc is not null && entity.LockoutEndUtc <= occurredAtUtc
            ? 0
            : entity.FailedLoginAttempts;
        entity.FailedLoginAttempts = Math.Min(maximumAttempts, previousAttempts + 1);
        if (entity.FailedLoginAttempts >= maximumAttempts)
        {
            entity.LockoutEndUtc = occurredAtUtc.Add(lockoutDuration);
        }
        entity.UpdatedAtUtc = occurredAtUtc;
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<LocalAccountOperationResult> CompleteSuccessfulLoginAsync(
        Guid accountId,
        string? rehashedPassword,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.LocalAccounts.SingleOrDefaultAsync(
            item => item.Id == accountId,
            cancellationToken);
        if (entity is null || !entity.IsActive)
        {
            return new(LocalAccountOperationStatus.NotFound);
        }

        entity.FailedLoginAttempts = 0;
        entity.LockoutEndUtc = null;
        entity.LastLoginAtUtc = occurredAtUtc;
        entity.UpdatedAtUtc = occurredAtUtc;
        if (rehashedPassword is not null)
        {
            entity.PasswordHash = rehashedPassword;
            entity.PasswordChangedAtUtc = occurredAtUtc;
            entity.SecurityStamp = Guid.NewGuid();
        }
        await dbContext.SaveChangesAsync(cancellationToken);
        return Success(entity);
    }

    public async Task<LocalAccountOperationResult> ChangePasswordAsync(
        Guid accountId,
        byte[] expectedVersion,
        string passwordHash,
        bool mustChangePassword,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.LocalAccounts.SingleOrDefaultAsync(
            item => item.Id == accountId,
            cancellationToken);
        var status = CheckVersion(entity, expectedVersion);
        if (status is not null)
        {
            return new(status.Value);
        }

        entity!.PasswordHash = passwordHash;
        entity.MustChangePassword = mustChangePassword;
        entity.PasswordChangedAtUtc = occurredAtUtc;
        entity.UpdatedAtUtc = occurredAtUtc;
        entity.FailedLoginAttempts = 0;
        entity.LockoutEndUtc = null;
        entity.SecurityStamp = Guid.NewGuid();
        return await SaveVersionedAsync(entity, cancellationToken);
    }

    public async Task<LocalAccountOperationResult> UpdateAsync(
        Guid actorId,
        Guid accountId,
        byte[] expectedVersion,
        string username,
        string normalizedUsername,
        string displayName,
        SystemRole role,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);
        await AcquireAdministratorLifecycleLockAsync(cancellationToken);
        var entity = await dbContext.LocalAccounts.SingleOrDefaultAsync(
            item => item.Id == accountId,
            cancellationToken);
        var status = CheckVersion(entity, expectedVersion);
        if (status is not null)
        {
            return new(status.Value);
        }

        if (entity!.IsActive
            && entity.Role == SystemRole.Administration.Value
            && role != SystemRole.Administration
            && await ActiveAdministratorCountAsync(cancellationToken) <= 1)
        {
            return new(LocalAccountOperationStatus.LastActiveAdministrator);
        }

        entity.Username = username;
        entity.NormalizedUsername = normalizedUsername;
        entity.DisplayName = displayName;
        entity.Role = role.Value;
        entity.UpdatedAtUtc = occurredAtUtc;
        entity.SecurityStamp = Guid.NewGuid();
        try
        {
            var result = await SaveVersionedAsync(entity, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return result;
        }
        catch (DbUpdateException exception) when (IsUniqueConstraint(exception))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(LocalAccountOperationStatus.DuplicateUsername);
        }
        catch (DbUpdateException exception) when (IsDeadlock(exception))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(LocalAccountOperationStatus.ConcurrencyConflict);
        }
        catch (SqlException exception) when (exception.Number == 1205)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(LocalAccountOperationStatus.ConcurrencyConflict);
        }
    }

    public async Task<LocalAccountOperationResult> SetActiveAsync(
        Guid actorId,
        Guid accountId,
        byte[] expectedVersion,
        bool isActive,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        if (!isActive && actorId == accountId)
        {
            return new(LocalAccountOperationStatus.SelfDeactivation);
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);
        await AcquireAdministratorLifecycleLockAsync(cancellationToken);
        var entity = await dbContext.LocalAccounts.SingleOrDefaultAsync(
            item => item.Id == accountId,
            cancellationToken);
        var status = CheckVersion(entity, expectedVersion);
        if (status is not null)
        {
            return new(status.Value);
        }

        if (!isActive && entity!.IsActive
            && entity.Role == SystemRole.Administration.Value
            && await ActiveAdministratorCountAsync(cancellationToken) <= 1)
        {
            return new(LocalAccountOperationStatus.LastActiveAdministrator);
        }

        entity!.IsActive = isActive;
        entity.UpdatedAtUtc = occurredAtUtc;
        entity.SecurityStamp = Guid.NewGuid();
        if (isActive)
        {
            entity.FailedLoginAttempts = 0;
            entity.LockoutEndUtc = null;
        }
        try
        {
            var result = await SaveVersionedAsync(entity, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return result;
        }
        catch (DbUpdateException exception) when (IsDeadlock(exception))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(LocalAccountOperationStatus.ConcurrencyConflict);
        }
        catch (SqlException exception) when (exception.Number == 1205)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(LocalAccountOperationStatus.ConcurrencyConflict);
        }
    }

    private Task<int> ActiveAdministratorCountAsync(CancellationToken cancellationToken) =>
        dbContext.LocalAccounts.CountAsync(
            item => item.IsActive && item.Role == SystemRole.Administration.Value,
            cancellationToken);

    private Task<int> AcquireAdministratorLifecycleLockAsync(CancellationToken cancellationToken) =>
        dbContext.Database.ExecuteSqlRawAsync(
            "DECLARE @result int; EXEC @result = sys.sp_getapplock @Resource = N'Cemaris.LocalAccounts.AdministratorLifecycle', @LockMode = N'Exclusive', @LockOwner = N'Transaction', @LockTimeout = 30000; IF @result < 0 THROW 51000, 'Cemaris local-account lifecycle lock failed.', 1;",
            cancellationToken);

    private async Task<LocalAccountOperationResult> SaveVersionedAsync(
        LocalAccountEntity entity,
        CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return Success(entity);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new(LocalAccountOperationStatus.ConcurrencyConflict);
        }
    }

    private static LocalAccountOperationStatus? CheckVersion(
        LocalAccountEntity? entity,
        byte[] expectedVersion) =>
        entity is null
            ? LocalAccountOperationStatus.NotFound
            : !entity.Version.AsSpan().SequenceEqual(expectedVersion)
                ? LocalAccountOperationStatus.ConcurrencyConflict
                : null;

    private static bool IsUniqueConstraint(DbUpdateException exception) =>
        FindSqlException(exception) is { Number: 2601 or 2627 };

    private static bool IsDeadlock(DbUpdateException exception) =>
        FindSqlException(exception) is { Number: 1205 };

    private static SqlException? FindSqlException(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException!)
        {
            if (current is SqlException sqlException)
            {
                return sqlException;
            }

            if (current.InnerException is null)
            {
                break;
            }
        }

        return null;
    }

    private static LocalAccountOperationResult Success(LocalAccountEntity entity) =>
        new(LocalAccountOperationStatus.Success, Map(entity));

    private static LocalAccountSnapshot Map(LocalAccountEntity entity) => new(
        entity.Id, entity.Username, entity.NormalizedUsername, entity.DisplayName,
        SystemRole.Parse(entity.Role), entity.PasswordHash, entity.IsActive,
        entity.FailedLoginAttempts, entity.LockoutEndUtc, entity.MustChangePassword,
        entity.SecurityStamp, entity.CreatedAtUtc, entity.UpdatedAtUtc,
        entity.PasswordChangedAtUtc, entity.LastLoginAtUtc, entity.Version.ToArray());

    private static LocalAccountEntity Map(LocalAccountSnapshot account) => new()
    {
        Id = account.Id,
        Username = account.Username,
        NormalizedUsername = account.NormalizedUsername,
        DisplayName = account.DisplayName,
        Role = account.Role.Value,
        PasswordHash = account.PasswordHash,
        IsActive = account.IsActive,
        FailedLoginAttempts = account.FailedLoginAttempts,
        LockoutEndUtc = account.LockoutEndUtc,
        MustChangePassword = account.MustChangePassword,
        SecurityStamp = account.SecurityStamp,
        CreatedAtUtc = account.CreatedAtUtc,
        UpdatedAtUtc = account.UpdatedAtUtc,
        PasswordChangedAtUtc = account.PasswordChangedAtUtc,
        LastLoginAtUtc = account.LastLoginAtUtc,
    };
}
