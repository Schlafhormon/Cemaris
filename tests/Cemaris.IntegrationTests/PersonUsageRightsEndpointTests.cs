using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Api.Contracts;
using Cemaris.Application.PersonUsageRights;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.DependencyInjection;

namespace Cemaris.IntegrationTests;

public sealed class PersonUsageRightsEndpointTests(PersonUsageRightsWebApplicationFactory factory) : IClassFixture<PersonUsageRightsWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    [Fact]
    public async Task ApiRunsCanonicalFlowWithDuplicateConfirmationStrongEtagsAndOpenApi()
    {
        using var client = factory.CreateClient();
        var information = await client.GetFromJsonAsync<SystemInformationResponse>("/api/system/info");
        Assert.True(information?.PersonUsageRightsEditingEnabled);
        var cemetery = await CreateMasterAsync(client, "cemeteries", new { name = "Synthetischer API-5b-Friedhof", code = "SYN-API-5B", isActive = true });
        var type = await CreateMasterAsync(client, "grave-types", new { name = "Synthetische API-5b-Grabart", code = "SYN-API-5B", burialForm = "Mixed", isActive = true });
        await CreateMasterAsync(client, "cemetery-grave-types", new { cemeteryId = cemetery, graveTypeId = type, isActive = true });
        var grave = await CreateMasterAsync(client, "grave-sites", new { cemeteryId = cemetery, graveTypeId = type, graveNumber = "SYN-API-5B-1", status = "Available", isBlocked = false, isActive = true });
        var rule = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/program-configuration/usage-right-start-rules", new { cemeteryId = cemetery, code = "SYN-URKUNDE", displayName = "Synthetische Urkundenübergabe" });
        Assert.Equal(HttpStatusCode.Created, rule.StatusCode);

        var body = new { partyType = "NaturalPerson", firstName = "Synthetik", lastName = "API", organizationName = (string?)null, addresses = new[] { new { street = "Testweg", houseNumber = "1", postalCode = "00000", city = "Teststadt", additionalInformation = (string?)null, validFromInclusive = "2020-01-01", validUntilExclusive = (string?)null, isCurrentPrimary = true } } };
        var first = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/parties", body); first.EnsureSuccessStatusCode(); var firstParty = await first.Content.ReadFromJsonAsync<PartyView>(JsonOptions); Assert.NotNull(firstParty); Assert.Equal("\"1\"", first.Headers.ETag?.ToString());
        var duplicate = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/parties", body); Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode); using (var problem = JsonDocument.Parse(await duplicate.Content.ReadAsStreamAsync())) Assert.Equal("possible-party-duplicate", problem.RootElement.GetProperty("code").GetString());
        var confirmed = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/parties", new { body.partyType, body.firstName, body.lastName, body.organizationName, body.addresses, confirmPossibleDuplicate = true }); confirmed.EnsureSuccessStatusCode();

        var right = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/usage-rights", new { graveSiteId = grave, holderPartyId = firstParty!.Id, startDate = "2026-09-01", endDate = "2056-09-01", sourceReference = "SYN-REF-API" });
        Assert.Equal(HttpStatusCode.Created, right.StatusCode); var rightView = await right.Content.ReadFromJsonAsync<UsageRightView>(JsonOptions); Assert.NotNull(rightView); Assert.Equal("SYN-URKUNDE", rightView.StartRuleCodeSnapshot);
        var missing = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/usage-rights/{rightView.Id}/extensions", new { newEndDate = "2057-09-01", reason = "Synthetische Verlängerung" }); Assert.Equal((HttpStatusCode)428, missing.StatusCode);
        var extended = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/usage-rights/{rightView.Id}/extensions", new { newEndDate = "2057-09-01", reason = "Synthetische Verlängerung" }, right.Headers.ETag!.ToString()); extended.EnsureSuccessStatusCode(); Assert.Equal("\"2\"", extended.Headers.ETag?.ToString());
        var stale = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/usage-rights/{rightView.Id}/extensions", new { newEndDate = "2058-09-01", reason = "Veralteter synthetischer Versuch" }, right.Headers.ETag!.ToString()); Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);

        using var openApi = JsonDocument.Parse(await client.GetStreamAsync("/openapi/v1.json"));
        var paths = openApi.RootElement.GetProperty("paths"); Assert.True(paths.TryGetProperty("/api/parties", out _)); Assert.True(paths.TryGetProperty("/api/usage-rights/{usageRightId}/transfers", out _)); Assert.True(paths.TryGetProperty("/api/program-configuration/usage-right-start-rules/{ruleId}", out _)); Assert.Contains("If-Match", openApi.RootElement.GetRawText(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task DirectoryUsesDefaultsFiltersStableFollowingPagesAndKeepsLegacyArraySearch()
    {
        using var client = factory.CreateClient();
        for (var index = 11; index >= 0; index--)
        {
            var addresses = new[] { new { street = $"Verzeichnisweg {index:00}", houseNumber = "1", postalCode = "00000", city = "Teststadt", additionalInformation = (string?)null, validFromInclusive = "2020-01-01", validUntilExclusive = (string?)null, isCurrentPrimary = index == 0 } };
            var response = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/parties", new
            {
                partyType = "Organization",
                firstName = (string?)null,
                lastName = (string?)null,
                organizationName = $"SYN-DIR-API-{index:00}",
                addresses,
            });
            response.EnsureSuccessStatusCode();
        }

        var defaults = await client.GetFromJsonAsync<PartyDirectoryPage>("/api/parties/directory", JsonOptions);
        Assert.NotNull(defaults);
        Assert.Equal(1, defaults.Page);
        Assert.Equal(10, defaults.PageSize);
        Assert.True(defaults.TotalMatches >= 12);

        var first = await client.GetFromJsonAsync<PartyDirectoryPage>("/api/parties/directory?query=%20SYN-DIR-API%20&page=1&pageSize=10", JsonOptions);
        var repeated = await client.GetFromJsonAsync<PartyDirectoryPage>("/api/parties/directory?query=SYN-DIR-API&page=1&pageSize=10", JsonOptions);
        var second = await client.GetFromJsonAsync<PartyDirectoryPage>("/api/parties/directory?query=SYN-DIR-API&page=2&pageSize=10", JsonOptions);
        Assert.NotNull(first);
        Assert.NotNull(repeated);
        Assert.NotNull(second);
        Assert.Equal(12, first.TotalMatches);
        Assert.Equal(2, first.TotalPages);
        Assert.Equal(10, first.Items.Count);
        Assert.Equal(first.Items.Select(x => x.Id), repeated.Items.Select(x => x.Id));
        Assert.Equal(2, second.Items.Count);
        Assert.Empty(first.Items.Select(x => x.Id).Intersect(second.Items.Select(x => x.Id)));
        Assert.Equal("SYN-DIR-API-00", first.Items[0].DisplayName);
        Assert.Equal("Verzeichnisweg 00 1, 00000 Teststadt", first.Items[0].CurrentPrimaryAddress);

        using var legacy = await client.GetAsync("/api/parties?query=SYN-DIR-API");
        legacy.EnsureSuccessStatusCode();
        using var legacyJson = JsonDocument.Parse(await legacy.Content.ReadAsStreamAsync());
        Assert.Equal(JsonValueKind.Array, legacyJson.RootElement.ValueKind);
        Assert.Equal(12, legacyJson.RootElement.GetArrayLength());

        using var openApi = JsonDocument.Parse(await client.GetStreamAsync("/openapi/v1.json"));
        var directoryOperation = openApi.RootElement.GetProperty("paths").GetProperty("/api/parties/directory").GetProperty("get");
        Assert.True(directoryOperation.GetProperty("responses").TryGetProperty("400", out _));
    }

    [Theory]
    [InlineData("/api/parties/directory?query=x")]
    [InlineData("/api/parties/directory?page=0")]
    [InlineData("/api/parties/directory?pageSize=51")]
    [InlineData("/api/parties/directory?page=2147483647&pageSize=50")]
    public async Task DirectoryReturnsStructuredValidationProblems(string path)
    {
        using var client = factory.CreateClient();
        using var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
        Assert.Equal("https://tools.ietf.org/html/rfc9110#section-15.5.1", problem.RootElement.GetProperty("type").GetString());
        Assert.Equal(JsonValueKind.Object, problem.RootElement.GetProperty("errors").ValueKind);
    }

    [Fact]
    public async Task DirectoryUsesTheExistingPolicyAndCapabilityBoundary()
    {
        using var caseWorkerFactory = factory.WithWebHostBuilder(TestIdentity.ConfigureAutomaticCaseWorker);
        using var caseWorker = caseWorkerFactory.CreateClient();
        using var allowed = await caseWorker.GetAsync("/api/parties/directory");
        Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);

        using var anonymousFactory = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            services.Configure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultForbidScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })));
        using var anonymous = anonymousFactory.CreateClient();
        using var unauthorized = await anonymous.GetAsync("/api/parties/directory");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);

        using var disabledFactory = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("Features:PersonUsageRightsEditingEnabled", "false"));
        using var disabled = disabledFactory.CreateClient();
        using var unavailable = await disabled.GetAsync("/api/parties/directory");
        Assert.Equal(HttpStatusCode.NotFound, unavailable.StatusCode);
    }

    private static async Task<Guid> CreateMasterAsync(HttpClient client, string route, object body)
    {
        var response = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/master-data/{route}", body); response.EnsureSuccessStatusCode(); using var result = JsonDocument.Parse(await response.Content.ReadAsStreamAsync()); return result.RootElement.GetProperty("id").GetGuid();
    }
}
