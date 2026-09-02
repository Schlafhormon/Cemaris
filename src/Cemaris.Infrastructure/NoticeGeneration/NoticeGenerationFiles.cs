using System.Diagnostics;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using Cemaris.Application.NoticeGeneration;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;
using DocumentFormat.OpenXml.Wordprocessing;

namespace Cemaris.Infrastructure.NoticeGeneration;

public sealed class NoticeGenerationOptions
{
    public string TemplateRoot { get; init; } = "Templates";
    public string TemplateFileName { get; init; } = "Cemaris-Beisetzungsgebuehren.docx";
    public string TempRoot { get; init; } = "notice-generation-temp";
    public string? LibreOfficeExecutablePath { get; init; }
    public long MaximumTemplateBytes { get; init; } = 10 * 1024 * 1024;
    public long MaximumEntryBytes { get; init; } = 5 * 1024 * 1024;
    public long MaximumUncompressedBytes { get; init; } = 30 * 1024 * 1024;
    public long MaximumOutputBytes { get; init; } = 20 * 1024 * 1024;
    public int MaximumCompressionRatio { get; init; } = 100;
    public int PdfTimeoutSeconds { get; init; } = 60;
    public int PdfParallelism { get; init; } = 2;
    public int OrphanMaximumAgeHours { get; init; } = 24;
}

