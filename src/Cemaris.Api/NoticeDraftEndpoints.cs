using Cemaris.Api.Security;
using Cemaris.Api.ErrorHandling;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Domain.NoticeDrafts;
using Microsoft.AspNetCore.Mvc;

namespace Cemaris.Api;

public static class NoticeDraftEndpoints
{
    public static void MapNoticeDrafts(this WebApplication app)
    {
        var caseDrafts = app.MapGroup("/api/cases/{caseId:guid}/notice-drafts")
            .WithTags("Canonical manual notice drafts").WithMetadata(new NoticeDraftEndpointMetadata())
            .RequireAuthorization(CemarisPolicies.NoticeDrafts);
        caseDrafts.MapGet("/", ReadForCaseAsync)
            .WithName("GetNoticeDraftsForCase")
            .WithSummary("Liest alle rechtlich wirkungslosen kanonischen Entwürfe eines Falls.")
            .WithDescription("Sortierung: Erstellzeit absteigend, stabile Entwurfs-ID aufsteigend. Der Vertrag ist von ReadNotices und ReadFeeItems getrennt.")
            .Produces<IReadOnlyList<NoticeDraftListItem>>()
            .ProducesProblem(401).ProducesProblem(403).ProducesProblem(404);
        caseDrafts.MapPost("/", CreateDraftAsync)
            .WithName("CreateNoticeDraft")
            .WithSummary("Legt einen manuellen, rechtlich wirkungslosen Entwurf samt Nummer, erster Revision und Audit atomar an.")
            .WithDescription("Erfordert X-Cemaris-CSRF und eine aktiv bestätigte Zahlungspflichtigenauswahl. Liefert Location und einen starken ETag.")
            .RequireCemarisAntiforgery()
            .Produces<NoticeDraftView>(201).ProducesValidationProblem()
            .ProducesProblem(401).ProducesProblem(403).ProducesProblem(409);

        var drafts = app.MapGroup("/api/notice-drafts")
            .WithTags("Canonical manual notice drafts").WithMetadata(new NoticeDraftEndpointMetadata())
            .RequireAuthorization(CemarisPolicies.NoticeDrafts);
        drafts.MapGet("/{noticeDraftId:guid}", GetDraftAsync)
            .WithName("GetNoticeDraft")
            .WithSummary("Liest Entwurfsfakten und vollständige geschützte Fachrevisionen.")
            .Produces<NoticeDraftView>().ProducesProblem(401).ProducesProblem(403).ProducesProblem(404);
        drafts.MapPost("/{noticeDraftId:guid}/corrections", CorrectDraftAsync)
            .WithName("CorrectNoticeDraft")
            .WithDescription("Erfordert X-Cemaris-CSRF, einen Grund und den letzten starken ETag in If-Match. Bei geänderter Zahlungspflichtigenauswahl ist eine erneute aktive Bestätigung nötig.")
            .RequireCemarisAntiforgery()
            .Produces<NoticeDraftView>().ProducesValidationProblem()
            .ProducesProblem(401).ProducesProblem(403).ProducesProblem(404)
            .ProducesProblem(409).ProducesProblem(412).ProducesProblem(428);
        drafts.MapPost("/{noticeDraftId:guid}/discard", DiscardDraftAsync)
            .WithName("DiscardNoticeDraft")
            .WithDescription("Verwirft den Entwurf historisiert. Erfordert X-Cemaris-CSRF, einen Grund und den letzten starken ETag in If-Match.")
            .RequireCemarisAntiforgery()
            .Produces<NoticeDraftView>().ProducesValidationProblem()
            .ProducesProblem(401).ProducesProblem(403).ProducesProblem(404)
            .ProducesProblem(409).ProducesProblem(412).ProducesProblem(428);

        var configuration = app.MapGroup("/api/program-configuration/notice-number")
            .WithTags("Notice-number configuration");
        configuration.MapGet("/", GetConfigurationAsync)
            .WithName("GetNoticeNumberConfiguration")
            .WithSummary("Liest die installationweite aktuelle Nummernkonfiguration oder 204.")
            .RequireAuthorization(CemarisPolicies.NoticeDrafts)
            .Produces<NoticeNumberConfigurationView>().Produces(204)
            .ProducesProblem(401).ProducesProblem(403);
        configuration.MapPost("/", CreateConfigurationAsync)
            .WithName("CreateNoticeNumberConfiguration")
            .WithDescription("Nur Administration. Erfordert X-Cemaris-CSRF; liefert Location und einen starken ETag.")
            .RequireAuthorization(CemarisPolicies.ProgramConfiguration)
            .RequireCemarisAntiforgery()
            .Produces<NoticeNumberConfigurationView>(201).ProducesValidationProblem()
            .ProducesProblem(401).ProducesProblem(403).ProducesProblem(409);
        configuration.MapPut("/{configurationId:guid}", ChangeConfigurationAsync)
            .WithName("ChangeNoticeNumberConfiguration")
            .WithDescription("Nur Administration. Erfordert X-Cemaris-CSRF, einen Grund und den letzten starken ETag in If-Match.")
            .RequireAuthorization(CemarisPolicies.ProgramConfiguration)
            .RequireCemarisAntiforgery()
            .Produces<NoticeNumberConfigurationView>().ProducesValidationProblem()
            .ProducesProblem(401).ProducesProblem(403).ProducesProblem(404)
            .ProducesProblem(409).ProducesProblem(412).ProducesProblem(428);
    }

