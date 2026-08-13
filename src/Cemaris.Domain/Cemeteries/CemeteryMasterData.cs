namespace Cemaris.Domain.Cemeteries;

public enum BurialForm
{
    EarthBurial,
    UrnBurial,
    Mixed,
}

public enum GraveSiteStatus
{
    Available,
    Reserved,
    Occupied,
}

public static class CemeteryMasterDataRules
{
    public const int NameMaximumLength = 200;
    public const int CodeMaximumLength = 50;
    public const int NoteMaximumLength = 2000;
    public const int AddressMaximumLength = 500;

    public static string Required(string? value, string field, int maximumLength)
    {
        var normalized = Optional(value, maximumLength);
        return normalized ?? throw new CemeteryMasterDataValidationException(field, "Der Wert ist erforderlich.");
    }

    public static string? Optional(string? value, int maximumLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            return null;
        }

        if (trimmed.Length > maximumLength)
        {
            throw new CemeteryMasterDataValidationException(
                "value",
                $"Der Wert darf höchstens {maximumLength} Zeichen lang sein.");
        }

        return trimmed;
    }

    public static string UniqueKey(string value) => value.Trim().ToUpperInvariant();

    public static void EnsureStatusTransition(GraveSiteStatus current, GraveSiteStatus next)
    {
        if (current == next ||
            current == GraveSiteStatus.Available ||
            current == GraveSiteStatus.Reserved && next != GraveSiteStatus.Reserved)
        {
            return;
        }

        throw new CemeteryMasterDataValidationException(
            "status",
            "Eine belegte Grabstelle darf in Inkrement 4a nicht wieder frei oder reserviert werden.");
    }
}

public sealed class CemeteryMasterDataValidationException(string field, string message)
    : Exception(message)
{
    public string Field { get; } = field;
}
