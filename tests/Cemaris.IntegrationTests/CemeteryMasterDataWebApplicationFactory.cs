using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Cemaris.IntegrationTests;

public sealed class CemeteryMasterDataWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseIsolatedCemarisSettings(new Dictionary<string, string?>
        {
            ["Features:CaseEditingEnabled"] = "true",
            ["Features:CemeteryMasterDataEditingEnabled"] = "true",
        });
        TestIdentity.ConfigureAutomaticCaseWorker(builder);
    }
}
