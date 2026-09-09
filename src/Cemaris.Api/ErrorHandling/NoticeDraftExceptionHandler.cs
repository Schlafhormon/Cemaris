using Cemaris.Domain.NoticeDrafts;
using Microsoft.AspNetCore.Diagnostics;

namespace Cemaris.Api.ErrorHandling;

public sealed record NoticeDraftEndpointMetadata;

public sealed class NoticeDraftExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var endpoint = httpContext.Features.Get<IExceptionHandlerFeature>()?.Endpoint ?? httpContext.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<NoticeDraftEndpointMetadata>() is null) return false;
        var result = exception switch
        {
            NoticeDraftValidationException e => NoticeDraftEndpoints.Validation(e.Field, e.Message),
            BadHttpRequestException { StatusCode: 400 } => Results.Problem(statusCode: 400, title: "Die Anfrage enthält fehlende oder ungültige Angaben."),
            _ => Results.Problem(statusCode: 503, title: "Der Entwurf konnte nicht sicher verarbeitet werden."),
        };
        await result.ExecuteAsync(httpContext);
        return true;
    }
}