    private static async Task<IResult> ReadForCaseAsync(
        Guid caseId,
        NoticeDraftService service,
        CancellationToken token) => await service.ReadForCaseAsync(caseId, token) is { } items
            ? Results.Ok(items)
            : NotFound("Der Fall wurde nicht gefunden.");

    private static async Task<IResult> GetDraftAsync(
        Guid noticeDraftId,
        NoticeDraftService service,
        HttpResponse response,
        CancellationToken token) => await service.FindDraftAsync(noticeDraftId, token) is { } view
            ? WithEtag(view, view.Version, response)
            : NotFound("Der Bescheidentwurf wurde nicht gefunden.");

    private static async Task<IResult> CreateDraftAsync(
        Guid caseId,
        CreateNoticeDraftCommand command,
        NoticeDraftService service,
        HttpResponse response,
        CancellationToken token)
    {
        try
        {
            var result = await service.CreateDraftAsync(caseId, command, token);
            if (result.Outcome != NoticeDraftMutationOutcome.Success) return Failure(result);
            var view = result.Snapshot ?? throw new InvalidOperationException("Der gespeicherte Entwurfssnapshot fehlt.");
            response.Headers.Location = $"/api/notice-drafts/{result.Id}";
            response.Headers.ETag = Etag(result.Version);
            return Results.Json(view, statusCode: 201);
        }
        catch (NoticeDraftValidationException exception)
        {
            return Validation(exception.Field, exception.Message);
        }
    }

    private static Task<IResult> CorrectDraftAsync(
        Guid noticeDraftId,
        CorrectNoticeDraftCommand command,
        NoticeDraftService service,
        HttpContext context,
        CancellationToken token) => Existing(
            context,
            version => service.CorrectDraftAsync(noticeDraftId, version, command, token));

    private static Task<IResult> DiscardDraftAsync(
        Guid noticeDraftId,
        DiscardNoticeDraftCommand command,
        NoticeDraftService service,
        HttpContext context,
        CancellationToken token) => Existing(
            context,
            version => service.DiscardDraftAsync(noticeDraftId, version, command, token));

    private static async Task<IResult> GetConfigurationAsync(
        NoticeDraftService service,
        HttpResponse response,
        CancellationToken token) => await service.FindConfigurationAsync(token) is { } view
            ? WithEtag(view, view.Version, response)
            : Results.NoContent();

    private static async Task<IResult> CreateConfigurationAsync(
        SaveNoticeNumberConfigurationCommand command,
        NoticeDraftService service,
        HttpResponse response,
        CancellationToken token)
    {
        try
        {
            var result = await service.CreateConfigurationAsync(command, token);
            if (result.Outcome != NoticeDraftMutationOutcome.Success) return Failure(result);
            var view = await service.FindConfigurationAsync(token)
                ?? throw new InvalidOperationException("Die angelegte Nummernkonfiguration ist nicht lesbar.");
            response.Headers.Location = "/api/program-configuration/notice-number";
            response.Headers.ETag = Etag(result.Version);
            return Results.Json(view, statusCode: 201);
        }
        catch (NoticeDraftValidationException exception)
        {
            return Validation(exception.Field, exception.Message);
        }
    }

    private static async Task<IResult> ChangeConfigurationAsync(
        Guid configurationId,
        SaveNoticeNumberConfigurationCommand command,
        NoticeDraftService service,
        HttpContext context,
        CancellationToken token)
    {
        var parsed = Parse(context.Request, out var version);
        if (parsed is not null) return parsed;
        try
        {
            var result = await service.ChangeConfigurationAsync(configurationId, version, command, token);
            if (result.Outcome != NoticeDraftMutationOutcome.Success) return Failure(result);
            var view = await service.FindConfigurationAsync(token)
                ?? throw new InvalidOperationException("Die geänderte Nummernkonfiguration ist nicht lesbar.");
            context.Response.Headers.ETag = Etag(result.Version);
            return Results.Ok(view);
        }
        catch (NoticeDraftValidationException exception)
        {
            return Validation(exception.Field, exception.Message);
        }
    }

