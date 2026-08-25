using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Cemaris.IntegrationTests;

public sealed class CemeteryMasterDataAdministratorWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseIsolatedCemarisSettings(new Dictionary<string, string?>
        {
            ["Features:CaseEditingEnabled"] = "true",
            ["Features:CemeteryMasterDataEditingEnabled"] = "true",
        });
        builder.ConfigureServices(TestIdentity.ConfigureAccounts);
    }
}
