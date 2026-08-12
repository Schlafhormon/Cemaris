namespace Cemaris.Application.Cases;

public sealed record CreateCaseCommand(
    string? Cemetery,
    string? Field,
    string? GraveNumber);

public sealed record ChangeGraveCommand(
    string? Cemetery,
    string? Field,
    string? GraveNumber);

public sealed record SaveDeceasedPersonCommand(
    string? FirstName,
    string? LastName,
    DateOnly? BirthDate,
    DateOnly? DeathDate);

public sealed record SaveBurialCommand(
    Guid? DeceasedPersonId,
    DateOnly? BurialDate);
