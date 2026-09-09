using System.Diagnostics;
using System.IO.Compression;
using Cemaris.Application.Identity;
using Cemaris.Application.NoticeGeneration;
using Cemaris.Infrastructure.NoticeGeneration;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace Cemaris.UnitTests;

public sealed class NoticeGenerationTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    [InlineData(100)]
    public async Task ExpandsAllRowsInOrderWithLiteralXmlTextAndSingleTotal(int count)
    {
        using var fixture = Fixture.Create();
        var lines = Enumerable.Range(1, count).Select(i => new NoticeDocumentLine($"Position {i:D3} <&> ÄÖÜ " + new string('x', 470), "0,10 EUR")).ToArray();
        var output = await fixture.Renderer.RenderAsync(new NoticeDocumentInput(NoticeGenerationService.Map(Source()), lines), CancellationToken.None);
        using var document = WordprocessingDocument.Open(new MemoryStream(output), false);
        var rows = document.MainDocumentPart!.Document!.Descendants<TableRow>().Where(row => row.InnerText.StartsWith("Position ", StringComparison.Ordinal)).ToArray();
        Assert.Equal(count, rows.Length);
        for (var index = 0; index < count; index++) Assert.StartsWith(lines[index].Description, rows[index].InnerText, StringComparison.Ordinal);
        Assert.DoesNotContain("{{", document.MainDocumentPart.Document.InnerText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task RejectsPositionTokensInSeparateRowsAndMergedPrototype()
    {
        using var fixture = Fixture.Create();
        using (var document = WordprocessingDocument.Open(fixture.Paths.TemplatePath, true))
        {
            var cell = document.MainDocumentPart!.Document!.Descendants<TableCell>().Single(x => x.InnerText.Contains("{{GEBUEHR_BETRAG}}", StringComparison.Ordinal));
            var row = cell.Parent!;
            cell.Remove(); row.InsertAfterSelf(new TableRow(cell)); document.MainDocumentPart.Document.Save();
        }
        await Assert.ThrowsAsync<InvalidDataException>(() => fixture.Renderer.RenderAsync(NoticeGenerationService.Map(Source()), CancellationToken.None));
    }

    [Fact]
    public void MapsExactlyApprovedTokensWithoutDerivingLegalOrFinancialFacts()
    {
        var source = Source();
        var values = NoticeGenerationService.Map(source);
        Assert.Equal(23, values.Count);
        Assert.Equal(NoticeGenerationService.RequiredTokens.Order(), values.Keys.Order());
        Assert.Equal(source.CaseId.ToString("D"), values["AKTENZEICHEN"]);
        Assert.Equal("28.08.2026", values["BESCHEIDDATUM"]);
        Assert.Equal("1.234,50 EUR", values["GEBUEHR_BETRAG"]);
        Assert.Equal(values["GEBUEHR_BETRAG"], values["GESAMTBETRAG"]);
        Assert.Equal("Ada Synthetik", values["KONTAKT_NAME"]);
        Assert.Equal("Synthetische Satzung", values["RECHTSGRUNDLAGE"]);
        Assert.DoesNotContain("EMPFAENGER_ANREDE", values.Keys);
        Assert.DoesNotContain("GEBUEHR_LEISTUNGSZEITRAUM", values.Keys);
        Assert.DoesNotContain("DOKUMENTTITEL", values.Keys);
        Assert.DoesNotContain("ZAHLUNGSINFORMATIONEN", values.Keys);
    }

    [Fact]
    public async Task RendersVersionedFixtureAcrossPackagePartsAndLeavesNoTokens()
    {
        using var fixture = Fixture.Create();
        var output = await fixture.Renderer.RenderAsync(NoticeGenerationService.Map(Source()), CancellationToken.None);
        using var document = WordprocessingDocument.Open(new MemoryStream(output), false);
        var text = string.Concat(document.MainDocumentPart!.Document!.Descendants<Text>().Select(x => x.Text))
            + string.Concat(document.MainDocumentPart.HeaderParts.SelectMany(x => x.Header!.Descendants<Text>()).Select(x => x.Text))
            + string.Concat(document.MainDocumentPart.FooterParts.SelectMany(x => x.Footer!.Descendants<Text>()).Select(x => x.Text));
        Assert.Contains("Synthetische Satzung", text, StringComparison.Ordinal);
        Assert.Equal(1, text.Split(SecureOpenXmlNoticeRenderer.LegalIneffectivenessMarker, StringSplitOptions.None).Length - 1);
        Assert.DoesNotContain("{{", text, StringComparison.Ordinal);
        Assert.DoesNotContain("EMPFAENGER_ANREDE", text, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ReplacesSplitRunsTablesHeadersAndFootersWithoutRemovingTheirStructure()
    {
        using var fixture = Fixture.Create();
        using (var document = WordprocessingDocument.Open(fixture.Paths.TemplatePath, true))
        {
            var main = document.MainDocumentPart!;
            var split = main.Document!.Descendants<Text>().Single(x => x.Text.Contains("{{AKTENZEICHEN}}", StringComparison.Ordinal));
            var run = split.Parent!; split.Text = "{{AKTEN"; var second = (Run)run.CloneNode(true); second.Descendants<Text>().Single().Text = "ZEICHEN}}"; run.InsertAfterSelf(second);
            var email = main.Document.Descendants<Paragraph>().Single(x => string.Concat(x.Descendants<Text>().Select(t => t.Text)).Contains("{{KONTAKT_EMAIL}}", StringComparison.Ordinal));
            main.HeaderParts.First().Header!.Append(email.CloneNode(true)); email.Remove();
            var basis = main.Document.Descendants<Paragraph>().Single(x => string.Concat(x.Descendants<Text>().Select(t => t.Text)).Contains("{{RECHTSGRUNDLAGE_FASSUNGSSTAND}}", StringComparison.Ordinal));
            main.FooterParts.First().Footer!.Append(basis.CloneNode(true)); basis.Remove();
            main.Document.Save(); main.HeaderParts.First().Header!.Save(); main.FooterParts.First().Footer!.Save();
        }
        var output = await fixture.Renderer.RenderAsync(NoticeGenerationService.Map(Source()), CancellationToken.None);
        using var rendered = WordprocessingDocument.Open(new MemoryStream(output), false);
        Assert.Contains(Source().CaseId.ToString("D"), string.Concat(rendered.MainDocumentPart!.Document!.Descendants<Text>().Select(x => x.Text)), StringComparison.Ordinal);
        Assert.Contains("ada@example.invalid", string.Concat(rendered.MainDocumentPart.HeaderParts.SelectMany(x => x.Header!.Descendants<Text>()).Select(x => x.Text)), StringComparison.Ordinal);
        Assert.Contains("01.01.2026", string.Concat(rendered.MainDocumentPart.FooterParts.SelectMany(x => x.Footer!.Descendants<Text>()).Select(x => x.Text)), StringComparison.Ordinal);
        Assert.NotEmpty(rendered.MainDocumentPart.Document.Descendants<Table>());
    }

    [Theory]
    [InlineData("word/vbaProject.bin")]
    [InlineData("word/activeX/activeX1.xml")]
    [InlineData("word/embeddings/oleObject1.bin")]
    public async Task RejectsActiveOrEmbeddedPackageEntries(string entryName)
    {
        using var fixture = Fixture.Create(archive => archive.CreateEntry(entryName));
        await Assert.ThrowsAsync<InvalidDataException>(() => fixture.Renderer.RenderAsync(NoticeGenerationService.Map(Source()), CancellationToken.None));
    }

    [Theory]
    [InlineData("{{AKTENZEICHEN}}", "")]
    [InlineData("{{AKTENZEICHEN}}", "{{UNBEKANNT}}")]
    [InlineData("{{AKTENZEICHEN}}", "{{AKTENZEICHEN}}{{AKTENZEICHEN}}")]
    public async Task RejectsMissingUnknownAndDuplicateTokens(string search, string replacement)
    {
        using var fixture = Fixture.Create(archive => ReplaceEntryText(archive, "word/document.xml", search, replacement));
        await Assert.ThrowsAsync<InvalidDataException>(() => fixture.Renderer.RenderAsync(NoticeGenerationService.Map(Source()), CancellationToken.None));
    }

    [Fact]
    public async Task RejectsExternalRelationshipsAndAlternativeHtmlContent()
    {
        using var external = Fixture.Create(archive => ReplaceEntryText(archive, "word/_rels/document.xml.rels", "</Relationships>", "<Relationship Id=\"rExternal\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink\" Target=\"https://example.invalid\" TargetMode=\"External\"/></Relationships>"));
        await Assert.ThrowsAsync<InvalidDataException>(() => external.Renderer.RenderAsync(NoticeGenerationService.Map(Source()), CancellationToken.None));
        using var html = Fixture.Create(archive => archive.CreateEntry("word/alternative.html"));
        await Assert.ThrowsAsync<InvalidDataException>(() => html.Renderer.RenderAsync(NoticeGenerationService.Map(Source()), CancellationToken.None));
    }

    [Fact]
    public async Task RejectsConfiguredZipEntryLimit()
    {
        using var fixture = Fixture.Create(maximumEntryBytes: 100);
        await Assert.ThrowsAsync<InvalidDataException>(() => fixture.Renderer.RenderAsync(NoticeGenerationService.Map(Source()), CancellationToken.None));
    }

    [Fact]
    public void RejectsTemplateTraversal()
    {
        var root = RepositoryRoot();
        var options = Options("..\\tmp\\examples");
        Assert.Throws<InvalidOperationException>(() => new NoticeGenerationPaths(options, Path.Combine(root, "src", "Cemaris.Api"), false));
    }

    [Fact]
    public async Task PdfUsesDirectArgumentListAndAlwaysCleansTemporaryGenerationDirectory()
    {
        using var fixture = Fixture.Create();
        var runner = new FakeRunner(writePdf: true);
        using var converter = new LibreOfficeNoticePdfConverter(fixture.Paths, fixture.Options, runner);
        var result = await converter.ConvertAsync([1, 2, 3], CancellationToken.None);
        Assert.StartsWith("%PDF-", System.Text.Encoding.ASCII.GetString(result), StringComparison.Ordinal);
        Assert.NotNull(runner.Start);
        Assert.False(runner.Start!.UseShellExecute);
        Assert.Contains("--headless", runner.Start.ArgumentList);
        Assert.Contains("pdf:writer_pdf_Export", runner.Start.ArgumentList);
        Assert.Contains(runner.Start.ArgumentList, value => value.StartsWith("-env:UserInstallation=file:", StringComparison.Ordinal));
        Assert.Empty(Directory.EnumerateDirectories(fixture.Paths.TempRoot, "generation-*"));
    }

    [Fact]
    public async Task PdfTimeoutHasStableErrorAndCleansTemporaryGenerationDirectory()
    {
        using var fixture = Fixture.Create();
        using var converter = new LibreOfficeNoticePdfConverter(fixture.Paths, fixture.Options, new FakeRunner(timedOut: true));
        var exception = await Assert.ThrowsAsync<NoticeGenerationException>(() => converter.ConvertAsync([1], CancellationToken.None));
        Assert.Equal("notice_pdf_timeout", exception.Code);
        Assert.Empty(Directory.EnumerateDirectories(fixture.Paths.TempRoot, "generation-*"));
    }

    [Fact]
    public async Task PdfDirectoryCreationFailureDoesNotLeakParallelismSlot()
    {
        using var fixture = Fixture.Create(pdfParallelism: 1);
        using var converter = new LibreOfficeNoticePdfConverter(fixture.Paths, fixture.Options, new FakeRunner(writePdf: true));
        Directory.Delete(fixture.Paths.TempRoot);
        await File.WriteAllTextAsync(fixture.Paths.TempRoot, "synthetic blocker");
        try
        {
            await Assert.ThrowsAnyAsync<IOException>(() => converter.ConvertAsync([1], CancellationToken.None));
        }
        finally
        {
            File.Delete(fixture.Paths.TempRoot);
            Directory.CreateDirectory(fixture.Paths.TempRoot);
        }

        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(2));
        var result = await converter.ConvertAsync([1], timeout.Token);

        Assert.StartsWith("%PDF-", System.Text.Encoding.ASCII.GetString(result), StringComparison.Ordinal);
        Assert.Empty(Directory.EnumerateDirectories(fixture.Paths.TempRoot, "generation-*"));
    }

    [Fact]
    public async Task PdfParallelismNeverExceedsConfiguredLimit()
    {
        using var fixture = Fixture.Create(); var runner = new CoordinatedRunner();
        using var converter = new LibreOfficeNoticePdfConverter(fixture.Paths, fixture.Options, runner);
        await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => converter.ConvertAsync([1], CancellationToken.None)));
        Assert.Equal(2, runner.MaximumConcurrency);
        Assert.Empty(Directory.EnumerateDirectories(fixture.Paths.TempRoot, "generation-*"));
    }

    [Fact]
    public async Task SuccessfulGenerationAuditsOnlyWhitelistBeforeReturningBytes()
    {
        var store = new GenerationStore(Source());
        var service = new NoticeGenerationService(store, new StaticRenderer(), new StaticPdf(),
            new ActorProvider(), new FixedTimeProvider());
        var result = await service.GenerateAsync(Source().NoticeDraftId, 4,
            new(Source().NoticeDraftId, Source().LegalBasisVersionId, NoticeGenerationFormat.Docx), CancellationToken.None);
        Assert.NotEmpty(result.Content);
        var audit = Assert.Single(store.Audits);
        Assert.True(audit.Succeeded);
        Assert.Null(audit.ErrorCode);
        Assert.Equal(4, audit.ExpectedNoticeDraftVersion);
    }

    [Fact]
    public async Task AuditFailureBlocksDocumentBytesAndRecordsStableFailureWhenStoreRecovers()
    {
        var store = new GenerationStore(Source(), throwFirstAudit: true);
        var service = new NoticeGenerationService(store, new StaticRenderer(), new StaticPdf(), new ActorProvider(), new FixedTimeProvider());
        var exception = await Assert.ThrowsAsync<NoticeGenerationException>(() => service.GenerateAsync(Source().NoticeDraftId, 4, new(Source().NoticeDraftId, Source().LegalBasisVersionId, NoticeGenerationFormat.Docx), CancellationToken.None));
        Assert.Equal("notice_generation_failed", exception.Code);
        var audit = Assert.Single(store.Audits); Assert.False(audit.Succeeded); Assert.Equal("notice_generation_failed", audit.ErrorCode);
    }

    [Theory]
    [InlineData(NoticeGenerationSourceOutcome.NoticeDraftNotActive, "notice_draft_not_active")]
    [InlineData(NoticeGenerationSourceOutcome.InvalidBurial, "notice_generation_burial_invalid")]
    [InlineData(NoticeGenerationSourceOutcome.InvalidPayerAddress, "notice_generation_payer_address_invalid")]
    [InlineData(NoticeGenerationSourceOutcome.InvalidGraveMasterData, "notice_generation_grave_master_data_invalid")]
    [InlineData(NoticeGenerationSourceOutcome.InactiveLegalBasis, "notice_generation_legal_basis_inactive")]
    [InlineData(NoticeGenerationSourceOutcome.ActorProfileIncomplete, "notice_generation_contact_profile_incomplete")]
    [InlineData(NoticeGenerationSourceOutcome.RequiredValueMissing, "notice_generation_required_value_missing")]
    public async Task CanonicalSourceFailuresHaveFieldSpecificCodesAndContentFreeAudit(
        NoticeGenerationSourceOutcome outcome,
        string expectedCode)
    {
        var source = Source();
        var store = new GenerationStore(source, outcome: outcome);
        var service = new NoticeGenerationService(store, new StaticRenderer(), new StaticPdf(),
            new ActorProvider(), new FixedTimeProvider());

        var exception = await Assert.ThrowsAsync<NoticeGenerationException>(() => service.GenerateAsync(
            source.NoticeDraftId, source.NoticeDraftVersion,
            new(source.NoticeDraftId, source.LegalBasisVersionId, NoticeGenerationFormat.Docx),
            CancellationToken.None));

        Assert.Equal(expectedCode, exception.Code);
        var audit = Assert.Single(store.Audits);
        Assert.False(audit.Succeeded);
        Assert.Equal(expectedCode, audit.ErrorCode);
        Assert.Equal(source.CaseId, audit.CaseId);
        Assert.Equal(source.LegalBasisInternalVersion, audit.LegalBasisInternalVersion);
    }

    private static NoticeGenerationSource Source() => new(
        Guid.Parse("20000000-0000-0000-0000-000000000001"), Guid.Parse("20000000-0000-0000-0000-000000000002"), 4,
        "SYN.2026000001", new DateOnly(2026, 8, 28), "Erika Beispiel", "Testweg 1", "00000", "Teststadt",
        "Testfriedhof", "Urnengrab", "SYN-GRAB-1", "Emil Beispiel", new DateOnly(2026, 8, 20),
        "Manuell erfasste synthetische Gebührenquelle", 1234.50m, new DateOnly(2026, 9, 28), "Ada", "Synthetik",
        "Friedhofsverwaltung Test", "SYN-1", "+49 000 123", "ada@example.invalid",
        Guid.Parse("20000000-0000-0000-0000-000000000003"), 2, "Synthetische Satzung", new DateOnly(2026, 1, 1));

    private static string RepositoryRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
            if (Directory.Exists(Path.Combine(directory.FullName, ".git"))) return directory.FullName;
        throw new InvalidOperationException("Repository root not found.");
    }

    private static NoticeGenerationOptions Options(string templateRoot, long maximumEntryBytes = 5 * 1024 * 1024, int pdfParallelism = 2) => new()
    {
        TemplateRoot = templateRoot,
        TemplateFileName = "Cemaris-Beisetzungsgebuehren-Testvorlage.docx",
        TempRoot = Path.Combine(templateRoot, "temp"),
        LibreOfficeExecutablePath = Environment.ProcessPath,
        MaximumEntryBytes = maximumEntryBytes,
        PdfParallelism = pdfParallelism,
    };

    private static void ReplaceEntryText(ZipArchive archive, string name, string search, string replacement)
    {
        var entry = archive.GetEntry(name)!; string content;
        using (var reader = new StreamReader(entry.Open())) content = reader.ReadToEnd();
        entry.Delete(); var changed = archive.CreateEntry(name);
        using var writer = new StreamWriter(changed.Open(), new System.Text.UTF8Encoding(false)); writer.Write(content.Replace(search, replacement, StringComparison.Ordinal));
    }

    private sealed class Fixture : IDisposable
    {
        private Fixture(string root, string workingRoot, NoticeGenerationOptions options, NoticeGenerationPaths paths)
        { Root = root; WorkingRoot = workingRoot; Options = options; Paths = paths; Renderer = new(paths, options); }
        public string Root { get; }
        public string WorkingRoot { get; }
        public NoticeGenerationOptions Options { get; }
        public NoticeGenerationPaths Paths { get; }
        public SecureOpenXmlNoticeRenderer Renderer { get; }
        public static Fixture Create(Action<ZipArchive>? mutate = null, long maximumEntryBytes = 5 * 1024 * 1024, int pdfParallelism = 2)
        {
            var root = RepositoryRoot(); var working = Path.Combine(root, "tmp", "notice-generation-unit-tests", Guid.NewGuid().ToString("N")); Directory.CreateDirectory(working);
            var source = Path.Combine(root, "src", "Cemaris.Api", "Templates", "Cemaris-Beisetzungsgebuehren-Testvorlage.docx");
            var target = Path.Combine(working, "Cemaris-Beisetzungsgebuehren-Testvorlage.docx"); File.Copy(source, target);
            if (mutate is not null) { using var archive = ZipFile.Open(target, ZipArchiveMode.Update); mutate(archive); }
            var options = Options(working, maximumEntryBytes, pdfParallelism);
            var paths = new NoticeGenerationPaths(options, root, false); return new(root, working, options, paths);
        }
        public void Dispose() { if (Directory.Exists(WorkingRoot)) Directory.Delete(WorkingRoot, true); var parent = Path.GetDirectoryName(WorkingRoot)!; if (Directory.Exists(parent) && !Directory.EnumerateFileSystemEntries(parent).Any()) Directory.Delete(parent); }
    }

    private sealed class FakeRunner(bool writePdf = false, bool timedOut = false) : INoticeProcessRunner
    {
        public ProcessStartInfo? Start { get; private set; }
        public Task<NoticeProcessResult> RunAsync(ProcessStartInfo start, TimeSpan timeout, CancellationToken token)
        {
            Start = start;
            if (writePdf) { var args = start.ArgumentList.ToArray(); var outdir = args[Array.IndexOf(args, "--outdir") + 1]; File.WriteAllBytes(Path.Combine(outdir, "notice.pdf"), "%PDF-synthetic"u8.ToArray()); }
            return Task.FromResult(new NoticeProcessResult(timedOut ? -1 : 0, timedOut));
        }
    }
    private sealed class CoordinatedRunner : INoticeProcessRunner
    {
        private int current; private int maximum;
        public int MaximumConcurrency => maximum;
        public async Task<NoticeProcessResult> RunAsync(ProcessStartInfo start, TimeSpan timeout, CancellationToken token)
        {
            var count = Interlocked.Increment(ref current); InterlockedExtensions.Max(ref maximum, count);
            try { await Task.Delay(50, token); var args = start.ArgumentList.ToArray(); var outdir = args[Array.IndexOf(args, "--outdir") + 1]; await File.WriteAllBytesAsync(Path.Combine(outdir, "notice.pdf"), "%PDF-parallel"u8.ToArray(), token); return new(0, false); }
            finally { Interlocked.Decrement(ref current); }
        }
    }
    private static class InterlockedExtensions
    {
        public static void Max(ref int target, int value) { int current; do { current = Volatile.Read(ref target); if (current >= value) return; } while (Interlocked.CompareExchange(ref target, value, current) != current); }
    }
    private sealed class GenerationStore(
        NoticeGenerationSource source,
        bool throwFirstAudit = false,
        NoticeGenerationSourceOutcome outcome = NoticeGenerationSourceOutcome.Found) : INoticeGenerationStore
    {
        public List<NoticeGenerationAudit> Audits { get; } = [];
        private int auditCalls;
        public Task<NoticeGenerationSourceResult> ReadSourceAsync(Guid a, long b, Guid c, Guid d, Guid e, CancellationToken token) => Task.FromResult(
            new NoticeGenerationSourceResult(outcome, outcome == NoticeGenerationSourceOutcome.Found ? source : null,
                source.CaseId, source.LegalBasisInternalVersion));
        public Task SaveAuditAsync(NoticeGenerationAudit audit, CancellationToken token) { if (throwFirstAudit && auditCalls++ == 0) throw new InvalidOperationException("synthetic audit failure"); Audits.Add(audit); return Task.CompletedTask; }
    }
    private sealed class StaticRenderer : INoticeDocumentRenderer { public Task<byte[]> RenderAsync(NoticeDocumentInput input, CancellationToken token) => Task.FromResult<byte[]>([1, 2]); }
    private sealed class StaticPdf : INoticePdfConverter { public Task<byte[]> ConvertAsync(byte[] document, CancellationToken token) => Task.FromResult<byte[]>("%PDF-x"u8.ToArray()); }
    private sealed class ActorProvider : ICurrentActorProvider { public ActorIdentity Current { get; } = new(TestIdentityId, "Ada Synthetik", SystemRole.Administration); private const string TestIdentityId = "10000000-0000-0000-0000-000000000001"; }
    private sealed class FixedTimeProvider : TimeProvider { public override DateTimeOffset GetUtcNow() => new(2026, 8, 28, 12, 0, 0, TimeSpan.Zero); }
}
