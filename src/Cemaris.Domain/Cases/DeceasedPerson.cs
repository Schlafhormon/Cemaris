namespace Cemaris.Domain.Cases;

public sealed record DeceasedPerson
{
    private DeceasedPerson(
        Guid id,
        string? firstName,
        string? lastName,
        DateOnly? birthDate,
        DateOnly? deathDate)
    {
        Id = id;
        FirstName = firstName;
        LastName = lastName;
        BirthDate = birthDate;
        DeathDate = deathDate;
    }

    public Guid Id { get; }

    public string? FirstName { get; }

    public string? LastName { get; }

    public DateOnly? BirthDate { get; }

    public DateOnly? DeathDate { get; }

    public static DeceasedPerson Create(
        Guid id,
        string? firstName,
        string? lastName,
        DateOnly? birthDate,
        DateOnly? deathDate)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Die Personen-ID darf nicht leer sein.", nameof(id));
        }

        var normalizedFirstName = CaseText.Optional(firstName, 200, "firstName");
        var normalizedLastName = CaseText.Optional(lastName, 200, "lastName");
        if (normalizedFirstName is null && normalizedLastName is null)
        {
            throw CaseText.Error(
                "lastName",
                "Mindestens Vorname oder Name muss angegeben werden.");
        }

        return new DeceasedPerson(
            id,
            normalizedFirstName,
            normalizedLastName,
            birthDate,
            deathDate);
    }
}