    internal static async Task<IResult> Existing(
        HttpContext context,
        Func<long, Task<NoticeDraftMutationResult>> mutate)
    {
        var parsed = Parse(context.Request, out var version);
        if (parsed is not null) return parsed;
        try
        {
            var result = await mutate(version);
            if (result.Outcome != NoticeDraftMutationOutcome.Success) return Failure(result);
            var view = result.Snapshot ?? throw new InvalidOperationException("Der gespeicherte Entwurfssnapshot fehlt.");
            context.Response.Headers.ETag = Etag(result.Version);
            return Results.Ok(view);
        }
        catch (NoticeDraftValidationException exception)
        {
            return Validation(exception.Field, exception.Message);
        }
    }

    internal static IResult Failure(NoticeDraftMutationResult result) => result.Outcome switch
    {
        NoticeDraftMutationOutcome.AmountModeConflict => Problem(409, "notice-draft-amount-mode-conflict", "Dieser Entwurfsmodus benötigt den vollständigen Positionsvertrag beziehungsweise eine ausdrückliche Umstellung."),
        NoticeDraftMutationOutcome.StorageFailure => Problem(503, "notice-draft-storage-failed", "Der Entwurf konnte nicht atomar gespeichert werden. Es wurde keine Änderung übernommen."),
        NoticeDraftMutationOutcome.NotFound => NotFound("Das Fachaggregat wurde nicht gefunden."),
        NoticeDraftMutationOutcome.VersionConflict => Problem(412, "notice-draft-version-conflict", "Das Fachaggregat wurde zwischenzeitlich geändert."),
        NoticeDraftMutationOutcome.InvalidReference => Validation("reference", "Mindestens ein kanonischer Fall- oder Beteiligtenbezug ist ungültig."),
        NoticeDraftMutationOutcome.ConfigurationMissing => Problem(409, "notice-number-configuration-missing", "Vor der Entwurfsanlage muss die Administration die Nummernkonfiguration anlegen."),
        NoticeDraftMutationOutcome.ConfigurationAlreadyExists => Problem(409, "notice-number-configuration-exists", "Es besteht bereits eine aktuelle Nummernkonfiguration."),
        NoticeDraftMutationOutcome.SequenceExhausted => Problem(409, "notice-number-sequence-exhausted", "Die Stellenzahl der laufenden Nummer ist erschöpft. Die Administration muss sie prospektiv erhöhen."),
        NoticeDraftMutationOutcome.Discarded => Problem(409, "notice-draft-discarded", "Ein verworfener Entwurf ist unveränderlich."),
        NoticeDraftMutationOutcome.PayerConfirmationRequired => Validation("payerSelectionConfirmed", "Die geänderte Zahlungspflichtigenauswahl muss erneut aktiv bestätigt werden."),
        _ => Results.Problem(statusCode: 500, title: "Unbekanntes Mutationsergebnis."),
    };

    private static IResult? Parse(HttpRequest request, out long version)
    {
        version = 0;
        if (!request.Headers.TryGetValue("If-Match", out var values))
            return Results.Problem(statusCode: 428, title: "If-Match mit einer starken aktuellen Version ist erforderlich.", type: "https://httpstatuses.com/428");
        var value = values.Count == 1 ? values[0] : null;
        return value is not null
            && value.Length > 2
            && value[0] == '"'
            && value[^1] == '"'
            && long.TryParse(value[1..^1], System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out version)
            && version > 0
                ? null
                : Results.Problem(statusCode: 400, title: "If-Match muss genau einen starken numerischen ETag enthalten.", type: "https://httpstatuses.com/400");
    }

    private static IResult WithEtag<T>(T value, long version, HttpResponse response)
    {
        response.Headers.ETag = Etag(version);
        return Results.Ok(value);
    }

    private static string Etag(long version) => $"\"{version.ToString(System.Globalization.CultureInfo.InvariantCulture)}\"";
    internal static IResult Validation(string field, string message) => Results.ValidationProblem(
        new Dictionary<string, string[]> { [field] = [message] },
        title: "Die Angaben sind ungültig.");
    private static IResult NotFound(string title) => Results.Problem(statusCode: 404, title: title, type: "https://httpstatuses.com/404");
    private static IResult Problem(int status, string code, string title) => Results.Problem(new ProblemDetails
    {
        Status = status,
        Title = title,
        Type = $"https://cemaris.local/problems/{code}",
        Extensions = { ["code"] = code },
    });
}
