namespace Cemaris.Application.Cases;

public sealed class SearchValidationException(IReadOnlyDictionary<string, string[]> errors)
    : Exception("Die Suchfilter sind ungültig.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}
