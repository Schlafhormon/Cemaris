namespace Cemaris.Application.Identity;

public interface ILocalAccountStore
{
    Task<int> CountAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<LocalAccountSnapshot>> ListAsync(CancellationToken cancellationToken);
    Task<LocalAccountSnapshot?> FindByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<LocalAccountSnapshot?> FindByNormalizedUsernameAsync(string normalizedUsername, CancellationToken cancellationToken);
    Task<LocalAccountOperationResult> CreateAsync(LocalAccountSnapshot account, CancellationToken cancellationToken);
    Task<LocalAccountOperationResult> CreateFirstAdministratorAsync(LocalAccountSnapshot account, CancellationToken cancellationToken);
    Task<LocalAccountSnapshot?> RegisterFailedLoginAsync(string normalizedUsername, DateTimeOffset occurredAtUtc, int maximumAttempts, TimeSpan lockoutDuration, CancellationToken cancellationToken);
    Task<LocalAccountOperationResult> CompleteSuccessfulLoginAsync(Guid accountId, string? rehashedPassword, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken);
    Task<LocalAccountOperationResult> ChangePasswordAsync(Guid accountId, byte[] expectedVersion, string passwordHash, bool mustChangePassword, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken);
    Task<LocalAccountOperationResult> UpdateAsync(Guid actorId, Guid accountId, byte[] expectedVersion, string username, string normalizedUsername, string displayName, SystemRole role, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken);
    Task<LocalAccountOperationResult> SetActiveAsync(Guid actorId, Guid accountId, byte[] expectedVersion, bool isActive, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken);
}
