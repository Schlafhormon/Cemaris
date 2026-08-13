using Cemaris.Application.Cases;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Cemaris.IntegrationTests;

internal sealed class SqlServerWebApplicationFactory(string connectionString)
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Features:CaseEditingEnabled", "true");
        TestIdentity.ConfigureAutomaticCaseWorker(builder);
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ICaseReadStore>();
            services.RemoveAll<ICaseWriteStore>();
            services.RemoveAll<CemarisDbContext>();
            services.RemoveAll<DbContextOptions<CemarisDbContext>>();

            services.AddDbContext<CemarisDbContext>(options =>
                options.UseSqlServer(connectionString));
            services.AddScoped<ICaseReadStore, EfCaseReadStore>();
            services.AddScoped<ICaseWriteStore, EfCaseWriteStore>();
        });
    }
}
