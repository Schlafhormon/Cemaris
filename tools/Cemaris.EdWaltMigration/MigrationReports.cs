using System.Text.Json;
using System.Text.Json.Serialization;

namespace Cemaris.EdWaltMigration;

public sealed record SafeMigrationReport(
    int SchemaVersion,
    string Kind,
    string Status,
    DateTimeOffset CreatedAtUtc,
    string DatasetFingerprint,
    string PlanFingerprint,
    MigrationCounts Counts,
    IReadOnlyList<SourceDiagnostic> Diagnostics);

public sealed record ApplyReport(
    int SchemaVersion,
    string Status,
    DateTimeOffset CreatedAtUtc,
    string DatasetFingerprint,
    string PlanFingerprint,
    int CemeteriesCreated,
    int CemeteriesPreserved,
    int GraveTypesCreated,
    int GraveTypesPreserved,
    int CemeteryGraveTypesCreated,
    int CemeteryGraveTypesPreserved,
    int Conflicts);

public sealed record ReconciliationReport(
    int SchemaVersion,
    string Status,
    DateTimeOffset CreatedAtUtc,
    string DatasetFingerprint,
    string PlanFingerprint,
    int CemeteriesExpected,
    int CemeteriesMatching,
    int CemeteriesMissing,
    int CemeteriesConflicting,
    int GraveTypesExpected,
    int GraveTypesMatching,
    int GraveTypesMissing,
    int GraveTypesConflicting,
    int CemeteryGraveTypesExpected,
    int CemeteryGraveTypesMatching,
    int CemeteryGraveTypesMissing,
    int CemeteryGraveTypesConflicting);

internal static class MigrationReports
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter() },
    };

    public static SafeMigrationReport Create(string kind, CemeteryMigrationPlan plan) =>
        new(
            1,
            kind,
            plan.IsSuccessful ? "success" : "failed",
            DateTimeOffset.UtcNow,
            plan.DatasetFingerprint,
            plan.PlanFingerprint,
            plan.Counts,
            plan.Diagnostics
                .OrderBy(item => item.Code, StringComparer.Ordinal)
                .ThenBy(item => item.RecordId, StringComparer.Ordinal)
                .ToArray());

    public static void Write<T>(string workspace, string fileName, T report)
    {
        var path = Path.Combine(workspace, fileName);
        File.WriteAllText(path, JsonSerializer.Serialize(report, JsonOptions));
    }

    public static SafeMigrationReport ReadDryRun(string workspace)
    {
        var path = Path.Combine(workspace, "dry-run.json");
        var report = JsonSerializer.Deserialize<SafeMigrationReport>(
            File.ReadAllText(path),
            JsonOptions);
        return report ?? throw new InvalidDataException("Der Dry-run-Bericht ist ungültig.");
    }
}
