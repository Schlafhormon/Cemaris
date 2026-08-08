using Cemaris.Api.Contracts;
using Cemaris.Api.ErrorHandling;
using Cemaris.Application.System;
using Cemaris.Infrastructure;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
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

app.Run();

public partial class Program;
