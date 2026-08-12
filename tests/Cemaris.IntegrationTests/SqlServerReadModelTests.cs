using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Cemaris.Api.Contracts;
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

    [SqlServerFact]
    public async Task WritePathUsesSameProjectionAndRejectsStaleVersionAtomically()
    {
        using var client = fixture.CreateClient();

        var createResponse = await client.PostAsJsonAsync(
            "/api/cases",
            new
            {
                cemetery = "Synthetischer SQL-Schreibfriedhof",
                field = "Testfeld SQL",
                graveNumber = "SYN-SQL-1",
            },
            CancellationToken.None);
        var created = await createResponse.Content.ReadFromJsonAsync<CaseResponse>(
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(created);
        Assert.True(created.IsSynthetic);
        Assert.Equal(1, created.Version);

        using var firstChange = new HttpRequestMessage(
            HttpMethod.Put,
            $"/api/cases/{created.Id}/grave")
        {
            Content = JsonContent.Create(new
            {
                cemetery = "Synthetischer SQL-Schreibfriedhof neu",
                field = "Testfeld SQL",
                graveNumber = "SYN-SQL-2",
            }),
        };
        firstChange.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"1\""));
        var firstResponse = await client.SendAsync(firstChange, CancellationToken.None);
        var changedGrave = await firstResponse.Content.ReadFromJsonAsync<CaseResponse>(
            CancellationToken.None);
        Assert.NotNull(changedGrave);

        using var addPerson = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/cases/{created.Id}/deceased-persons")
        {
            Content = JsonContent.Create(new
            {
                firstName = "Synthetische SQL-Testperson",
                lastName = "Providerparität",
            }),
        };
        addPerson.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"2\""));
        var personResponse = await client.SendAsync(addPerson, CancellationToken.None);
        var withPerson = await personResponse.Content.ReadFromJsonAsync<CaseResponse>(
            CancellationToken.None);
        Assert.NotNull(withPerson);
        var person = Assert.Single(withPerson.DeceasedPersons);

        using var addBurial = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/cases/{created.Id}/burials")
        {
            Content = JsonContent.Create(new
            {
                deceasedPersonId = person.Id,
                burialDate = "2026-03-04",
            }),
        };
        addBurial.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"3\""));
        var burialResponse = await client.SendAsync(addBurial, CancellationToken.None);

        using var staleChange = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/cases/{created.Id}/deceased-persons")
        {
            Content = JsonContent.Create(new
            {
                firstName = "Nicht gespeichert",
                lastName = "SQL-Konflikt",
            }),
        };
        staleChange.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"1\""));
        var staleResponse = await client.SendAsync(staleChange, CancellationToken.None);

        var detail = await client.GetFromJsonAsync<CaseResponse>(
            $"/api/cases/{created.Id}",
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, personResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, burialResponse.StatusCode);
        Assert.Equal(HttpStatusCode.PreconditionFailed, staleResponse.StatusCode);
        Assert.NotNull(detail);
        Assert.Equal(4, detail.Version);
        Assert.Equal("SYN-SQL-2", detail.Grave.GraveNumber);
        Assert.Single(detail.DeceasedPersons);
        Assert.Single(detail.Burials);
    }
}
