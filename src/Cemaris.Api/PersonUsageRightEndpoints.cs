using Cemaris.Api.Security;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;
using Microsoft.AspNetCore.Mvc;

namespace Cemaris.Api;

public static class PersonUsageRightEndpoints
{
    public static void MapPersonUsageRights(this WebApplication app)
    {
        var parties = app.MapGroup("/api/parties").WithTags("Canonical parties").RequireAuthorization(CemarisPolicies.PersonUsageRights);
        parties.MapGet("/", async (string query, PersonUsageRightService service, CancellationToken token) => Results.Ok(await service.SearchPartiesAsync(query, token)))
            .WithName("SearchParties").Produces<IReadOnlyList<PartySearchItem>>().ProducesValidationProblem();
        parties.MapGet("/{partyId:guid}", GetPartyAsync).WithName("GetParty").Produces<PartyView>().ProducesProblem(404);
        parties.MapPost("/", CreatePartyAsync).WithName("CreateParty").RequireCemarisAntiforgery().Produces<PartyView>(201).ProducesValidationProblem().ProducesProblem(409);
        parties.MapPost("/{partyId:guid}/corrections", CorrectPartyAsync).WithName("CorrectParty").RequireCemarisAntiforgery().Produces<PartyView>().ProducesProblem(412).ProducesProblem(428);
        parties.MapPost("/{partyId:guid}/addresses", AddAddressAsync).WithName("AddPartyAddress").RequireCemarisAntiforgery().Produces<PartyView>().ProducesProblem(412).ProducesProblem(428);
        parties.MapPost("/{partyId:guid}/addresses/{addressId:guid}/corrections", CorrectAddressAsync).WithName("CorrectPartyAddress").RequireCemarisAntiforgery().Produces<PartyView>().ProducesProblem(412).ProducesProblem(428);

        var rights = app.MapGroup("/api").WithTags("Canonical usage rights").RequireAuthorization(CemarisPolicies.PersonUsageRights);
        rights.MapGet("/grave-sites/{graveSiteId:guid}/usage-rights", GetRightByGraveAsync).WithName("GetUsageRightByGraveSite").Produces<UsageRightView>().Produces(204);
        rights.MapGet("/usage-rights/{usageRightId:guid}", GetRightAsync).WithName("GetUsageRight").Produces<UsageRightView>().ProducesProblem(404);
        rights.MapPost("/usage-rights", CreateRightAsync).WithName("CreateUsageRight").RequireCemarisAntiforgery().Produces<UsageRightView>(201).ProducesValidationProblem().ProducesProblem(409);
        rights.MapPost("/usage-rights/{usageRightId:guid}/transfers", TransferRightAsync).WithName("TransferUsageRight").RequireCemarisAntiforgery().Produces<UsageRightView>().ProducesProblem(412).ProducesProblem(428);
        rights.MapPost("/usage-rights/{usageRightId:guid}/extensions", ExtendRightAsync).WithName("ExtendUsageRight").RequireCemarisAntiforgery().Produces<UsageRightView>().ProducesProblem(412).ProducesProblem(428);
        rights.MapPost("/usage-rights/{usageRightId:guid}/corrections", CorrectRightAsync).WithName("CorrectUsageRight").RequireCemarisAntiforgery().Produces<UsageRightView>().ProducesProblem(412).ProducesProblem(428);

        var rules = app.MapGroup("/api/program-configuration/usage-right-start-rules").WithTags("Usage-right start configuration");
        rules.MapGet("/", (PersonUsageRightService service, CancellationToken token) => service.ReadStartRulesAsync(token)).WithName("GetUsageRightStartRules").RequireAuthorization(CemarisPolicies.PersonUsageRights).Produces<IReadOnlyList<UsageRightStartRuleView>>();
        rules.MapPost("/", CreateRuleAsync).WithName("CreateUsageRightStartRule").RequireAuthorization(CemarisPolicies.ProgramConfiguration).RequireCemarisAntiforgery().Produces<UsageRightStartRuleView>(201).ProducesValidationProblem().ProducesProblem(409);
        rules.MapPut("/{ruleId:guid}", ChangeRuleAsync).WithName("ChangeUsageRightStartRule").RequireAuthorization(CemarisPolicies.ProgramConfiguration).RequireCemarisAntiforgery().Produces<UsageRightStartRuleView>().ProducesProblem(412).ProducesProblem(428);
    }

