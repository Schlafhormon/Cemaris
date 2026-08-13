using Cemaris.Api.Security;
using Cemaris.Application.Cemeteries;
using Cemaris.Domain.Cemeteries;
using Microsoft.AspNetCore.Mvc;

namespace Cemaris.Api;

public static class CemeteryMasterDataEndpoints
{
    public static void MapCemeteryMasterData(this WebApplication app)
    {
        var group = app.MapGroup("/api/master-data")
            .WithTags("Synthetic Development cemetery master data")
            .RequireAuthorization(CemarisPolicies.MasterData);

        group.MapGet("/cemeteries", (bool? includeInactive, CemeteryMasterDataService service, CancellationToken token) =>
            service.ReadAsync(includeInactive == true, token))
            .WithName("GetCemeteryMasterData")
            .Produces<CemeteryMasterDataSnapshot>();

        MapSave(group, "cemeteries", CemeteryMasterDataKind.Cemetery,
            (CemeteryMasterDataService s, Guid? id, long? v, SaveCemeteryCommand c, CancellationToken t) => s.SaveCemeteryAsync(id, v, c, t));
        MapSave(group, "areas", CemeteryMasterDataKind.Area,
            (CemeteryMasterDataService s, Guid? id, long? v, SaveCemeteryLevelCommand c, CancellationToken t) => s.SaveAreaAsync(id, v, c, t));
        MapSave(group, "fields", CemeteryMasterDataKind.Field,
            (CemeteryMasterDataService s, Guid? id, long? v, SaveCemeteryLevelCommand c, CancellationToken t) => s.SaveFieldAsync(id, v, c, t));
        MapSave(group, "rows", CemeteryMasterDataKind.Row,
            (CemeteryMasterDataService s, Guid? id, long? v, SaveCemeteryLevelCommand c, CancellationToken t) => s.SaveRowAsync(id, v, c, t));
        MapSave(group, "grave-types", CemeteryMasterDataKind.GraveType,
            (CemeteryMasterDataService s, Guid? id, long? v, SaveGraveTypeCommand c, CancellationToken t) => s.SaveGraveTypeAsync(id, v, c, t));
        MapSave(group, "cemetery-grave-types", CemeteryMasterDataKind.CemeteryGraveType,
            (CemeteryMasterDataService s, Guid? id, long? v, SaveCemeteryGraveTypeCommand c, CancellationToken t) => s.SaveCemeteryGraveTypeAsync(id, v, c, t));
        MapSave(group, "grave-sites", CemeteryMasterDataKind.GraveSite,
            (CemeteryMasterDataService s, Guid? id, long? v, SaveGraveSiteCommand c, CancellationToken t) => s.SaveGraveSiteAsync(id, v, c, t));

        group.MapDelete("/{kind}/{id:guid}", DeleteAsync)
            .RequireAuthorization(CemarisPolicies.MasterDataDeletion)
            .RequireCemarisAntiforgery()
            .WithName("DeleteCemeteryMasterData")
            .WithDescription("Requires the current strong entity ETag in If-Match and the Administration role.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status412PreconditionFailed)
            .ProducesProblem(StatusCodes.Status428PreconditionRequired);
    }

    private static void MapSave<T>(
        RouteGroupBuilder group,
        string route,
        CemeteryMasterDataKind kind,
        Func<CemeteryMasterDataService, Guid?, long?, T, CancellationToken, Task<CemeteryMasterDataMutationResult>> save)
    {
        group.MapPost($"/{route}", (T command, CemeteryMasterDataService service, HttpContext context, CancellationToken token) => ExecuteAsync(null, null, command, service, context, save, token))
            .RequireCemarisAntiforgery()
            .WithName($"Create{kind}")
            .Produces<CemeteryMasterDataMutationResult>(StatusCodes.Status201Created)
            .ProducesValidationProblem();
        group.MapPut($"/{route}/{{id:guid}}", (Guid id, T command, CemeteryMasterDataService service, HttpContext context, CancellationToken token) =>
                ExecuteAsync(id, ParseVersion(context.Request), command, service, context, save, token))
            .RequireCemarisAntiforgery()
            .WithName($"Change{kind}")
            .WithDescription("Requires the current strong entity ETag in If-Match.")
            .Produces<CemeteryMasterDataMutationResult>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status412PreconditionFailed)
            .ProducesProblem(StatusCodes.Status428PreconditionRequired);
    }

