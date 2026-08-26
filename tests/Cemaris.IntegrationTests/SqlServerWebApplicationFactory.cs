using Cemaris.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Cemaris.IntegrationTests;

internal sealed class SqlServerWebApplicationFactory(
    string connectionString,
    bool enableAllFeatures = false)
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        var settings = new Dictionary<string, string?>
        {
            ["ReadModel:Provider"] = "SqlServer",
            ["Features:CaseEditingEnabled"] = "true",
        };
        if (enableAllFeatures)
        {
            settings["Features:CemeteryMasterDataEditingEnabled"] = "true";
            settings["Features:BurialProcessEditingEnabled"] = "true";
            settings["Features:PersonUsageRightsEditingEnabled"] = "true";
            settings["Features:NoticeDraftEditingEnabled"] = "true";
        }

        builder.UseIsolatedCemarisSettings(settings);

        TestIdentity.ConfigureAutomaticCaseWorker(builder);
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<CemarisDbContext>();
            services.RemoveAll<DbContextOptions<CemarisDbContext>>();

            services.AddDbContext<CemarisDbContext>(options =>
                options.UseSqlServer(connectionString));
        });
    }
}
