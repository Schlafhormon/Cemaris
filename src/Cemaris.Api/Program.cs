using Cemaris.Api.Contracts;
using Cemaris.Api.ErrorHandling;
using Cemaris.Application.Cases;
using Cemaris.Application.System;
using Cemaris.Domain.Cases;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

var caseEditingEnabled = builder.Configuration.GetValue<bool>("Features:CaseEditingEnabled");
if (caseEditingEnabled && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException(
        "Case editing may be enabled only in the Development environment with synthetic data.");
}

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.UseUtcTimestamp = true;
});

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .GetChildren()
    .Select(origin => origin.Value)
    .OfType<string>()
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray();

var openApiEnabled = builder.Configuration.GetValue(
    "OpenApi:Enabled",
    builder.Environment.IsDevelopment());

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHealthChecks();
builder.Services.AddCemarisInfrastructure(builder.Configuration);

var maximumSearchResults = builder.Configuration.GetValue<int?>("Search:MaxResults") ?? 10;
builder.Services.AddScoped(serviceProvider => new CaseReadService(
    serviceProvider.GetRequiredService<ICaseReadStore>(),
    maximumSearchResults));
if (caseEditingEnabled)
{
    builder.Services.AddScoped<CaseWriteService>();
}

if (openApiEnabled)
{
    builder.Services.AddOpenApi();
}

if (allowedOrigins.Length > 0)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("CemarisWeb", policy =>
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod());
    });
}

var app = builder.Build();

if (builder.Configuration.GetValue<bool>("Maintenance:SeedSynthetic"))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "Synthetic SQL seeding is permitted only in the Development environment.");
    }

    var readModelProvider = builder.Configuration["ReadModel:Provider"] ?? "Synthetic";
    if (!readModelProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException(
            "Synthetic SQL seeding requires ReadModel:Provider to be 'SqlServer'.");
    }

    var expectedDatabase = builder.Configuration["Maintenance:ExpectedDatabase"];
    if (string.IsNullOrWhiteSpace(expectedDatabase))
    {
        throw new InvalidOperationException(
            "Maintenance:ExpectedDatabase must be set explicitly when synthetic SQL seeding is requested.");
    }

    await using var scope = app.Services.CreateAsyncScope();
    var seeder = scope.ServiceProvider.GetRequiredService<SyntheticReadModelSeeder>();
    var result = await seeder.ResetAsync(expectedDatabase, CancellationToken.None);

    ApiLog.SyntheticSeedCompleted(
        app.Logger,
        result.CasesWritten,
        result.SkippedUnresolvedUsageRightHolders);

    return;
}

app.UseExceptionHandler();

if (openApiEnabled)
{
    app.MapOpenApi();
}

if (allowedOrigins.Length > 0)
{
    app.UseCors("CemarisWeb");
}

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = static async (context, report) =>
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsJsonAsync(
            new HealthResponse(
                report.Status == HealthStatus.Healthy ? "Healthy" : report.Status.ToString(),
                "Cemaris.Api"),
            context.RequestAborted);
    },
});

var systemEndpoints = app.MapGroup("/api/system")
    .WithTags("System");

systemEndpoints.MapGet("/info", () =>
{
    var project = ProjectInformation.Current;

    return TypedResults.Ok(new SystemInformationResponse(
        project.Name,
        project.Subtitle,
        project.Phase,
        project.ProductionReady,
        caseEditingEnabled,
        typeof(Program).Assembly.GetName().Version?.ToString(3) ?? "unbekannt"));
})
    .WithName("GetSystemInformation")
    .Produces<SystemInformationResponse>(StatusCodes.Status200OK);

var caseEndpoints = app.MapGroup("/api")
    .WithTags("Read-only cases");

caseEndpoints.MapGet("/search", SearchCasesAsync)
    .WithName("SearchCases")
    .WithSummary("Searches the read-only case overview with AND-combined filters.")
    .Produces<SearchCasesResponse>(StatusCodes.Status200OK)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest);

caseEndpoints.MapGet("/cases/{id:guid}", GetCaseAsync)
    .WithName("GetCase")
    .WithSummary("Returns the complete read-only MVP detail projection for one case.")
    .Produces<CaseResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

