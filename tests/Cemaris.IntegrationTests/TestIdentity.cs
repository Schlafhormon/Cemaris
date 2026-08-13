using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Cemaris.Api.Contracts;
using Cemaris.Api.Security;
using Cemaris.Application.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Cemaris.IntegrationTests;

internal static class TestIdentity
{
    internal static readonly Guid AdministratorId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    internal static readonly Guid CaseWorkerId = Guid.Parse("10000000-0000-0000-0000-000000000002");
    internal const string AdministratorPassword = "Synthetisch-Admin-2026";
    internal const string CaseWorkerPassword = "Synthetisch-Sach-2026";

    internal static void ConfigureAccounts(IServiceCollection services)
    {
        services.RemoveAll<ILocalAccountStore>();
        services.RemoveAll<TestLocalAccountStore>();
        var store = new TestLocalAccountStore([
            CreateAccount(AdministratorId, "test-admin", "Synthetische Testadministration", SystemRole.Administration, AdministratorPassword),
            CreateAccount(CaseWorkerId, "test-sach", "Synthetische Testsachbearbeitung", SystemRole.Sachbearbeitung, CaseWorkerPassword),
        ]);
        services.AddSingleton(store);
        services.AddSingleton<ILocalAccountStore>(store);
    }

    internal static void ConfigureAutomaticCaseWorker(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            ConfigureAccounts(services);
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
                options.DefaultForbidScheme = TestAuthenticationHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                TestAuthenticationHandler.SchemeName,
                _ => { });
        });
    }

    internal static async Task LoginAsync(
        this HttpClient client,
        string username = "test-admin",
        string password = AdministratorPassword)
    {
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenResponse>(
            "/api/auth/csrf",
            CancellationToken.None);
        Assert.NotNull(csrf);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/login")
        {
            Content = JsonContent.Create(new { username, password }),
        };
        request.Headers.TryAddWithoutValidation(csrf.HeaderName, csrf.RequestToken);
        var response = await client.SendAsync(request, CancellationToken.None);
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
    }

    internal static async Task<HttpResponseMessage> SendWithCsrfAsync(
        this HttpClient client,
        HttpMethod method,
        string path,
        object? body = null,
        string? etag = null)
    {
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenResponse>(
            "/api/auth/csrf",
            CancellationToken.None);
        Assert.NotNull(csrf);
        using var request = new HttpRequestMessage(method, path)
        {
            Content = body is null ? null : JsonContent.Create(body),
        };
        request.Headers.TryAddWithoutValidation(csrf.HeaderName, csrf.RequestToken);
        if (etag is not null)
        {
            request.Headers.TryAddWithoutValidation("If-Match", etag);
        }
        return await client.SendAsync(request, CancellationToken.None);
    }

    internal static async Task SetDefaultCsrfHeaderAsync(this HttpClient client)
    {
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenResponse>(
            "/api/auth/csrf",
            CancellationToken.None);
        Assert.NotNull(csrf);
        client.DefaultRequestHeaders.Remove(csrf.HeaderName);
        client.DefaultRequestHeaders.TryAddWithoutValidation(csrf.HeaderName, csrf.RequestToken);
    }

    private static LocalAccountSnapshot CreateAccount(
        Guid id,
        string username,
        string displayName,
        SystemRole role,
        string password)
    {
        var now = new DateTimeOffset(2026, 8, 13, 8, 0, 0, TimeSpan.Zero);
        var account = new LocalAccountSnapshot(
            id, username, LocalAccountNormalizer.NormalizeUsername(username), displayName, role,
            string.Empty, true, 0, null, false, Guid.NewGuid(), now, now, now, null, BitConverter.GetBytes(1L));
        return account with
        {
            PasswordHash = new PasswordHasher<LocalAccountSnapshot>().HashPassword(account, password),
        };
    }
}

internal sealed class TestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    internal const string SchemeName = "CemarisTest";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, TestIdentity.CaseWorkerId.ToString("D")),
            new Claim(ClaimTypes.Name, "Synthetische Testsachbearbeitung"),
            new Claim(ClaimTypes.Role, SystemRole.Sachbearbeitung.Value),
            new Claim(CemarisClaimTypes.PasswordChangeRequired, bool.FalseString),
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName)));
    }
}

public sealed class CookieIdentityWebApplicationFactory : Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program>
{
    internal TestLogCollector Logs { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Features:CaseEditingEnabled", "true");
        builder.UseSetting("ReadModel:Provider", "Synthetic");
        builder.ConfigureServices(TestIdentity.ConfigureAccounts);
        builder.ConfigureLogging(logging => logging.AddProvider(Logs));
    }
}

internal sealed record TestLogEntry(int EventId, string Message);

internal sealed class TestLogCollector : ILoggerProvider
{
    private readonly ConcurrentQueue<TestLogEntry> entries = new();
    internal IReadOnlyList<TestLogEntry> Entries => entries.ToArray();
    public ILogger CreateLogger(string categoryName) => new CollectorLogger(entries);
    public void Dispose() { }

    private sealed class CollectorLogger(ConcurrentQueue<TestLogEntry> entries) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            if (eventId.Id is >= 2001 and <= 2020)
            {
                entries.Enqueue(new TestLogEntry(eventId.Id, formatter(state, exception)));
            }
        }
    }
}
