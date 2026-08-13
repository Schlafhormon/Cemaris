namespace Cemaris.Domain.Cases;

public sealed record GraveReference
{
    private GraveReference(string cemetery, string? field, string? graveNumber, Guid? graveSiteId)
    {
        Cemetery = cemetery;
        Field = field;
        GraveNumber = graveNumber;
        GraveSiteId = graveSiteId;
    }

    public string Cemetery { get; }

    public string? Field { get; }

    public string? GraveNumber { get; }

    public Guid? GraveSiteId { get; }

    public static GraveReference Create(string? cemetery, string? field, string? graveNumber) =>
        new(
            CaseText.Required(cemetery, 200, "cemetery"),
            CaseText.Optional(field, 100, "field"),
            CaseText.Optional(graveNumber, 100, "graveNumber"),
            null);

    public static GraveReference CreateCanonical(Guid graveSiteId, string cemetery, string? field, string graveNumber)
    {
        if (graveSiteId == Guid.Empty)
        {
            throw new CaseValidationException(
                new Dictionary<string, string[]> { ["graveSiteId"] = ["Die Grabstellen-ID darf nicht leer sein."] });
        }

        return new(
            CaseText.Required(cemetery, 200, "cemetery"),
            CaseText.Optional(field, 100, "field"),
            CaseText.Required(graveNumber, 100, "graveNumber"),
            graveSiteId);
    }
}
