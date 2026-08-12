namespace Cemaris.Domain.Cases;

public sealed record Burial
{
    private Burial(Guid id, Guid? deceasedPersonId, DateOnly burialDate)
    {
        Id = id;
        DeceasedPersonId = deceasedPersonId;
        BurialDate = burialDate;
    }

    public Guid Id { get; }

    public Guid? DeceasedPersonId { get; }

    public DateOnly BurialDate { get; }

    public static Burial Create(Guid id, Guid? deceasedPersonId, DateOnly? burialDate)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Die Beisetzungs-ID darf nicht leer sein.", nameof(id));
        }

        if (deceasedPersonId == Guid.Empty)
        {
            throw CaseText.Error(
                "deceasedPersonId",
                "Der Verstorbenenbezug muss eine gültige ID sein oder fehlen.");
        }

        if (burialDate is null)
        {
            throw CaseText.Error("burialDate", "Das Beisetzungsdatum ist erforderlich.");
        }

        return new Burial(id, deceasedPersonId, burialDate.Value);
    }
}
