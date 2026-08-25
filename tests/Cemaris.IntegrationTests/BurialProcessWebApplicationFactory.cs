using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Cemaris.IntegrationTests;

public sealed class BurialProcessWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseIsolatedCemarisSettings(new Dictionary<string, string?>
        {
            ["Features:CemeteryMasterDataEditingEnabled"] = "true",
            ["Features:BurialProcessEditingEnabled"] = "true",
        });
        TestIdentity.ConfigureAutomaticCaseWorker(builder);
    }
}
