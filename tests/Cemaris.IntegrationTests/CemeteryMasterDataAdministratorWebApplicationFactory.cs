using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Cemaris.IntegrationTests;

public sealed class CemeteryMasterDataAdministratorWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Features:CaseEditingEnabled", "true");
        builder.UseSetting("Features:CemeteryMasterDataEditingEnabled", "true");
        builder.UseSetting("ReadModel:Provider", "Synthetic");
        builder.ConfigureServices(TestIdentity.ConfigureAccounts);
    }
}
