using Cemaris.Application.Cases;
using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.Identity;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.PersonUsageRights;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Cemaris.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddCemarisInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var provider = configuration["ReadModel:Provider"] ?? "Synthetic";
        var connectionString = configuration.GetConnectionString("CemarisDatabase");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "The connection string 'CemarisDatabase' must be configured for local accounts.");
        }

        services.AddDbContext<CemarisDbContext>(options =>
            options.UseSqlServer(connectionString));
        services.AddScoped<ILocalAccountStore, EfLocalAccountStore>();

        if (provider.Equals("Synthetic", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<SyntheticStoreCoordinator>();
            services.AddSingleton<SyntheticCemeteryMasterDataStore>();
            services.AddSingleton<ICemeteryMasterDataStore>(serviceProvider =>
                serviceProvider.GetRequiredService<SyntheticCemeteryMasterDataStore>());
            services.AddSingleton<SyntheticCaseReadStore>();
            services.AddSingleton<ICaseReadStore>(serviceProvider =>
                serviceProvider.GetRequiredService<SyntheticCaseReadStore>());
            services.AddSingleton<ICaseWriteStore>(serviceProvider =>
                serviceProvider.GetRequiredService<SyntheticCaseReadStore>());
            services.AddSingleton<IBurialProcessStore>(serviceProvider =>
                serviceProvider.GetRequiredService<SyntheticCaseReadStore>());
            services.AddSingleton<SyntheticPersonUsageRightStore>();
            services.AddSingleton<IPersonUsageRightStore>(serviceProvider => serviceProvider.GetRequiredService<SyntheticPersonUsageRightStore>());
            return services;
        }

        if (!provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"The read model provider '{provider}' is not supported. Use 'Synthetic' or 'SqlServer'.");
        }

        services.AddScoped<ICaseReadStore, EfCaseReadStore>();
        services.AddScoped<ICaseWriteStore, EfCaseWriteStore>();
        services.AddScoped<IBurialProcessStore, EfBurialProcessStore>();
        services.AddScoped<ICemeteryMasterDataStore, EfCemeteryMasterDataStore>();
        services.AddScoped<IPersonUsageRightStore, EfPersonUsageRightStore>();
        services.AddScoped<SyntheticReadModelSeeder>();

        return services;
    }
}
