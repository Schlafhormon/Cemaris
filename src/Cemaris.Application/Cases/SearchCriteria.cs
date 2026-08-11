namespace Cemaris.Application.Cases;

public sealed record SearchCriteria(
    string? Name = null,
    string? FirstName = null,
    DateOnly? BirthDate = null,
    DateOnly? DeathDate = null,
    string? Cemetery = null,
    string? Field = null,
    string? GraveNumber = null,
    DateOnly? BurialDate = null,
    string? EntitledPerson = null,
    string? Address = null,
    string? NoticeNumber = null);
