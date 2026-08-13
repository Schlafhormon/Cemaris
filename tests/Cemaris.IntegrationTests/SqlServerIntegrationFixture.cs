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

    public bool LegacyBurialRemainedReadable { get; private set; }

    public int VerifiedPredecessorMigrations { get; private set; }

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
            VerifiedPredecessorMigrations = await VerifyAllPredecessorsAsync();
            await ExecuteOnMasterAsync($"CREATE DATABASE [{databaseName}];");

            var options = new DbContextOptionsBuilder<CemarisDbContext>()
                .UseSqlServer(DatabaseConnectionString)
                .Options;
            await using var dbContext = new CemarisDbContext(options);
            await dbContext.Database.MigrateAsync("20260813104713_AddCemeteryMasterData");

            var legacyCaseId = Guid.NewGuid();
            var legacyBurialId = Guid.NewGuid();
            await dbContext.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO ReadCases (Id, IsSynthetic, Version) VALUES ({legacyCaseId}, CAST(1 AS bit), 1)");
            await dbContext.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO ReadGraves (CaseId, Cemetery, Field, GraveNumber) VALUES ({legacyCaseId}, {"Synthetischer Migrations-Testfriedhof"}, NULL, {"SYN-MIG-1"})");
            await dbContext.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO ReadBurials (Id, CaseId, DeceasedPersonId, BurialDate) VALUES ({legacyBurialId}, {legacyCaseId}, NULL, {new DateOnly(2026, 8, 1)})");
            await dbContext.Database.MigrateAsync();

            var legacyProjection = await new EfCaseReadStore(dbContext)
                .FindAsync(legacyCaseId, CancellationToken.None);
            LegacyMigrationPreservedNullableAttribution = legacyProjection is not null
                && legacyProjection.LastChange is null
                && !await dbContext.CaseChanges.AnyAsync(item => item.CaseId == legacyCaseId);
            var legacyBurial = Assert.Single(legacyProjection?.Burials ?? []);
            LegacyBurialRemainedReadable = legacyBurial.Id == legacyBurialId
                && legacyBurial.DeceasedPersonId is null
                && legacyBurial.BurialDate == new DateOnly(2026, 8, 1)
                && legacyBurial.Status is null
                && legacyBurial.GraveSiteId is null
                && legacyBurial.PlanningDate is null;

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

    private async Task<int> VerifyAllPredecessorsAsync()
    {
        var baseBuilder = new SqlConnectionStringBuilder(masterConnectionString);
        var migrations = new[]
        {
            "20260811110042_InitialReadModel",
            "20260812103956_AddCaseVersion",
            "20260813064742_AddCaseChangeAttribution",
            "20260813080626_AddLocalAccountsAndSecurityState",
            "20260813104713_AddCemeteryMasterData",
        };
        var verified = 0;
        foreach (var migration in migrations)
        {
            var auxiliaryName = $"{DatabasePrefix}Migration_{Guid.NewGuid():N}";
            if (!auxiliaryName.StartsWith(DatabasePrefix, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Invalid migration-test database prefix.");
            }

            try
            {
                await ExecuteOnMasterAsync($"CREATE DATABASE [{auxiliaryName}];");
                var builder = new SqlConnectionStringBuilder(baseBuilder.ConnectionString)
                {
                    InitialCatalog = auxiliaryName,
                    Pooling = false,
                };
                var options = new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(builder.ConnectionString).Options;
                await using var context = new CemarisDbContext(options);
                await context.Database.MigrateAsync(migration);
                var caseId = Guid.NewGuid();
                var burialId = Guid.NewGuid();
                await context.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO ReadCases (Id, IsSynthetic) VALUES ({caseId}, CAST(1 AS bit))");
                await context.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO ReadBurials (Id, CaseId, DeceasedPersonId, BurialDate) VALUES ({burialId}, {caseId}, NULL, {new DateOnly(2026, 7, 31)})");
                await context.Database.MigrateAsync();
                var burial = await context.Burials.AsNoTracking().SingleAsync(item => item.Id == burialId);
                if (burial.ProcessStatus is not null || burial.GraveSiteId is not null || burial.PlanningDate is not null || burial.BurialDate != new DateOnly(2026, 7, 31))
                {
                    throw new InvalidOperationException("A representative legacy burial was not preserved.");
                }
                verified++;
            }
            finally
            {
                var resolvedAuxiliaryName = new SqlConnectionStringBuilder(baseBuilder.ConnectionString)
                {
                    InitialCatalog = auxiliaryName,
                }.InitialCatalog;
                if (auxiliaryName.StartsWith(DatabasePrefix, StringComparison.Ordinal)
                    && auxiliaryName.Length > DatabasePrefix.Length
                    && string.Equals(resolvedAuxiliaryName, auxiliaryName, StringComparison.Ordinal))
                {
                    await ExecuteOnMasterAsync($"IF DB_ID(N'{auxiliaryName}') IS NOT NULL BEGIN ALTER DATABASE [{auxiliaryName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{auxiliaryName}]; END;");
                }
            }
        }
        return verified;
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
