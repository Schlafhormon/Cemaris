namespace Cemaris.Domain.Cases;

public sealed class CaseValidationException(IReadOnlyDictionary<string, string[]> errors)
    : Exception("Die Fallaktendaten sind ungültig.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}
