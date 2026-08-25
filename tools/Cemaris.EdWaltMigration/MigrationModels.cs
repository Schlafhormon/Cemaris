using System.Security.Cryptography;
using System.Text;
using Cemaris.Domain.Cemeteries;

namespace Cemaris.EdWaltMigration;

public sealed record SourceDiagnostic(string Code, string RecordId, bool IsBlocking);

public sealed record CemeterySourceRecord(
    string Tenant,
    string CemeteryCode,
    string GraveTypeCode,
    string CemeteryName,
    string GraveTypeName,
    string RecordId,
    string SafePayloadHash,
    bool IsLegacyVariant);

public sealed record GraveSourceRecord(
    string Tenant,
    string CemeteryCode,
    string StructureKey,
    string RecordId);

public sealed record EdWaltSourceSet(
    IReadOnlyList<CemeterySourceRecord> CurrentMasterRecords,
    IReadOnlyList<CemeterySourceRecord> LegacyMasterRecords,
    IReadOnlyList<GraveSourceRecord> GraveRecords,
    IReadOnlyList<SourceDiagnostic> Diagnostics,
    string DatasetFingerprint,
    long CurrentMasterRecordCount,
    long LegacyMasterRecordCount,
    long GraveRecordCount);

public sealed record DesiredCemetery(
    Guid Id,
    string Name,
    string Code,
    string NormalizedName,
    string NormalizedCode,
    string PayloadHash,
    string SourceRecordId);

public sealed record LocalGraveTypeDecision(
    string SourceRecordId,
    string TargetKey,
    string TargetName,
    BurialForm BurialForm,
    bool IsActive);

public sealed record LocalMigrationDecisionSet(
    int SchemaVersion,
    string DatasetFingerprint,
    IReadOnlyList<LocalGraveTypeDecision> GraveTypes);

public sealed record DesiredGraveType(
    Guid Id,
    string TargetKey,
    string Name,
    string? Code,
    string NormalizedName,
    string? NormalizedCode,
    BurialForm BurialForm,
    bool IsActive,
    string PayloadHash,
    IReadOnlyList<string> SourceRecordIds);

public sealed record DesiredCemeteryGraveType(
    Guid Id,
    Guid CemeteryId,
    Guid GraveTypeId,
    bool IsActive,
    string PayloadHash,
    string SourceRecordId);

public sealed record CemeteryMigrationPlan(
    IReadOnlyList<DesiredCemetery> Cemeteries,
    IReadOnlyList<DesiredGraveType> GraveTypes,
    IReadOnlyList<DesiredCemeteryGraveType> CemeteryGraveTypes,
    IReadOnlyList<SourceDiagnostic> Diagnostics,
    string DatasetFingerprint,
    string PlanFingerprint,
    MigrationCounts Counts)
{
    public bool IsSuccessful => Diagnostics.All(item => !item.IsBlocking);
}

public sealed record MigrationCounts(
    long CurrentMasterRecords,
    long LegacyMasterRecords,
    long SharedVariantKeys,
    long CurrentOnlyVariantKeys,
    long LegacyOnlyVariantKeys,
    long SharedSafePayloadDifferences,
    long CemeteriesPlanned,
    long GraveTypesPlanned,
    long CemeteryGraveTypesPlanned,
    long GraveTypesExcludedWithoutBurialForm,
    long GraveRecords,
    long GraveRecordsExcludedWithoutGraveType,
    long GraveRecordsWithUnknownCemetery,
    long BlockingErrors,
    long NonBlockingFindings);

internal static class MigrationHash
{
    public static string Hex(params ReadOnlyMemory<byte>[] values)
    {
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        foreach (var value in values)
        {
            hash.AppendData(value.Span);
        }

        return Convert.ToHexString(hash.GetHashAndReset());
    }

    public static string Text(params string[] values) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(string.Join('\u001f', values))));

    public static Guid Id(params string[] values)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(string.Join('\u001f', values)));
        bytes[6] = (byte)((bytes[6] & 0x0F) | 0x50);
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80);
        return new Guid(bytes.AsSpan(0, 16));
    }
}

internal static class MigrationRules
{
    public static DesiredCemetery CreateCemetery(
        CemeterySourceRecord source)
    {
        var name = CemeteryMasterDataRules.Required(
            source.CemeteryName,
            "name",
            CemeteryMasterDataRules.NameMaximumLength);
        var code = CemeteryMasterDataRules.Required(
            source.CemeteryCode,
            "code",
            CemeteryMasterDataRules.CodeMaximumLength);
        return new DesiredCemetery(
            MigrationHash.Id("EDWALT", "Cemetery", source.Tenant, source.CemeteryCode),
            name,
            code,
            CemeteryMasterDataRules.UniqueKey(name),
            CemeteryMasterDataRules.UniqueKey(code),
            MigrationHash.Text("Cemetery", name, code),
            source.RecordId);
    }

    public static DesiredGraveType CreateGraveType(
        string targetKey,
        string targetName,
        IReadOnlyList<CemeterySourceRecord> sources,
        BurialForm burialForm,
        bool isActive,
        string? sourceCode)
    {
        var name = CemeteryMasterDataRules.Required(
            targetName,
            "name",
            CemeteryMasterDataRules.NameMaximumLength);
        var code = CemeteryMasterDataRules.Optional(
            sourceCode,
            CemeteryMasterDataRules.CodeMaximumLength);
        return new DesiredGraveType(
            MigrationHash.Id("EDWALT", "GraveType", targetKey),
            targetKey,
            name,
            code,
            CemeteryMasterDataRules.UniqueKey(name),
            code is null ? null : CemeteryMasterDataRules.UniqueKey(code),
            burialForm,
            isActive,
            MigrationHash.Text("GraveType", name, code ?? string.Empty, burialForm.ToString(), isActive.ToString()),
            sources.Select(item => item.RecordId).Order(StringComparer.Ordinal).ToArray());
    }

    public static DesiredCemeteryGraveType CreateCemeteryGraveType(
        CemeterySourceRecord source,
        DesiredGraveType graveType,
        bool isActive)
    {
        var cemeteryId = MigrationHash.Id("EDWALT", "Cemetery", source.Tenant, source.CemeteryCode);
        var id = MigrationHash.Id(
            "EDWALT",
            "CemeteryGraveType",
            source.Tenant,
            source.CemeteryCode,
            source.GraveTypeCode);
        return new DesiredCemeteryGraveType(
            id,
            cemeteryId,
            graveType.Id,
            isActive,
            MigrationHash.Text("CemeteryGraveType", cemeteryId.ToString("D"), graveType.Id.ToString("D"), isActive.ToString()),
            source.RecordId);
    }
}
