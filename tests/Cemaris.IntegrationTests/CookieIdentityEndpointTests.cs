using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cemaris.Api.Contracts;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.Extensions.DependencyInjection;

namespace Cemaris.IntegrationTests;

public sealed class CookieIdentityEndpointTests
{
    [Fact]
    public async Task AnonymousCaseAccessReturns401WithoutRedirectWhileHealthAndSystemStayAnonymous()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient(new() { AllowAutoRedirect = false });

        var search = await client.GetAsync("/api/search", CancellationToken.None);
        var detail = await client.GetAsync($"/api/cases/{Guid.NewGuid()}", CancellationToken.None);
        var health = await client.GetAsync("/health", CancellationToken.None);
        var system = await client.GetAsync("/api/system/info", CancellationToken.None);

        Assert.Equal(HttpStatusCode.Unauthorized, search.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, detail.StatusCode);
        Assert.Null(search.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, health.StatusCode);
        Assert.Equal(HttpStatusCode.OK, system.StatusCode);
    }

    [Fact]
    public async Task LoginRequiresValidCsrfAndUsesGenericFailure()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient(new() { AllowAutoRedirect = false });

        var missing = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { username = "test-admin", password = TestIdentity.AdministratorPassword },
            CancellationToken.None);
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenResponse>("/api/auth/csrf");
        Assert.NotNull(csrf);
        using var wrongRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/login")
        {
            Content = JsonContent.Create(new { username = "test-admin", password = TestIdentity.AdministratorPassword }),
        };
        wrongRequest.Headers.TryAddWithoutValidation(csrf.HeaderName, "wrong-token");
        var wrong = await client.SendAsync(wrongRequest, CancellationToken.None);

        using var unknownRequest = LoginRequest(csrf, "unknown-user", "Falsches-Testpasswort-2026");
        using var passwordRequest = LoginRequest(csrf, "test-admin", "Falsches-Testpasswort-2026");
        var unknown = await client.SendAsync(unknownRequest, CancellationToken.None);
        var badPassword = await client.SendAsync(passwordRequest, CancellationToken.None);
        var unknownBody = await unknown.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();
        var badBody = await badPassword.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();

        using var validRequest = LoginRequest(csrf, "  TEST-ADMIN  ", TestIdentity.AdministratorPassword);
        var valid = await client.SendAsync(validRequest, CancellationToken.None);

        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, wrong.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, badPassword.StatusCode);
        Assert.Equal(unknownBody?.Status, badBody?.Status);
        Assert.Equal(unknownBody?.Title, badBody?.Title);
        Assert.Equal(HttpStatusCode.OK, valid.StatusCode);
        Assert.Contains(valid.Headers.GetValues("Set-Cookie"), value => value.Contains("Cemaris.Session", StringComparison.Ordinal) && value.Contains("httponly", StringComparison.OrdinalIgnoreCase) && value.Contains("samesite=lax", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task FiveFailedLoginsLockAccountWithSameGenericResponse()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenResponse>("/api/auth/csrf");
        Assert.NotNull(csrf);
        for (var attempt = 0; attempt < 5; attempt++)
        {
            using var failed = LoginRequest(csrf, "test-sach", "Falsches-Passwort-2026");
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.SendAsync(failed)).StatusCode);
        }

        using var correct = LoginRequest(csrf, "test-sach", TestIdentity.CaseWorkerPassword);
        var locked = await client.SendAsync(correct);
        Assert.Equal(HttpStatusCode.Unauthorized, locked.StatusCode);
    }

    [Fact]
    public async Task LoginRateLimitDoesNotAffectHealthCheck()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenResponse>("/api/auth/csrf");
        Assert.NotNull(csrf);
        HttpResponseMessage? last = null;
        for (var attempt = 0; attempt < 11; attempt++)
        {
            using var request = LoginRequest(csrf, $"unknown-{attempt}", "Falsches-Passwort-2026");
            last?.Dispose();
            last = await client.SendAsync(request);
        }

        using (last)
        {
            Assert.NotNull(last);
            Assert.Equal(HttpStatusCode.TooManyRequests, last.StatusCode);
        }
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
    }

    [Theory]
    [InlineData("test-admin", TestIdentity.AdministratorPassword)]
    [InlineData("test-sach", TestIdentity.CaseWorkerPassword)]
    public async Task BothConfirmedRolesCanUseCaseReading(string username, string password)
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        await client.LoginAsync(username, password);

        var search = await client.GetAsync("/api/search", CancellationToken.None);
        var detail = await client.GetAsync(
            "/api/cases/00000000-0000-0000-0000-000000000001",
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, search.StatusCode);
        Assert.Equal(HttpStatusCode.OK, detail.StatusCode);
    }

    [Theory]
    [InlineData("test-admin", TestIdentity.AdministratorPassword)]
    [InlineData("test-sach", TestIdentity.CaseWorkerPassword)]
    public async Task BothConfirmedRolesCanUseAllSixCaseMutations(string username, string password)
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        await client.LoginAsync(username, password);

        var create = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/cases", new { cemetery = "Synthetischer Rollentestfriedhof" });
        var current = await create.Content.ReadFromJsonAsync<CaseResponse>();
        Assert.NotNull(current);
        var response = await client.SendWithCsrfAsync(HttpMethod.Put, $"/api/cases/{current.Id}/grave", new { cemetery = "Synthetischer Rollentestfriedhof neu" }, create.Headers.ETag!.ToString());
        var afterGrave = await response.Content.ReadFromJsonAsync<CaseResponse>();
        Assert.NotNull(afterGrave);
        response = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{current.Id}/deceased-persons", new { firstName = "Synthetische", lastName = "Rollenperson" }, response.Headers.ETag!.ToString());
        var afterPerson = await response.Content.ReadFromJsonAsync<CaseResponse>();
        var person = Assert.Single(afterPerson!.DeceasedPersons);
        response = await client.SendWithCsrfAsync(HttpMethod.Put, $"/api/cases/{current.Id}/deceased-persons/{person.Id}", new { firstName = "Synthetisch geändert", lastName = "Rollenperson" }, response.Headers.ETag!.ToString());
        response = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{current.Id}/burials", new { deceasedPersonId = person.Id, burialDate = "2026-08-13" }, response.Headers.ETag!.ToString());
        var afterBurial = await response.Content.ReadFromJsonAsync<CaseResponse>();
        var burial = Assert.Single(afterBurial!.Burials);
        response = await client.SendWithCsrfAsync(HttpMethod.Put, $"/api/cases/{current.Id}/burials/{burial.Id}", new { deceasedPersonId = person.Id, burialDate = "2026-08-14" }, response.Headers.ETag!.ToString());
        var completed = await response.Content.ReadFromJsonAsync<CaseResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(completed);
        Assert.Equal(6, completed.Version);
        var changes = factory.Services.GetRequiredService<SyntheticCaseReadStore>().GetChanges(current.Id);
        Assert.Equal(
            username == "test-admin"
                ? TestIdentity.AdministratorId.ToString("D")
                : TestIdentity.CaseWorkerId.ToString("D"),
            changes[^1].Actor.Id);
    }

    [Fact]
    public async Task CaseWorkerReceives403ForEveryUserAdministrationOperation()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient(new() { AllowAutoRedirect = false });
        await client.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
        await client.SetDefaultCsrfHeaderAsync();
        var id = TestIdentity.AdministratorId;

        var responses = new[]
        {
            await client.GetAsync("/api/admin/accounts", CancellationToken.None),
            await client.PostAsJsonAsync("/api/admin/accounts", new { username = "x", displayName = "x", role = "Sachbearbeitung", password = "Synthetisch-Neu-2026" }),
            await client.PutAsJsonAsync($"/api/admin/accounts/{id}", new { username = "x", displayName = "x", role = "Sachbearbeitung", version = "AQ==" }),
            await client.PutAsJsonAsync($"/api/admin/accounts/{id}/active", new { isActive = false, version = "AQ==" }),
            await client.PostAsJsonAsync($"/api/admin/accounts/{id}/reset-password", new { temporaryPassword = "Synthetisch-Neu-2026", version = "AQ==" }),
        };

        Assert.All(responses, response => Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode));
    }

    [Fact]
    public async Task AdministrationCanCreateUpdateDeactivateActivateAndResetAccount()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        await client.LoginAsync();
        await client.SetDefaultCsrfHeaderAsync();

        var createdResponse = await client.PostAsJsonAsync(
            "/api/admin/accounts",
            new { username = "synthetic-new", displayName = "Synthetisches neues Konto", role = "Sachbearbeitung", password = "Synthetisch-Start-2026" });
        var created = await createdResponse.Content.ReadFromJsonAsync<LocalAccountResponse>();
        Assert.NotNull(created);
        Assert.True(created.MustChangePassword);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/admin/accounts/{created.Id}",
            new { username = "synthetic-renamed", displayName = "Synthetisch umbenannt", role = "Administration", version = created.Version });
        var updated = await updateResponse.Content.ReadFromJsonAsync<LocalAccountResponse>();
        Assert.NotNull(updated);

        var deactivateResponse = await client.PutAsJsonAsync(
            $"/api/admin/accounts/{updated.Id}/active",
            new { isActive = false, version = updated.Version });
        var deactivated = await deactivateResponse.Content.ReadFromJsonAsync<LocalAccountResponse>();
        Assert.NotNull(deactivated);
        Assert.False(deactivated.IsActive);

        var activateResponse = await client.PutAsJsonAsync(
            $"/api/admin/accounts/{deactivated.Id}/active",
            new { isActive = true, version = deactivated.Version });
        var activated = await activateResponse.Content.ReadFromJsonAsync<LocalAccountResponse>();
        Assert.NotNull(activated);

        var resetResponse = await client.PostAsJsonAsync(
            $"/api/admin/accounts/{activated.Id}/reset-password",
            new { temporaryPassword = "Synthetisch-Reset-2026", version = activated.Version });
        var reset = await resetResponse.Content.ReadFromJsonAsync<LocalAccountResponse>();

        Assert.Equal(HttpStatusCode.Created, createdResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Equal("Administration", updated.Role);
        Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);
        Assert.NotNull(reset);
        Assert.True(reset.MustChangePassword);
    }

    [Fact]
    public async Task DeactivationInvalidatesExistingCookieOnNextRequest()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var worker = factory.CreateClient(new() { AllowAutoRedirect = false });
        using var administrator = factory.CreateClient(new() { AllowAutoRedirect = false });
        await worker.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
        await administrator.LoginAsync();
        await administrator.SetDefaultCsrfHeaderAsync();
        var accounts = await administrator.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts");
        var workerAccount = Assert.Single(accounts!, item => item.Id == TestIdentity.CaseWorkerId);

        var changed = await administrator.PutAsJsonAsync(
            $"/api/admin/accounts/{workerAccount.Id}/active",
            new { isActive = false, version = workerAccount.Version });
        var rejected = await worker.GetAsync("/api/search", CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, rejected.StatusCode);
    }

    [Fact]
    public async Task RoleAndPasswordChangesInvalidateExistingCookieOnNextRequest()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var worker = factory.CreateClient(new() { AllowAutoRedirect = false });
        using var administrator = factory.CreateClient(new() { AllowAutoRedirect = false });
        await worker.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
        await administrator.LoginAsync();
        await administrator.SetDefaultCsrfHeaderAsync();
        var accounts = await administrator.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts");
        var workerAccount = Assert.Single(accounts!, item => item.Id == TestIdentity.CaseWorkerId);

        var roleResponse = await administrator.PutAsJsonAsync(
            $"/api/admin/accounts/{workerAccount.Id}",
            new { username = workerAccount.Username, displayName = workerAccount.DisplayName, role = "Administration", version = workerAccount.Version });
        var roleChanged = await roleResponse.Content.ReadFromJsonAsync<LocalAccountResponse>();
        Assert.NotNull(roleChanged);
        Assert.Equal(HttpStatusCode.Unauthorized, (await worker.GetAsync("/api/search")).StatusCode);

        await worker.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
        var refreshedAccounts = await administrator.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts");
        roleChanged = Assert.Single(refreshedAccounts!, item => item.Id == workerAccount.Id);
        var resetResponse = await administrator.PostAsJsonAsync(
            $"/api/admin/accounts/{workerAccount.Id}/reset-password",
            new { temporaryPassword = "Synthetisch-Neu-2026", version = roleChanged.Version });
        Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await worker.GetAsync("/api/search")).StatusCode);
    }

    [Fact]
    public async Task TemporaryPasswordRequiresChangeBeforeCaseWork()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var administrator = factory.CreateClient();
        using var accountClient = factory.CreateClient(new() { AllowAutoRedirect = false });
        await administrator.LoginAsync();
        await administrator.SetDefaultCsrfHeaderAsync();
        var accounts = await administrator.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts");
        var worker = Assert.Single(accounts!, item => item.Id == TestIdentity.CaseWorkerId);
        var reset = await administrator.PostAsJsonAsync(
            $"/api/admin/accounts/{worker.Id}/reset-password",
            new { temporaryPassword = "Synthetisch-Temp-2026", version = worker.Version });
        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);

        await accountClient.LoginAsync("test-sach", "Synthetisch-Temp-2026");
        var me = await accountClient.GetFromJsonAsync<CurrentAccountResponse>("/api/auth/me");
        var forbidden = await accountClient.GetAsync("/api/search", CancellationToken.None);
        await accountClient.SetDefaultCsrfHeaderAsync();
        var changed = await accountClient.PostAsJsonAsync(
            "/api/auth/change-password",
            new { currentPassword = "Synthetisch-Temp-2026", newPassword = "Synthetisch-Dauerhaft-2026" });

        Assert.NotNull(me);
        Assert.True(me.MustChangePassword);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, changed.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await accountClient.GetAsync("/api/auth/me")).StatusCode);
        await accountClient.LoginAsync("test-sach", "Synthetisch-Dauerhaft-2026");
        Assert.Equal(HttpStatusCode.OK, (await accountClient.GetAsync("/api/search")).StatusCode);
    }

    [Fact]
    public async Task LastAdministratorAndSelfDeactivationAreProtected()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        await client.LoginAsync();
        await client.SetDefaultCsrfHeaderAsync();
        var accounts = await client.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts");
        var administrator = Assert.Single(accounts!, item => item.Id == TestIdentity.AdministratorId);

        var demotion = await client.PutAsJsonAsync(
            $"/api/admin/accounts/{administrator.Id}",
            new { username = administrator.Username, displayName = administrator.DisplayName, role = "Sachbearbeitung", version = administrator.Version });
        var deactivation = await client.PutAsJsonAsync(
            $"/api/admin/accounts/{administrator.Id}/active",
            new { isActive = false, version = administrator.Version });

        Assert.Equal(HttpStatusCode.Conflict, demotion.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, deactivation.StatusCode);
    }

    [Fact]
    public async Task ClientIdentityHeadersCannotReplaceAuthenticatedAuditActor()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        await client.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenResponse>("/api/auth/csrf");
        Assert.NotNull(csrf);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/cases")
        {
            Content = JsonContent.Create(new { cemetery = "Synthetischer Identitätsheader-Testfriedhof" }),
        };
        request.Headers.TryAddWithoutValidation(csrf.HeaderName, csrf.RequestToken);
        request.Headers.TryAddWithoutValidation("X-Actor-Id", Guid.NewGuid().ToString("D"));
        request.Headers.TryAddWithoutValidation("X-Actor-Name", "Manipulierter Akteur");
        var response = await client.SendAsync(request, CancellationToken.None);
        var created = await response.Content.ReadFromJsonAsync<CaseResponse>();
        Assert.NotNull(created);

        var changes = factory.Services.GetRequiredService<SyntheticCaseReadStore>().GetChanges(created.Id);
        var change = Assert.Single(changes);
        Assert.Equal(TestIdentity.CaseWorkerId.ToString("D"), change.Actor.Id);
        Assert.Equal("Synthetische Testsachbearbeitung", change.Actor.DisplayName);
    }

    [Fact]
    public async Task MissingCsrfRejectsAllSixCaseMutationsWithoutStateChange()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        await client.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
        var createdResponse = await client.SendWithCsrfAsync(HttpMethod.Post, "/api/cases", new { cemetery = "Synthetischer CSRF-Testfriedhof" });
        var created = await createdResponse.Content.ReadFromJsonAsync<CaseResponse>();
        Assert.NotNull(created);

        var paths = new (HttpMethod Method, string Path, object Body)[]
        {
            (HttpMethod.Post, "/api/cases", new { cemetery = "Nicht gespeichert" }),
            (HttpMethod.Put, $"/api/cases/{created.Id}/grave", new { cemetery = "Nicht gespeichert" }),
            (HttpMethod.Post, $"/api/cases/{created.Id}/deceased-persons", new { firstName = "Nicht", lastName = "gespeichert" }),
            (HttpMethod.Put, $"/api/cases/{created.Id}/deceased-persons/{Guid.NewGuid()}", new { firstName = "Nicht", lastName = "gespeichert" }),
            (HttpMethod.Post, $"/api/cases/{created.Id}/burials", new { burialDate = "2026-08-13" }),
            (HttpMethod.Put, $"/api/cases/{created.Id}/burials/{Guid.NewGuid()}", new { burialDate = "2026-08-13" }),
        };
        foreach (var item in paths)
        {
            using var request = new HttpRequestMessage(item.Method, item.Path) { Content = JsonContent.Create(item.Body) };
            request.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
            var response = await client.SendAsync(request, CancellationToken.None);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        var detail = await client.GetFromJsonAsync<CaseResponse>($"/api/cases/{created.Id}");
        Assert.NotNull(detail);
        Assert.Equal(1, detail.Version);
        Assert.Single(factory.Services.GetRequiredService<SyntheticCaseReadStore>().GetChanges(created.Id));
    }

    [Fact]
    public async Task MissingCsrfRejectsLogoutPasswordAndEveryAdministrativeMutation()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        await client.LoginAsync();
        var accounts = await client.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts");
        var worker = Assert.Single(accounts!, item => item.Id == TestIdentity.CaseWorkerId);
        var requests = new[]
        {
            new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout"),
            new HttpRequestMessage(HttpMethod.Post, "/api/auth/change-password") { Content = JsonContent.Create(new { currentPassword = TestIdentity.AdministratorPassword, newPassword = "Nicht-Speichern-2026" }) },
            new HttpRequestMessage(HttpMethod.Post, "/api/admin/accounts") { Content = JsonContent.Create(new { username = "no-csrf", displayName = "Nicht speichern", role = "Sachbearbeitung", password = "Nicht-Speichern-2026" }) },
            new HttpRequestMessage(HttpMethod.Put, $"/api/admin/accounts/{worker.Id}") { Content = JsonContent.Create(new { username = worker.Username, displayName = "Nicht speichern", role = worker.Role, version = worker.Version }) },
            new HttpRequestMessage(HttpMethod.Put, $"/api/admin/accounts/{worker.Id}/active") { Content = JsonContent.Create(new { isActive = false, version = worker.Version }) },
            new HttpRequestMessage(HttpMethod.Post, $"/api/admin/accounts/{worker.Id}/reset-password") { Content = JsonContent.Create(new { temporaryPassword = "Nicht-Speichern-2026", version = worker.Version }) },
        };

        foreach (var request in requests)
        {
            using (request)
            {
                Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(request)).StatusCode);
            }
        }

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/me")).StatusCode);
        var unchanged = await client.GetFromJsonAsync<LocalAccountResponse[]>("/api/admin/accounts");
        Assert.Equal(worker, Assert.Single(unchanged!, item => item.Id == worker.Id));
    }

    [Fact]
    public async Task OpenApiDocumentsIdentityStatusAndOmitsSecretFields()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/openapi/v1.json", CancellationToken.None);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
        var raw = document.RootElement.GetRawText();

        Assert.Contains("/api/auth/login", raw, StringComparison.Ordinal);
        Assert.Contains("/api/admin/accounts", raw, StringComparison.Ordinal);
        Assert.Contains("401", raw, StringComparison.Ordinal);
        Assert.Contains("403", raw, StringComparison.Ordinal);
        Assert.Contains("X-Cemaris-CSRF", raw, StringComparison.Ordinal);
        Assert.Contains("CemarisCookie", raw, StringComparison.Ordinal);
        Assert.DoesNotContain("passwordHash", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("securityStamp", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("lockoutEnd", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SecurityLogsUseStableEventIdsWithoutPasswordsOrCookies()
    {
        await using var factory = new CookieIdentityWebApplicationFactory();
        using var client = factory.CreateClient();
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenResponse>("/api/auth/csrf");
        Assert.NotNull(csrf);
        using var failedRequest = LoginRequest(csrf, "test-admin", "Nicht-Protokollieren-2026");
        await client.SendAsync(failedRequest, CancellationToken.None);
        await client.LoginAsync();
        await client.SetDefaultCsrfHeaderAsync();
        await client.PostAsJsonAsync(
            "/api/admin/accounts",
            new { username = "log-test", displayName = "Synthetisches Logtestkonto", role = "Sachbearbeitung", password = "Ebenfalls-Nicht-Loggen-2026" });
        await client.PutAsJsonAsync(
            $"/api/admin/accounts/{TestIdentity.CaseWorkerId}",
            new { username = "test-sach", displayName = "Nicht protokollieren", role = "Sachbearbeitung", version = "ungültig" });

        var entries = factory.Logs.Entries;
        Assert.Contains(entries, item => item.EventId == 2002);
        Assert.Contains(entries, item => item.EventId == 2001);
        Assert.Contains(entries, item => item.EventId == 2010);
        var combined = string.Join(" | ", entries.Select(item => item.Message));
        Assert.Contains(nameof(Cemaris.Application.Identity.LocalAccountOperationStatus.ValidationFailed), combined, StringComparison.Ordinal);
        Assert.DoesNotContain("Nicht-Protokollieren-2026", combined, StringComparison.Ordinal);
        Assert.DoesNotContain("Ebenfalls-Nicht-Loggen-2026", combined, StringComparison.Ordinal);
        Assert.DoesNotContain("Cemaris.Session", combined, StringComparison.Ordinal);
        Assert.DoesNotContain("test-admin", combined, StringComparison.Ordinal);
    }

    private static HttpRequestMessage LoginRequest(
        AntiforgeryTokenResponse csrf,
        string username,
        string password)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/login")
        {
            Content = JsonContent.Create(new { username, password }),
        };
        request.Headers.TryAddWithoutValidation(csrf.HeaderName, csrf.RequestToken);
        return request;
    }
}