    private static async Task<IResult> GetPartyAsync(Guid partyId, PersonUsageRightService service, HttpResponse response, CancellationToken token) => await service.FindPartyAsync(partyId, token) is { } view ? WithEtag(view, view.Version, response) : Results.NotFound();
    private static async Task<IResult> GetRightAsync(Guid usageRightId, PersonUsageRightService service, HttpResponse response, CancellationToken token) => await service.FindUsageRightAsync(usageRightId, token) is { } view ? WithEtag(view, view.Version, response) : Results.NotFound();
    private static async Task<IResult> GetRightByGraveAsync(Guid graveSiteId, PersonUsageRightService service, HttpResponse response, CancellationToken token) => await service.FindUsageRightByGraveSiteAsync(graveSiteId, token) is { } view ? WithEtag(view, view.Version, response) : Results.NoContent();

    private static async Task<IResult> CreatePartyAsync(CreatePartyCommand command, PersonUsageRightService service, HttpResponse response, CancellationToken token)
    {
        try { var result = await service.CreatePartyAsync(command, token); if (result.Outcome != PersonUsageRightMutationOutcome.Success) return Failure(result); var view = await service.FindPartyAsync(result.Id, token) ?? throw new InvalidOperationException("Die angelegte beteiligte Identität ist nicht lesbar."); response.Headers.Location = $"/api/parties/{result.Id}"; response.Headers.ETag = Etag(result.Version); return Results.Json(view, statusCode: 201); }
        catch (PartyValidationException ex) { return Validation(ex.Field, ex.Message); }
    }

    private static Task<IResult> CorrectPartyAsync(Guid partyId, CorrectPartyCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) => Existing(context, v => service.CorrectPartyAsync(partyId, v, command, token), () => service.FindPartyAsync(partyId, token));
    private static Task<IResult> AddAddressAsync(Guid partyId, AddPartyAddressCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) => Existing(context, v => service.AddPartyAddressAsync(partyId, v, command, token), () => service.FindPartyAsync(partyId, token));
    private static Task<IResult> CorrectAddressAsync(Guid partyId, Guid addressId, CorrectPartyAddressCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) => Existing(context, v => service.CorrectPartyAddressAsync(partyId, addressId, v, command, token), () => service.FindPartyAsync(partyId, token));

    private static async Task<IResult> CreateRightAsync(CreateUsageRightCommand command, PersonUsageRightService service, HttpResponse response, CancellationToken token)
    {
        try { var result = await service.CreateUsageRightAsync(command, token); if (result.Outcome != PersonUsageRightMutationOutcome.Success) return Failure(result); var view = await service.FindUsageRightAsync(result.Id, token) ?? throw new InvalidOperationException("Das angelegte Nutzungsrecht ist nicht lesbar."); response.Headers.Location = $"/api/usage-rights/{result.Id}"; response.Headers.ETag = Etag(result.Version); return Results.Json(view, statusCode: 201); }
        catch (UsageRightValidationException ex) { return Validation(ex.Field, ex.Message); }
        catch (PartyValidationException ex) { return Validation(ex.Field, ex.Message); }
    }

    private static Task<IResult> TransferRightAsync(Guid usageRightId, TransferUsageRightCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) => Existing(context, v => service.TransferUsageRightAsync(usageRightId, v, command, token), () => service.FindUsageRightAsync(usageRightId, token));
    private static Task<IResult> ExtendRightAsync(Guid usageRightId, ExtendUsageRightCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) => Existing(context, v => service.ExtendUsageRightAsync(usageRightId, v, command, token), () => service.FindUsageRightAsync(usageRightId, token));
    private static Task<IResult> CorrectRightAsync(Guid usageRightId, CorrectUsageRightCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token) => Existing(context, v => service.CorrectUsageRightAsync(usageRightId, v, command, token), () => service.FindUsageRightAsync(usageRightId, token));

