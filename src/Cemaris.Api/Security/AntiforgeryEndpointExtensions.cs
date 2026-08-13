using Microsoft.AspNetCore.Antiforgery;

namespace Cemaris.Api.Security;

public static class AntiforgeryEndpointExtensions
{
    public static RouteHandlerBuilder RequireCemarisAntiforgery(this RouteHandlerBuilder builder) =>
        builder.AddEndpointFilter(ValidateAsync);

    public static RouteGroupBuilder RequireCemarisAntiforgery(this RouteGroupBuilder builder) =>
        builder.AddEndpointFilter(ValidateAsync);

    private static async ValueTask<object?> ValidateAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var antiforgery = context.HttpContext.RequestServices.GetRequiredService<IAntiforgery>();
        try
        {
            await antiforgery.ValidateRequestAsync(context.HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Die CSRF-Prüfung ist fehlgeschlagen.",
                type: "https://httpstatuses.com/400");
        }

        return await next(context);
    }
}
