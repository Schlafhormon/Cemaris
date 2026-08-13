using System.Text;

namespace Cemaris.Application.Cases;

public static class PossibleDuplicateMatcher
{
    public static IReadOnlyList<PossibleDeceasedDuplicate> Find(
        IEnumerable<DeceasedDetails> existing,
        DeceasedDetails candidate)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(candidate);

        return existing
            .Where(item => IsPossibleDuplicate(item, candidate))
            .Select(item => new PossibleDeceasedDuplicate(
                item.Id,
                DisplayName(item),
                item.BirthDate,
                item.DeathDate))
            .ToArray();
    }

    public static bool IsPossibleDuplicate(DeceasedDetails left, DeceasedDetails right)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);

        var leftFirst = Normalize(left.FirstName);
        var rightFirst = Normalize(right.FirstName);
        var leftLast = Normalize(left.LastName);
        var rightLast = Normalize(right.LastName);

        var matchingNamePart = MatchesPresent(leftFirst, rightFirst)
            || MatchesPresent(leftLast, rightLast);
        if (!matchingNamePart
            || Contradicts(leftFirst, rightFirst)
            || Contradicts(leftLast, rightLast)
            || Contradicts(left.BirthDate, right.BirthDate)
            || Contradicts(left.DeathDate, right.DeathDate))
        {
            return false;
        }

        return true;
    }

    private static string DisplayName(DeceasedDetails person)
    {
        var value = string.Join(' ', new[] { person.FirstName, person.LastName }
            .Where(part => !string.IsNullOrWhiteSpace(part)));
        return value.Length == 0 ? "Name nicht angegeben" : value;
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return string.Join(' ', value
                .Normalize(NormalizationForm.FormKC)
                .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .ToUpperInvariant();
    }

    private static bool MatchesPresent(string? left, string? right) =>
        left is not null && right is not null && left == right;

    private static bool Contradicts<T>(T? left, T? right)
        where T : struct =>
        left.HasValue && right.HasValue && !EqualityComparer<T>.Default.Equals(left.Value, right.Value);

    private static bool Contradicts(string? left, string? right) =>
        left is not null && right is not null && left != right;
}
