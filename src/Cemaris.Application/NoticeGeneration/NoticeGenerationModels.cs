using Cemaris.Application.Identity;

namespace Cemaris.Application.NoticeGeneration;

public enum NoticeGenerationFormat { Docx, Pdf }

public sealed record GenerateNoticeDraftCommand(
    Guid BurialId,
    Guid LegalBasisVersionId,
    NoticeGenerationFormat Format);

public sealed record NoticeGenerationSource(
    Guid CaseId,
    Guid NoticeDraftId,
    long NoticeDraftVersion,
    string NoticeNumber,
    DateOnly NoticeDate,
    string PayerName,
    string PayerStreetAndHouseNumber,
    string PayerPostalCode,
    string PayerCity,
    string CemeteryName,
    string GraveTypeName,
    string GraveReference,
    string DeceasedName,
    DateOnly BurialDate,
    string FeeReasonOrSource,
    decimal TotalAmount,
    DateOnly DueDate,
    string ActorFirstName,
    string ActorLastName,
    string ActorContactPoint,
    string ActorRoom,
    string ActorPhone,
    string ActorEmail,
    Guid LegalBasisVersionId,
    long LegalBasisInternalVersion,
    string LegalBasisName,
    DateOnly LegalBasisVersionDate);

public sealed record NoticeGenerationArtifact(byte[] Content, string ContentType, string FileName);
public enum NoticeGenerationSourceOutcome
{
    Found,
    NotFound,
    VersionConflict,
    NoticeDraftNotActive,
    InvalidBurial,
    InvalidPayerAddress,
    InvalidGraveMasterData,
    InactiveLegalBasis,
    ActorProfileIncomplete,
    RequiredValueMissing
}
public sealed record NoticeGenerationSourceResult(
    NoticeGenerationSourceOutcome Outcome,
    NoticeGenerationSource? Source = null,
    Guid CaseId = default,
    long LegalBasisInternalVersion = 0);

public sealed record NoticeGenerationAudit(
    Guid Id,
    Guid CaseId,
    Guid NoticeDraftId,
    long ExpectedNoticeDraftVersion,
    Guid ActorId,
    DateTimeOffset OccurredAtUtc,
    NoticeGenerationFormat Format,
    Guid LegalBasisVersionId,
    long LegalBasisInternalVersion,
    bool Succeeded,
    string? ErrorCode);

public interface INoticeGenerationStore
{
    Task<NoticeGenerationSourceResult> ReadSourceAsync(Guid noticeDraftId, long expectedVersion, Guid burialId,
        Guid legalBasisVersionId, Guid actorId, CancellationToken token);
    Task SaveAuditAsync(NoticeGenerationAudit audit, CancellationToken token);
}

public interface INoticeDocumentRenderer
{
    Task<byte[]> RenderAsync(IReadOnlyDictionary<string, string> values, CancellationToken token);
}

public interface INoticePdfConverter
{
    Task<byte[]> ConvertAsync(byte[] document, CancellationToken token);
}

public sealed class NoticeGenerationException(string code, string message, int statusCode) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}

