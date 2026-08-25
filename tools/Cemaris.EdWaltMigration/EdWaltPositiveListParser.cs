using System.Security.Cryptography;

namespace Cemaris.EdWaltMigration;

public sealed class EdWaltPositiveListParser
{
    public const int CurrentMasterRecordLength = 1414;
    public const int LegacyMasterRecordLength = 323;
    public const int GraveRecordLength = 2693;

    private static readonly FieldSpan Tenant = new(0, 2, FieldKind.Code);
    private static readonly FieldSpan CemeteryCode = new(2, 4, FieldKind.Code);
    private static readonly FieldSpan GraveTypeCode = new(6, 4, FieldKind.DigitCode);
    private static readonly FieldSpan CemeteryName = new(15, 35, FieldKind.Text);
    private static readonly FieldSpan GraveTypeName1 = new(86, 30, FieldKind.Text);
    private static readonly FieldSpan GraveTypeName2 = new(116, 30, FieldKind.Text);
    private static readonly FieldSpan StructureKey = new(6, 20, FieldKind.Code);

    public static EdWaltSourceSet Parse(string phase2Root)
    {
        var safeRoot = ApprovedPaths.ValidatePhase2Root(phase2Root);
        return ParseValidatedRoot(safeRoot);
    }

    internal static EdWaltSourceSet ParseSyntheticFixture(string phase2Root)
    {
        var safeRoot = ApprovedPaths.ValidateSyntheticFixtureRoot(phase2Root);
        return ParseValidatedRoot(safeRoot);
    }

    private static EdWaltSourceSet ParseValidatedRoot(string safeRoot)
    {
        var rawRoot = Path.Combine(safeRoot, "raw-uncompressed");
        var diagnostics = new List<SourceDiagnostic>();
        using var datasetHash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        var current = ReadMasterFile(
            Path.Combine(rawRoot, "W005.raw"),
            CurrentMasterRecordLength,
            false,
            diagnostics,
            datasetHash);
        var legacy = ReadMasterFile(
            Path.Combine(rawRoot, "W005dm.raw"),
            LegacyMasterRecordLength,
            true,
            diagnostics,
            datasetHash);
        var graves = ReadGraveFile(
            Path.Combine(rawRoot, "W020.raw"),
            diagnostics,
            datasetHash,
            out var graveRecordCount);

        return new EdWaltSourceSet(
            current,
            legacy,
            graves,
            diagnostics,
            Convert.ToHexString(datasetHash.GetHashAndReset()),
            current.Count,
            legacy.Count,
            graveRecordCount);
    }

    private static List<CemeterySourceRecord> ReadMasterFile(
        string path,
        int recordLength,
        bool isLegacy,
        List<SourceDiagnostic> diagnostics,
        IncrementalHash datasetHash)
    {
        var count = ValidateFile(path, recordLength);
        datasetHash.AppendData([(byte)(isLegacy ? 2 : 1)]);
        datasetHash.AppendData(BitConverter.GetBytes(count));
        var records = new List<CemeterySourceRecord>(checked((int)count));
        using var stream = OpenReadOnly(path);
        for (long index = 0; index < count; index++)
        {
            var recordOffset = index * recordLength;
            var tenant = ReadSpan(stream, recordOffset, Tenant);
            var cemeteryCode = ReadSpan(stream, recordOffset, CemeteryCode);
            var graveTypeCode = ReadSpan(stream, recordOffset, GraveTypeCode);
            var cemeteryName = ReadSpan(stream, recordOffset, CemeteryName);
            var graveName1 = ReadSpan(stream, recordOffset, GraveTypeName1);
            var graveName2 = ReadSpan(stream, recordOffset, GraveTypeName2);
            var approvedBytes = new[]
            {
                tenant.Bytes,
                cemeteryCode.Bytes,
                graveTypeCode.Bytes,
                cemeteryName.Bytes,
                graveName1.Bytes,
                graveName2.Bytes,
            };
            foreach (var value in approvedBytes)
            {
                datasetHash.AppendData(value);
            }

            var recordId = MigrationHash.Hex(
                new byte[] { (byte)(isLegacy ? 2 : 1) },
                tenant.Bytes,
                cemeteryCode.Bytes,
                graveTypeCode.Bytes);
            var blocking = false;
            blocking |= AddFieldDiagnostic(tenant, recordId, "E_MASTER_TENANT", diagnostics);
            blocking |= AddFieldDiagnostic(cemeteryCode, recordId, "E_MASTER_CEMETERY_CODE", diagnostics);
            blocking |= AddFieldDiagnostic(graveTypeCode, recordId, "E_MASTER_GRAVE_TYPE_CODE", diagnostics);
            blocking |= AddFieldDiagnostic(cemeteryName, recordId, "E_MASTER_CEMETERY_NAME", diagnostics);
            blocking |= AddFieldDiagnostic(graveName1, recordId, "E_MASTER_GRAVE_TYPE_NAME", diagnostics);
            blocking |= AddFieldDiagnostic(graveName2, recordId, "E_MASTER_GRAVE_TYPE_NAME_2", diagnostics, required: false);
            if (blocking)
            {
                continue;
            }

            var graveTypeName = string.IsNullOrEmpty(graveName2.Value)
                ? graveName1.Value!
                : $"{graveName1.Value} {graveName2.Value}";
            records.Add(new CemeterySourceRecord(
                tenant.Value!,
                cemeteryCode.Value!,
                graveTypeCode.Value!,
                cemeteryName.Value!,
                graveTypeName,
                recordId,
                MigrationHash.Hex(approvedBytes.Select(value => (ReadOnlyMemory<byte>)value).ToArray()),
                isLegacy));
        }

        return records;
    }

