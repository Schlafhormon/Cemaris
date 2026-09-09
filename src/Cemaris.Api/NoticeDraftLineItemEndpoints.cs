using Cemaris.Api.ErrorHandling;
using Cemaris.Api.Security;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Domain.NoticeDrafts;

namespace Cemaris.Api;

public static class NoticeDraftLineItemEndpoints
{
    public static void MapNoticeDraftLineItems(this WebApplication app)
    {
        var group = app.MapGroup("/api").WithTags("Manuelle Gebührenpositionen")
            .WithMetadata(new NoticeDraftEndpointMetadata())
            .RequireAuthorization(CemarisPolicies.NoticeDrafts).RequireCemarisAntiforgery();
        Describe(group.MapPost("/cases/{caseId:guid}/notice-drafts/line-items", Create), "CreateNoticeDraftLineItems", true);
        Describe(group.MapPost("/notice-drafts/{noticeDraftId:guid}/line-item-corrections", Correct), "CorrectNoticeDraftLineItems");
        Describe(group.MapPost("/notice-drafts/{noticeDraftId:guid}/line-item-conversion", Convert), "ConvertNoticeDraftToLineItems");
    }

    private static void Describe(RouteHandlerBuilder route, string name, bool create = false) => route.WithName(name)
        .WithSummary("Speichert den vollständigen rechtlich wirkungslosen Entwurf mit 1 bis 100 geordneten positiven EUR-Positionen atomar.")
        .WithDescription("Beträge als Dezimalstrings, verbindliche serverseitige Summe. Neue Positions-IDs: null. Korrektur/Umstellung verlangen Grund und starken If-Match; Umstellung zusätzlich conversionConfirmed=true. Cookie und X-Cemaris-CSRF sind erforderlich.")
        .Produces<NoticeDraftView>(create ? 201 : 200).ProducesValidationProblem()
        .ProducesProblem(401).ProducesProblem(403).ProducesProblem(404).ProducesProblem(409)
        .ProducesProblem(412).ProducesProblem(428).ProducesProblem(503);

    private static async Task<IResult> Create(Guid caseId, SaveNoticeDraftLineItemsCommand command,
        NoticeDraftService service, HttpResponse response, CancellationToken token)
    {
        try
        {
            var result = await service.CreateLineItemsAsync(caseId, command, token);
            if (result.Outcome != NoticeDraftMutationOutcome.Success) return NoticeDraftEndpoints.Failure(result);
            response.Headers.Location = $"/api/notice-drafts/{result.Id}";
            response.Headers.ETag = $"\"{result.Version}\"";
            return Results.Json(result.Snapshot, statusCode: 201);
        }
        catch (NoticeDraftValidationException e) { return NoticeDraftEndpoints.Validation(e.Field, e.Message); }
    }

    private static Task<IResult> Correct(Guid noticeDraftId, SaveNoticeDraftLineItemsCommand command,
        NoticeDraftService service, HttpContext context, CancellationToken token) =>
        NoticeDraftEndpoints.Existing(context, version => service.CorrectLineItemsAsync(noticeDraftId, version, command, false, token));

    private static Task<IResult> Convert(Guid noticeDraftId, SaveNoticeDraftLineItemsCommand command,
        NoticeDraftService service, HttpContext context, CancellationToken token) =>
        NoticeDraftEndpoints.Existing(context, version => service.CorrectLineItemsAsync(noticeDraftId, version, command, true, token));
}
