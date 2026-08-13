using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Cemaris.IntegrationTests;

public sealed class CemeteryMasterDataWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Features:CaseEditingEnabled", "true");
        builder.UseSetting("Features:CemeteryMasterDataEditingEnabled", "true");
        builder.UseSetting("ReadModel:Provider", "Synthetic");
        TestIdentity.ConfigureAutomaticCaseWorker(builder);
    }
}
