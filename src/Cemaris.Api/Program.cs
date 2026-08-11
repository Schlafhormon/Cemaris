using Cemaris.Api.Contracts;
using Cemaris.Api.ErrorHandling;
using Cemaris.Application.Cases;
using Cemaris.Application.System;
using Cemaris.Infrastructure;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

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
        typeof(Program).Assembly.GetName().Version?.ToString(3) ?? "unbekannt"));
})
    .WithName("GetSystemInformation")
    .Produces<SystemInformationResponse>(StatusCodes.Status200OK);

var caseEndpoints = app.MapGroup("/api")
    .WithTags("Read-only cases");

caseEndpoints.MapGet("/search", SearchCasesAsync)
    .WithName("SearchCases")
    .WithSummary("Searches the read-only case overview with AND-combined filters.")
    .Produces<SearchResponse>(StatusCodes.Status200OK)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest);

caseEndpoints.MapGet("/cases/{id:guid}", GetCaseAsync)
    .WithName("GetCase")
    .WithSummary("Returns the complete read-only MVP detail projection for one case.")
    .Produces<CaseOverview>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);

app.Run();

static async Task<IResult> SearchCasesAsync(
    [AsParameters] SearchCasesRequest request,
    CaseReadService service,
    CancellationToken cancellationToken)
{
    try
    {
        var response = await service.SearchAsync(request.ToCriteria(), cancellationToken);
        return Results.Ok(response);
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
    CancellationToken cancellationToken)
{
    var caseOverview = await service.GetAsync(id, cancellationToken);
    if (caseOverview is not null)
    {
        return Results.Ok(caseOverview);
    }

    return Results.Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Der angeforderte Fall wurde nicht gefunden.",
        type: "https://httpstatuses.com/404");
}

public partial class Program;
