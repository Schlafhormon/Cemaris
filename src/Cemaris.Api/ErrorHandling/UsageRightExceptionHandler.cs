using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;
using Microsoft.AspNetCore.Diagnostics;

namespace Cemaris.Api.ErrorHandling;

public sealed record UsageRightEndpointMetadata;
public sealed class UsageRightExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var endpoint = httpContext.Features.Get<IExceptionHandlerFeature>()?.Endpoint ?? httpContext.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<UsageRightEndpointMetadata>() is null) return false;
        IResult result = exception switch
        {
            UsageRightValidationException e => Results.ValidationProblem(new Dictionary<string, string[]> { [e.Field] = [e.Message] }),
            PartyValidationException e => Results.ValidationProblem(new Dictionary<string, string[]> { [e.Field] = [e.Message] }),
            UsageRightStateException => Results.Problem(statusCode: 409, title: "Der Vorgang ist für diesen Rechtszustand oder diese Rechtefolge nicht zulässig."),
            BadHttpRequestException { StatusCode: 400 } => Results.Problem(statusCode: 400, title: "Die Anfrage enthält fehlende oder ungültige Angaben."),
            _ => Results.Problem(statusCode: 500, title: "Der Rechtsvorgang konnte nicht verarbeitet werden."),
        };
        // Inhaltswerte aus Fachnachweisen und SQL-Exceptions nicht protokollieren.
        await result.ExecuteAsync(httpContext);
        return true;
    }
}
