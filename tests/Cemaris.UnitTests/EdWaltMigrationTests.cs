using System.Text.Json;
using Cemaris.Domain.Cemeteries;
using Cemaris.EdWaltMigration;

namespace Cemaris.UnitTests;

public sealed class EdWaltMigrationTests : IDisposable
{
    private readonly string testRoot = Path.Combine(
        Path.GetTempPath(),
        $"CemarisEdWaltMigrationTests-{Guid.NewGuid():N}");

    [Fact]
    public void ParserReadsOnlyPositiveListedSpansAndKeepsExcludedBlankRecordNonBlocking()
    {
        var sourceRoot = CreateSource(
            [CreateMasterRecord(EdWaltPositiveListParser.CurrentMasterRecordLength)],
            [CreateMasterRecord(EdWaltPositiveListParser.LegacyMasterRecordLength)],
            [CreateGraveRecord(), Enumerable.Repeat((byte)0x20, EdWaltPositiveListParser.GraveRecordLength).ToArray()]);

        var source = EdWaltPositiveListParser.ParseSyntheticFixture(sourceRoot);
        var plan = CemeteryMigrationPlanner.Create(source);

        var current = Assert.Single(source.CurrentMasterRecords);
        Assert.Equal("01", current.Tenant);
        Assert.Equal("0001", current.CemeteryCode);
        Assert.Equal("1001", current.GraveTypeCode);
        Assert.Equal("Synthetischer Friedhof Ä", current.CemeteryName);
        Assert.Equal("Synthetische Grabart", current.GraveTypeName);
        Assert.Equal(2, source.GraveRecordCount);
        Assert.Single(source.GraveRecords);
        Assert.Equal("A1B2C3D4E5F6G7H8I9J0", source.GraveRecords[0].StructureKey);
        Assert.Equal(3, source.Diagnostics.Count);
        Assert.All(source.Diagnostics, item => Assert.False(item.IsBlocking));
        Assert.True(plan.IsSuccessful);
        Assert.Equal(1, plan.Counts.CemeteriesPlanned);
        Assert.Equal(1, plan.Counts.GraveTypesExcludedWithoutBurialForm);
        Assert.Equal(2, plan.Counts.GraveRecordsExcludedWithoutGraveType);
    }

    [Fact]
    public void SafeReportContainsNoDecodedSourceValues()
    {
        var sourceRoot = CreateSource(
            [CreateMasterRecord(EdWaltPositiveListParser.CurrentMasterRecordLength)],
            [CreateMasterRecord(EdWaltPositiveListParser.LegacyMasterRecordLength)],
            [CreateGraveRecord()]);
        var source = EdWaltPositiveListParser.ParseSyntheticFixture(sourceRoot);
        var report = MigrationReports.Create("dry-run", CemeteryMigrationPlanner.Create(source));

        var json = JsonSerializer.Serialize(report);

        Assert.DoesNotContain("Synthetischer Friedhof", json, StringComparison.Ordinal);
        Assert.DoesNotContain("Synthetische Grabart", json, StringComparison.Ordinal);
        Assert.DoesNotContain("A1B2C3D4E5F6G7H8I9J0", json, StringComparison.Ordinal);
    }

    [Fact]
    public void CompleteAnonymousMappingCreatesGlobalGraveTypeAndCemeteryAssignments()
    {
        var first = CreateSourceRecord("01", "0001", "1001", "Friedhof Eins", "RID-1");
        var second = CreateSourceRecord("01", "0002", "1001", "Friedhof Zwei", "RID-2");
        var source = new EdWaltSourceSet(
            [first, second],
            [],
            [],
            [],
            "DATASET",
            2,
            0,
            0);
        var decisions = new LocalMigrationDecisionSet(
            1,
            source.DatasetFingerprint,
            [
                new("RID-1", "TARGET", "Synthetische Zielgrabart", BurialForm.Mixed, true),
                new("RID-2", "TARGET", "Synthetische Zielgrabart", BurialForm.Mixed, true),
            ]);

        var plan = CemeteryMigrationPlanner.Create(source, decisions, requireCompleteMapping: true);
        var reportJson = JsonSerializer.Serialize(MigrationReports.Create("dry-run", plan));

        Assert.True(plan.IsSuccessful);
        Assert.Equal(2, plan.Counts.CemeteriesPlanned);
        Assert.Equal(1, plan.Counts.GraveTypesPlanned);
        Assert.Equal(2, plan.Counts.CemeteryGraveTypesPlanned);
        Assert.Equal(0, plan.Counts.GraveTypesExcludedWithoutBurialForm);
        Assert.DoesNotContain("Synthetische Zielgrabart", reportJson, StringComparison.Ordinal);
        Assert.DoesNotContain("Friedhof Eins", reportJson, StringComparison.Ordinal);
    }

