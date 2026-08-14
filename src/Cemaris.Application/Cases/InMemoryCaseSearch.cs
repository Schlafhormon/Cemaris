namespace Cemaris.Application.Cases;

/// <summary>
/// Applies the MVP search semantics to bounded or synthetic in-memory data.
/// Database-backed stores implement the same contract server-side.
/// </summary>
public static class InMemoryCaseSearch
{
    public static CaseSearchStoreResult Search(
        IEnumerable<CaseOverview> cases,
        SearchCriteria criteria,
        int maximumResults,
        int offset = 0)
    {
        ArgumentNullException.ThrowIfNull(cases);
        ArgumentNullException.ThrowIfNull(criteria);

        var rankedCases = cases
            .Select(caseOverview => Evaluate(caseOverview, criteria))
            .Where(result => result is not null)
            .Select(result => result!)
            .OrderBy(result => result.WorstMatchTier)
            .ThenByDescending(result => result.MatchingValueCount)
            .ThenBy(result => result.CaseOverview.Grave.Cemetery ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ThenBy(result => result.CaseOverview.Grave.Field ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ThenBy(result => result.CaseOverview.Grave.GraveNumber ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ThenBy(result => result.CaseOverview.Id)
            .ToArray();

        return new CaseSearchStoreResult(
            rankedCases.Skip(offset).Take(maximumResults).Select(result => result.CaseOverview).ToArray(),
            rankedCases.Length);
    }

    private static RankedCase? Evaluate(CaseOverview caseOverview, SearchCriteria criteria)
    {
        var evaluations = new List<MatchEvaluation>();

        if (!TryAddTextEvaluation(
                criteria.Name,
                caseOverview.DeceasedPersons.Select(person => person.LastName),
                evaluations)
            || !TryAddTextEvaluation(
                criteria.FirstName,
                caseOverview.DeceasedPersons.Select(person => person.FirstName),
                evaluations)
            || !TryAddDateEvaluation(
                criteria.BirthDate,
                caseOverview.DeceasedPersons.Select(person => person.BirthDate),
                evaluations)
            || !TryAddDateEvaluation(
                criteria.DeathDate,
                caseOverview.DeceasedPersons.Select(person => person.DeathDate),
                evaluations)
            || !TryAddTextEvaluation(criteria.Cemetery, [caseOverview.Grave.Cemetery], evaluations)
            || !TryAddTextEvaluation(criteria.Field, [caseOverview.Grave.Field], evaluations)
            || !TryAddTextEvaluation(criteria.GraveNumber, [caseOverview.Grave.GraveNumber], evaluations)
            || !TryAddDateEvaluation(
                criteria.BurialDate,
                caseOverview.Burials.Select(burial => burial.BurialDate),
                evaluations)
            || !TryAddTextEvaluation(
                criteria.EntitledPerson,
                caseOverview.EntitledPersons.SelectMany(GetEntitledPersonSearchValues),
                evaluations)
            || !TryAddTextEvaluation(
                criteria.Address,
                caseOverview.EntitledPersons
                    .SelectMany(person => person.Addresses)
                    .SelectMany(GetAddressSearchValues),
                evaluations)
            || !TryAddTextEvaluation(
                criteria.NoticeNumber,
                caseOverview.Notices.Select(notice => notice.NoticeNumber),
                evaluations))
        {
            return null;
        }

        var worstMatchTier = evaluations.Count == 0
            ? MatchTier.Exact
            : evaluations.Max(evaluation => evaluation.Tier);
        var matchingValueCount = evaluations.Sum(evaluation => evaluation.MatchingValueCount);

        return new RankedCase(caseOverview, worstMatchTier, matchingValueCount);
    }

    private static bool TryAddTextEvaluation(
        string? filter,
        IEnumerable<string?> values,
        ICollection<MatchEvaluation> evaluations)
    {
        if (string.IsNullOrWhiteSpace(filter))
        {
            return true;
        }

        var normalizedFilter = filter.Trim();
        var matches = values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => EvaluateTextMatch(value!.Trim(), normalizedFilter))
            .Where(tier => tier is not null)
            .Select(tier => tier!.Value)
            .ToArray();

        if (matches.Length == 0)
        {
            return false;
        }

        evaluations.Add(new MatchEvaluation(matches.Min(), matches.Length));
        return true;
    }

    private static bool TryAddDateEvaluation(
        DateOnly? filter,
        IEnumerable<DateOnly?> values,
        ICollection<MatchEvaluation> evaluations)
    {
        if (filter is null)
        {
            return true;
        }

        var matchingValueCount = values.Count(value => value == filter);
        if (matchingValueCount == 0)
        {
            return false;
        }

        evaluations.Add(new MatchEvaluation(MatchTier.Exact, matchingValueCount));
        return true;
    }

    private static MatchTier? EvaluateTextMatch(string value, string filter)
    {
        if (value.Equals(filter, StringComparison.OrdinalIgnoreCase))
        {
            return MatchTier.Exact;
        }

        if (value.StartsWith(filter, StringComparison.OrdinalIgnoreCase))
        {
            return MatchTier.Prefix;
        }

        return value.Contains(filter, StringComparison.OrdinalIgnoreCase)
            ? MatchTier.Partial
            : null;
    }

    private static IEnumerable<string?> GetEntitledPersonSearchValues(EntitledPersonDetails person)
    {
        yield return person.FirstName;
        yield return person.LastName;
        yield return JoinNonEmpty(person.FirstName, person.LastName);
        yield return person.OrganizationName;
    }

    private static IEnumerable<string?> GetAddressSearchValues(AddressDetails address)
    {
        yield return address.Street;
        yield return address.HouseNumber;
        yield return address.PostalCode;
        yield return address.City;
        yield return address.AdditionalInformation;
        yield return FormatAddress(address);
    }

    private static string FormatAddress(AddressDetails address)
    {
        var street = JoinNonEmpty(address.Street, address.HouseNumber);
        var city = JoinNonEmpty(address.PostalCode, address.City);
        var parts = new[] { street, city, address.AdditionalInformation }
            .Where(part => !string.IsNullOrWhiteSpace(part));

        return string.Join(", ", parts);
    }

    private static string JoinNonEmpty(params string?[] values) =>
        string.Join(' ', values.Where(value => !string.IsNullOrWhiteSpace(value)));

    private enum MatchTier
    {
        Exact = 0,
        Prefix = 1,
        Partial = 2,
    }

    private sealed record MatchEvaluation(MatchTier Tier, int MatchingValueCount);

    private sealed record RankedCase(
        CaseOverview CaseOverview,
        MatchTier WorstMatchTier,
        int MatchingValueCount);
}
