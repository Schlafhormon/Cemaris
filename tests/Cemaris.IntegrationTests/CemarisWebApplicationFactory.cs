using Cemaris.Application.Cases;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Cemaris.IntegrationTests;

public sealed class CemarisWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Features:CaseEditingEnabled", "false");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ICaseReadStore>();
            services.RemoveAll<SyntheticCaseReadStore>();
            services.AddSingleton<SyntheticCaseReadStore>();
            services.AddSingleton<ICaseReadStore>(serviceProvider =>
                serviceProvider.GetRequiredService<SyntheticCaseReadStore>());
        });
    }
}
