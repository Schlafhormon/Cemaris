namespace Cemaris.Application.Cases;

/// <summary>
/// Narrow, read-only projection for the first MVP. It deliberately contains no
/// rules for grave types, terms, fees or statuses.
/// </summary>
public sealed record CaseOverview(
    Guid Id,
    bool IsSynthetic,
    long Version,
    GraveDetails Grave,
    IReadOnlyList<DeceasedDetails> DeceasedPersons,
    IReadOnlyList<BurialDetails> Burials,
    IReadOnlyList<UsageRightDetails> UsageRights,
    IReadOnlyList<EntitledPersonDetails> EntitledPersons,
    IReadOnlyList<NoticeDetails> Notices,
    IReadOnlyList<string> DataQualityNotes,
    LastCaseChangeDetails? LastChange = null);

public sealed record LastCaseChangeDetails(
    string ActorDisplayName,
    DateTimeOffset ChangedAtUtc);

public sealed record GraveDetails(
    string? Cemetery,
    string? Field,
    string? GraveNumber,
    Guid? GraveSiteId = null);

public sealed record DeceasedDetails(
    Guid Id,
    string? FirstName,
    string? LastName,
    DateOnly? BirthDate,
    DateOnly? DeathDate);

public sealed record BurialDetails(
    Guid Id,
    Guid? DeceasedPersonId,
    DateOnly? BurialDate,
    Guid? GraveSiteId = null,
    Domain.Cases.BurialProcessStatus? Status = null,
    DateOnly? PlanningDate = null);

public sealed record UsageRightDetails(
    Guid Id,
    string? Reference,
    DateOnly? ValidFrom,
    DateOnly? ValidUntil,
    IReadOnlyList<Guid> EntitledPersonIds);

public sealed record EntitledPersonDetails(
    Guid Id,
    string? FirstName,
    string? LastName,
    string? OrganizationName,
    IReadOnlyList<AddressDetails> Addresses);

public sealed record AddressDetails(
    Guid Id,
    string? Street,
    string? HouseNumber,
    string? PostalCode,
    string? City,
    string? AdditionalInformation);

public sealed record NoticeDetails(
    Guid Id,
    string? NoticeNumber,
    DateOnly? NoticeDate,
    DateOnly? DueDate,
    decimal? AssessedAmount,
    string? CurrencyCode,
    IReadOnlyList<FeeItemDetails> FeeItems);

public sealed record FeeItemDetails(
    Guid Id,
    string? Description,
    decimal? Amount,
    string? CurrencyCode);

public sealed record SearchRecord(
    Guid CaseId,
    bool IsSynthetic,
    string? Cemetery,
    string? Field,
    string? GraveNumber,
    IReadOnlyList<SearchDeceasedPerson> DeceasedPersons,
    IReadOnlyList<DateOnly> BurialDates,
    IReadOnlyList<SearchEntitledPerson> EntitledPersons,
    IReadOnlyList<string> NoticeNumbers);

public sealed record SearchDeceasedPerson(
    Guid Id,
    string? FirstName,
    string? LastName,
    DateOnly? BirthDate,
    DateOnly? DeathDate);

public sealed record SearchEntitledPerson(
    Guid Id,
    string DisplayName,
    IReadOnlyList<string> Addresses);

public sealed record SearchResponse(
    IReadOnlyList<SearchRecord> Items,
    int TotalMatches,
    int Limit,
    bool IsTruncated,
    int Page,
    int PageSize,
    int TotalPages);

public sealed record CaseSearchStoreResult(
    IReadOnlyList<CaseOverview> Items,
    int TotalMatches);
