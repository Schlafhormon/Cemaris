using System.Net;
using System.Net.Http.Json;
using Cemaris.Api.Contracts;

namespace Cemaris.IntegrationTests;

public sealed class HealthEndpointTests(CemarisWebApplicationFactory factory)
    : IClassFixture<CemarisWebApplicationFactory>
{
    [Fact]
    public async Task GetHealthReturnsHealthyServiceStatus()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health", CancellationToken.None);
        var content = await response.Content.ReadFromJsonAsync<HealthResponse>(
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(content);
        Assert.Equal("Healthy", content.Status);
        Assert.Equal("Cemaris.Api", content.Service);
    }
}
