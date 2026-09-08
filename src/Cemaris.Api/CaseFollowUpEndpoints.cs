using System.Globalization;
using Cemaris.Api.ErrorHandling;
using Cemaris.Api.Security;
using Cemaris.Application.CaseFollowUps;
using Cemaris.Domain.CaseFollowUps;

namespace Cemaris.Api;

public static class CaseFollowUpEndpoints
{
    public static void MapCaseFollowUps(this WebApplication app)
    {
        var group = app.MapGroup("/api/case-follow-ups").WithTags("Manuelle Wiedervorlagen")
            .WithMetadata(new CaseFollowUpEndpointMetadata())
            .RequireAuthorization(CemarisPolicies.CaseFollowUps);
        DescribeRead(group.MapGet("/", (HttpRequest request, CaseFollowUpService service, CancellationToken token) =>
            Read(null, request, service, token)), "ListCaseFollowUps", typeof(CaseFollowUpPage));
        DescribeRead(group.MapGet("/{id:guid}", async (Guid id, Guid caseId, CaseFollowUpService service, HttpResponse response, CancellationToken token) =>
        {
            var view = await service.FindAsync(caseId, id, token);
            if (view is null) return Problem(404, "Die Wiedervorlage wurde in diesem Fall nicht gefunden.");
            response.Headers.ETag = Etag(view.State.Version);
            return Results.Ok(view);
        }), "GetCaseFollowUp", typeof(CaseFollowUpView))
            .WithDescription("caseId ist verpflichtend. Liefert eigene starke Version und vollständige geschützte Fachrevisionen.");
        DescribeWrite(group.MapPut("/{id:guid}", (Guid id, Guid caseId, ChangeCaseFollowUpCommand command,
            CaseFollowUpService service, HttpContext context, CancellationToken token) =>
            Existing(context, v => service.ChangeAsync(caseId, id, v, command, token))), "ChangeCaseFollowUp");
        foreach (var (route, operation) in new[]
        {
            ("complete", CaseFollowUpOperation.Completed), ("cancel", CaseFollowUpOperation.Cancelled), ("reopen", CaseFollowUpOperation.Reopened),
        })
        {
            DescribeWrite(group.MapPost($"/{{id:guid}}/{route}", (Guid id, Guid caseId, CaseFollowUpReasonCommand command,
                CaseFollowUpService service, HttpContext context, CancellationToken token) =>
                Existing(context, v => service.TransitionAsync(caseId, id, v, operation, command, token))), $"{operation}CaseFollowUp");
        }

        var cases = app.MapGroup("/api/cases/{caseId:guid}/follow-ups").WithTags("Manuelle Wiedervorlagen")
            .WithMetadata(new CaseFollowUpEndpointMetadata())
            .RequireAuthorization(CemarisPolicies.CaseFollowUps);
        DescribeRead(cases.MapGet("/", (Guid caseId, HttpRequest request, CaseFollowUpService service, CancellationToken token) =>
            Read(caseId, request, service, token)), "ListCaseFollowUpsForCase", typeof(CaseFollowUpPage));
        DescribeWrite(cases.MapPost("/", async (Guid caseId, CreateCaseFollowUpCommand command,
            CaseFollowUpService service, HttpContext context, CancellationToken token) =>
        {
            try { return Result(await service.CreateAsync(caseId, command, token), context.Response, created: true); }
            catch (CaseFollowUpValidationException e) { return Validation(e); }
        }), "CreateCaseFollowUp").Produces<CaseFollowUpView>(201);
    }

    private static RouteHandlerBuilder DescribeRead(RouteHandlerBuilder route, string name, Type response) =>
        route.WithName(name).Produces(200, response).ProducesValidationProblem()
            .ProducesProblem(401).ProducesProblem(403).ProducesProblem(404)
            .WithDescription("Gemeinsamer Arbeitsvorrat. Status: Open (Default), Completed, Cancelled oder All; dueUntil einschließlich YYYY-MM-DD. page ab 1, pageSize 10/25/50 (Default 10). Sortierung: Datum, UTC-Erstellzeit, native SQL-GUID-Reihenfolge.");
    private static RouteHandlerBuilder DescribeWrite(RouteHandlerBuilder route, string name) =>
        route.WithName(name).RequireCemarisAntiforgery().Produces<CaseFollowUpView>().ProducesValidationProblem()
            .ProducesProblem(401).ProducesProblem(403).ProducesProblem(404).ProducesProblem(409).ProducesProblem(412).ProducesProblem(428)
            .WithDescription("Erfordert X-Cemaris-CSRF. Bestehende Einträge erfordern caseId, Pflichtbegründung und genau einen aktuellen starken numerischen If-Match-ETag. Fehlende oder schwache ETags: 428; sonst ungültige ETags: 400. Keine Änderung fremder Fachaggregate.");

