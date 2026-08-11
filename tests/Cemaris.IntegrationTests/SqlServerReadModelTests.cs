using System.Net;
using System.Net.Http.Json;
using Cemaris.Application.Cases;
using Cemaris.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerReadModelTests(SqlServerIntegrationFixture fixture)
    : IClassFixture<SqlServerIntegrationFixture>
{
    [SqlServerFact]
    public async Task MigrationAndSeedCreateExpectedSyntheticDataset()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer(fixture.DatabaseConnectionString)
            .Options;
        await using var dbContext = new CemarisDbContext(options);

        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
        var caseCount = await dbContext.Cases.CountAsync();

        Assert.Empty(pendingMigrations);
        Assert.Equal(15, caseCount);
        Assert.True(await dbContext.Cases.AllAsync(item => item.IsSynthetic));
        Assert.Equal(15, fixture.SeedResult.CasesWritten);
        Assert.Equal(1, fixture.SeedResult.SkippedUnresolvedUsageRightHolders);
    }

    [SqlServerFact]
    public async Task SearchRunsThroughEfStoreWithFilteringAndLimit()
    {
        using var client = fixture.CreateClient();

        var allResponse = await client.GetAsync("/api/search", CancellationToken.None);
        var allResults = await allResponse.Content.ReadFromJsonAsync<SearchResponse>(
            CancellationToken.None);
        var filteredResponse = await client.GetAsync(
            "/api/search?name=Muster-Testperson&cemetery=Testfriedhof%20Nord",
            CancellationToken.None);
        var filteredResults = await filteredResponse.Content.ReadFromJsonAsync<SearchResponse>(
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, allResponse.StatusCode);
        Assert.NotNull(allResults);
        Assert.Equal(15, allResults.TotalMatches);
        Assert.Equal(10, allResults.Items.Count);
        Assert.True(allResults.IsTruncated);

        Assert.Equal(HttpStatusCode.OK, filteredResponse.StatusCode);
        Assert.NotNull(filteredResults);
        var match = Assert.Single(filteredResults.Items);
        Assert.Equal("1001", match.GraveNumber);
        Assert.Equal(2, match.DeceasedPersons.Count);
        Assert.Contains("SYN-B-2024-0001", match.NoticeNumbers);
    }

    [SqlServerFact]
    public async Task DetailPreservesCompleteAndIncompleteRelationships()
    {
        using var client = fixture.CreateClient();

        var complete = await client.GetFromJsonAsync<CaseOverview>(
            "/api/cases/00000000-0000-0000-0000-000000000001",
            CancellationToken.None);
        var incomplete = await client.GetFromJsonAsync<CaseOverview>(
            "/api/cases/00000000-0000-0000-0000-000000000002",
            CancellationToken.None);

        Assert.NotNull(complete);
        Assert.Equal(2, complete.DeceasedPersons.Count);
        Assert.Single(complete.UsageRights[0].EntitledPersonIds);
        Assert.Equal(2, complete.EntitledPersons[0].Addresses.Count);

        Assert.NotNull(incomplete);
        Assert.Null(incomplete.Burials[0].DeceasedPersonId);
        Assert.Empty(incomplete.UsageRights[0].EntitledPersonIds);
        Assert.Equal(3, incomplete.DataQualityNotes.Count);
    }
}
