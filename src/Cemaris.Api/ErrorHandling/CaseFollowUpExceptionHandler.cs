using Microsoft.AspNetCore.Diagnostics;

namespace Cemaris.Api.ErrorHandling;

public sealed class CaseFollowUpExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var endpoint = httpContext.Features.Get<IExceptionHandlerFeature>()?.Endpoint ?? httpContext.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<CaseFollowUpEndpointMetadata>() is null) return false;
        var invalid = exception is BadHttpRequestException { StatusCode: 400 };
        // Weder gebundene Eingaben noch Datenbankfehler mit Inhaltswerten protokollieren.
        await Results.Problem(statusCode: invalid ? 400 : 500,
            title: invalid ? "Die Anfrage enthält fehlende oder ungültige Angaben. Datum: YYYY-MM-DD; Fallbezug: gültige Fall-ID."
                : "Die Wiedervorlage konnte nicht verarbeitet werden.").ExecuteAsync(httpContext);
        return true;
    }
}

public sealed record CaseFollowUpEndpointMetadata;
