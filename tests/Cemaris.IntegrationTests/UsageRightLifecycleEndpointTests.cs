using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Api.Contracts;
using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Application.PersonUsageRights;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Cemaris.IntegrationTests;

public sealed class UsageRightLifecycleEndpointTests
{
    internal static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    [Theory]
    [InlineData("test-admin", TestIdentity.AdministratorPassword)]
    [InlineData("test-sach", TestIdentity.CaseWorkerPassword)]
    public async Task CookieRollenCsrfEtagsBinderUndAlleOperationen(string username, string password)
    {
        await using var factory = new UsageRightLifecycleWebApplicationFactory();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var service = new PersonUsageRightService(scope.ServiceProvider.GetRequiredService<IPersonUsageRightStore>(), new UsageRightLifecycleContractTests.Actor(), new UsageRightLifecycleContractTests.Clock());
        var setup = await UsageRightLifecycleContractTests.Setup(scope.ServiceProvider.GetRequiredService<ICemeteryMasterDataStore>(), service);
        var path = $"/api/usage-rights/{setup.Right.Id}";
        var body = new { terminationDate = "2026-09-02", kind = "Returned", reason = "SYN-HTTP", sourceReference = "SYN-Quelle", manualReviewConfirmed = true };
        foreach (var route in new[] { "terminations", "termination-reversals", "successors", "sequence-corrections" })
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync(path + "/" + route, body)).StatusCode);
        await client.LoginAsync(username, password);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(path + "/terminations", body)).StatusCode);
        foreach (var (etag, expected) in new[] { ((string?)null, 428), ("W/\"1\"", 400), ("*", 400), ("\"0\"", 400), ("\"99\"", 412), ("\"9223372036854775807\"", 412) })
            Assert.Equal(expected, (int)(await client.SendWithCsrfAsync(HttpMethod.Post, path + "/terminations", body, etag)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendWithCsrfAsync(HttpMethod.Post, path + "/terminations", new { terminationDate = "invalid" }, "\"1\"")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendWithCsrfAsync(HttpMethod.Post, path + "/terminations", new { body.terminationDate, body.kind, body.reason, body.sourceReference, manualReviewConfirmed = false }, "\"1\"")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/usage-rights/{Guid.NewGuid()}/terminations", body, "\"1\"")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendWithCsrfAsync(HttpMethod.Post, path + "/terminations", new { body.terminationDate, body.reason, body.sourceReference, body.manualReviewConfirmed }, "\"1\"")).StatusCode);
        var end = await Mutate(client, path + "/terminations", body, "\"1\"");
        Assert.Equal(HttpStatusCode.Conflict, (await client.SendWithCsrfAsync(HttpMethod.Post, path + "/extensions", new { newEndDate = "2060-01-01", reason = "SYN" }, end.ETag)).StatusCode);
        var reverse = await Mutate(client, path + "/termination-reversals", new { reason = "SYN-Rücknahme" }, end.ETag);
        end = await Mutate(client, path + "/terminations", body, reverse.ETag);
        Assert.Equal(HttpStatusCode.NotFound, (await client.SendWithCsrfAsync(HttpMethod.Post, path + "/successors", new { holderPartyId = Guid.NewGuid(), startDate = "2026-09-02", endDate = "2056-09-02", sourceReference = "SYN", reason = "SYN", manualReviewConfirmed = true }, end.ETag)).StatusCode);
        var b = await Mutate(client, path + "/successors", new { holderPartyId = setup.Party, startDate = "2026-09-02", endDate = "2056-09-02", sourceReference = "SYN", reason = "SYN", manualReviewConfirmed = true }, end.ETag, 201);
        var sequence = (await client.GetFromJsonAsync<UsageRightListItem[]>(path + "/sequence", Json))!;
        var correction = new { reason = "SYN-Korrektur", confirmSequenceCorrection = true, members = sequence.Select(x => new { x.Id, x.Version }).ToArray() };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendWithCsrfAsync(HttpMethod.Post, path + "/sequence-corrections", new { correction.reason, confirmSequenceCorrection = false, correction.members }, $"\"{sequence[0].Version}\"")).StatusCode);
        Assert.Equal(HttpStatusCode.PreconditionFailed, (await client.SendWithCsrfAsync(HttpMethod.Post, path + "/sequence-corrections", new { correction.reason, correction.confirmSequenceCorrection, members = new[] { new { Id = Guid.NewGuid(), Version = 1L } } }, $"\"{sequence[0].Version}\"")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendWithCsrfAsync(HttpMethod.Post, path + "/sequence-corrections", new { correction.reason, correction.confirmSequenceCorrection, members = new object?[] { null } }, $"\"{sequence[0].Version}\"")).StatusCode);
        var reopened = await Mutate(client, path + "/sequence-corrections", correction, $"\"{sequence[0].Version}\"");
        Assert.Equal(Domain.UsageRights.UsageRightStatus.Open, reopened.View.Status);
        var historical = (await client.GetFromJsonAsync<UsageRightView>($"/api/usage-rights/{b.View.Id}", Json))!;
        Assert.Equal(Domain.UsageRights.UsageRightStatus.Voided, historical.Status);
        var info = (await client.GetFromJsonAsync<SystemInformationResponse>("/api/system/info"))!;
        Assert.True(info.UsageRightLifecycleEnabled); Assert.False(info.NoticeGenerationEnabled);
        using var api = JsonDocument.Parse(await client.GetStringAsync("/openapi/v1.json"));
        Assert.True(api.RootElement.GetProperty("paths").TryGetProperty("/api/usage-rights/{id}/sequence-corrections", out _));
        (await client.SendWithCsrfAsync(HttpMethod.Post, "/api/auth/logout")).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path)).StatusCode);
    }

    [Fact]
    public async Task DeaktivierungUndDevelopmentAbhaengigkeit()
    {
        await using var factory = new UsageRightLifecycleWebApplicationFactory();
        using var disabled = factory.WithWebHostBuilder(builder => builder.UseSetting("IntegrationTests:Overrides:Features:UsageRightLifecycleEnabled", "false"));
        using var client = disabled.CreateClient();
        Assert.False((await client.GetFromJsonAsync<SystemInformationResponse>("/api/system/info"))!.UsageRightLifecycleEnabled);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync($"/api/usage-rights/{Guid.NewGuid()}/terminations", new { })).StatusCode);
        using var wrongEnvironment = factory.WithWebHostBuilder(builder => builder.UseEnvironment("Production"));
        Assert.Throws<InvalidOperationException>(() => wrongEnvironment.CreateClient());
        using var missingDependency = factory.WithWebHostBuilder(builder => builder.UseSetting("IntegrationTests:Overrides:Features:PersonUsageRightsEditingEnabled", "false"));
        Assert.Throws<InvalidOperationException>(() => missingDependency.CreateClient());
    }

    [Fact]
    public async Task RolleUndPasswortwechselpflichtSperrenAlleNeuenMutationen()
    {
        await using var factory = new UsageRightLifecycleWebApplicationFactory();
        using var admin = factory.CreateClient();
        await admin.LoginAsync();
        var accounts = (await admin.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts"))!;
        var worker = Assert.Single(accounts, x => x.Id == TestIdentity.CaseWorkerId);
        (await admin.SendWithCsrfAsync(HttpMethod.Post, $"/api/admin/accounts/{worker.Id}/reset-password", new { temporaryPassword = TestIdentity.CaseWorkerPassword, version = worker.Version })).EnsureSuccessStatusCode();
        using var restricted = factory.CreateClient();
        await restricted.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
        using var noRoleFactory = factory.WithWebHostBuilder(b => b.ConfigureServices(s => s.AddTransient<Microsoft.AspNetCore.Authentication.IClaimsTransformation, RemoveRole>()));
        using var noRole = noRoleFactory.CreateClient();
        await noRole.LoginAsync();
        foreach (var client in new[] { restricted, noRole })
            foreach (var route in new[] { "terminations", "termination-reversals", "successors", "sequence-corrections" })
                Assert.Equal(HttpStatusCode.Forbidden, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/usage-rights/{Guid.NewGuid()}/{route}", new { }, "\"1\"")).StatusCode);
    }

    private sealed class RemoveRole : Microsoft.AspNetCore.Authentication.IClaimsTransformation
    {
        public Task<System.Security.Claims.ClaimsPrincipal> TransformAsync(System.Security.Claims.ClaimsPrincipal principal)
        {
            var copy = principal.Clone();
            foreach (var identity in copy.Identities)
                foreach (var claim in identity.FindAll(System.Security.Claims.ClaimTypes.Role).ToArray()) identity.RemoveClaim(claim);
            return Task.FromResult(copy);
        }
    }

    private static async Task<(UsageRightView View, string ETag)> Mutate(HttpClient client, string path, object body, string etag, int status = 200)
    {
        using var response = await client.SendWithCsrfAsync(HttpMethod.Post, path, body, etag);
        Assert.Equal(status, (int)response.StatusCode);
        var view = (await response.Content.ReadFromJsonAsync<UsageRightView>(Json))!;
        Assert.Equal($"\"{view.Version}\"", response.Headers.ETag!.ToString());
        return (view, response.Headers.ETag.ToString());
    }
}
