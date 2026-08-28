using Cemaris.Application.Identity;

namespace Cemaris.Application.NoticeGeneration;

public sealed record LegalBasisVersionView(
    Guid Id,
    string Name,
    DateOnly VersionDate,
    bool IsActive,
    long Version,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record CreateLegalBasisVersionCommand(string? Name, DateOnly VersionDate);
public sealed record SetLegalBasisActiveCommand(bool IsActive);

public enum LegalBasisMutationOutcome { Success, NotFound, VersionConflict, Duplicate }

public sealed record LegalBasisMutationResult(
    LegalBasisMutationOutcome Outcome,
    Guid Id,
    long Version = 0);

public sealed record LegalBasisMutation(
    Guid Id,
    Guid LegalBasisVersionId,
    long ResultingVersion,
    string Operation,
    DateTimeOffset OccurredAtUtc,
    ActorIdentity Actor);

public interface ILegalBasisVersionStore
{
    Task<IReadOnlyList<LegalBasisVersionView>> ReadAsync(bool activeOnly, CancellationToken token);
    Task<LegalBasisVersionView?> FindAsync(Guid id, CancellationToken token);
    Task<LegalBasisMutationResult> CreateAsync(Guid id, string name, DateOnly versionDate, LegalBasisMutation mutation, CancellationToken token);
    Task<LegalBasisMutationResult> SetActiveAsync(Guid id, long expectedVersion, bool isActive, LegalBasisMutation mutation, CancellationToken token);
}

public sealed class LegalBasisValidationException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}

public sealed class LegalBasisVersionService(
    ILegalBasisVersionStore store,
    ICurrentActorProvider actors,
    TimeProvider timeProvider)
{
    public Task<IReadOnlyList<LegalBasisVersionView>> ReadAsync(bool activeOnly, CancellationToken token) =>
        store.ReadAsync(activeOnly, token);

    public async Task<LegalBasisVersionView?> FindAsync(Guid id, CancellationToken token) =>
        await store.FindAsync(id, token);

    public Task<LegalBasisMutationResult> CreateAsync(CreateLegalBasisVersionCommand command, CancellationToken token)
    {
        var name = CleanName(command.Name);
        if (command.VersionDate == default)
            throw new LegalBasisValidationException("versionDate", "Ein gültiger Versionsstand ist erforderlich.");
        var id = Guid.NewGuid();
        return store.CreateAsync(id, name, command.VersionDate, Mutation(id, 1, "Created"), token);
    }

    public Task<LegalBasisMutationResult> SetActiveAsync(Guid id, long expectedVersion, SetLegalBasisActiveCommand command, CancellationToken token) =>
        store.SetActiveAsync(id, expectedVersion, command.IsActive, Mutation(id, expectedVersion + 1, command.IsActive ? "Activated" : "Deactivated"), token);

    private static string CleanName(string? value)
    {
        var clean = value?.Trim() ?? string.Empty;
        if (clean.Length is 0 or > 300 || clean.Any(char.IsControl))
            throw new LegalBasisValidationException("name", "Der Satzungsname muss 1 bis 300 Zeichen lang sein und darf keine Steuerzeichen enthalten.");
        return clean;
    }

    private LegalBasisMutation Mutation(Guid id, long version, string operation) => new(
        Guid.NewGuid(), id, version, operation, timeProvider.GetUtcNow(), actors.Current);
}