if (caseEditingEnabled)
{
    var writeEndpoints = app.MapGroup("/api/cases")
        .WithTags("Synthetic Development case editing");

    writeEndpoints.MapPost("/", CreateCaseAsync)
        .WithName("CreateCase")
        .WithSummary("Creates one synthetic Development case record with a server-generated ID.")
        .WithDescription("Returns Location, the current projection and a strong ETag containing the case version.")
        .Produces<CaseResponse>(StatusCodes.Status201Created)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest);

    writeEndpoints.MapPut("/{caseId:guid}/grave", ChangeGraveAsync)
        .WithName("ChangeCaseGrave")
        .WithSummary("Changes the stored grave reference of a synthetic Development case.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    writeEndpoints.MapPost("/{caseId:guid}/deceased-persons", AddDeceasedPersonAsync)
        .WithName("AddCaseDeceasedPerson")
        .WithSummary("Adds a deceased person with a server-generated ID.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    writeEndpoints.MapPut(
            "/{caseId:guid}/deceased-persons/{personId:guid}",
            ChangeDeceasedPersonAsync)
        .WithName("ChangeCaseDeceasedPerson")
        .WithSummary("Changes a deceased person already stored in the case.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    writeEndpoints.MapPost("/{caseId:guid}/burials", AddBurialAsync)
        .WithName("AddCaseBurial")
        .WithSummary("Adds a burial with a server-generated ID.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    writeEndpoints.MapPut("/{caseId:guid}/burials/{burialId:guid}", ChangeBurialAsync)
        .WithName("ChangeCaseBurial")
        .WithSummary("Changes a burial already stored in the case.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);
}

app.Run();

static async Task<IResult> SearchCasesAsync(
    [AsParameters] SearchCasesRequest request,
    CaseReadService service,
    CancellationToken cancellationToken)
{
    try
    {
        var response = await service.SearchAsync(request.ToCriteria(), cancellationToken);
        return Results.Ok(response.ToResponse());
    }
    catch (SearchValidationException exception)
    {
        return Results.ValidationProblem(
            exception.Errors.ToDictionary(item => item.Key, item => item.Value),
            title: exception.Message,
            statusCode: StatusCodes.Status400BadRequest);
    }
}

static async Task<IResult> GetCaseAsync(
    Guid id,
    CaseReadService service,
    HttpResponse response,
    CancellationToken cancellationToken)
{
    var caseOverview = await service.GetAsync(id, cancellationToken);
    if (caseOverview is not null)
    {
        SetCaseEtag(response, caseOverview.Version);
        return Results.Ok(caseOverview.ToResponse());
    }

    return Results.Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Der angeforderte Fall wurde nicht gefunden.",
        type: "https://httpstatuses.com/404");
}

static async Task<IResult> CreateCaseAsync(
    CreateCaseRequest request,
    CaseWriteService service,
    HttpResponse response,
    CancellationToken cancellationToken)
{
    try
    {
        var created = await service.CreateAsync(request.ToCommand(), cancellationToken);
        SetCaseEtag(response, created.Version);
        return Results.Created($"/api/cases/{created.Id}", created.ToResponse());
    }
    catch (CaseValidationException exception)
    {
        return ValidationProblem(exception.Errors, exception.Message);
    }
}

static Task<IResult> ChangeGraveAsync(
    Guid caseId,
    ChangeGraveRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.ChangeGraveAsync(
            caseId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static Task<IResult> AddDeceasedPersonAsync(
    Guid caseId,
    SaveDeceasedPersonRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.AddDeceasedPersonAsync(
            caseId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static Task<IResult> ChangeDeceasedPersonAsync(
    Guid caseId,
    Guid personId,
    SaveDeceasedPersonRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.ChangeDeceasedPersonAsync(
            caseId,
            personId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static Task<IResult> AddBurialAsync(
    Guid caseId,
    SaveBurialRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.AddBurialAsync(
            caseId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static Task<IResult> ChangeBurialAsync(
    Guid caseId,
    Guid burialId,
    SaveBurialRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.ChangeBurialAsync(
            caseId,
            burialId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static async Task<IResult> ExecuteMutationAsync(
    HttpContext context,
    Func<long, Task<CaseOverview>> mutation)
{
    var preconditionProblem = ParseExpectedVersion(context.Request, out var expectedVersion);
    if (preconditionProblem is not null)
    {
        return preconditionProblem;
    }

    try
    {
        var updated = await mutation(expectedVersion);
        SetCaseEtag(context.Response, updated.Version);
        return Results.Ok(updated.ToResponse());
    }
    catch (CaseValidationException exception)
    {
        return ValidationProblem(exception.Errors, exception.Message);
    }
    catch (CaseReferenceValidationException exception)
    {
        return ValidationProblem(exception.Errors, exception.Message);
    }
    catch (CaseRecordNotFoundException exception)
    {
        return NotFoundProblem(exception.Message);
    }
    catch (CaseChildNotFoundException exception)
    {
        return NotFoundProblem(exception.Message);
    }
    catch (CaseVersionConflictException exception)
    {
        return Results.Problem(
            statusCode: StatusCodes.Status412PreconditionFailed,
            title: exception.Message,
            type: "https://httpstatuses.com/412");
    }
}

static IResult? ParseExpectedVersion(HttpRequest request, out long expectedVersion)
{
    expectedVersion = 0;
    if (!request.Headers.TryGetValue("If-Match", out var values))
    {
        return Results.Problem(
            statusCode: StatusCodes.Status428PreconditionRequired,
            title: "Für diese Änderung ist der zuletzt gelesene ETag in If-Match erforderlich.",
            type: "https://httpstatuses.com/428");
    }

    if (values.Count != 1)
    {
        return InvalidEtagProblem();
    }

    var value = values[0];
    if (value is null
        || value.Length < 3
        || value[0] != '"'
        || value[^1] != '"'
        || !long.TryParse(
            value.AsSpan(1, value.Length - 2),
            System.Globalization.NumberStyles.None,
            System.Globalization.CultureInfo.InvariantCulture,
            out expectedVersion)
        || expectedVersion < 1)
    {
        return InvalidEtagProblem();
    }

    return null;
}

static IResult InvalidEtagProblem() =>
    Results.Problem(
        statusCode: StatusCodes.Status400BadRequest,
        title: "If-Match muss genau einen starken Fallversions-ETag wie \"1\" enthalten.",
        type: "https://httpstatuses.com/400");

static IResult ValidationProblem(
    IReadOnlyDictionary<string, string[]> errors,
    string title) =>
    Results.ValidationProblem(
        errors.ToDictionary(item => item.Key, item => item.Value),
        title: title,
        statusCode: StatusCodes.Status400BadRequest);

static IResult NotFoundProblem(string title) =>
    Results.Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: title,
        type: "https://httpstatuses.com/404");

static void SetCaseEtag(HttpResponse response, long version) =>
    response.Headers.ETag = $"\"{version.ToString(System.Globalization.CultureInfo.InvariantCulture)}\"";

public partial class Program;

internal static partial class ApiLog
{
    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Information,
        Message = "Synthetic SQL seed completed. Cases written: {casesWritten}; unresolved holder references skipped: {skippedReferences}.")]
    internal static partial void SyntheticSeedCompleted(
        ILogger logger,
        int casesWritten,
        int skippedReferences);
}
