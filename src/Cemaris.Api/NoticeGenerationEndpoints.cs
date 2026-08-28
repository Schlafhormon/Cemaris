using System.Security.Claims;
using Cemaris.Api.Security;
using Cemaris.Application.Identity;
using Cemaris.Application.NoticeGeneration;
using Microsoft.AspNetCore.Mvc;

namespace Cemaris.Api;

public static class NoticeGenerationEndpoints
{
    public static void MapNoticeGeneration(this WebApplication app)
    {
        var bases = app.MapGroup("/api/master-data/legal-basis-versions")
            .WithTags("Legal-basis master data");
        bases.MapGet("/", ReadLegalBasesAsync)
            .WithName("ReadLegalBasisVersions")
            .WithSummary("Liest aktive oder alle unveränderlichen Satzungsversionen.")
            .RequireAuthorization(CemarisPolicies.NoticeGeneration)
            .Produces<IReadOnlyList<LegalBasisVersionView>>().ProducesProblem(401).ProducesProblem(403);
        bases.MapPost("/", CreateLegalBasisAsync)
            .WithName("CreateLegalBasisVersion")
            .WithSummary("Legt eine neue inhaltlich unveränderliche, zunächst inaktive Satzungsversion an.")
            .RequireAuthorization(CemarisPolicies.LegalBasisAdministration).RequireCemarisAntiforgery()
            .Produces<LegalBasisVersionView>(201).ProducesValidationProblem().ProducesProblem(401).ProducesProblem(403).ProducesProblem(409);
        bases.MapPut("/{legalBasisVersionId:guid}/active", SetLegalBasisActiveAsync)
            .WithName("SetLegalBasisVersionActive")
            .WithSummary("Aktiviert oder deaktiviert eine Satzungsversion; Name und Fassungsstand bleiben unveränderlich.")
            .RequireAuthorization(CemarisPolicies.LegalBasisAdministration).RequireCemarisAntiforgery()
            .Produces<LegalBasisVersionView>().ProducesProblem(401).ProducesProblem(403).ProducesProblem(404)
            .ProducesProblem(412).ProducesProblem(428).ProducesValidationProblem(400);

        app.MapPost("/api/notice-drafts/{noticeDraftId:guid}/generate", GenerateAsync)
            .WithTags("Legally ineffective notice generation")
            .WithName("GenerateNoticeDraftDocument")
            .WithSummary("Erzeugt flüchtig einen rechtlich wirkungslosen Gebührenbescheidentwurf als DOCX oder PDF.")
            .WithDescription("Erfordert X-Cemaris-CSRF und den aktuellen starken Entwurfs-ETag in If-Match. Es erfolgen weder Freigabe, Signatur, Zustellung, Archivierung noch Fachberechnungen. Fehlercodes: notice_draft_not_found, notice_draft_version_conflict, notice_draft_not_active, notice_generation_burial_invalid, notice_generation_payer_address_invalid, notice_generation_grave_master_data_invalid, notice_generation_legal_basis_inactive, notice_generation_contact_profile_incomplete, notice_generation_required_value_missing, notice_generation_failed, notice_pdf_timeout, notice_pdf_conversion_failed, notice_pdf_missing, notice_pdf_invalid.")
            .RequireAuthorization(CemarisPolicies.NoticeGeneration)
            .RequireAuthorization(CemarisPolicies.CaseWork)
            .RequireCemarisAntiforgery()
            .RequireRateLimiting("NoticeGeneration")
            .Produces(200, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            .Produces(200, contentType: "application/pdf")
            .ProducesValidationProblem(400).ProducesProblem(401).ProducesProblem(403).ProducesProblem(404)
            .ProducesProblem(409).ProducesProblem(412).ProducesProblem(428).ProducesProblem(429).ProducesProblem(500).ProducesProblem(503);
    }

    private static async Task<IResult> ReadLegalBasesAsync(bool activeOnly, ClaimsPrincipal user,
        LegalBasisVersionService service, CancellationToken token)
    {
        if (!activeOnly && !user.IsInRole(SystemRole.Administration.Value))
            return Results.Forbid();
        return Results.Ok(await service.ReadAsync(activeOnly, token));
    }

    private static async Task<IResult> CreateLegalBasisAsync(CreateLegalBasisVersionCommand command,
        LegalBasisVersionService service, HttpResponse response, CancellationToken token)
    {
        try
        {
            var result = await service.CreateAsync(command, token);
            if (result.Outcome == LegalBasisMutationOutcome.Duplicate)
                return Problem(409, "legal_basis_version_duplicate", "Diese Satzungsversion besteht bereits.");
            var view = await service.FindAsync(result.Id, token) ?? throw new InvalidOperationException("Die Satzungsversion ist nicht lesbar.");
            response.Headers.Location = $"/api/master-data/legal-basis-versions/{result.Id}";
            response.Headers.ETag = Etag(result.Version);
            return Results.Json(view, statusCode: 201);
        }
        catch (LegalBasisValidationException exception) { return Validation(exception.Field, exception.Message); }
    }

    private static async Task<IResult> SetLegalBasisActiveAsync(Guid legalBasisVersionId,
        SetLegalBasisActiveCommand command, LegalBasisVersionService service, HttpContext context, CancellationToken token)
    {
        var parsed = Parse(context.Request, out var version); if (parsed is not null) return parsed;
        var result = await service.SetActiveAsync(legalBasisVersionId, version, command, token);
        if (result.Outcome == LegalBasisMutationOutcome.NotFound) return Problem(404, "legal_basis_version_not_found", "Die Satzungsversion wurde nicht gefunden.");
        if (result.Outcome == LegalBasisMutationOutcome.VersionConflict) return Problem(412, "legal_basis_version_conflict", "Die Satzungsversion wurde zwischenzeitlich geändert.");
        var view = await service.FindAsync(result.Id, token) ?? throw new InvalidOperationException("Die Satzungsversion ist nicht lesbar.");
        context.Response.Headers.ETag = Etag(result.Version); return Results.Ok(view);
    }

    private static async Task<IResult> GenerateAsync(Guid noticeDraftId, GenerateNoticeDraftCommand command,
        NoticeGenerationService service, HttpContext context, CancellationToken token)
    {
        if (!Enum.IsDefined(command.Format))
            return Validation("format", "Das Ausgabeformat muss Docx oder Pdf sein.", "notice_generation_format_invalid");
        var parsed = Parse(context.Request, out var version); if (parsed is not null) return parsed;
        try
        {
            var artifact = await service.GenerateAsync(noticeDraftId, version, command, token);
            context.Response.Headers.CacheControl = "no-store";
            context.Response.Headers.Pragma = "no-cache";
            context.Response.Headers.XContentTypeOptions = "nosniff";
            return Results.File(artifact.Content, artifact.ContentType, artifact.FileName, enableRangeProcessing: false);
        }
        catch (NoticeGenerationException exception)
        {
            return Problem(exception.StatusCode, exception.Code, exception.Message);
        }
    }

    private static IResult? Parse(HttpRequest request, out long version)
    {
        version = 0;
        if (!request.Headers.TryGetValue("If-Match", out var values)) return Problem(428, "notice_draft_version_required", "If-Match mit einer starken aktuellen Version ist erforderlich.");
        var value = values.Count == 1 ? values[0] : null;
        return value is not null && value.Length > 2 && value[0] == '"' && value[^1] == '"'
            && long.TryParse(value[1..^1], System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out version) && version > 0
            ? null : Validation("ifMatch", "If-Match muss genau einen starken numerischen ETag enthalten.", "notice_draft_version_invalid");
    }
    private static string Etag(long version) => $"\"{version.ToString(System.Globalization.CultureInfo.InvariantCulture)}\"";
    private static IResult Validation(string field, string message, string code = "validation_failed") => Results.Json(
        new HttpValidationProblemDetails(new Dictionary<string, string[]> { { field, [message] } })
        {
            Status = 400,
            Title = "Die Angaben sind ungültig.",
            Type = $"https://cemaris.local/problems/{code}",
            Extensions = { { "code", code } }
        }, statusCode: 400, contentType: "application/problem+json");
    private static IResult Problem(int status, string code, string title) => Results.Problem(new ProblemDetails { Status = status, Title = title, Type = $"https://cemaris.local/problems/{code}", Extensions = { { "code", code } } });
}
