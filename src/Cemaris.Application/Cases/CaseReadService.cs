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

        var result = await store.SearchAsync(criteria, maximumResults, cancellationToken);
        var items = result.Items
            .Select(ToSearchRecord)
            .ToArray();

        return new SearchResponse(
            items,
            result.TotalMatches,
            maximumResults,
            result.TotalMatches > maximumResults);
    }

    public Task<CaseOverview?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        store.FindAsync(id, cancellationToken);

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

}
