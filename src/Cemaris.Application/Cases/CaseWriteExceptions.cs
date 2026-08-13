namespace Cemaris.Application.Cases;

public sealed class CaseRecordNotFoundException()
    : Exception("Die angeforderte Fallakte wurde nicht gefunden.");

public sealed class CaseChildNotFoundException()
    : Exception("Der angeforderte untergeordnete Datensatz wurde nicht gefunden.");

public sealed class CaseVersionConflictException()
    : Exception("Die Fallakte wurde zwischenzeitlich geändert.");

public sealed class CaseReferenceValidationException()
    : Exception("Der Verstorbenenbezug gehört nicht zu dieser Fallakte oder ist nicht vorhanden.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["deceasedPersonId"] =
            ["Der Verstorbenenbezug gehört nicht zu dieser Fallakte oder ist nicht vorhanden."],
        };
}

public sealed class GraveSiteReferenceValidationException()
    : Exception("Die Grabstelle ist nicht vorhanden, gesperrt oder für neue Zuordnungen nicht aktiv verfügbar.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["graveSiteId"] = ["Die Grabstelle ist nicht vorhanden, gesperrt oder für neue Zuordnungen nicht aktiv verfügbar."],
        };
}

public sealed class DeceasedPersonAlreadyHasBurialException()
    : Exception("Für diese verstorbene Person besteht bereits eine Beisetzung.");

public sealed class BurialProcessStateConflictException()
    : Exception("Die Beisetzung befindet sich nicht in dem für diese Operation erforderlichen Zustand.");

public sealed class PossibleDeceasedDuplicateException(
    IReadOnlyList<PossibleDeceasedDuplicate> candidates)
    : Exception("Innerhalb dieser Fallakte wurde mindestens eine mögliche Personendublette gefunden.")
{
    public IReadOnlyList<PossibleDeceasedDuplicate> Candidates { get; } = candidates;
}
