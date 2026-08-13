using System.Security.Claims;
using Cemaris.Api.Security;
using Cemaris.Application.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Cemaris.UnitTests;

public sealed class LocalIdentityTests
{
    [Fact]
    public void UsernameNormalizationAndSecurityDefaultsAreStable()
    {
        var options = new LocalAccountSecurityOptions();

        Assert.Equal("TEST-BENUTZER", LocalAccountNormalizer.NormalizeUsername("  Test-Benutzer "));
        Assert.Equal(12, options.PasswordMinimumLength);
        Assert.Equal(128, options.PasswordMaximumLength);
        Assert.Equal(5, options.MaximumFailedLoginAttempts);
        Assert.Equal(TimeSpan.FromMinutes(15), options.LockoutDuration);
        Assert.Equal(TimeSpan.FromMinutes(30), options.SessionIdleTimeout);
        options.Validate();
        Assert.Throws<InvalidOperationException>(() => new LocalAccountSecurityOptions { PasswordMinimumLength = 11 }.Validate());
        Assert.Throws<InvalidOperationException>(() => new LocalAccountSecurityOptions { LockoutDuration = TimeSpan.FromMinutes(14) }.Validate());
    }

    [Fact]
    public void FrameworkHasherVerifiesAndRequestsRehashForOlderFrameworkFormat()
    {
        var account = Account();
        var oldHasher = new PasswordHasher<LocalAccountSnapshot>(Options.Create(new PasswordHasherOptions
        {
            CompatibilityMode = PasswordHasherCompatibilityMode.IdentityV2,
        }));
        var currentHasher = new PasswordHasher<LocalAccountSnapshot>();
        var hash = oldHasher.HashPassword(account, "Synthetisches-Passwort-2026");

        Assert.Equal(
            PasswordVerificationResult.SuccessRehashNeeded,
            currentHasher.VerifyHashedPassword(account, hash, "Synthetisches-Passwort-2026"));
        Assert.Equal(
            PasswordVerificationResult.Failed,
            currentHasher.VerifyHashedPassword(account, hash, "Falsches-Passwort-2026"));
    }

    [Fact]
    public void PolicyMatrixMatchesConfirmedRoleBoundaries()
    {
        Assert.Equal(SystemRole.All, CemarisPolicies.Matrix[CemarisPolicies.CaseWork]);
        Assert.Equal(SystemRole.All, CemarisPolicies.Matrix[CemarisPolicies.MasterData]);
        Assert.Equal([SystemRole.Administration], CemarisPolicies.Matrix[CemarisPolicies.UserAdministration]);
        Assert.Equal([SystemRole.Administration], CemarisPolicies.Matrix[CemarisPolicies.ProgramConfiguration]);
        Assert.Equal([SystemRole.Administration], CemarisPolicies.Matrix[CemarisPolicies.FormTemplates]);
    }

