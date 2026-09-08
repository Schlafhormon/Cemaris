using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Api.Contracts;
using Cemaris.Application.CaseFollowUps;
using Cemaris.Domain.CaseFollowUps;
using Cemaris.Infrastructure.CaseFollowUps;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Cemaris.IntegrationTests;

public sealed class CaseFollowUpEndpointTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    private static readonly Guid CaseId = SyntheticCaseFollowUpStoreTests.CaseId;
    private static readonly Guid OtherCaseId = SyntheticCaseFollowUpStoreTests.OtherCaseId;

    [Theory]
    [InlineData("test-admin", TestIdentity.AdministratorPassword)]
    [InlineData("test-sach", TestIdentity.CaseWorkerPassword)]
    public async Task BeideRollenBearbeitenMitCookiesCsrfEtagUndHistorie(string username, string password)
    {
        await using var factory = new CaseFollowUpWebApplicationFactory();
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/case-follow-ups")).StatusCode);
        await client.LoginAsync(username, password);
        var before = await client.GetStringAsync($"/api/cases/{CaseId}");
        var info = await client.GetFromJsonAsync<SystemInformationResponse>("/api/system/info");
        Assert.True(info!.CaseFollowUpsEnabled); Assert.False(info.NoticeGenerationEnabled); Assert.False(info.NoticeDraftEditingEnabled);
        var created = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/follow-ups", Input());
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal("\"1\"", created.Headers.ETag!.ToString());
        var view = (await created.Content.ReadFromJsonAsync<CaseFollowUpView>(Json))!;
        var id = view.State.Id;
        Assert.Equal(CaseId, view.State.CaseId); Assert.Equal("Titel", view.State.Title);
        Assert.Null(view.State.Description); Assert.Equal(new DateOnly(2024, 2, 29), view.State.DueDate);
        Assert.Equal(CaseFollowUpStatus.Open, view.State.Status); Assert.Single(view.Revisions);
        Assert.Contains($"caseId={CaseId}", created.Headers.Location!.ToString(), StringComparison.Ordinal);
        var path = $"/api/case-follow-ups/{id}";
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"{path}?caseId={OtherCaseId}")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync(path)).StatusCode);
        var missingReason = await client.SendWithCsrfAsync(HttpMethod.Put, $"{path}?caseId={CaseId}", Input("Neu", " "), "\"1\"");
        Assert.Equal(HttpStatusCode.BadRequest, missingReason.StatusCode);
        var same = await client.SendWithCsrfAsync(HttpMethod.Put, $"{path}?caseId={CaseId}", Input(reason: "Unverändert"), "\"1\"");
        Assert.Equal(HttpStatusCode.BadRequest, same.StatusCode);
        foreach (var (etag, expected) in new[] { ((string?)null, 428), ("W/\"1\"", 428), ("*", 400), ("\"1\",\"2\"", 400), ("\"99\"", 412) })
        {
            var rejected = await client.SendWithCsrfAsync(HttpMethod.Put, $"{path}?caseId={CaseId}", Input("Neu", "Test"), etag);
            Assert.Equal(expected, (int)rejected.StatusCode);
        }
        Assert.Equal(HttpStatusCode.NotFound, (await client.SendWithCsrfAsync(HttpMethod.Put, $"{path}?caseId={OtherCaseId}", Input("Neu", "Test"), "\"1\"")).StatusCode);
        Assert.Equal((1, 1, 1), factory.Services.GetRequiredService<SyntheticCaseFollowUpStore>().Diagnostics);
        var changed = await client.SendWithCsrfAsync(HttpMethod.Put, $"{path}?caseId={CaseId}",
            new { title = "Verschoben", description = "Synthetischer Text", dueDate = "2026-09-10", reason = " Manuell verschoben " }, "\"1\"");
        changed.EnsureSuccessStatusCode();
        var version = 2;
        foreach (var operation in new[] { "complete", "reopen", "cancel", "reopen" })
        {
            var transition = await client.SendWithCsrfAsync(HttpMethod.Post, $"{path}/{operation}?caseId={CaseId}", new { reason = "Synthetischer Verlauf" }, $"\"{version}\"");
            transition.EnsureSuccessStatusCode();
            Assert.Equal($"\"{++version}\"", transition.Headers.ETag!.ToString());
            var invalidOperation = operation == "reopen" ? "reopen" : operation == "complete" ? "cancel" : "complete";
            Assert.Equal(HttpStatusCode.Conflict, (await client.SendWithCsrfAsync(HttpMethod.Post, $"{path}/{invalidOperation}?caseId={CaseId}", new { reason = "Unzulässig" }, $"\"{version}\"")).StatusCode);
            if (operation != "reopen") Assert.Equal(HttpStatusCode.Conflict, (await client.SendWithCsrfAsync(HttpMethod.Put, $"{path}?caseId={CaseId}", Input("Gesperrt", "Test"), $"\"{version}\"")).StatusCode);
        }
        var final = (await client.GetFromJsonAsync<CaseFollowUpView>($"{path}?caseId={CaseId}", Json))!;
        Assert.Equal(6, final.Revisions.Count);
        Assert.Equal("Manuell verschoben", final.Revisions[1].Reason);
        Assert.Equal((1, 6, 6), factory.Services.GetRequiredService<SyntheticCaseFollowUpStore>().Diagnostics);
        Assert.Equal(before, await client.GetStringAsync($"/api/cases/{CaseId}"));
        var listText = await client.GetStringAsync("/api/case-follow-ups");
        Assert.DoesNotContain("description", listText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("revisions", listText, StringComparison.OrdinalIgnoreCase);
        SyntheticCaseFollowUpStoreTests.MarkNonSynthetic(factory.Services.GetRequiredService<SyntheticCaseReadStore>());
        Assert.Equal(HttpStatusCode.Conflict, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/follow-ups", Input())).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.SendWithCsrfAsync(HttpMethod.Post, $"{path}/complete?caseId={CaseId}", new { reason = "Test" }, "\"6\"")).StatusCode);
        (await client.SendWithCsrfAsync(HttpMethod.Post, "/api/auth/logout")).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync($"{path}?caseId={CaseId}")).StatusCode);
    }

    [Fact]
    public async Task UngueltigeAngabenCsrfCapabilityUndOpenApi()
    {
        await using var factory = new CaseFollowUpWebApplicationFactory();
        using var client = factory.CreateClient(); await client.LoginAsync();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync($"/api/cases/{CaseId}/follow-ups", Input())).StatusCode);
        foreach (var query in new[] { "status=2", "status=Unknown", "status=", "status=Open&status=All", "dueUntil=2025-02-29", "dueUntil=2026-9-1", "page=0", "pageSize=11", "page=2147483647", "page=" })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync($"/api/case-follow-ups?{query}")).StatusCode);
        foreach (var date in new string?[] { null, "", "2025-02-29", "2024-02-30", "10000-01-01" })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{CaseId}/follow-ups", new { title = "Test", dueDate = date })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{Guid.NewGuid()}/follow-ups", Input())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/cases/{Guid.NewGuid()}/follow-ups")).StatusCode);
        using var openApi = JsonDocument.Parse(await client.GetStringAsync("/openapi/v1.json"));
        var paths = openApi.RootElement.GetProperty("paths");
        foreach (var route in new[] { "/api/case-follow-ups", "/api/cases/{caseId}/follow-ups", "/api/case-follow-ups/{id}", "/api/case-follow-ups/{id}/complete", "/api/case-follow-ups/{id}/cancel", "/api/case-follow-ups/{id}/reopen" })
            Assert.True(paths.TryGetProperty(route, out _));
        var responses = paths.GetProperty("/api/case-follow-ups/{id}").GetProperty("put").GetProperty("responses");
        foreach (var code in new[] { "400", "401", "403", "404", "409", "412", "428" }) Assert.True(responses.TryGetProperty(code, out _));
        Assert.DoesNotContain("CaseFollowUpAudit", openApi.RootElement.GetRawText(), StringComparison.Ordinal);
        using var disabledFactory = factory.WithWebHostBuilder(b => b.UseSetting("IntegrationTests:Overrides:Features:CaseFollowUpsEnabled", "false"));
        using var disabled = disabledFactory.CreateClient();
        Assert.False((await disabled.GetFromJsonAsync<SystemInformationResponse>("/api/system/info"))!.CaseFollowUpsEnabled);
        Assert.Equal(HttpStatusCode.NotFound, (await disabled.GetAsync("/api/case-follow-ups")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await disabled.PostAsJsonAsync($"/api/cases/{CaseId}/follow-ups", Input())).StatusCode);
        using var productionFactory = factory.WithWebHostBuilder(b => b.UseEnvironment("Production"));
        var exception = Assert.Throws<InvalidOperationException>(() => productionFactory.CreateClient());
        Assert.Contains("Development", exception.Message, StringComparison.Ordinal);
    }

    private static object Input(string title = " Titel ", string? reason = null) => new { title, description = "  ", dueDate = "2024-02-29", reason };

    [Fact]
    public async Task JedeRouteSchuetztAnmeldungRolleIdentitaetUndCsrf()
    {
        await using var factory = new CaseFollowUpWebApplicationFactory();
        var id = Guid.NewGuid();
        var routes = new[]
        {
            (HttpMethod.Get, "/api/case-follow-ups"), (HttpMethod.Get, $"/api/cases/{CaseId}/follow-ups"),
            (HttpMethod.Get, $"/api/case-follow-ups/{id}?caseId={CaseId}"),
            (HttpMethod.Post, $"/api/cases/{CaseId}/follow-ups"), (HttpMethod.Put, $"/api/case-follow-ups/{id}?caseId={CaseId}"),
            (HttpMethod.Post, $"/api/case-follow-ups/{id}/complete?caseId={CaseId}"),
            (HttpMethod.Post, $"/api/case-follow-ups/{id}/cancel?caseId={CaseId}"),
            (HttpMethod.Post, $"/api/case-follow-ups/{id}/reopen?caseId={CaseId}"),
        };
        using var anonymous = factory.CreateClient();
        foreach (var (method, path) in routes)
        {
            using var request = new HttpRequestMessage(method, path) { Content = method == HttpMethod.Get ? null : JsonContent.Create(Input(reason: "Test")) };
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.SendAsync(request)).StatusCode);
        }
        using var client = factory.CreateClient(); await client.LoginAsync();
        foreach (var (method, path) in routes.Where(x => x.Item1 != HttpMethod.Get))
        {
            using var request = new HttpRequestMessage(method, path) { Content = JsonContent.Create(Input(reason: "Test")) };
            request.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
            Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(request)).StatusCode);
        }
        using var noRoleFactory = factory.WithWebHostBuilder(b => b.ConfigureServices(s => s.AddTransient<IClaimsTransformation, RemoveRole>()));
        using var noRole = noRoleFactory.CreateClient(); await noRole.LoginAsync();
        foreach (var (method, path) in routes)
            Assert.Equal(HttpStatusCode.Forbidden, (await noRole.SendWithCsrfAsync(method, path, method == HttpMethod.Get ? null : Input(reason: "Test"), "\"1\"")).StatusCode);
        var accounts = (await client.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts"))!;
        var worker = Assert.Single(accounts, x => x.Id == TestIdentity.CaseWorkerId);
        (await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/admin/accounts/{worker.Id}/reset-password",
            new { temporaryPassword = TestIdentity.CaseWorkerPassword, version = worker.Version })).EnsureSuccessStatusCode();
        using var restricted = factory.CreateClient(); await restricted.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
        foreach (var (method, path) in routes)
            Assert.Equal(HttpStatusCode.Forbidden, (await restricted.SendWithCsrfAsync(method, path, method == HttpMethod.Get ? null : Input(reason: "Test"), "\"1\"")).StatusCode);
    }

    private sealed class RemoveRole : IClaimsTransformation
    {
        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var copy = principal.Clone();
            foreach (var identity in copy.Identities)
                foreach (var claim in identity.FindAll(ClaimTypes.Role).ToArray()) identity.RemoveClaim(claim);
            return Task.FromResult(copy);
        }
    }
}