public sealed class NoticeGenerationPaths
{
    public NoticeGenerationPaths(NoticeGenerationOptions options, string contentRoot, bool requirePdf)
    {
        var root = Path.GetFullPath(contentRoot);
        TemplateRoot = ResolveWithin(root, options.TemplateRoot, "template root");
        TemplatePath = ResolveWithin(TemplateRoot, options.TemplateFileName, "template file");
        TempRoot = ResolveWithin(root, options.TempRoot, "temporary root");
        if (!File.Exists(TemplatePath) || !string.Equals(Path.GetExtension(TemplatePath), ".docx", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The configured DOCX notice template is missing or invalid.");
        Directory.CreateDirectory(TempRoot);
        EnsureNoReparsePoint(TemplateRoot); EnsureNoReparsePoint(TemplatePath); EnsureNoReparsePoint(TempRoot);
        if (requirePdf)
        {
            if (string.IsNullOrWhiteSpace(options.LibreOfficeExecutablePath) || !Path.IsPathFullyQualified(options.LibreOfficeExecutablePath))
                throw new InvalidOperationException("An absolute LibreOffice executable path is required for notice PDF generation.");
            LibreOfficeExecutablePath = Path.GetFullPath(options.LibreOfficeExecutablePath);
            if (!File.Exists(LibreOfficeExecutablePath)) throw new InvalidOperationException("The configured LibreOffice executable does not exist.");
        }
        else LibreOfficeExecutablePath = options.LibreOfficeExecutablePath;
    }

    public string TemplateRoot { get; }
    public string TemplatePath { get; }
    public string TempRoot { get; }
    public string? LibreOfficeExecutablePath { get; }

    internal static string ResolveWithin(string root, string value, string label)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new InvalidOperationException($"The configured {label} is empty.");
        var path = Path.GetFullPath(Path.IsPathFullyQualified(value) ? value : Path.Combine(root, value));
        var prefix = Path.TrimEndingDirectorySeparator(Path.GetFullPath(root)) + Path.DirectorySeparatorChar;
        if (!path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) && !string.Equals(path, Path.TrimEndingDirectorySeparator(root), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"The configured {label} leaves its permitted root.");
        return path;
    }

    internal static void EnsureNoReparsePoint(string path)
    {
        for (FileSystemInfo? current = File.Exists(path) ? new FileInfo(path) : new DirectoryInfo(path);
            current is not null && current.Exists;
            current = current is FileInfo file ? file.Directory : ((DirectoryInfo)current).Parent)
            if ((current.Attributes & FileAttributes.ReparsePoint) != 0)
                throw new InvalidOperationException("Notice-generation paths must not contain reparse points.");
    }
}

public sealed partial class SecureOpenXmlNoticeRenderer(NoticeGenerationPaths paths, NoticeGenerationOptions options)
    : INoticeDocumentRenderer
{
    public const string LegalIneffectivenessMarker = "RECHTLICH WIRKUNGSLOSER ENTWURF";

    [GeneratedRegex(@"\{\{([A-Z0-9_]+)\}\}", RegexOptions.CultureInvariant)]
    private static partial Regex TokenRegex();

    public async Task<byte[]> RenderAsync(IReadOnlyDictionary<string, string> values, CancellationToken token)
    {
        if (values.Count != NoticeGenerationService.RequiredTokens.Length
            || NoticeGenerationService.RequiredTokens.Any(x => !values.TryGetValue(x, out var value) || string.IsNullOrWhiteSpace(value)))
            throw new InvalidDataException("The notice token mapping is incomplete.");
        var template = await File.ReadAllBytesAsync(paths.TemplatePath, token);
        ValidatePackageBytes(template);
        using var stream = new MemoryStream(); await stream.WriteAsync(template, token); stream.Position = 0;
        using (var document = WordprocessingDocument.Open(stream, true, new OpenSettings { AutoSave = true }))
        {
            ValidateParts(document);
            var paragraphs = EnumerateParagraphs(document).ToArray();
            var found = NoticeGenerationService.RequiredTokens.ToDictionary(x => x, _ => 0, StringComparer.Ordinal);
            foreach (var paragraph in paragraphs)
            {
                var text = string.Concat(paragraph.Descendants<Text>().Select(x => x.Text));
                foreach (Match match in TokenRegex().Matches(text))
                {
                    if (!found.TryGetValue(match.Groups[1].Value, out var count)) throw new InvalidDataException("The template contains an unknown token.");
                    found[match.Groups[1].Value] = count + 1;
                }
            }
            if (found.Any(x => x.Value != 1)) throw new InvalidDataException("Every approved token must occur exactly once.");
            foreach (var paragraph in paragraphs) ReplaceParagraphTokens(paragraph, values);
            AddLegalIneffectivenessMarker(document);
            var validationErrors = new OpenXmlValidator(FileFormatVersions.Microsoft365).Validate(document, token).Take(1).ToArray();
            if (validationErrors.Length > 0) throw new InvalidDataException("The generated OpenXML package is invalid.");
        }
        var output = stream.ToArray();
        if (output.LongLength > options.MaximumOutputBytes) throw new InvalidDataException("The generated document is too large.");
        ValidatePackageBytes(output);
        using (var check = WordprocessingDocument.Open(new MemoryStream(output), false))
            if (EnumerateParagraphs(check).Any(x => TokenRegex().IsMatch(string.Concat(x.Descendants<Text>().Select(t => t.Text)))))
                throw new InvalidDataException("A template token remained in the generated document.");
        return output;
    }

    private static void AddLegalIneffectivenessMarker(WordprocessingDocument document)
    {
        var body = document.MainDocumentPart?.Document?.Body
            ?? throw new InvalidDataException("The main document body is missing.");
        var paragraph = new Paragraph(
            new ParagraphProperties(
                new SpacingBetweenLines { After = "160" },
                new Justification { Val = JustificationValues.Center }),
            new Run(
                new RunProperties(
                    new RunFonts { Ascii = "Arial", HighAnsi = "Arial" },
                    new Bold(),
                    new Color { Val = "C00000" },
                    new FontSize { Val = "28" },
                    new FontSizeComplexScript { Val = "28" }),
                new Text(LegalIneffectivenessMarker)));
        body.InsertAt(paragraph, 0);
    }

    private void ValidatePackageBytes(byte[] bytes)
    {
        if (bytes.LongLength is 0 || bytes.LongLength > options.MaximumTemplateBytes) throw new InvalidDataException("The template size is invalid.");
        using var archive = new ZipArchive(new MemoryStream(bytes), ZipArchiveMode.Read, false);
        long total = 0;
        foreach (var entry in archive.Entries)
        {
            if (entry.FullName.Contains("..", StringComparison.Ordinal) || Path.IsPathFullyQualified(entry.FullName)) throw new InvalidDataException("The package contains an unsafe entry path.");
            if (entry.Length > options.MaximumEntryBytes) throw new InvalidDataException("A package entry is too large.");
            total = checked(total + entry.Length);
            if (total > options.MaximumUncompressedBytes) throw new InvalidDataException("The package expands beyond its limit.");
            if (entry.CompressedLength == 0 ? entry.Length > 0 : entry.Length / Math.Max(1, entry.CompressedLength) > options.MaximumCompressionRatio)
                throw new InvalidDataException("The package compression ratio is unsafe.");
            var name = entry.FullName.Replace('\\', '/').ToLowerInvariant();
            if (name.Contains("vbaproject", StringComparison.Ordinal) || name.Contains("activex/", StringComparison.Ordinal)
                || name.Contains("embeddings/", StringComparison.Ordinal) || name.Contains("oleobject", StringComparison.Ordinal)
                || name.EndsWith(".bin", StringComparison.Ordinal)) throw new InvalidDataException("Active package content is forbidden.");
            var extension = Path.GetExtension(name);
            if (extension is not (".xml" or ".rels" or ".png" or ".jpg" or ".jpeg" or ".gif" or ".emf" or ".wmf"))
                throw new InvalidDataException("The package contains an unapproved content type.");
        }
    }

    private static void ValidateParts(WordprocessingDocument document)
    {
        if (document.DocumentType != WordprocessingDocumentType.Document) throw new InvalidDataException("Only plain DOCX documents are accepted.");
        var pending = new Queue<OpenXmlPartContainer>(); pending.Enqueue(document);
        while (pending.Count > 0)
        {
            var current = pending.Dequeue();
            if (current.ExternalRelationships.Any() || current.HyperlinkRelationships.Any(x => x.IsExternal))
                throw new InvalidDataException("External package relationships are forbidden.");
            foreach (var pair in current.Parts)
            {
                if (pair.OpenXmlPart is AlternativeFormatImportPart) throw new InvalidDataException("Alternative document content is forbidden.");
                pending.Enqueue(pair.OpenXmlPart);
            }
        }
        var main = document.MainDocumentPart ?? throw new InvalidDataException("The main document part is missing.");
        var root = main.Document ?? throw new InvalidDataException("The main document root is missing.");
        if (root.Descendants<AltChunk>().Any()
            || main.DocumentSettingsPart?.Settings?.Descendants<AttachedTemplate>().Any() == true)
            throw new InvalidDataException("Linked or alternative document content is forbidden.");
    }

    private static IEnumerable<Paragraph> EnumerateParagraphs(WordprocessingDocument document)
    {
        var main = document.MainDocumentPart;
        if (main?.Document is null) yield break;
        foreach (var item in main.Document.Descendants<Paragraph>()) yield return item;
        foreach (var part in main.HeaderParts)
            foreach (var item in part.Header?.Descendants<Paragraph>() ?? []) yield return item;
        foreach (var part in main.FooterParts)
            foreach (var item in part.Footer?.Descendants<Paragraph>() ?? []) yield return item;
    }

    private static void ReplaceParagraphTokens(Paragraph paragraph, IReadOnlyDictionary<string, string> values)
    {
        var texts = paragraph.Descendants<Text>().ToArray();
        var content = string.Concat(texts.Select(x => x.Text));
        var matches = TokenRegex().Matches(content).Cast<Match>().OrderByDescending(x => x.Index).ToArray();
        foreach (var match in matches)
        {
            var starts = new int[texts.Length]; var offset = 0;
            for (var i = 0; i < texts.Length; i++) { starts[i] = offset; offset += texts[i].Text.Length; }
            var startIndex = Array.FindLastIndex(starts, x => x <= match.Index);
            var endPosition = match.Index + match.Length;
            var endIndex = Array.FindLastIndex(starts, x => x < endPosition);
            var prefix = texts[startIndex].Text[..(match.Index - starts[startIndex])];
            var suffix = texts[endIndex].Text[(endPosition - starts[endIndex])..];
            texts[startIndex].Text = prefix + values[match.Groups[1].Value] + suffix;
            texts[startIndex].Space = SpaceProcessingModeValues.Preserve;
            for (var i = startIndex + 1; i <= endIndex; i++) texts[i].Text = string.Empty;
        }
    }
}

public sealed record NoticeProcessResult(int ExitCode, bool TimedOut);

public interface INoticeProcessRunner
{
    Task<NoticeProcessResult> RunAsync(ProcessStartInfo start, TimeSpan timeout, CancellationToken token);
}

public sealed class DirectNoticeProcessRunner : INoticeProcessRunner
{
    public async Task<NoticeProcessResult> RunAsync(ProcessStartInfo start, TimeSpan timeout, CancellationToken token)
    {
        using var process = Process.Start(start) ?? throw new InvalidOperationException("LibreOffice could not be started.");
        using var outputSource = CancellationTokenSource.CreateLinkedTokenSource(token);
        var stdout = ReadBoundedAsync(process.StandardOutput, outputSource.Token);
        var stderr = ReadBoundedAsync(process.StandardError, outputSource.Token);
        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(token); timeoutSource.CancelAfter(timeout);
        try { await process.WaitForExitAsync(timeoutSource.Token); }
        catch (OperationCanceledException) when (!token.IsCancellationRequested)
        {
            await TerminateAsync(process); outputSource.Cancel(); await ObserveAsync(stdout, stderr); return new(-1, true);
        }
        catch (OperationCanceledException)
        {
            await TerminateAsync(process); outputSource.Cancel(); await ObserveAsync(stdout, stderr); throw;
        }
        await Task.WhenAll(stdout, stderr);
        return new(process.ExitCode, false);
    }

