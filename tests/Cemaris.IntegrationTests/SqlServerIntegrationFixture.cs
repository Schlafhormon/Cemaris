using System.Diagnostics.CodeAnalysis;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[SuppressMessage(
    "Design",
    "CA1001:Types that own disposable fields should be disposable",
    Justification = "xUnit disposes class fixtures through IAsyncLifetime.DisposeAsync.")]
public sealed class SqlServerIntegrationFixture : IAsyncLifetime
{
    private readonly string databaseName = $"Cemaris_IntegrationTests_{Guid.NewGuid():N}";
    private string? masterConnectionString;
    private SqlServerWebApplicationFactory? applicationFactory;

    public string DatabaseConnectionString { get; private set; } = string.Empty;

    public SyntheticSeedResult SeedResult { get; private set; } = null!;

    public HttpClient CreateClient() =>
        (applicationFactory ?? throw new InvalidOperationException("The SQL test fixture is not initialized."))
        .CreateClient();

    public async Task InitializeAsync()
    {
        var configuredConnectionString = Environment.GetEnvironmentVariable(
            SqlServerFactAttribute.ConnectionStringEnvironmentVariable);
        if (string.IsNullOrWhiteSpace(configuredConnectionString))
        {
            throw new InvalidOperationException(
                $"{SqlServerFactAttribute.ConnectionStringEnvironmentVariable} is required for SQL integration tests.");
        }

        var masterBuilder = new SqlConnectionStringBuilder(configuredConnectionString)
        {
            InitialCatalog = "master",
            Pooling = false,
            ApplicationName = "Cemaris SQL integration tests",
        };
        masterConnectionString = masterBuilder.ConnectionString;

        var databaseBuilder = new SqlConnectionStringBuilder(configuredConnectionString)
        {
            InitialCatalog = databaseName,
            Pooling = false,
            ApplicationName = "Cemaris SQL integration tests",
        };
        DatabaseConnectionString = databaseBuilder.ConnectionString;

        try
        {
            await ExecuteOnMasterAsync($"CREATE DATABASE [{databaseName}];");

            var options = new DbContextOptionsBuilder<CemarisDbContext>()
                .UseSqlServer(DatabaseConnectionString)
                .Options;
            await using var dbContext = new CemarisDbContext(options);
            await dbContext.Database.MigrateAsync();

            var seeder = new SyntheticReadModelSeeder(dbContext);
            SeedResult = await seeder.ResetAsync(databaseName, CancellationToken.None);
            applicationFactory = new SqlServerWebApplicationFactory(DatabaseConnectionString);
        }
        catch
        {
            await DropDatabaseAsync();
            throw;
        }
    }

    public async Task DisposeAsync()
    {
        if (applicationFactory is not null)
        {
            await applicationFactory.DisposeAsync();
        }

        await DropDatabaseAsync();
    }

    private async Task DropDatabaseAsync()
    {
        if (masterConnectionString is null)
        {
            return;
        }

        await ExecuteOnMasterAsync(
            $"""
            IF DB_ID(N'{databaseName}') IS NOT NULL
            BEGIN
                ALTER DATABASE [{databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                DROP DATABASE [{databaseName}];
            END;
            """);
    }

    private async Task ExecuteOnMasterAsync(string commandText)
    {
        await using var connection = new SqlConnection(masterConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = commandText;
        command.CommandTimeout = 60;
        await command.ExecuteNonQueryAsync();
    }
}
