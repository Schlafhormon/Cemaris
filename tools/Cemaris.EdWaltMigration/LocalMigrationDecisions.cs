using System.Text.Json;
using System.Text.Json.Serialization;

namespace Cemaris.EdWaltMigration;

public static class LocalMigrationDecisions
{
    public const string FileName = "cemetery-master-data-decisions.json";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter() },
    };

    public static LocalMigrationDecisionSet ReadRequired(
        string workspace,
        string expectedDatasetFingerprint)
    {
        var path = Path.Combine(workspace, FileName);
        if (!File.Exists(path))
        {
            throw new InvalidDataException("Die lokale Grabartenentscheidung fehlt.");
        }

        var decisions = JsonSerializer.Deserialize<LocalMigrationDecisionSet>(
            File.ReadAllText(path),
            JsonOptions) ?? throw new InvalidDataException("Die lokale Grabartenentscheidung ist ungültig.");
        if (decisions.SchemaVersion != 1 ||
            !IsHash(decisions.DatasetFingerprint) ||
            !string.Equals(
                decisions.DatasetFingerprint,
                expectedDatasetFingerprint,
                StringComparison.Ordinal) ||
            decisions.GraveTypes is null ||
            decisions.GraveTypes.Count == 0 ||
            decisions.GraveTypes.Any(item =>
                !IsHash(item.SourceRecordId) ||
                !IsHash(item.TargetKey) ||
                string.IsNullOrWhiteSpace(item.TargetName) ||
                item.TargetName.Any(char.IsControl) ||
                !Enum.IsDefined(item.BurialForm)) ||
            decisions.GraveTypes.Select(item => item.SourceRecordId).Distinct(StringComparer.Ordinal).Count() !=
            decisions.GraveTypes.Count)
        {
            throw new InvalidDataException("Die lokale Grabartenentscheidung ist unvollständig oder nicht aktuell.");
        }

        return decisions;
    }

    private static bool IsHash(string? value) =>
        value is { Length: 64 } && value.All(item => item is >= '0' and <= '9' or >= 'A' and <= 'F');
}
