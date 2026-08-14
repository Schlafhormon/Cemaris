using Cemaris.Application.Cases;

namespace Cemaris.Api.Contracts;

public sealed class SearchCasesRequest
{
    public string? Name { get; init; }

    public string? FirstName { get; init; }

    public DateOnly? BirthDate { get; init; }

    public DateOnly? DeathDate { get; init; }

    public string? Cemetery { get; init; }

    public string? Field { get; init; }

    public string? GraveNumber { get; init; }

    public DateOnly? BurialDate { get; init; }

    public string? EntitledPerson { get; init; }

    public string? Address { get; init; }

    public string? NoticeNumber { get; init; }

    public int? Page { get; init; }

    public int? PageSize { get; init; }

    public SearchCriteria ToCriteria() =>
        new(
            Name,
            FirstName,
            BirthDate,
            DeathDate,
            Cemetery,
            Field,
            GraveNumber,
            BurialDate,
            EntitledPerson,
            Address,
            NoticeNumber);
}
