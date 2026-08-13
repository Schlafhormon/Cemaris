namespace Cemaris.Application.Cases;

public sealed record CreateCaseCommand(
    string? Cemetery,
    string? Field,
    string? GraveNumber,
    Guid? GraveSiteId = null);

public sealed record ChangeGraveCommand(
    string? Cemetery,
    string? Field,
    string? GraveNumber,
    Guid? GraveSiteId = null);

public sealed record SaveDeceasedPersonCommand(
    string? FirstName,
    string? LastName,
    DateOnly? BirthDate,
    DateOnly? DeathDate,
    bool ConfirmPossibleDuplicate = false);

public sealed record SaveBurialCommand(
    Guid? DeceasedPersonId,
    DateOnly? BurialDate);