    private static async Task<IResult> Read(Guid? caseId, HttpRequest request, CaseFollowUpService service, CancellationToken token)
    {
        try
        {
            string? Parameter(string key)
            {
                if (!request.Query.TryGetValue(key, out var values)) return null;
                if (values.Count != 1 || string.IsNullOrEmpty(values[0]))
                    throw new CaseFollowUpValidationException(key, "Genau ein nicht leerer Wert ist erforderlich.");
                return values[0];
            }
            var rawStatus = Parameter("status") ?? "Open";
            CaseFollowUpStatus? status = rawStatus switch
            {
                "Open" => CaseFollowUpStatus.Open,
                "Completed" => CaseFollowUpStatus.Completed,
                "Cancelled" => CaseFollowUpStatus.Cancelled,
                "All" => null,
                _ => throw new CaseFollowUpValidationException("status", "Der Status ist ungültig."),
            };
            var rawDate = Parameter("dueUntil");
            DateOnly? date = null;
            if (rawDate is not null)
            {
                if (!DateOnly.TryParseExact(rawDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                    throw new CaseFollowUpValidationException("dueUntil", "Ein gültiges Datum in YYYY-MM-DD ist erforderlich.");
                date = parsed;
            }
            int Number(string key, int fallback) => Parameter(key) is not { } raw ? fallback
                : int.TryParse(raw, NumberStyles.None, CultureInfo.InvariantCulture, out var n) ? n
                : throw new CaseFollowUpValidationException(key, "Eine gültige ganze Zahl ist erforderlich.");
            var page = await service.ReadAsync(caseId, new(status, date, Number("page", 1), Number("pageSize", 10)), token);
            return page is null ? Problem(404, "Der Fall wurde nicht gefunden.") : Results.Ok(page);
        }
        catch (CaseFollowUpValidationException e) { return Validation(e); }
    }

    private static async Task<IResult> Existing(HttpContext context, Func<long, Task<CaseFollowUpResult>> mutate)
    {
        var values = context.Request.Headers.IfMatch;
        if (values.Count == 0 || values.Count == 1 && values[0]?.StartsWith("W/", StringComparison.Ordinal) == true)
            return Problem(428, "Der zuletzt gelesene starke ETag ist erforderlich.");
        var raw = values.Count == 1 ? values[0] : null;
        if (raw is null || raw.Length < 3 || raw[0] != '"' || raw[^1] != '"'
            || !long.TryParse(raw.AsSpan(1, raw.Length - 2), NumberStyles.None, CultureInfo.InvariantCulture, out var version) || version < 1)
            return Problem(400, "If-Match muss genau einen starken numerischen ETag enthalten.");
        try { return Result(await mutate(version), context.Response); }
        catch (CaseFollowUpValidationException e) { return Validation(e); }
    }

    private static IResult Result(CaseFollowUpResult result, HttpResponse response, bool created = false)
    {
        if (result.Outcome != CaseFollowUpOutcome.Success) return result.Outcome switch
        {
            CaseFollowUpOutcome.NotFound => Problem(404, "Der Fall oder die zugehörige Wiedervorlage wurde nicht gefunden."),
            CaseFollowUpOutcome.NonSynthetic => Problem(409, "Nur synthetische Fälle dürfen bearbeitet werden."),
            CaseFollowUpOutcome.VersionConflict => Problem(412, "Die Wiedervorlage wurde zwischenzeitlich geändert. Ihre Eingaben bleiben erhalten; bitte bewusst neu laden."),
            _ => Problem(409, "Diese Aktion ist im aktuellen Zustand nicht zulässig."),
        };
        var view = result.Value!;
        response.Headers.ETag = Etag(view.State.Version);
        if (created) response.Headers.Location = $"/api/case-follow-ups/{view.State.Id}?caseId={view.State.CaseId}";
        return Results.Json(view, statusCode: created ? 201 : 200);
    }
    private static string Etag(long version) => $"\"{version.ToString(CultureInfo.InvariantCulture)}\"";
    private static IResult Validation(CaseFollowUpValidationException e) => Results.ValidationProblem(
        new Dictionary<string, string[]> { [e.Field] = [e.Message] }, title: "Die Angaben sind ungültig.");
    private static IResult Problem(int status, string title) => Results.Problem(statusCode: status, title: title);
}
