using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Application.Cemeteries;

namespace Cemaris.IntegrationTests;

public sealed class CemeteryMasterDataEndpointTests(CemeteryMasterDataWebApplicationFactory factory)
    : IClassFixture<CemeteryMasterDataWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task OpenApiContainsMasterDataReferencesAndConcurrencyContract()
    {
        using var client = factory.CreateClient();
        var document = await client.GetStringAsync("/openapi/v1.json");

        Assert.Contains("/api/master-data/cemeteries", document, StringComparison.Ordinal);
        Assert.Contains("/api/master-data/grave-sites", document, StringComparison.Ordinal);
        Assert.Contains("graveSiteId", document, StringComparison.Ordinal);
        Assert.Contains("If-Match", document, StringComparison.Ordinal);
        Assert.Contains("CemarisCookie", document, StringComparison.Ordinal);
    }

    [Fact]
    public async Task CaseWorkerCanCreateAndChangeButCannotDeleteMasterData()
    {
        using var client = factory.CreateClient();
        var legacyCase = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/cases", new
        {
            cemetery = "Freier Text ist bei aktiver Stammdaten-Capability unzulässig",
            field = (string?)null,
            graveNumber = "SYN-FREE-TEXT",
        });
        Assert.Equal(HttpStatusCode.BadRequest, legacyCase.StatusCode);

        var createdResponse = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/master-data/cemeteries", new
        {
            name = "Synthetischer API-Friedhof",
            code = "SYN-API",
            address = (string?)null,
            note = (string?)null,
            isActive = true,
        });
        var created = await createdResponse.Content.ReadFromJsonAsync<CemeteryMasterDataMutationResult>(JsonOptions);

        Assert.Equal(HttpStatusCode.Created, createdResponse.StatusCode);
        Assert.NotNull(created);
        Assert.Equal("\"1\"", createdResponse.Headers.ETag?.Tag);

        var missingVersion = await client.SendWithCsrfAsync(HttpMethod.Put, $"/api/master-data/cemeteries/{created.Id}", new
        {
            name = "Umbenannter synthetischer API-Friedhof",
            code = "SYN-API",
            address = (string?)null,
            note = (string?)null,
            isActive = true,
        });
        Assert.Equal((HttpStatusCode)428, missingVersion.StatusCode);

        var changed = await client.SendWithCsrfAsync(HttpMethod.Put, $"/api/master-data/cemeteries/{created.Id}", new
        {
            name = "Umbenannter synthetischer API-Friedhof",
            code = "SYN-API",
            address = (string?)null,
            note = (string?)null,
            isActive = false,
        }, "\"1\"");
        Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
        Assert.Equal("\"2\"", changed.Headers.ETag?.Tag);

        var forbiddenDelete = await client.SendWithCsrfAsync(HttpMethod.Delete, $"/api/master-data/Cemetery/{created.Id}", etag: "\"2\"");
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenDelete.StatusCode);
    }

    [Fact]
    public async Task MutationRequiresCsrfAndDuplicateIsRejectedWithoutPartialWrite()
    {
        using var client = factory.CreateClient();
        var withoutCsrf = await client.PostAsJsonAsync("/api/master-data/grave-types", new
        {
            name = "Synthetische API-Grabart",
            code = "SYN-GT",
            burialForm = "Mixed",
            note = (string?)null,
            isActive = true,
        });
        Assert.Equal(HttpStatusCode.BadRequest, withoutCsrf.StatusCode);

        var first = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/master-data/grave-types", new
        {
            name = "Synthetische API-Grabart",
            code = "SYN-GT",
            burialForm = "Mixed",
            note = (string?)null,
            isActive = true,
        });
        var duplicate = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/master-data/grave-types", new
        {
            name = " synthetische api-grabart ",
            code = "SYN-GT-2",
            burialForm = "Mixed",
            note = (string?)null,
            isActive = true,
        });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);

        var snapshot = await client.GetFromJsonAsync<CemeteryMasterDataSnapshot>("/api/master-data/cemeteries?includeInactive=true", JsonOptions);
        Assert.NotNull(snapshot);
        Assert.Single(snapshot.GraveTypes, x => x.Name == "Synthetische API-Grabart");
    }
}

public sealed class CemeteryMasterDataAdministratorEndpointTests(CemeteryMasterDataAdministratorWebApplicationFactory factory)
    : IClassFixture<CemeteryMasterDataAdministratorWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task AdministratorCanDeleteCompletelyUnusedMasterData()
    {
        using var client = factory.CreateClient();
        await client.LoginAsync();
        var create = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/master-data/cemeteries", new
        {
            name = "Synthetischer Löschfriedhof",
            code = "SYN-DELETE",
            address = (string?)null,
            note = (string?)null,
            isActive = true,
        });
        var created = await create.Content.ReadFromJsonAsync<CemeteryMasterDataMutationResult>(JsonOptions);
        Assert.NotNull(created);

        var deleted = await client.SendWithCsrfAsync(HttpMethod.Delete, $"/api/master-data/Cemetery/{created.Id}", etag: "\"1\"");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
    }
}
