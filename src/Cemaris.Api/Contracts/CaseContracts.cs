using Cemaris.Application.Cases;

namespace Cemaris.Api.Contracts;

public sealed record CreateCaseRequest(string? Cemetery, string? Field, string? GraveNumber, Guid? GraveSiteId = null)
{
    public CreateCaseCommand ToCommand() => new(Cemetery, Field, GraveNumber, GraveSiteId);
}

public sealed record ChangeGraveRequest(string? Cemetery, string? Field, string? GraveNumber, Guid? GraveSiteId = null)
{
    public ChangeGraveCommand ToCommand() => new(Cemetery, Field, GraveNumber, GraveSiteId);
}

public sealed record SaveDeceasedPersonRequest(
    string? FirstName,
    string? LastName,
    DateOnly? BirthDate,
    DateOnly? DeathDate)
{
    public SaveDeceasedPersonCommand ToCommand() =>
        new(FirstName, LastName, BirthDate, DeathDate);
}

public sealed record SaveBurialRequest(Guid? DeceasedPersonId, DateOnly? BurialDate)
{
    public SaveBurialCommand ToCommand() => new(DeceasedPersonId, BurialDate);
}

public sealed record CaseResponse(
    Guid Id,
    bool IsSynthetic,
    long Version,
    GraveResponse Grave,
    IReadOnlyList<DeceasedPersonResponse> DeceasedPersons,
    IReadOnlyList<BurialResponse> Burials,
    IReadOnlyList<UsageRightResponse> UsageRights,
    IReadOnlyList<EntitledPersonResponse> EntitledPersons,
    IReadOnlyList<NoticeResponse> Notices,
    IReadOnlyList<string> DataQualityNotes,
    LastCaseChangeResponse? LastChange);

public sealed record LastCaseChangeResponse(
    string ActorDisplayName,
    DateTimeOffset ChangedAtUtc);

public sealed record GraveResponse(string? Cemetery, string? Field, string? GraveNumber, Guid? GraveSiteId);

public sealed record DeceasedPersonResponse(
    Guid Id,
    string? FirstName,
    string? LastName,
    DateOnly? BirthDate,
    DateOnly? DeathDate);

public sealed record BurialResponse(Guid Id, Guid? DeceasedPersonId, DateOnly? BurialDate);

public sealed record UsageRightResponse(
    Guid Id,
    string? Reference,
    DateOnly? ValidFrom,
    DateOnly? ValidUntil,
    IReadOnlyList<Guid> EntitledPersonIds);

public sealed record EntitledPersonResponse(
    Guid Id,
    string? FirstName,
    string? LastName,
    string? OrganizationName,
    IReadOnlyList<AddressResponse> Addresses);

public sealed record AddressResponse(
    Guid Id,
    string? Street,
    string? HouseNumber,
    string? PostalCode,
    string? City,
    string? AdditionalInformation);

public sealed record NoticeResponse(
    Guid Id,
    string? NoticeNumber,
    DateOnly? NoticeDate,
    DateOnly? DueDate,
    decimal? AssessedAmount,
    string? CurrencyCode,
    IReadOnlyList<FeeItemResponse> FeeItems);

public sealed record FeeItemResponse(
    Guid Id,
    string? Description,
    decimal? Amount,
    string? CurrencyCode);

public sealed record SearchCasesResponse(
    IReadOnlyList<SearchCaseResponse> Items,
    int TotalMatches,
    int Limit,
    bool IsTruncated);

public sealed record SearchCaseResponse(
    Guid CaseId,
    bool IsSynthetic,
    string? Cemetery,
    string? Field,
    string? GraveNumber,
    IReadOnlyList<SearchDeceasedPersonResponse> DeceasedPersons,
    IReadOnlyList<DateOnly> BurialDates,
    IReadOnlyList<SearchEntitledPersonResponse> EntitledPersons,
    IReadOnlyList<string> NoticeNumbers);

public sealed record SearchDeceasedPersonResponse(
    Guid Id,
    string? FirstName,
    string? LastName,
    DateOnly? BirthDate,
    DateOnly? DeathDate);

public sealed record SearchEntitledPersonResponse(
    Guid Id,
    string DisplayName,
    IReadOnlyList<string> Addresses);

internal static class CaseContractMapper
{
    internal static CaseResponse ToResponse(this CaseOverview source) =>
        new(
            source.Id,
            source.IsSynthetic,
            source.Version,
            new GraveResponse(
                source.Grave.Cemetery,
                source.Grave.Field,
                source.Grave.GraveNumber,
                source.Grave.GraveSiteId),
            source.DeceasedPersons.Select(item => new DeceasedPersonResponse(
                item.Id,
                item.FirstName,
                item.LastName,
                item.BirthDate,
                item.DeathDate)).ToArray(),
            source.Burials.Select(item => new BurialResponse(
                item.Id,
                item.DeceasedPersonId,
                item.BurialDate)).ToArray(),
            source.UsageRights.Select(item => new UsageRightResponse(
                item.Id,
                item.Reference,
                item.ValidFrom,
                item.ValidUntil,
                item.EntitledPersonIds)).ToArray(),
            source.EntitledPersons.Select(item => new EntitledPersonResponse(
                item.Id,
                item.FirstName,
                item.LastName,
                item.OrganizationName,
                item.Addresses.Select(address => new AddressResponse(
                    address.Id,
                    address.Street,
                    address.HouseNumber,
                    address.PostalCode,
                    address.City,
                    address.AdditionalInformation)).ToArray())).ToArray(),
            source.Notices.Select(item => new NoticeResponse(
                item.Id,
                item.NoticeNumber,
                item.NoticeDate,
                item.DueDate,
                item.AssessedAmount,
                item.CurrencyCode,
                item.FeeItems.Select(feeItem => new FeeItemResponse(
                    feeItem.Id,
                    feeItem.Description,
                    feeItem.Amount,
                    feeItem.CurrencyCode)).ToArray())).ToArray(),
            source.DataQualityNotes,
            source.LastChange is null
                ? null
                : new LastCaseChangeResponse(
                    source.LastChange.ActorDisplayName,
                    source.LastChange.ChangedAtUtc));

    internal static SearchCasesResponse ToResponse(this SearchResponse source) =>
        new(
            source.Items.Select(item => new SearchCaseResponse(
                item.CaseId,
                item.IsSynthetic,
                item.Cemetery,
                item.Field,
                item.GraveNumber,
                item.DeceasedPersons.Select(person => new SearchDeceasedPersonResponse(
                    person.Id,
                    person.FirstName,
                    person.LastName,
                    person.BirthDate,
                    person.DeathDate)).ToArray(),
                item.BurialDates,
                item.EntitledPersons.Select(person => new SearchEntitledPersonResponse(
                    person.Id,
                    person.DisplayName,
                    person.Addresses)).ToArray(),
                item.NoticeNumbers)).ToArray(),
            source.TotalMatches,
            source.Limit,
            source.IsTruncated);
}
