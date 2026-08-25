using Cemaris.Domain.Cemeteries;

namespace Cemaris.EdWaltMigration;

public sealed class CemeteryMigrationPlanner
{
    public static CemeteryMigrationPlan Create(
        EdWaltSourceSet source,
        LocalMigrationDecisionSet? decisions = null,
        bool requireCompleteMapping = false)
    {
        var diagnostics = source.Diagnostics.ToList();
        var currentByKey = IndexMaster(source.CurrentMasterRecords, diagnostics, "E_CURRENT_DUPLICATE_KEY");
        var legacyByKey = IndexMaster(source.LegacyMasterRecords, diagnostics, "E_LEGACY_DUPLICATE_KEY");
        var sharedKeys = currentByKey.Keys.Intersect(legacyByKey.Keys, StringComparer.Ordinal).ToArray();
        var sharedPayloadDifferences = sharedKeys.Count(key =>
            !string.Equals(currentByKey[key].SafePayloadHash, legacyByKey[key].SafePayloadHash, StringComparison.Ordinal));
        diagnostics.AddRange(sharedKeys
            .Where(key => !string.Equals(currentByKey[key].SafePayloadHash, legacyByKey[key].SafePayloadHash, StringComparison.Ordinal))
            .Select(key => new SourceDiagnostic(
                "E_SHARED_VARIANT_SAFE_PAYLOAD_DIFFERENCE",
                currentByKey[key].RecordId,
                true)));

        var desiredCemeteries = CreateCemeteries(source, diagnostics);
        AddCemeteryUniquenessDiagnostics(desiredCemeteries, diagnostics);

        var decisionByRecordId = IndexDecisions(source, decisions, diagnostics);
        var unmapped = source.CurrentMasterRecords
            .Where(item => !decisionByRecordId.ContainsKey(item.RecordId))
            .ToArray();
        if (requireCompleteMapping)
        {
            diagnostics.AddRange(unmapped.Select(item =>
                new SourceDiagnostic("E_GRAVE_TYPE_MAPPING_MISSING", item.RecordId, true)));
        }

        var groups = CreateMappedGroups(source, decisionByRecordId, diagnostics);
        var collidingCodes = groups
            .Where(item => item.CandidateCode is not null)
            .GroupBy(item => item.CandidateCode!, StringComparer.Ordinal)
            .Where(item => item.Count() > 1)
            .Select(item => item.Key)
            .ToHashSet(StringComparer.Ordinal);
        var desiredGraveTypes = new List<DesiredGraveType>();
        foreach (var group in groups)
        {
            var sourceCode = collidingCodes.Contains(group.CandidateCode ?? string.Empty)
                ? null
                : group.CandidateCode;
            if (group.CandidateCode is not null && sourceCode is null)
            {
                diagnostics.Add(new SourceDiagnostic(
                    "W_GRAVE_TYPE_CODE_OMITTED_GLOBAL_COLLISION",
                    group.Sources[0].RecordId,
                    false));
            }

            try
            {
                desiredGraveTypes.Add(MigrationRules.CreateGraveType(
                    group.TargetKey,
                    group.TargetName,
                    group.Sources,
                    group.BurialForm,
                    group.IsActive,
                    sourceCode));
            }
            catch (Exception exception) when (
                exception is ArgumentException or InvalidOperationException or CemeteryMasterDataValidationException)
            {
                diagnostics.Add(new SourceDiagnostic(
                    "E_GRAVE_TYPE_TARGET_VALIDATION",
                    group.Sources[0].RecordId,
                    true));
            }
        }

        AddGraveTypeUniquenessDiagnostics(desiredGraveTypes, diagnostics);
        var desiredByTargetKey = desiredGraveTypes.ToDictionary(item => item.TargetKey, StringComparer.Ordinal);
        var desiredAssignments = new List<DesiredCemeteryGraveType>();
        foreach (var sourceRecord in source.CurrentMasterRecords)
        {
            if (!decisionByRecordId.TryGetValue(sourceRecord.RecordId, out var decision) ||
                !desiredByTargetKey.TryGetValue(decision.TargetKey, out var graveType))
            {
                continue;
            }

            desiredAssignments.Add(MigrationRules.CreateCemeteryGraveType(sourceRecord, graveType, decision.IsActive));
        }

        AddAssignmentUniquenessDiagnostics(desiredAssignments, diagnostics);
        var currentCemeteryKeys = source.CurrentMasterRecords
            .Select(item => SourceCemeteryKey(item.Tenant, item.CemeteryCode))
            .ToHashSet(StringComparer.Ordinal);
        var unknownCemeteryGraves = source.GraveRecords
            .Where(item => !currentCemeteryKeys.Contains(SourceCemeteryKey(item.Tenant, item.CemeteryCode)))
            .ToArray();
        diagnostics.AddRange(unknownCemeteryGraves.Select(item =>
            new SourceDiagnostic("W_GRAVE_UNKNOWN_CURRENT_CEMETERY", item.RecordId, false)));

        var planFingerprint = MigrationHash.Text(
            desiredCemeteries
                .Select(item => $"C:{item.Id:D}:{item.PayloadHash}")
                .Concat(desiredGraveTypes.Select(item => $"G:{item.Id:D}:{item.PayloadHash}"))
                .Concat(desiredAssignments.Select(item => $"A:{item.Id:D}:{item.PayloadHash}"))
                .Order(StringComparer.Ordinal)
                .Prepend(source.DatasetFingerprint)
                .ToArray());
        var counts = new MigrationCounts(
            source.CurrentMasterRecordCount,
            source.LegacyMasterRecordCount,
            sharedKeys.Length,
            currentByKey.Count - sharedKeys.Length,
            legacyByKey.Count - sharedKeys.Length,
            sharedPayloadDifferences,
            desiredCemeteries.Count,
            desiredGraveTypes.Count,
            desiredAssignments.Count,
            unmapped.Length,
            source.GraveRecordCount,
            source.GraveRecordCount,
            unknownCemeteryGraves.Length,
            diagnostics.Count(item => item.IsBlocking),
            diagnostics.Count(item => !item.IsBlocking));
        return new CemeteryMigrationPlan(
            desiredCemeteries,
            desiredGraveTypes,
            desiredAssignments,
            diagnostics,
            source.DatasetFingerprint,
            planFingerprint,
            counts);
    }