    private static async Task<IResult> ExecuteAsync<T>(Guid? id, long? version, T command, CemeteryMasterDataService service, HttpContext context, Func<CemeteryMasterDataService, Guid?, long?, T, CancellationToken, Task<CemeteryMasterDataMutationResult>> save, CancellationToken token)
    {
        if (id.HasValue && !version.HasValue) return PreconditionRequired();
        try
        {
            var result = await save(service, id, version, command, token);
            return Result(result, id.HasValue ? StatusCodes.Status200OK : StatusCodes.Status201Created, context.Response);
        }
        catch (CemeteryMasterDataValidationException exception)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]> { [exception.Field] = [exception.Message] }, title: "Die Stammdaten sind ungültig.");
        }
    }

    private static async Task<IResult> DeleteAsync(string kind, Guid id, CemeteryMasterDataService service, HttpRequest request, CancellationToken token)
    {
        if (!Enum.TryParse<CemeteryMasterDataKind>(kind, true, out var parsed)) return Results.NotFound();
        var version = ParseVersion(request);
        if (!version.HasValue) return PreconditionRequired();
        return Result(await service.DeleteAsync(parsed, id, version.Value, token), StatusCodes.Status204NoContent);
    }

    private static IResult Result(CemeteryMasterDataMutationResult result, int successStatus, HttpResponse? response = null)
    {
        if (result.Outcome == CemeteryMasterDataMutationOutcome.Success && response is not null)
            response.Headers.ETag = $"\"{result.Version}\"";
        return result.Outcome switch
        {
            CemeteryMasterDataMutationOutcome.Success when successStatus == StatusCodes.Status204NoContent => Results.NoContent(),
            CemeteryMasterDataMutationOutcome.Success => Results.Json(result, statusCode: successStatus),
            CemeteryMasterDataMutationOutcome.NotFound => Results.NotFound(new ProblemDetails { Title = "Der Stammdatensatz wurde nicht gefunden.", Status = 404 }),
            CemeteryMasterDataMutationOutcome.Conflict => Results.Problem(statusCode: 412, title: "Der Stammdatensatz wurde zwischenzeitlich geändert."),
            CemeteryMasterDataMutationOutcome.Duplicate => Results.Problem(statusCode: 409, title: "Im Gültigkeitsbereich existiert bereits ein gleicher Name, Code oder eine gleiche Grabnummer."),
            CemeteryMasterDataMutationOutcome.InvalidReference => Results.ValidationProblem(new Dictionary<string, string[]> { ["reference"] = ["Die Hierarchie oder Grabartenzuordnung ist ungültig."] }),
            CemeteryMasterDataMutationOutcome.InUse => Results.Problem(statusCode: 409, title: "Der verwendete Stammdatensatz darf nicht physisch gelöscht werden."),
            _ => Results.Problem(statusCode: 500, title: "Unbekanntes Mutationsergebnis."),
        };
    }

    private static long? ParseVersion(HttpRequest request)
    {
        var value = request.Headers.IfMatch.ToString().Trim();
        return value.Length > 2 && value[0] == '"' && value[^1] == '"' && long.TryParse(value[1..^1], out var version) && version > 0 ? version : null;
    }

    private static IResult PreconditionRequired() => Results.Problem(statusCode: StatusCodes.Status428PreconditionRequired, title: "If-Match mit einer starken aktuellen Version ist erforderlich.");
}
