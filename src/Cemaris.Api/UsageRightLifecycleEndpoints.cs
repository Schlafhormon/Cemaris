using Cemaris.Api.ErrorHandling;
using Cemaris.Api.Security;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;

namespace Cemaris.Api;

public static class UsageRightLifecycleEndpoints
{
    public static void MapUsageRightLifecycle(this WebApplication app)
    {
        var group = app.MapGroup("/api/usage-rights/{id:guid}").WithTags("Manueller Nutzungsrechtslebenszyklus")
            .WithMetadata(new UsageRightEndpointMetadata()).RequireAuthorization(CemarisPolicies.PersonUsageRights);
        Configure(group.MapPost("/terminations", (Guid id, TerminateUsageRightCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) =>
            Execute(context, v => service.TerminateUsageRightAsync(id, v, command, token))), "TerminateUsageRight");
        Configure(group.MapPost("/termination-reversals", (Guid id, ReverseUsageRightTerminationCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) =>
            Execute(context, v => service.ReverseUsageRightTerminationAsync(id, v, command, token))), "ReverseUsageRightTermination");
        Configure(group.MapPost("/successors", (Guid id, CreateUsageRightSuccessorCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) =>
            Execute(context, v => service.CreateUsageRightSuccessorAsync(id, v, command, token), true)), "CreateUsageRightSuccessor").Produces<UsageRightView>(201);
        Configure(group.MapPost("/sequence-corrections", (Guid id, CorrectUsageRightSequenceCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) =>
            Execute(context, v => service.CorrectUsageRightSequenceAsync(id, v, command, token))), "CorrectUsageRightSequence");
    }

    private static RouteHandlerBuilder Configure(RouteHandlerBuilder route, string name) => route.WithName(name)
        .WithDescription("Manueller Vorgang mit starkem aktuellem If-Match und CSRF. Beendigung spätestens heute (UTC); keine Frist- oder Grabstatusautomatik.")
        .RequireCemarisAntiforgery().Produces<UsageRightView>().ProducesValidationProblem().ProducesProblem(401).ProducesProblem(403)
        .ProducesProblem(404).ProducesProblem(409).ProducesProblem(412).ProducesProblem(428);

    private static async Task<IResult> Execute(HttpContext context, Func<long, Task<PersonUsageRightMutationResult>> mutate, bool created = false)
    {
        if (!context.Request.Headers.TryGetValue("If-Match", out var values)) return Results.Problem(statusCode: 428, title: "Ein aktueller If-Match ist erforderlich.");
        var value = values.Count == 1 ? values[0] : null;
        if (value is null || value.Length < 3 || value[0] != '"' || value[^1] != '"'
            || !long.TryParse(value.AsSpan(1, value.Length - 2), System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out var version) || version < 1)
            return Results.Problem(statusCode: 400, title: "Genau ein starker numerischer ETag ist erforderlich.");
        var result = await mutate(version);
        if (result.Outcome != PersonUsageRightMutationOutcome.Success)
        {
            var status = result.Outcome switch
            {
                PersonUsageRightMutationOutcome.NotFound or PersonUsageRightMutationOutcome.InvalidReference => 404,
                PersonUsageRightMutationOutcome.VersionConflict => 412,
                _ => 409
            };
            return Results.Problem(statusCode: status, title: status == 412 ? "Recht oder Rechtefolge wurde geändert. Vollständigen Stand neu laden und erneut bestätigen." : "Der Vorgang konnte für diesen Bezug oder Zustand nicht gespeichert werden.");
        }
        var saved = result.Right ?? throw new InvalidOperationException("Der gespeicherte Rechtsstand fehlt.");
        context.Response.Headers.ETag = $"\"{saved.Version}\"";
        if (created) context.Response.Headers.Location = $"/api/usage-rights/{saved.Id}";
        return Results.Json(saved, statusCode: created ? 201 : 200);
    }
}