    private static async Task<string> ReadBoundedAsync(StreamReader reader, CancellationToken token)
    {
        var buffer = new char[1024]; var result = new StringBuilder(4096);
        while (true) { var read = await reader.ReadAsync(buffer.AsMemory(), token); if (read == 0) break; if (result.Length < 8192) result.Append(buffer, 0, Math.Min(read, 8192 - result.Length)); }
        return result.ToString();
    }

    private static async Task ObserveAsync(params Task[] tasks)
    {
        try { await Task.WhenAll(tasks); }
        catch (OperationCanceledException) { }
        catch (ObjectDisposedException) { }
        catch (IOException) { }
    }

    private static async Task TerminateAsync(Process process)
    {
        try { if (!process.HasExited) process.Kill(entireProcessTree: true); }
        catch (InvalidOperationException) { return; }
        using var waitSource = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        try { await process.WaitForExitAsync(waitSource.Token); }
        catch (OperationCanceledException) { }
        catch (InvalidOperationException) { }
    }
}

public sealed class LibreOfficeNoticePdfConverter(NoticeGenerationPaths paths, NoticeGenerationOptions options, INoticeProcessRunner runner)
    : INoticePdfConverter, IDisposable
{
    private readonly SemaphoreSlim semaphore = new(Math.Max(1, options.PdfParallelism));

    public async Task<byte[]> ConvertAsync(byte[] document, CancellationToken token)
    {
        await semaphore.WaitAsync(token);
        string? directory = null;
        try
        {
            directory = CreateDirectory(paths.TempRoot);
            var input = Path.Combine(directory, "notice.docx"); await File.WriteAllBytesAsync(input, document, token);
            var profile = Path.Combine(directory, "profile"); Directory.CreateDirectory(profile);
            var start = new ProcessStartInfo
            {
                FileName = paths.LibreOfficeExecutablePath!,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };
            start.ArgumentList.Add("--headless"); start.ArgumentList.Add("--nologo"); start.ArgumentList.Add("--nodefault");
            start.ArgumentList.Add("--nolockcheck"); start.ArgumentList.Add($"-env:UserInstallation={new Uri(profile).AbsoluteUri}");
            start.ArgumentList.Add("--convert-to"); start.ArgumentList.Add("pdf:writer_pdf_Export");
            start.ArgumentList.Add("--outdir"); start.ArgumentList.Add(directory); start.ArgumentList.Add(input);
            var result = await runner.RunAsync(start, TimeSpan.FromSeconds(Math.Clamp(options.PdfTimeoutSeconds, 1, 300)), token);
            if (result.TimedOut) throw new NoticeGenerationException("notice_pdf_timeout", "Die PDF-Konvertierung wurde sicher abgebrochen.", 503);
            if (result.ExitCode != 0) throw new NoticeGenerationException("notice_pdf_conversion_failed", "Die PDF-Konvertierung ist fehlgeschlagen.", 503);
            var output = Path.Combine(directory, "notice.pdf");
            if (!File.Exists(output)) throw new NoticeGenerationException("notice_pdf_missing", "Die PDF-Konvertierung lieferte keine Datei.", 503);
            var bytes = await File.ReadAllBytesAsync(output, token);
            if (bytes.Length is < 5 || bytes.LongLength > options.MaximumOutputBytes || !bytes.AsSpan(0, 5).SequenceEqual("%PDF-"u8))
                throw new NoticeGenerationException("notice_pdf_invalid", "Die PDF-Ausgabe ist ungültig.", 503);
            return bytes;
        }
        finally
        {
            try { if (directory is not null) SafeDelete(directory, paths.TempRoot); }
            finally { semaphore.Release(); }
        }
    }

    private static string CreateDirectory(string root) { var path = Path.Combine(root, "generation-" + Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(16))); Directory.CreateDirectory(path); return path; }
    internal static void SafeDelete(string path, string root)
    {
        if (!Directory.Exists(path)) return;
        var full = Path.GetFullPath(path); var prefix = Path.TrimEndingDirectorySeparator(Path.GetFullPath(root)) + Path.DirectorySeparatorChar;
        if (!full.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Temporary cleanup escaped its root.");
        var info = new DirectoryInfo(full); if ((info.Attributes & FileAttributes.ReparsePoint) != 0) throw new InvalidOperationException("Temporary cleanup encountered a reparse point.");
        foreach (var entry in info.EnumerateFileSystemInfos("*", SearchOption.AllDirectories)) if ((entry.Attributes & FileAttributes.ReparsePoint) != 0) throw new InvalidOperationException("Temporary cleanup encountered a reparse point.");
        Directory.Delete(full, true);
    }

    public void Dispose() => semaphore.Dispose();
}

public static class NoticeGenerationTempCleaner
{
    public static void CleanOrphans(NoticeGenerationPaths paths, NoticeGenerationOptions options, DateTimeOffset now)
    {
        foreach (var directory in new DirectoryInfo(paths.TempRoot).EnumerateDirectories("generation-*", SearchOption.TopDirectoryOnly))
        {
            if ((directory.Attributes & FileAttributes.ReparsePoint) != 0) continue;
            if (directory.LastWriteTimeUtc <= now.UtcDateTime.AddHours(-Math.Max(1, options.OrphanMaximumAgeHours)))
                LibreOfficeNoticePdfConverter.SafeDelete(directory.FullName, paths.TempRoot);
        }
    }
}
