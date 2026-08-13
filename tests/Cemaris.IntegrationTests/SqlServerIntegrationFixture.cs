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
    private const string DatabasePrefix = "Cemaris_IntegrationTests_";
    private readonly string databaseName = $"{DatabasePrefix}{Guid.NewGuid():N}";
    private string? masterConnectionString;
    private SqlServerWebApplicationFactory? applicationFactory;

    public string DatabaseConnectionString { get; private set; } = string.Empty;

    public SyntheticSeedResult SeedResult { get; private set; } = null!;

    public bool LegacyMigrationPreservedNullableAttribution { get; private set; }

    public int SeededCaseCount { get; private set; }

    public int SeededChangeCount { get; private set; }

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
            await dbContext.Database.MigrateAsync("20260812103956_AddCaseVersion");

            var legacyCaseId = Guid.NewGuid();
            await dbContext.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO ReadCases (Id, IsSynthetic, Version) VALUES ({legacyCaseId}, CAST(1 AS bit), 1)");
            await dbContext.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO ReadGraves (CaseId, Cemetery, Field, GraveNumber) VALUES ({legacyCaseId}, {"Synthetischer Migrations-Testfriedhof"}, NULL, {"SYN-MIG-1"})");
            await dbContext.Database.MigrateAsync();

            var legacyProjection = await new EfCaseReadStore(dbContext)
                .FindAsync(legacyCaseId, CancellationToken.None);
            LegacyMigrationPreservedNullableAttribution = legacyProjection is not null
                && legacyProjection.LastChange is null
                && !await dbContext.CaseChanges.AnyAsync(item => item.CaseId == legacyCaseId);

            var seeder = new SyntheticReadModelSeeder(dbContext);
            SeedResult = await seeder.ResetAsync(databaseName, CancellationToken.None);
            SeededCaseCount = await dbContext.Cases.CountAsync();
            SeededChangeCount = await dbContext.CaseChanges.CountAsync();
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

        var resolvedDatabaseName = new SqlConnectionStringBuilder(DatabaseConnectionString)
            .InitialCatalog;
        if (!databaseName.StartsWith(DatabasePrefix, StringComparison.Ordinal)
            || databaseName.Length <= DatabasePrefix.Length
            || !string.Equals(resolvedDatabaseName, databaseName, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Refusing to drop a database outside the Cemaris integration-test prefix.");
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