    private static List<GraveSourceRecord> ReadGraveFile(
        string path,
        List<SourceDiagnostic> diagnostics,
        IncrementalHash datasetHash,
        out long rawRecordCount)
    {
        var count = ValidateFile(path, GraveRecordLength);
        rawRecordCount = count;
        datasetHash.AppendData([3]);
        datasetHash.AppendData(BitConverter.GetBytes(count));
        var records = new List<GraveSourceRecord>(checked((int)count));
        using var stream = OpenReadOnly(path);
        for (long index = 0; index < count; index++)
        {
            var recordOffset = index * GraveRecordLength;
            var tenant = ReadSpan(stream, recordOffset, Tenant);
            var cemeteryCode = ReadSpan(stream, recordOffset, CemeteryCode);
            var structureKey = ReadSpan(stream, recordOffset, StructureKey);
            datasetHash.AppendData(tenant.Bytes);
            datasetHash.AppendData(cemeteryCode.Bytes);
            datasetHash.AppendData(structureKey.Bytes);
            var recordId = MigrationHash.Hex(
                new byte[] { 3 },
                tenant.Bytes,
                cemeteryCode.Bytes,
                structureKey.Bytes);
            var blocking = false;
            blocking |= AddFieldDiagnostic(
                tenant,
                recordId,
                "W_GRAVE_TENANT_EXCLUDED_RECORD",
                diagnostics,
                diagnosticIsBlocking: false);
            blocking |= AddFieldDiagnostic(
                cemeteryCode,
                recordId,
                "W_GRAVE_CEMETERY_CODE_EXCLUDED_RECORD",
                diagnostics,
                diagnosticIsBlocking: false);
            blocking |= AddFieldDiagnostic(
                structureKey,
                recordId,
                "W_GRAVE_STRUCTURE_KEY_EXCLUDED_RECORD",
                diagnostics,
                diagnosticIsBlocking: false);
            if (!blocking)
            {
                records.Add(new GraveSourceRecord(
                    tenant.Value!,
                    cemeteryCode.Value!,
                    structureKey.Value!,
                    recordId));
            }
        }

        return records;
    }

    private static bool AddFieldDiagnostic(
        ParsedField field,
        string recordId,
        string code,
        List<SourceDiagnostic> diagnostics,
        bool required = true,
        bool diagnosticIsBlocking = true)
    {
        if (field.ErrorCode is not null || required && string.IsNullOrEmpty(field.Value))
        {
            diagnostics.Add(new SourceDiagnostic(code, recordId, diagnosticIsBlocking));
            return true;
        }

        return false;
    }

