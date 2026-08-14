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

public sealed class PersonUsageRightsWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Features:CemeteryMasterDataEditingEnabled", "true");
        builder.UseSetting("Features:PersonUsageRightsEditingEnabled", "true");
        builder.UseSetting("ReadModel:Provider", "Synthetic");
        builder.ConfigureServices(services =>
        {
            TestIdentity.ConfigureAccounts(services);
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = AdministratorAuthenticationHandler.SchemeName;
                options.DefaultChallengeScheme = AdministratorAuthenticationHandler.SchemeName;
                options.DefaultForbidScheme = AdministratorAuthenticationHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, AdministratorAuthenticationHandler>(AdministratorAuthenticationHandler.SchemeName, _ => { });
        });
    }
}

internal sealed class AdministratorAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    internal const string SchemeName = "CemarisAdministratorTest";
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, TestIdentity.AdministratorId.ToString("D")), new Claim(ClaimTypes.Name, "Synthetische Testadministration"), new Claim(ClaimTypes.Role, SystemRole.Administration.Value), new Claim(CemarisClaimTypes.PasswordChangeRequired, bool.FalseString) };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName)));
    }
}
