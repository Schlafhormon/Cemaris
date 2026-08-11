using Cemaris.Application.Cases;
using Cemaris.Infrastructure.Persistence;
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
        if (provider.Equals("Synthetic", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<ICaseReadStore, SyntheticCaseReadStore>();
            return services;
        }

        if (!provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"The read model provider '{provider}' is not supported. Use 'Synthetic' or 'SqlServer'.");
        }

        var connectionString = configuration.GetConnectionString("CemarisDatabase");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "The connection string 'CemarisDatabase' must be configured for the SQL Server read model provider.");
        }

        services.AddDbContext<CemarisDbContext>(options =>
            options.UseSqlServer(connectionString));
        services.AddScoped<ICaseReadStore, EfCaseReadStore>();
        services.AddScoped<SyntheticReadModelSeeder>();

        return services;
    }
}
