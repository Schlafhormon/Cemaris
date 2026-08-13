using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Cemaris.IntegrationTests;

public sealed class BurialProcessWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Features:CaseEditingEnabled", "false");
        builder.UseSetting("Features:CemeteryMasterDataEditingEnabled", "true");
        builder.UseSetting("Features:BurialProcessEditingEnabled", "true");
        builder.UseSetting("ReadModel:Provider", "Synthetic");
        TestIdentity.ConfigureAutomaticCaseWorker(builder);
    }
}
