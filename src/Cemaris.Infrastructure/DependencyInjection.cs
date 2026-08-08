using Cemaris.Infrastructure.Persistence;
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
        var connectionString = configuration.GetConnectionString("CemarisDatabase");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "The connection string 'CemarisDatabase' must be configured.");
        }

        services.AddDbContext<CemarisDbContext>(options =>
            options.UseSqlServer(connectionString));

        return services;
    }
}
