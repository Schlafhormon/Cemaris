using System.Security.Claims;
using System.Text.Encodings.Web;
using Cemaris.Api.Security;
using Cemaris.Application.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Cemaris.IntegrationTests;

public sealed class NoticeDraftWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseIsolatedCemarisSettings(new Dictionary<string, string?>
        {
            ["Features:PersonUsageRightsEditingEnabled"] = "true",
            ["Features:NoticeDraftEditingEnabled"] = "true",
        });
        builder.ConfigureServices(services =>
        {
            TestIdentity.ConfigureAccounts(services);
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = NoticeDraftAdministratorAuthenticationHandler.SchemeName;
                options.DefaultChallengeScheme = NoticeDraftAdministratorAuthenticationHandler.SchemeName;
                options.DefaultForbidScheme = NoticeDraftAdministratorAuthenticationHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, NoticeDraftAdministratorAuthenticationHandler>(
                NoticeDraftAdministratorAuthenticationHandler.SchemeName,
                _ => { });
        });
    }
}

internal sealed class NoticeDraftAdministratorAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    internal const string SchemeName = "CemarisNoticeDraftAdministratorTest";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, TestIdentity.AdministratorId.ToString("D")),
            new Claim(ClaimTypes.Name, "Synthetische Testadministration"),
            new Claim(ClaimTypes.Role, SystemRole.Administration.Value),
            new Claim(CemarisClaimTypes.PasswordChangeRequired, bool.FalseString),
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName)));
    }
}
