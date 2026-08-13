using System.Security.Claims;
using Cemaris.Application.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Cemaris.Api.Security;

public sealed class LocalCookieAuthenticationEvents(
    ILocalAccountStore accountStore,
    TimeProvider timeProvider) : CookieAuthenticationEvents
{
    public override Task RedirectToLogin(RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    }

    public override Task RedirectToAccessDenied(RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    }

    public override async Task ValidatePrincipal(CookieValidatePrincipalContext context)
    {
        if (context.Principal is null
            || !PrincipalAccount.TryGetId(context.Principal, out var accountId)
            || !Guid.TryParse(
                context.Principal.FindFirstValue(CemarisClaimTypes.SecurityStamp),
                out var securityStamp))
        {
            await RejectAsync(context);
            return;
        }

        var account = await accountStore.FindByIdAsync(accountId, context.HttpContext.RequestAborted);
        if (account is null || !account.IsActive || account.SecurityStamp != securityStamp)
        {
            await RejectAsync(context);
            return;
        }

        var expiresUtc = context.Properties.ExpiresUtc;
        if (expiresUtc is not null && expiresUtc <= timeProvider.GetUtcNow())
        {
            await RejectAsync(context);
        }
    }

    private static async Task RejectAsync(CookieValidatePrincipalContext context)
    {
        context.RejectPrincipal();
        await context.HttpContext.SignOutAsync();
    }
}
