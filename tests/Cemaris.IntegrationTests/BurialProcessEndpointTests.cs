using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Api.Contracts;
using Cemaris.Application.Cemeteries;
using Cemaris.Domain.Cases;
using Cemaris.Domain.Cemeteries;

namespace Cemaris.IntegrationTests;

public sealed class BurialProcessEndpointTests(BurialProcessWebApplicationFactory factory)
    : IClassFixture<BurialProcessWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task ProcessRunsEndToEndWithDuplicateWarningEtagsAndMonotonicGraveStatus()
    {
        using var client = factory.CreateClient();
        var siteId = await CreateAvailableGraveSiteAsync(client);
        var caseId = Guid.Parse("00000000-0000-0000-0000-000000000003");

        var information = await client.GetFromJsonAsync<SystemInformationResponse>("/api/system/info");
        Assert.NotNull(information);
        Assert.True(information.BurialProcessEditingEnabled);
        Assert.False(information.CaseEditingEnabled);

        var duplicate = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{caseId}/deceased-persons", new
        {
            firstName = " testvorname-03 ",
            lastName = "SYNTHETISCHE-PERSON-03",
            birthDate = "1943-01-01",
            deathDate = "2023-02-01",
        }, "\"1\"");
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        using (var problem = JsonDocument.Parse(await duplicate.Content.ReadAsStreamAsync()))
        {
            Assert.Equal("possible-deceased-duplicate", problem.RootElement.GetProperty("code").GetString());
            Assert.Single(problem.RootElement.GetProperty("candidates").EnumerateArray());
        }

        var unchanged = await client.GetFromJsonAsync<CaseResponse>($"/api/cases/{caseId}");
        Assert.NotNull(unchanged);
        Assert.Equal(1, unchanged.Version);

        var confirmedDuplicate = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{caseId}/deceased-persons", new
        {
            firstName = "testvorname-03",
            lastName = "synthetische-person-03",
            birthDate = "1943-01-01",
            deathDate = "2023-02-01",
            confirmPossibleDuplicate = true,
        }, "\"1\"");
        var withPerson = await ReadCaseAsync(confirmedDuplicate);
        var person = withPerson.DeceasedPersons[^1];

        var created = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{caseId}/burials", new
        {
            deceasedPersonId = person.Id,
            graveSiteId = siteId,
        }, Etag(confirmedDuplicate));
        var draft = await ReadCaseAsync(created);
        var burial = draft.Burials.Single(item => item.Status == BurialProcessStatus.Draft);

        var planned = await TransitionAsync(client, caseId, burial.Id, Etag(created), "Planned", "2026-08-14", null);
        var confirmed = await TransitionAsync(client, caseId, burial.Id, Etag(planned), "Confirmed", null, null);
        Assert.Equal(GraveSiteStatus.Reserved, await GraveStatusAsync(client, siteId));

        var backToPlanned = await TransitionAsync(client, caseId, burial.Id, Etag(confirmed), "Planned", null, null);
        Assert.Equal(GraveSiteStatus.Reserved, await GraveStatusAsync(client, siteId));
        var reconfirmed = await TransitionAsync(client, caseId, burial.Id, Etag(backToPlanned), "Confirmed", null, null);
        var performed = await TransitionAsync(client, caseId, burial.Id, Etag(reconfirmed), "Performed", null, "2026-08-13");
        Assert.Equal(GraveSiteStatus.Occupied, await GraveStatusAsync(client, siteId));
        var completed = await TransitionAsync(client, caseId, burial.Id, Etag(performed), "Completed", null, null);
        var reopened = await TransitionAsync(client, caseId, burial.Id, Etag(completed), "Performed", null, null);
        var final = await ReadCaseAsync(reopened);
        Assert.Equal(BurialProcessStatus.Performed, final.Burials.Single(item => item.Id == burial.Id).Status);
        Assert.Equal(new DateOnly(2026, 8, 13), final.Burials.Single(item => item.Id == burial.Id).BurialDate);
        Assert.Equal(GraveSiteStatus.Occupied, await GraveStatusAsync(client, siteId));

        var second = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{caseId}/burials", new
        {
            deceasedPersonId = person.Id,
            graveSiteId = siteId,
        }, Etag(reopened));
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        using var secondProblem = JsonDocument.Parse(await second.Content.ReadAsStreamAsync());
        Assert.Equal("deceased-person-already-has-burial", secondProblem.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task OpenApiContainsOnlyProcessMutationPathWhenCapabilityIsEnabled()
    {
        using var client = factory.CreateClient();
        using var document = JsonDocument.Parse(await client.GetStreamAsync("/openapi/v1.json"));
        var paths = document.RootElement.GetProperty("paths");
        Assert.True(paths.TryGetProperty("/api/cases/{caseId}/burials/{burialId}/transitions", out _));
        Assert.True(paths.TryGetProperty("/api/cases/{caseId}/burials/{burialId}/adopt", out _));
        Assert.True(paths.TryGetProperty("/api/burial-process/master-data", out _));
        Assert.False(paths.TryGetProperty("/api/cases", out _));
        Assert.Contains("CemarisCookie", document.RootElement.GetRawText(), StringComparison.Ordinal);
    }

    private static async Task<Guid> CreateAvailableGraveSiteAsync(HttpClient client)
    {
        var cemetery = await CreateMasterAsync(client, "cemeteries", new { name = "Synthetischer 4b-Friedhof", code = "S4B", isActive = true });
        var graveType = await CreateMasterAsync(client, "grave-types", new { name = "Synthetische 4b-Grabart", code = "S4B", burialForm = "Mixed", isActive = true });
        await CreateMasterAsync(client, "cemetery-grave-types", new { cemeteryId = cemetery, graveTypeId = graveType, isActive = true });
        return await CreateMasterAsync(client, "grave-sites", new { cemeteryId = cemetery, graveTypeId = graveType, graveNumber = "SYN-4B-1", status = "Available", isBlocked = false, isActive = true });
    }

    private static async Task<Guid> CreateMasterAsync(HttpClient client, string route, object body)
    {
        var response = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/master-data/{route}", body);
        response.EnsureSuccessStatusCode();
        using var result = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
        return result.RootElement.GetProperty("id").GetGuid();
    }

    private static Task<HttpResponseMessage> TransitionAsync(HttpClient client, Guid caseId, Guid burialId, string etag, string targetStatus, string? planningDate, string? actualBurialDate) =>
        client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{caseId}/burials/{burialId}/transitions", new { targetStatus, planningDate, actualBurialDate }, etag);

    private static async Task<GraveSiteStatus> GraveStatusAsync(HttpClient client, Guid siteId)
    {
        var data = await client.GetFromJsonAsync<CemeteryMasterDataSnapshot>("/api/burial-process/master-data", JsonOptions);
        return data?.GraveSites.Single(item => item.Id == siteId).Status ?? throw new Xunit.Sdk.XunitException("Grabstelle fehlt.");
    }

    private static async Task<CaseResponse> ReadCaseAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<CaseResponse>(JsonOptions) ?? throw new Xunit.Sdk.XunitException("Fallantwort fehlt.");
    }

    private static string Etag(HttpResponseMessage response) => response.Headers.ETag?.ToString() ?? throw new Xunit.Sdk.XunitException("ETag fehlt.");
}