    private static async Task<IResult> CreateRuleAsync(SaveUsageRightStartRuleCommand command, PersonUsageRightService service, HttpResponse response, CancellationToken token)
    {
        try { var result = await service.SaveStartRuleAsync(null, null, command, token); if (result.Outcome != PersonUsageRightMutationOutcome.Success) return Failure(result); var view = (await service.ReadStartRulesAsync(token)).Single(x => x.Id == result.Id); response.Headers.Location = $"/api/program-configuration/usage-right-start-rules/{result.Id}"; response.Headers.ETag = Etag(result.Version); return Results.Json(view, statusCode: 201); }
        catch (PartyValidationException ex) { return Validation(ex.Field, ex.Message); }
    }

    private static async Task<IResult> ChangeRuleAsync(Guid ruleId, SaveUsageRightStartRuleCommand command, PersonUsageRightService service, HttpContext context, CancellationToken token)
    {
        var parsed = Parse(context.Request, out var version); if (parsed is not null) return parsed;
        try { var result = await service.SaveStartRuleAsync(ruleId, version, command, token); if (result.Outcome != PersonUsageRightMutationOutcome.Success) return Failure(result); var view = (await service.ReadStartRulesAsync(token)).Single(x => x.Id == result.Id); context.Response.Headers.ETag = Etag(result.Version); return Results.Ok(view); }
        catch (PartyValidationException ex) { return Validation(ex.Field, ex.Message); }
    }

    private static async Task<IResult> Existing<T>(HttpContext context, Func<long, Task<PersonUsageRightMutationResult>> mutate, Func<Task<T?>> load) where T : class
    {
        var parsed = Parse(context.Request, out var version); if (parsed is not null) return parsed;
        try { var result = await mutate(version); if (result.Outcome != PersonUsageRightMutationOutcome.Success) return Failure(result); var view = await load() ?? throw new InvalidOperationException("Das geänderte Aggregat ist nicht lesbar."); context.Response.Headers.ETag = Etag(result.Version); return Results.Ok(view); }
        catch (PartyValidationException ex) { return Validation(ex.Field, ex.Message); }
        catch (UsageRightValidationException ex) { return Validation(ex.Field, ex.Message); }
    }

    private static IResult Failure(PersonUsageRightMutationResult result) => result.Outcome switch
    {
        PersonUsageRightMutationOutcome.NotFound => Results.NotFound(new ProblemDetails { Status = 404, Title = "Das Fachaggregat wurde nicht gefunden." }),
        PersonUsageRightMutationOutcome.VersionConflict => Results.Problem(statusCode: 412, title: "Das Fachaggregat wurde zwischenzeitlich geändert.", type: "https://httpstatuses.com/412"),
        PersonUsageRightMutationOutcome.PossibleDuplicate => Results.Problem(new ProblemDetails { Status = 409, Title = "Mindestens eine mögliche Beteiligten-Dublette wurde gefunden.", Type = "https://cemaris.local/problems/possible-party-duplicate", Extensions = { ["code"] = "possible-party-duplicate", ["candidates"] = result.DuplicateCandidates ?? [] } }),
        PersonUsageRightMutationOutcome.Duplicate => Results.Problem(new ProblemDetails { Status = 409, Title = "Die fachliche Eindeutigkeit ist bereits belegt.", Type = "https://cemaris.local/problems/person-usage-right-duplicate", Extensions = { ["code"] = "person-usage-right-duplicate" } }),
        PersonUsageRightMutationOutcome.InvalidReference => Validation("reference", "Mindestens ein kanonischer Bezug oder die Startregel ist ungültig."),
        _ => Results.Problem(statusCode: 500, title: "Unbekanntes Mutationsergebnis."),
    };

    private static IResult? Parse(HttpRequest request, out long version)
    {
        version = 0; if (!request.Headers.TryGetValue("If-Match", out var values)) return Results.Problem(statusCode: 428, title: "If-Match mit einer starken aktuellen Version ist erforderlich.");
        var value = values.Count == 1 ? values[0] : null; return value is not null && value.Length > 2 && value[0] == '"' && value[^1] == '"' && long.TryParse(value[1..^1], out version) && version > 0 ? null : Results.Problem(statusCode: 400, title: "If-Match muss genau einen starken numerischen ETag enthalten.");
    }

    private static IResult WithEtag<T>(T value, long version, HttpResponse response) { response.Headers.ETag = Etag(version); return Results.Ok(value); }
    private static string Etag(long version) => $"\"{version}\"";
    private static IResult Validation(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] }, title: "Die Angaben sind ungültig.");
}