    [Fact]
    public void ClaimsActorRequiresStableGuidDisplayNameAndExactlyOneKnownRole()
    {
        var id = Guid.NewGuid();
        var principal = Principal(id, "Synthetischer Akteur", SystemRole.Administration.Value);
        var actor = ClaimsActorIdentityFactory.Create(principal);

        Assert.Equal(id.ToString("D"), actor.Id);
        Assert.Equal("Synthetischer Akteur", actor.DisplayName);
        Assert.Equal(SystemRole.Administration, actor.Role);
        Assert.Throws<InvalidOperationException>(() => ClaimsActorIdentityFactory.Create(new ClaimsPrincipal()));
        Assert.Throws<InvalidOperationException>(() => ClaimsActorIdentityFactory.Create(
            new ClaimsPrincipal(new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, id.ToString("D")),
                new Claim(ClaimTypes.Name, "Synthetisch"),
                new Claim(ClaimTypes.Role, "Sachbearbeitung"),
                new Claim(ClaimTypes.Role, "Administration"),
            ], "test"))));
        Assert.Throws<ArgumentOutOfRangeException>(() => ClaimsActorIdentityFactory.Create(
            Principal(id, "Synthetisch", "Unbekannt")));
    }

    [Fact]
    public async Task FailedLoginsLockAccountAndSuccessfulLoginAfterWindowResetsState()
    {
        var now = new DateTimeOffset(2026, 8, 13, 8, 0, 0, TimeSpan.Zero);
        var time = new MutableTimeProvider(now);
        var account = Account();
        var hasher = new PasswordHasher<LocalAccountSnapshot>();
        account = account with { PasswordHash = hasher.HashPassword(account, "Synthetisches-Passwort-2026") };
        var store = new AuthenticationStore(account);
        var service = new LocalAccountService(store, hasher, time, new LocalAccountSecurityOptions());

        for (var attempt = 0; attempt < 5; attempt++)
        {
            Assert.False((await service.AuthenticateAsync("test", "Falsches-Passwort-2026", CancellationToken.None)).Succeeded);
        }

        Assert.Equal(5, store.Account.FailedLoginAttempts);
        Assert.Equal(now.AddMinutes(15), store.Account.LockoutEndUtc);
        Assert.False((await service.AuthenticateAsync("test", "Synthetisches-Passwort-2026", CancellationToken.None)).Succeeded);

        time.UtcNow = now.AddMinutes(16);
        Assert.True((await service.AuthenticateAsync("test", "Synthetisches-Passwort-2026", CancellationToken.None)).Succeeded);
        Assert.Equal(0, store.Account.FailedLoginAttempts);
        Assert.Null(store.Account.LockoutEndUtc);
    }

    private static LocalAccountSnapshot Account()
    {
        var now = new DateTimeOffset(2026, 8, 13, 8, 0, 0, TimeSpan.Zero);
        return new(
            Guid.NewGuid(), "test", "TEST", "Synthetisches Testkonto",
            SystemRole.Sachbearbeitung, string.Empty, true, 0, null, false,
            Guid.NewGuid(), now, now, now, null, BitConverter.GetBytes(1L));
    }

    private static ClaimsPrincipal Principal(Guid id, string name, string role) =>
        new(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, id.ToString("D")),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Role, role),
        ], "test"));

    private sealed class MutableTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public DateTimeOffset UtcNow { get; set; } = utcNow;
        public override DateTimeOffset GetUtcNow() => UtcNow;
    }

    private sealed class AuthenticationStore(LocalAccountSnapshot account) : ILocalAccountStore
    {
        public LocalAccountSnapshot Account { get; private set; } = account;
        public Task<int> CountAsync(CancellationToken cancellationToken) => Task.FromResult(1);
        public Task<IReadOnlyList<LocalAccountSnapshot>> ListAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<LocalAccountSnapshot>>([Account]);
        public Task<LocalAccountSnapshot?> FindByIdAsync(Guid id, CancellationToken cancellationToken) => Task.FromResult<LocalAccountSnapshot?>(id == Account.Id ? Account : null);
        public Task<LocalAccountSnapshot?> FindByNormalizedUsernameAsync(string normalizedUsername, CancellationToken cancellationToken) => Task.FromResult<LocalAccountSnapshot?>(normalizedUsername == Account.NormalizedUsername ? Account : null);
        public Task<LocalAccountOperationResult> CreateAsync(LocalAccountSnapshot value, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<LocalAccountOperationResult> CreateFirstAdministratorAsync(LocalAccountSnapshot value, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<LocalAccountSnapshot?> RegisterFailedLoginAsync(string normalizedUsername, DateTimeOffset occurredAtUtc, int maximumAttempts, TimeSpan lockoutDuration, CancellationToken cancellationToken) { var previousAttempts = Account.LockoutEndUtc is not null && Account.LockoutEndUtc <= occurredAtUtc ? 0 : Account.FailedLoginAttempts; var attempts = Math.Min(maximumAttempts, previousAttempts + 1); Account = Account with { FailedLoginAttempts = attempts, LockoutEndUtc = attempts >= maximumAttempts ? occurredAtUtc.Add(lockoutDuration) : null }; return Task.FromResult<LocalAccountSnapshot?>(Account); }
        public Task<LocalAccountOperationResult> CompleteSuccessfulLoginAsync(Guid accountId, string? rehashedPassword, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken) { Account = Account with { FailedLoginAttempts = 0, LockoutEndUtc = null, PasswordHash = rehashedPassword ?? Account.PasswordHash }; return Task.FromResult(new LocalAccountOperationResult(LocalAccountOperationStatus.Success, Account)); }
        public Task<LocalAccountOperationResult> ChangePasswordAsync(Guid accountId, byte[] expectedVersion, string passwordHash, bool mustChangePassword, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<LocalAccountOperationResult> UpdateAsync(Guid actorId, Guid accountId, byte[] expectedVersion, string username, string normalizedUsername, string displayName, SystemRole role, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<LocalAccountOperationResult> SetActiveAsync(Guid actorId, Guid accountId, byte[] expectedVersion, bool isActive, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
