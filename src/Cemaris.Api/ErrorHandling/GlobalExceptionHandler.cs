using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Cemaris.Api.ErrorHandling;

public sealed partial class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        LogUnhandledException(exception, httpContext.TraceIdentifier);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        await httpContext.Response.WriteAsJsonAsync(
            new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Ein unerwarteter Fehler ist aufgetreten.",
                Type = "https://httpstatuses.com/500",
                Instance = httpContext.Request.Path,
                Extensions =
                {
                    ["traceId"] = httpContext.TraceIdentifier,
                },
            },
            cancellationToken);

        return true;
    }

    [LoggerMessage(
        EventId = 1,
        Level = LogLevel.Error,
        Message = "Unhandled API error for trace {TraceIdentifier}")]
    private partial void LogUnhandledException(Exception exception, string traceIdentifier);
}