public sealed class NoticeGenerationService(
    INoticeGenerationStore store,
    INoticeDocumentRenderer renderer,
    INoticePdfConverter pdfConverter,
    ICurrentActorProvider actors,
    TimeProvider timeProvider)
{
    public static readonly string[] RequiredTokens =
    [
        "AKTENZEICHEN", "BESCHEIDDATUM", "BESCHEIDNUMMER", "EMPFAENGER_NAME",
        "EMPFAENGER_STRASSE_HAUSNUMMER", "EMPFAENGER_PLZ", "EMPFAENGER_ORT", "FRIEDHOF",
        "GRABART", "GRABBEZUG", "VERSTORBENE_PERSON", "BEISETZUNGSDATUM", "GEBUEHR_BEZEICHNUNG",
        "GEBUEHR_BETRAG", "GESAMTBETRAG", "ZAHLUNGSFRIST", "KONTAKT_NAME", "KONTAKTSTELLE",
        "KONTAKT_ZIMMER", "KONTAKT_TELEFON", "KONTAKT_EMAIL", "RECHTSGRUNDLAGE",
        "RECHTSGRUNDLAGE_FASSUNGSSTAND"
    ];

    public async Task<NoticeGenerationArtifact> GenerateAsync(Guid noticeDraftId, long expectedVersion,
        GenerateNoticeDraftCommand command, CancellationToken token)
    {
        if (!Guid.TryParse(actors.Current.Id, out var actorId) || actorId == Guid.Empty)
            throw new NoticeGenerationException("notice_generation_actor_invalid", "Das aktive Benutzerkonto ist ungültig.", 403);

        NoticeGenerationSource? source = null;
        var auditCaseId = Guid.Empty;
        var auditLegalBasisInternalVersion = 0L;
        string? errorCode = null;
        try
        {
            if (noticeDraftId == Guid.Empty || command.BurialId == Guid.Empty || command.LegalBasisVersionId == Guid.Empty)
                throw new NoticeGenerationException("notice_generation_invalid_reference", "Alle fachlichen Referenzen sind erforderlich.", 400);
            var read = await store.ReadSourceAsync(noticeDraftId, expectedVersion, command.BurialId,
                command.LegalBasisVersionId, actorId, token);
            auditCaseId = read.CaseId;
            auditLegalBasisInternalVersion = read.LegalBasisInternalVersion;
            source = read.Source;
            if (read.Outcome != NoticeGenerationSourceOutcome.Found || source is null)
                throw read.Outcome switch
                {
                    NoticeGenerationSourceOutcome.NotFound => new NoticeGenerationException("notice_draft_not_found", "Der Bescheidentwurf wurde nicht gefunden.", 404),
                    NoticeGenerationSourceOutcome.VersionConflict => new NoticeGenerationException("notice_draft_version_conflict", "Der Bescheidentwurf wurde zwischenzeitlich geändert.", 412),
                    NoticeGenerationSourceOutcome.NoticeDraftNotActive => new NoticeGenerationException("notice_draft_not_active", "Nur ein aktiver Bescheidentwurf kann ausgegeben werden.", 409),
                    NoticeGenerationSourceOutcome.InvalidBurial => new NoticeGenerationException("notice_generation_burial_invalid", "Die ausgewählte tatsächliche Beisetzung, verstorbene Person oder Grabstellenreferenz fehlt.", 409),
                    NoticeGenerationSourceOutcome.InvalidPayerAddress => new NoticeGenerationException("notice_generation_payer_address_invalid", "Für den bestätigten Zahlungspflichtigen fehlt eine aktuelle primäre Postanschrift.", 409),
                    NoticeGenerationSourceOutcome.InvalidGraveMasterData => new NoticeGenerationException("notice_generation_grave_master_data_invalid", "Friedhof, Grabart oder Grabstellenbezeichnung sind nicht vollständig kanonisch lesbar.", 409),
                    NoticeGenerationSourceOutcome.InactiveLegalBasis => new NoticeGenerationException("notice_generation_legal_basis_inactive", "Die ausgewählte Satzungsversion ist nicht aktiv.", 409),
                    NoticeGenerationSourceOutcome.ActorProfileIncomplete => new NoticeGenerationException("notice_generation_contact_profile_incomplete", "Das aktive Benutzerkontaktprofil ist für die Dokumenterzeugung nicht vollständig.", 409),
                    _ => new NoticeGenerationException("notice_generation_required_value_missing", "Mindestens ein erforderlicher kanonischer Platzhalterwert fehlt.", 409),
                };
            var values = Map(source);
            var docx = await renderer.RenderAsync(values, token);
            var content = command.Format == NoticeGenerationFormat.Pdf
                ? await pdfConverter.ConvertAsync(docx, token)
                : docx;
            await store.SaveAuditAsync(Audit(source, actorId, command.Format, true, null), token);
            var extension = command.Format == NoticeGenerationFormat.Pdf ? ".pdf" : ".docx";
            var contentType = command.Format == NoticeGenerationFormat.Pdf
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            return new(content, contentType, SafeFileName(source.NoticeNumber) + extension);
        }
        catch (NoticeGenerationException exception)
        {
            errorCode = exception.Code;
            throw;
        }
        catch (OperationCanceledException) when (token.IsCancellationRequested)
        {
            errorCode = "notice_generation_cancelled";
            throw;
        }
        catch (Exception)
        {
            errorCode = "notice_generation_failed";
            throw new NoticeGenerationException(errorCode, "Das Dokument konnte nicht sicher erzeugt werden.", 500);
        }
        finally
        {
            if (errorCode is not null)
            {
                var fallback = source ?? new NoticeGenerationSource(
                    CaseId: auditCaseId, NoticeDraftId: noticeDraftId, NoticeDraftVersion: expectedVersion,
                    NoticeNumber: string.Empty, NoticeDate: default, PayerName: string.Empty,
                    PayerStreetAndHouseNumber: string.Empty, PayerPostalCode: string.Empty, PayerCity: string.Empty,
                    CemeteryName: string.Empty, GraveTypeName: string.Empty, GraveReference: string.Empty,
                    DeceasedName: string.Empty, BurialDate: default, FeeReasonOrSource: string.Empty,
                    TotalAmount: 0, DueDate: default, ActorFirstName: string.Empty, ActorLastName: string.Empty,
                    ActorContactPoint: string.Empty, ActorRoom: string.Empty, ActorPhone: string.Empty,
                    ActorEmail: string.Empty, LegalBasisVersionId: command.LegalBasisVersionId,
                    LegalBasisInternalVersion: auditLegalBasisInternalVersion, LegalBasisName: string.Empty, LegalBasisVersionDate: default);
                await store.SaveAuditAsync(Audit(fallback, actorId, command.Format, false, errorCode), CancellationToken.None);
            }
        }
    }

    private NoticeGenerationAudit Audit(NoticeGenerationSource source, Guid actorId, NoticeGenerationFormat format,
        bool succeeded, string? errorCode) => new(Guid.NewGuid(), source.CaseId, source.NoticeDraftId,
            source.NoticeDraftVersion, actorId, timeProvider.GetUtcNow(), format, source.LegalBasisVersionId,
            source.LegalBasisInternalVersion, succeeded, errorCode);

    public static IReadOnlyDictionary<string, string> Map(NoticeGenerationSource source)
    {
        var culture = global::System.Globalization.CultureInfo.GetCultureInfo("de-DE");
        string Date(DateOnly value) => value.ToString("d", culture);
        var amount = source.TotalAmount.ToString("N2", culture) + " EUR";
        return new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["AKTENZEICHEN"] = source.CaseId.ToString("D"),
            ["BESCHEIDDATUM"] = Date(source.NoticeDate),
            ["BESCHEIDNUMMER"] = source.NoticeNumber,
            ["EMPFAENGER_NAME"] = source.PayerName,
            ["EMPFAENGER_STRASSE_HAUSNUMMER"] = source.PayerStreetAndHouseNumber,
            ["EMPFAENGER_PLZ"] = source.PayerPostalCode,
            ["EMPFAENGER_ORT"] = source.PayerCity,
            ["FRIEDHOF"] = source.CemeteryName,
            ["GRABART"] = source.GraveTypeName,
            ["GRABBEZUG"] = source.GraveReference,
            ["VERSTORBENE_PERSON"] = source.DeceasedName,
            ["BEISETZUNGSDATUM"] = Date(source.BurialDate),
            ["GEBUEHR_BEZEICHNUNG"] = source.FeeReasonOrSource,
            ["GEBUEHR_BETRAG"] = amount,
            ["GESAMTBETRAG"] = amount,
            ["ZAHLUNGSFRIST"] = Date(source.DueDate),
            ["KONTAKT_NAME"] = $"{source.ActorFirstName} {source.ActorLastName}",
            ["KONTAKTSTELLE"] = source.ActorContactPoint,
            ["KONTAKT_ZIMMER"] = source.ActorRoom,
            ["KONTAKT_TELEFON"] = source.ActorPhone,
            ["KONTAKT_EMAIL"] = source.ActorEmail,
            ["RECHTSGRUNDLAGE"] = source.LegalBasisName,
            ["RECHTSGRUNDLAGE_FASSUNGSSTAND"] = Date(source.LegalBasisVersionDate),
        };
    }

    private static string SafeFileName(string value)
    {
        var chars = value.Select(character => character is >= 'A' and <= 'Z' or >= 'a' and <= 'z' or >= '0' and <= '9' or '-' or '_' or '.' ? character : '_').ToArray();
        var clean = new string(chars).Trim('.', '_');
        return string.IsNullOrEmpty(clean) ? "Gebuehrenbescheidentwurf" : clean[..Math.Min(clean.Length, 100)];
    }
}