    private static List<DesiredCemetery> CreateCemeteries(
        EdWaltSourceSet source,
        List<SourceDiagnostic> diagnostics)
    {
        var desired = new List<DesiredCemetery>();
        foreach (var group in source.CurrentMasterRecords.GroupBy(
                     item => SourceCemeteryKey(item.Tenant, item.CemeteryCode),
                     StringComparer.Ordinal))
        {
            var names = group.Select(item => item.CemeteryName).Distinct(StringComparer.Ordinal).ToArray();
            if (names.Length != 1)
            {
                diagnostics.Add(new SourceDiagnostic("E_CEMETERY_NAME_CONFLICT", group.First().RecordId, true));
                continue;
            }

            try
            {
                desired.Add(MigrationRules.CreateCemetery(group.First()));
            }
            catch (Exception exception) when (
                exception is ArgumentException or InvalidOperationException or CemeteryMasterDataValidationException)
            {
                diagnostics.Add(new SourceDiagnostic("E_CEMETERY_TARGET_VALIDATION", group.First().RecordId, true));
            }
        }

        return desired;
    }

    private static Dictionary<string, LocalGraveTypeDecision> IndexDecisions(
        EdWaltSourceSet source,
        LocalMigrationDecisionSet? decisions,
        List<SourceDiagnostic> diagnostics)
    {
        if (decisions is null)
        {
            return new Dictionary<string, LocalGraveTypeDecision>(StringComparer.Ordinal);
        }

        if (decisions.SchemaVersion != 1 ||
            !string.Equals(decisions.DatasetFingerprint, source.DatasetFingerprint, StringComparison.Ordinal))
        {
            diagnostics.Add(new SourceDiagnostic("E_MAPPING_DATASET_MISMATCH", source.DatasetFingerprint, true));
            return new Dictionary<string, LocalGraveTypeDecision>(StringComparer.Ordinal);
        }

        var known = source.CurrentMasterRecords.Select(item => item.RecordId).ToHashSet(StringComparer.Ordinal);
        var result = new Dictionary<string, LocalGraveTypeDecision>(StringComparer.Ordinal);
        foreach (var decision in decisions.GraveTypes)
        {
            if (!known.Contains(decision.SourceRecordId))
            {
                diagnostics.Add(new SourceDiagnostic("E_MAPPING_UNKNOWN_SOURCE_RECORD", decision.SourceRecordId, true));
                continue;
            }

            if (!result.TryAdd(decision.SourceRecordId, decision))
            {
                diagnostics.Add(new SourceDiagnostic("E_MAPPING_DUPLICATE_SOURCE_RECORD", decision.SourceRecordId, true));
            }
        }

        return result;
    }

