namespace Cemaris.Domain.Cases;

public sealed record GraveReference
{
    private GraveReference(string cemetery, string? field, string? graveNumber)
    {
        Cemetery = cemetery;
        Field = field;
        GraveNumber = graveNumber;
    }

    public string Cemetery { get; }

    public string? Field { get; }

    public string? GraveNumber { get; }

    public static GraveReference Create(string? cemetery, string? field, string? graveNumber) =>
        new(
            CaseText.Required(cemetery, 200, "cemetery"),
            CaseText.Optional(field, 100, "field"),
            CaseText.Optional(graveNumber, 100, "graveNumber"));
}
