using Cemaris.Application.Identity;

namespace Cemaris.IntegrationTests;

internal sealed class TestLocalAccountStore(IEnumerable<LocalAccountSnapshot> seed) : ILocalAccountStore
{
    private readonly Lock gate = new();
    private readonly Dictionary<Guid, LocalAccountSnapshot> accounts = seed.ToDictionary(item => item.Id);
    private long version = 10;

    public Task<int> CountAsync(CancellationToken cancellationToken) { lock (gate) return Task.FromResult(accounts.Count); }
    public Task<IReadOnlyList<LocalAccountSnapshot>> ListAsync(CancellationToken cancellationToken) { lock (gate) return Task.FromResult<IReadOnlyList<LocalAccountSnapshot>>(accounts.Values.OrderBy(item => item.NormalizedUsername).ToArray()); }
    public Task<LocalAccountSnapshot?> FindByIdAsync(Guid id, CancellationToken cancellationToken) { lock (gate) return Task.FromResult(accounts.GetValueOrDefault(id)); }
    public Task<LocalAccountSnapshot?> FindByNormalizedUsernameAsync(string normalizedUsername, CancellationToken cancellationToken) { lock (gate) return Task.FromResult(accounts.Values.SingleOrDefault(item => item.NormalizedUsername == normalizedUsername)); }

    public Task<LocalAccountOperationResult> CreateAsync(LocalAccountSnapshot account, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            if (accounts.Values.Any(item => item.NormalizedUsername == account.NormalizedUsername)) return Task.FromResult(new LocalAccountOperationResult(LocalAccountOperationStatus.DuplicateUsername));
            var saved = Next(account);
            accounts.Add(saved.Id, saved);
            return Task.FromResult(new LocalAccountOperationResult(LocalAccountOperationStatus.Success, saved));
        }
    }
    public Task<LocalAccountOperationResult> CreateFirstAdministratorAsync(LocalAccountSnapshot account, CancellationToken cancellationToken) { lock (gate) { if (accounts.Count > 0) return Result(LocalAccountOperationStatus.AccountsAlreadyExist); var saved = Next(account); accounts.Add(saved.Id, saved); return Result(LocalAccountOperationStatus.Success, saved); } }

    public Task<LocalAccountSnapshot?> RegisterFailedLoginAsync(string normalizedUsername, DateTimeOffset occurredAtUtc, int maximumAttempts, TimeSpan lockoutDuration, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            var account = accounts.Values.SingleOrDefault(item => item.NormalizedUsername == normalizedUsername);
            if (account is null) return Task.FromResult<LocalAccountSnapshot?>(null);
            var previousAttempts = account.LockoutEndUtc is not null && account.LockoutEndUtc <= occurredAtUtc ? 0 : account.FailedLoginAttempts;
            var attempts = Math.Min(maximumAttempts, previousAttempts + 1);
            var changed = Next(account with { FailedLoginAttempts = attempts, LockoutEndUtc = attempts >= maximumAttempts ? occurredAtUtc.Add(lockoutDuration) : null, UpdatedAtUtc = occurredAtUtc });
            accounts[changed.Id] = changed;
            return Task.FromResult<LocalAccountSnapshot?>(changed);
        }
    }

    public Task<LocalAccountOperationResult> CompleteSuccessfulLoginAsync(Guid accountId, string? rehashedPassword, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            if (!accounts.TryGetValue(accountId, out var account) || !account.IsActive) return Result(LocalAccountOperationStatus.NotFound);
            var changed = Next(account with { FailedLoginAttempts = 0, LockoutEndUtc = null, LastLoginAtUtc = occurredAtUtc, UpdatedAtUtc = occurredAtUtc, PasswordHash = rehashedPassword ?? account.PasswordHash, SecurityStamp = rehashedPassword is null ? account.SecurityStamp : Guid.NewGuid() });
            accounts[accountId] = changed;
            return Result(LocalAccountOperationStatus.Success, changed);
        }
    }

    public Task<LocalAccountOperationResult> ChangePasswordAsync(Guid accountId, byte[] expectedVersion, string passwordHash, bool mustChangePassword, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            var check = Check(accountId, expectedVersion, out var account); if (check is not null) return Result(check.Value);
            var changed = Next(account! with { PasswordHash = passwordHash, MustChangePassword = mustChangePassword, PasswordChangedAtUtc = occurredAtUtc, UpdatedAtUtc = occurredAtUtc, FailedLoginAttempts = 0, LockoutEndUtc = null, SecurityStamp = Guid.NewGuid() }); accounts[accountId] = changed; return Result(LocalAccountOperationStatus.Success, changed);
        }
    }

    public Task<LocalAccountOperationResult> UpdateAsync(Guid actorId, Guid accountId, byte[] expectedVersion, string username, string normalizedUsername, string displayName, SystemRole role, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            var check = Check(accountId, expectedVersion, out var account); if (check is not null) return Result(check.Value);
            if (accounts.Values.Any(item => item.Id != accountId && item.NormalizedUsername == normalizedUsername)) return Result(LocalAccountOperationStatus.DuplicateUsername);
            if (account!.IsActive && account.Role == SystemRole.Administration && role != SystemRole.Administration && ActiveAdmins() <= 1) return Result(LocalAccountOperationStatus.LastActiveAdministrator);
            var changed = Next(account with { Username = username, NormalizedUsername = normalizedUsername, DisplayName = displayName, Role = role, UpdatedAtUtc = occurredAtUtc, SecurityStamp = Guid.NewGuid() }); accounts[accountId] = changed; return Result(LocalAccountOperationStatus.Success, changed);
        }
    }

    public Task<LocalAccountOperationResult> SetActiveAsync(Guid actorId, Guid accountId, byte[] expectedVersion, bool isActive, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken)
    {
        lock (gate)
        {
            if (!isActive && actorId == accountId) return Result(LocalAccountOperationStatus.SelfDeactivation);
            var check = Check(accountId, expectedVersion, out var account); if (check is not null) return Result(check.Value);
            if (!isActive && account!.IsActive && account.Role == SystemRole.Administration && ActiveAdmins() <= 1) return Result(LocalAccountOperationStatus.LastActiveAdministrator);
            var changed = Next(account! with { IsActive = isActive, UpdatedAtUtc = occurredAtUtc, SecurityStamp = Guid.NewGuid(), FailedLoginAttempts = isActive ? 0 : account.FailedLoginAttempts, LockoutEndUtc = isActive ? null : account.LockoutEndUtc }); accounts[accountId] = changed; return Result(LocalAccountOperationStatus.Success, changed);
        }
    }

    private int ActiveAdmins() => accounts.Values.Count(item => item.IsActive && item.Role == SystemRole.Administration);
    private LocalAccountOperationStatus? Check(Guid id, byte[] expected, out LocalAccountSnapshot? account) { account = accounts.GetValueOrDefault(id); return account is null ? LocalAccountOperationStatus.NotFound : !account.Version.SequenceEqual(expected) ? LocalAccountOperationStatus.ConcurrencyConflict : null; }
    private LocalAccountSnapshot Next(LocalAccountSnapshot account) => account with { Version = BitConverter.GetBytes(++version) };
    private static Task<LocalAccountOperationResult> Result(LocalAccountOperationStatus status, LocalAccountSnapshot? account = null) => Task.FromResult(new LocalAccountOperationResult(status, account));
}