    private static ParsedField ReadSpan(Stream stream, long recordOffset, FieldSpan span)
    {
        var bytes = new byte[span.Length];
        stream.Position = recordOffset + span.Offset;
        stream.ReadExactly(bytes);
        try
        {
            var value = Cp1252.Decode(bytes).TrimEnd(' ');
            if (span.Kind == FieldKind.DigitCode && value.Any(item => item is < '0' or > '9'))
            {
                return new ParsedField(bytes, null, "invalid-digit-code");
            }

            if (value.Any(char.IsControl))
            {
                return new ParsedField(bytes, null, "control-character");
            }

            return new ParsedField(bytes, value, null);
        }
        catch (InvalidDataException)
        {
            return new ParsedField(bytes, null, "invalid-cp1252");
        }
    }

    private static long ValidateFile(string path, int recordLength)
    {
        var info = new FileInfo(path);
        if (!info.Exists || info.Length % recordLength != 0)
        {
            throw new InvalidDataException(
                "Eine positiv gelistete Quelldatei fehlt oder besitzt keine ganzzahlige Satzanzahl.");
        }

        return info.Length / recordLength;
    }

    private static FileStream OpenReadOnly(string path) =>
        new(path, FileMode.Open, FileAccess.Read, FileShare.Read);

    private sealed record FieldSpan(int Offset, int Length, FieldKind Kind);
    private sealed record ParsedField(byte[] Bytes, string? Value, string? ErrorCode);
    private enum FieldKind { Code, DigitCode, Text }
}

internal static class Cp1252
{
    private static readonly char[] Controls =
    [
        '\u20ac', '\0', '\u201a', '\u0192', '\u201e', '\u2026', '\u2020', '\u2021',
        '\u02c6', '\u2030', '\u0160', '\u2039', '\u0152', '\0', '\u017d', '\0',
        '\0', '\u2018', '\u2019', '\u201c', '\u201d', '\u2022', '\u2013', '\u2014',
        '\u02dc', '\u2122', '\u0161', '\u203a', '\u0153', '\0', '\u017e', '\u0178',
    ];

    public static string Decode(ReadOnlySpan<byte> bytes)
    {
        var result = new char[bytes.Length];
        for (var index = 0; index < bytes.Length; index++)
        {
            var value = bytes[index];
            if (value is < 0x20)
            {
                throw new InvalidDataException("Ein positiv gelistetes Textfeld enthält ein Steuerbyte.");
            }

            if (value is >= 0x80 and <= 0x9F)
            {
                var mapped = Controls[value - 0x80];
                if (mapped == '\0')
                {
                    throw new InvalidDataException("Ein positiv gelistetes Textfeld enthält ein undefiniertes CP1252-Byte.");
                }

                result[index] = mapped;
            }
            else
            {
                result[index] = (char)value;
            }
        }

        return new string(result);
    }
}

internal static class ApprovedPaths
{
    public const string Phase2DirectoryName = "phase2-20260811";
    public const string Phase5DirectoryName = "phase5-cemetery-master-data-20260825";
    public const string ApprovedMigrationRoot = @"C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration";
    public static readonly string ApprovedPhase2Root = Path.Combine(
        ApprovedMigrationRoot,
        Phase2DirectoryName);
    public static readonly string ApprovedPhase5Root = Path.Combine(
        ApprovedMigrationRoot,
        Phase5DirectoryName);

    public static string ValidatePhase2Root(string value)
    {
        var fullPath = Path.GetFullPath(value);
        if (!Directory.Exists(fullPath) ||
            !string.Equals(fullPath, ApprovedPhase2Root, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Die Phase-2-Quelle liegt nicht in der freigegebenen Arbeitswurzel.");
        }

        return fullPath;
    }

    public static string ValidateWorkspace(string phase2Root, string workspace)
    {
        ValidatePhase2Root(phase2Root);
        var resolved = Path.GetFullPath(workspace);
        if (!string.Equals(resolved, ApprovedPhase5Root, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Das Laufartefaktverzeichnis ist nicht die freigegebene Phase-5-Wurzel.");
        }

        Directory.CreateDirectory(resolved);
        return resolved;
    }

    internal static string ValidateSyntheticFixtureRoot(string value)
    {
        var fullPath = Path.GetFullPath(value);
        if (!Directory.Exists(fullPath) ||
            !string.Equals(Path.GetFileName(fullPath), Phase2DirectoryName, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Die synthetische Testquelle besitzt nicht die erwartete Phase-2-Struktur.");
        }

        return fullPath;
    }
}
