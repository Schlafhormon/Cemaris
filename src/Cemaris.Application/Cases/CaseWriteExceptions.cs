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