    private static List<GraveTypeGroup> CreateMappedGroups(
        EdWaltSourceSet source,
        Dictionary<string, LocalGraveTypeDecision> decisionByRecordId,
        List<SourceDiagnostic> diagnostics)
    {
        var mapped = source.CurrentMasterRecords
            .Where(item => decisionByRecordId.ContainsKey(item.RecordId))
            .Select(item => new MappedRecord(item, decisionByRecordId[item.RecordId]))
            .GroupBy(item => item.Decision.TargetKey, StringComparer.Ordinal);
        var result = new List<GraveTypeGroup>();
        foreach (var group in mapped)
        {
            var records = group.ToArray();
            var names = records.Select(item => item.Decision.TargetName).Distinct(StringComparer.Ordinal).ToArray();
            var burialForms = records.Select(item => item.Decision.BurialForm).Distinct().ToArray();
            var activeStates = records.Select(item => item.Decision.IsActive).Distinct().ToArray();
            if (names.Length != 1 || burialForms.Length != 1 || activeStates.Length != 1)
            {
                diagnostics.Add(new SourceDiagnostic("E_GRAVE_TYPE_MAPPING_TARGET_CONFLICT", records[0].Source.RecordId, true));
                continue;
            }

            var codes = records.Select(item => item.Source.GraveTypeCode).Distinct(StringComparer.Ordinal).ToArray();
            if (codes.Length != 1)
            {
                diagnostics.Add(new SourceDiagnostic(
                    "W_GRAVE_TYPE_CODE_OMITTED_INCONSISTENT",
                    records[0].Source.RecordId,
                    false));
            }

            result.Add(new GraveTypeGroup(
                group.Key,
                names[0],
                records.Select(item => item.Source).ToArray(),
                burialForms[0],
                activeStates[0],
                codes.Length == 1 ? codes[0] : null));
        }

        return result;
    }

    private static Dictionary<string, CemeterySourceRecord> IndexMaster(
        IReadOnlyList<CemeterySourceRecord> records,
        List<SourceDiagnostic> diagnostics,
        string duplicateCode)
    {
        var result = new Dictionary<string, CemeterySourceRecord>(StringComparer.Ordinal);
        foreach (var record in records)
        {
            var key = $"{record.Tenant}\u001f{record.CemeteryCode}\u001f{record.GraveTypeCode}";
            if (!result.TryAdd(key, record))
            {
                diagnostics.Add(new SourceDiagnostic(duplicateCode, record.RecordId, true));
            }
        }

        return result;
    }

    private static void AddCemeteryUniquenessDiagnostics(
        IReadOnlyList<DesiredCemetery> desired,
        List<SourceDiagnostic> diagnostics)
    {
        AddDuplicates(desired, item => item.NormalizedCode, item => item.SourceRecordId,
            "E_TARGET_DUPLICATE_CEMETERY_CODE", diagnostics);
        AddDuplicates(desired, item => item.NormalizedName, item => item.SourceRecordId,
            "E_TARGET_DUPLICATE_CEMETERY_NAME", diagnostics);
    }

    private static void AddGraveTypeUniquenessDiagnostics(
        IReadOnlyList<DesiredGraveType> desired,
        List<SourceDiagnostic> diagnostics)
    {
        AddDuplicates(desired, item => item.NormalizedName, item => item.SourceRecordIds[0],
            "E_TARGET_DUPLICATE_GRAVE_TYPE_NAME", diagnostics);
        AddDuplicates(
            desired.Where(item => item.NormalizedCode is not null).ToArray(),
            item => item.NormalizedCode!,
            item => item.SourceRecordIds[0],
            "E_TARGET_DUPLICATE_GRAVE_TYPE_CODE",
            diagnostics);
    }

    private static void AddAssignmentUniquenessDiagnostics(
        IReadOnlyList<DesiredCemeteryGraveType> desired,
        List<SourceDiagnostic> diagnostics)
    {
        AddDuplicates(desired, item => item.Id.ToString("D"), item => item.SourceRecordId,
            "E_TARGET_DUPLICATE_ASSIGNMENT_ID", diagnostics);
        AddDuplicates(desired, item => $"{item.CemeteryId:D}\u001f{item.GraveTypeId:D}", item => item.SourceRecordId,
            "E_TARGET_DUPLICATE_CEMETERY_GRAVE_TYPE", diagnostics);
    }

    private static void AddDuplicates<T>(
        IReadOnlyList<T> desired,
        Func<T, string> key,
        Func<T, string> recordId,
        string diagnosticCode,
        List<SourceDiagnostic> diagnostics)
    {
        foreach (var group in desired.GroupBy(key, StringComparer.Ordinal).Where(item => item.Count() > 1))
        {
            diagnostics.AddRange(group.Skip(1).Select(item =>
                new SourceDiagnostic(diagnosticCode, recordId(item), true)));
        }
    }

    private static string SourceCemeteryKey(string tenant, string code) => $"{tenant}\u001f{code}";

    private sealed record MappedRecord(CemeterySourceRecord Source, LocalGraveTypeDecision Decision);

    private sealed record GraveTypeGroup(
        string TargetKey,
        string TargetName,
        IReadOnlyList<CemeterySourceRecord> Sources,
        BurialForm BurialForm,
        bool IsActive,
        string? CandidateCode);
}