    [Fact]
    public void RequiredMappingBlocksEveryUnmappedCurrentRecord()
    {
        var sourceRecord = CreateSourceRecord("01", "0001", "1001", "Friedhof Eins", "RID-1");
        var source = new EdWaltSourceSet(
            [sourceRecord],
            [],
            [],
            [],
            "DATASET",
            1,
            0,
            0);
        var decisions = new LocalMigrationDecisionSet(1, source.DatasetFingerprint, []);

        var plan = CemeteryMigrationPlanner.Create(source, decisions, requireCompleteMapping: true);

        Assert.False(plan.IsSuccessful);
        Assert.Contains(plan.Diagnostics, item =>
            item.Code == "E_GRAVE_TYPE_MAPPING_MISSING" && item.IsBlocking);
    }

    [Fact]
    public void ParserRejectsNonIntegralRecordLength()
    {
        var sourceRoot = CreateSource(
            [new byte[EdWaltPositiveListParser.CurrentMasterRecordLength - 1]],
            [CreateMasterRecord(EdWaltPositiveListParser.LegacyMasterRecordLength)],
            [CreateGraveRecord()]);

        Assert.Throws<InvalidDataException>(() => EdWaltPositiveListParser.ParseSyntheticFixture(sourceRoot));
    }

    [Fact]
    public void PlannerBlocksTargetCodeCollisionAcrossSourceTenants()
    {
        var first = CreateSourceRecord("01", "0001", "1001", "Friedhof Eins", "RID-1");
        var second = CreateSourceRecord("02", "0001", "1001", "Friedhof Zwei", "RID-2");
        var source = new EdWaltSourceSet(
            [first, second],
            [],
            [],
            [],
            "DATASET",
            2,
            0,
            0);

        var plan = CemeteryMigrationPlanner.Create(source);

        Assert.False(plan.IsSuccessful);
        Assert.Contains(plan.Diagnostics, item => item.Code == "E_TARGET_DUPLICATE_CEMETERY_CODE" && item.IsBlocking);
    }

    [Fact]
    public void PlannerBlocksDifferentSafePayloadForSharedVariantKey()
    {
        var current = CreateSourceRecord("01", "0001", "1001", "Friedhof Eins", "RID-1");
        var legacy = current with
        {
            RecordId = "RID-2",
            SafePayloadHash = "OTHER-PAYLOAD",
            IsLegacyVariant = true,
        };
        var source = new EdWaltSourceSet(
            [current],
            [legacy],
            [],
            [],
            "DATASET",
            1,
            1,
            0);

        var plan = CemeteryMigrationPlanner.Create(source);

        Assert.False(plan.IsSuccessful);
        Assert.Contains(
            plan.Diagnostics,
            item => item.Code == "E_SHARED_VARIANT_SAFE_PAYLOAD_DIFFERENCE" && item.IsBlocking);
    }

    public void Dispose()
    {
        if (Directory.Exists(testRoot))
        {
            Directory.Delete(testRoot, recursive: true);
        }
    }

    private string CreateSource(
        IReadOnlyList<byte[]> current,
        IReadOnlyList<byte[]> legacy,
        IReadOnlyList<byte[]> graves)
    {
        var sourceRoot = Path.Combine(testRoot, ApprovedPaths.Phase2DirectoryName);
        var rawRoot = Path.Combine(sourceRoot, "raw-uncompressed");
        Directory.CreateDirectory(rawRoot);
        WriteRecords(Path.Combine(rawRoot, "W005.raw"), current);
        WriteRecords(Path.Combine(rawRoot, "W005dm.raw"), legacy);
        WriteRecords(Path.Combine(rawRoot, "W020.raw"), graves);
        return sourceRoot;
    }

    private static byte[] CreateMasterRecord(int length)
    {
        var record = Enumerable.Repeat((byte)0x20, length).ToArray();
        WriteField(record, 0, "01");
        WriteField(record, 2, "0001");
        WriteField(record, 6, "1001");
        WriteField(record, 15, "Synthetischer Friedhof Ä");
        Array.Fill(record, (byte)0x01, 50, 35);
        WriteField(record, 86, "Synthetische Grabart");
        return record;
    }

    private static byte[] CreateGraveRecord()
    {
        var record = Enumerable.Repeat((byte)0x01, EdWaltPositiveListParser.GraveRecordLength).ToArray();
        WriteField(record, 0, "01");
        WriteField(record, 2, "0001");
        WriteField(record, 6, "A1B2C3D4E5F6G7H8I9J0");
        return record;
    }

    private static CemeterySourceRecord CreateSourceRecord(
        string tenant,
        string cemeteryCode,
        string graveTypeCode,
        string cemeteryName,
        string recordId) =>
        new(
            tenant,
            cemeteryCode,
            graveTypeCode,
            cemeteryName,
            "Synthetische Grabart",
            recordId,
            $"PAYLOAD-{recordId}",
            false);

    private static void WriteField(byte[] target, int offset, string value)
    {
        for (var index = 0; index < value.Length; index++)
        {
            target[offset + index] = checked((byte)value[index]);
        }
    }

    private static void WriteRecords(string path, IEnumerable<byte[]> records)
    {
        using var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        foreach (var record in records)
        {
            stream.Write(record);
        }
    }
}
