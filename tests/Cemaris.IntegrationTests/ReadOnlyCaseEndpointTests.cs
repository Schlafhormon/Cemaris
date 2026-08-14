using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cemaris.Application.Cases;
using Microsoft.AspNetCore.Mvc;

namespace Cemaris.IntegrationTests;

public sealed class ReadOnlyCaseEndpointTests(CemarisWebApplicationFactory factory)
    : IClassFixture<CemarisWebApplicationFactory>
{
    [Fact]
    public async Task SearchWithoutFiltersReturnsAtMostConfiguredSyntheticResults()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/search", CancellationToken.None);
        var result = await response.Content.ReadFromJsonAsync<SearchResponse>(CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.Equal(10, result.Items.Count);
        Assert.True(result.TotalMatches > result.Items.Count);
        Assert.True(result.IsTruncated);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.True(result.TotalPages > 1);
        Assert.All(result.Items, item => Assert.True(item.IsSynthetic));
    }

    [Fact]
    public async Task SearchSupportsStableServerSidePagination()
    {
        using var client = factory.CreateClient();

        var first = await client.GetFromJsonAsync<SearchResponse>(
            "/api/search?page=1&pageSize=5",
            CancellationToken.None);
        var second = await client.GetFromJsonAsync<SearchResponse>(
            "/api/search?page=2&pageSize=5",
            CancellationToken.None);

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(5, first.Items.Count);
        Assert.Equal(5, second.Items.Count);
        Assert.Empty(first.Items.Select(item => item.CaseId).Intersect(second.Items.Select(item => item.CaseId)));
        Assert.Equal(2, second.Page);
        Assert.Equal(first.TotalPages, second.TotalPages);
    }

    [Fact]
    public async Task SearchRejectsPageSizeAboveConfiguredMaximum()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/search?page=1&pageSize=11", CancellationToken.None);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>(CancellationToken.None);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Contains("pageSize", problem.Errors.Keys);
    }

    [Fact]
    public async Task SearchValidatesMinimumTextLength()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/search?name=M", CancellationToken.None);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>(
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Contains("name", problem.Errors.Keys);
    }

    [Fact]
    public async Task SearchCombinesFiltersAndReturnsCaseContext()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(
            "/api/search?name=Muster-Testperson&cemetery=Testfriedhof%20Nord",
            CancellationToken.None);
        var result = await response.Content.ReadFromJsonAsync<SearchResponse>(CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        var item = Assert.Single(result.Items);
        Assert.Equal("1001", item.GraveNumber);
        Assert.Equal(2, item.DeceasedPersons.Count);
        Assert.Equal(2, item.EntitledPersons[0].Addresses.Count);
        Assert.Contains("SYN-B-2024-0001", item.NoticeNumbers);
    }

    [Fact]
    public async Task DetailReturnsFullReadViewAndVisibleRelationshipNotes()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(
            "/api/cases/00000000-0000-0000-0000-000000000002",
            CancellationToken.None);
        var result = await response.Content.ReadFromJsonAsync<CaseOverview>(CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.True(result.IsSynthetic);
        Assert.NotEmpty(result.DeceasedPersons);
        Assert.NotEmpty(result.Burials);
        Assert.NotEmpty(result.UsageRights);
        Assert.NotEmpty(result.Notices);
        Assert.Null(result.Burials[0].DeceasedPersonId);
        Assert.NotEmpty(result.DataQualityNotes);
    }

    [Fact]
    public async Task DetailReturnsProblemForUnknownCase()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(
            "/api/cases/00000000-0000-0000-0000-999999999999",
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task OpenApiContainsReadOnlySearchAndDetailPaths()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json", CancellationToken.None);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(
            CancellationToken.None));
        var paths = document.RootElement.GetProperty("paths");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(paths.TryGetProperty("/api/search", out _));
        Assert.True(paths.TryGetProperty("/api/cases/{id}", out _));
        Assert.False(paths.TryGetProperty("/api/cases", out _));
        Assert.False(paths.TryGetProperty("/api/cases/{caseId}/grave", out _));
    }

    [Fact]
    public async Task DefaultConfigurationExposesNoEditingCapabilityOrWriteEndpoint()
    {
        using var client = factory.CreateClient();

        var information = await client.GetFromJsonAsync<Cemaris.Api.Contracts.SystemInformationResponse>(
            "/api/system/info",
            CancellationToken.None);
        var writeResponse = await client.PostAsJsonAsync(
            "/api/cases",
            new { cemetery = "Synthetischer Testfriedhof" },
            CancellationToken.None);

        Assert.NotNull(information);
        Assert.False(information.CaseEditingEnabled);
        Assert.Equal(HttpStatusCode.NotFound, writeResponse.StatusCode);
    }
}
