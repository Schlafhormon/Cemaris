namespace Cemaris.Application.Cases;

public sealed class CaseReadService(ICaseReadStore store, int maximumResults = 10)
{
    private const int MinimumTextLength = 2;

    private readonly int maximumResults = maximumResults > 0
        ? maximumResults
        : throw new ArgumentOutOfRangeException(
            nameof(maximumResults),
            maximumResults,
            "The search result limit must be greater than zero.");

    public async Task<SearchResponse> SearchAsync(
        SearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(criteria);
        Validate(criteria);

        var cases = await store.ListAsync(cancellationToken);
        var rankedRecords = cases
            .Select(caseOverview => Evaluate(caseOverview, criteria))
            .Where(result => result is not null)
            .Select(result => result!)
            .OrderBy(result => result.WorstMatchTier)
            .ThenByDescending(result => result.MatchingValueCount)
            .ThenBy(result => result.Record.Cemetery, StringComparer.OrdinalIgnoreCase)
            .ThenBy(result => result.Record.Field ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ThenBy(result => result.Record.GraveNumber ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ThenBy(result => result.Record.CaseId)
            .ToArray();

        var items = rankedRecords
            .Take(maximumResults)
            .Select(result => result.Record)
            .ToArray();

        return new SearchResponse(
            items,
            rankedRecords.Length,
            maximumResults,
            rankedRecords.Length > maximumResults);
    }

    public Task<CaseOverview?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        store.FindAsync(id, cancellationToken);

    private static RankedSearchRecord? Evaluate(CaseOverview caseOverview, SearchCriteria criteria)
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

        var record = ToSearchRecord(caseOverview);
        var worstMatchTier = evaluations.Count == 0
            ? MatchTier.Exact
            : evaluations.Max(evaluation => evaluation.Tier);
        var matchingValueCount = evaluations.Sum(evaluation => evaluation.MatchingValueCount);

        return new RankedSearchRecord(record, worstMatchTier, matchingValueCount);
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

    private static SearchRecord ToSearchRecord(CaseOverview caseOverview) =>
        new(
            caseOverview.Id,
            caseOverview.IsSynthetic,
            caseOverview.Grave.Cemetery,
            caseOverview.Grave.Field,
            caseOverview.Grave.GraveNumber,
            caseOverview.DeceasedPersons
                .Select(person => new SearchDeceasedPerson(
                    person.Id,
                    person.FirstName,
                    person.LastName,
                    person.BirthDate,
                    person.DeathDate))
                .ToArray(),
            caseOverview.Burials
                .Where(burial => burial.BurialDate is not null)
                .Select(burial => burial.BurialDate!.Value)
                .Distinct()
                .Order()
                .ToArray(),
            caseOverview.EntitledPersons
                .Select(person => new SearchEntitledPerson(
                    person.Id,
                    GetDisplayName(person),
                    person.Addresses.Select(FormatAddress).ToArray()))
                .ToArray(),
            caseOverview.Notices
                .Select(notice => notice.NoticeNumber)
                .Where(number => !string.IsNullOrWhiteSpace(number))
                .Select(number => number!)
                .ToArray());

    private static string GetDisplayName(EntitledPersonDetails person)
    {
        var personalName = JoinNonEmpty(person.FirstName, person.LastName);
        return !string.IsNullOrWhiteSpace(personalName)
            ? personalName
            : person.OrganizationName ?? "Nicht angegeben";
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

    private static void Validate(SearchCriteria criteria)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        AddMinimumLengthError(errors, "name", criteria.Name);
        AddMinimumLengthError(errors, "firstName", criteria.FirstName);
        AddMinimumLengthError(errors, "cemetery", criteria.Cemetery);
        AddMinimumLengthError(errors, "field", criteria.Field);
        AddMinimumLengthError(errors, "entitledPerson", criteria.EntitledPerson);
        AddMinimumLengthError(errors, "address", criteria.Address);

        if (errors.Count > 0)
        {
            throw new SearchValidationException(errors);
        }
    }

    private static void AddMinimumLengthError(
        Dictionary<string, string[]> errors,
        string fieldName,
        string? value)
    {
        if (!string.IsNullOrWhiteSpace(value) && value.Trim().Length < MinimumTextLength)
        {
            errors[fieldName] = [
                $"Der Textfilter muss mindestens {MinimumTextLength} Zeichen enthalten.",
            ];
        }
    }

    private enum MatchTier
    {
        Exact = 0,
        Prefix = 1,
        Partial = 2,
    }

    private sealed record MatchEvaluation(MatchTier Tier, int MatchingValueCount);

    private sealed record RankedSearchRecord(
        SearchRecord Record,
        MatchTier WorstMatchTier,
        int MatchingValueCount);
}
