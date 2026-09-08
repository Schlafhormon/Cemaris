using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.PersonUsageRights;
using Cemaris.Infrastructure.PersonUsageRights;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using static Cemaris.IntegrationTests.UsageRightLifecycleContractTests;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerUsageRightLifecycleTests(SqlServerIntegrationFixture fixture) : IClassFixture<SqlServerIntegrationFixture>
{
    private DbContextOptions<CemarisDbContext> Options(params IInterceptor[] interceptors) => new DbContextOptionsBuilder<CemarisDbContext>()
        .UseSqlServer(fixture.DatabaseConnectionString).AddInterceptors(interceptors).Options;
    private static PersonUsageRightService Service(CemarisDbContext db) => new(new EfPersonUsageRightStore(db), new Actor(), new Clock());

    [SqlServerFact]
    public async Task MigrationHistorischesJsonFolgeRollbackRennenUndHostwechsel()
    {
        Assert.StartsWith("Cemaris_IntegrationTests_", fixture.DatabaseName, StringComparison.Ordinal);
        await using var db = new CemarisDbContext(Options());
        var service = Service(db);
        var setup = await Setup(new EfCemeteryMasterDataStore(db), service);
        var old = await db.UsageRightRevisions.AsNoTracking().SingleAsync(x => x.UsageRightId == setup.Right.Id);
        var json = JsonNode.Parse(old.StateJson)!.AsObject();
        foreach (var property in new[] { "status", "termination", "predecessorId", "operationId", "manualGrantReviewConfirmed" }) json.Remove(property);
        var oldJson = json.ToJsonString();
        await db.Database.MigrateAsync("20260908062036_AddManualCaseFollowUps");
        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE UsageRightRevisions SET StateJson = {oldJson} WHERE Id = {old.Id}");
        await db.Database.MigrateAsync();
        Assert.Equal(oldJson, await db.UsageRightRevisions.Where(x => x.Id == old.Id).Select(x => x.StateJson).SingleAsync());
        var migrated = (await service.FindUsageRightAsync(setup.Right.Id, Token))!;
        Assert.Equal(Domain.UsageRights.UsageRightStatus.Open, migrated.Status); Assert.Null(migrated.Termination);
        var caseBefore = JsonSerializer.Serialize(await db.Cases.AsNoTracking().OrderBy(x => x.Id).Select(x => new { x.Id, x.Version }).ToArrayAsync());
        await RunContract(service, setup.Site, setup.Party, migrated);
        Assert.Equal(caseBefore, JsonSerializer.Serialize(await db.Cases.AsNoTracking().OrderBy(x => x.Id).Select(x => new { x.Id, x.Version }).ToArrayAsync()));
        Assert.Equal(oldJson, await db.UsageRightRevisions.Where(x => x.Id == old.Id).Select(x => x.StateJson).SingleAsync());

        var chain = await Setup(new EfCemeteryMasterDataStore(db), service);
        var ended = Success(await service.TerminateUsageRightAsync(chain.Right.Id, 1, Termination(), Token)).Right!;
        var b = Success(await service.CreateUsageRightSuccessorAsync(ended.Id, ended.Version, Successor(chain.Party), Token)).Right!;
        b = Success(await service.TerminateUsageRightAsync(b.Id, b.Version, Termination(3), Token)).Right!;
        var c = Success(await service.CreateUsageRightSuccessorAsync(b.Id, b.Version, Successor(chain.Party, 3), Token)).Right!;
        var sequence = (await service.ReadUsageRightSequenceAsync(ended.Id, Token))!;
        var before = await Snapshot(db, chain.Site);
        foreach (var audit in new[] { false, true })
        {
            await using var broken = new CemarisDbContext(Options(new EvidenceFailure(audit)));
            await Assert.ThrowsAsync<InvalidOperationException>(() => Service(broken).CorrectUsageRightSequenceAsync(ended.Id, sequence[0].Version, Correction(sequence), Token));
            Assert.Equal(before, await Snapshot(db, chain.Site));
        }

        // Tatsächlich zwei unabhängige Transaktionen treffen sich vor dem ersten Schreiben.
        await Race(service, db, (s, a, p) => s.CreateUsageRightSuccessorAsync(a.Id, a.Version, Successor(p), Token),
            (s, a, p) => s.CreateUsageRightSuccessorAsync(a.Id, a.Version, Successor(p), Token));
        await Race(service, db, (s, a, p) => s.ReverseUsageRightTerminationAsync(a.Id, a.Version, new("SYN-Rennen"), Token),
            (s, a, p) => s.CreateUsageRightSuccessorAsync(a.Id, a.Version, Successor(p), Token));
        await Race(service, db, (s, a, p) => s.TerminateUsageRightAsync(a.Id, a.Version, Termination(), Token),
            (s, a, p) => s.TransferUsageRightAsync(a.Id, a.Version, new(p, new(2026, 9, 1), "SYN-Rennen"), Token), false);
        await Race(service, db, (s, a, p) => s.TerminateUsageRightAsync(a.Id, a.Version, Termination(), Token),
            (s, a, p) => s.TerminateUsageRightAsync(a.Id, a.Version, Termination(), Token), false);
        var barrier = new SaveBarrier();
        async Task<PersonUsageRightMutationResult> Correct()
        { await using var ctx = new CemarisDbContext(Options(barrier)); return await Service(ctx).CorrectUsageRightSequenceAsync(ended.Id, sequence[0].Version, Correction(sequence), Token); }
        async Task<PersonUsageRightMutationResult> Extend()
        { await using var ctx = new CemarisDbContext(Options(barrier)); return await Service(ctx).ExtendUsageRightAsync(c.Id, c.Version, new(new(2060, 1, 1), "SYN-Rennen"), Token); }
        var results = await Task.WhenAll(Correct(), Extend());
        Assert.Single(results, x => x.Outcome == PersonUsageRightMutationOutcome.Success);
        Assert.Single(results, x => x.Outcome == PersonUsageRightMutationOutcome.VersionConflict);
        Assert.True(await db.CanonicalUsageRights.CountAsync(x => x.GraveSiteId == chain.Site && x.Status == "Open") <= 1);
        await Hostwechsel(setup.Right.Id);
    }

    private async Task Race(PersonUsageRightService service, CemarisDbContext db,
        Func<PersonUsageRightService, UsageRightView, Guid, Task<PersonUsageRightMutationResult>> first,
        Func<PersonUsageRightService, UsageRightView, Guid, Task<PersonUsageRightMutationResult>> second, bool terminateFirst = true)
    {
        var setup = await Setup(new EfCemeteryMasterDataStore(db), service);
        var ended = terminateFirst ? Success(await service.TerminateUsageRightAsync(setup.Right.Id, 1, Termination(), Token)).Right! : setup.Right;
        var barrier = new SaveBarrier();
        async Task<PersonUsageRightMutationResult> Run(Func<PersonUsageRightService, UsageRightView, Guid, Task<PersonUsageRightMutationResult>> action)
        { await using var context = new CemarisDbContext(Options(barrier)); return await action(Service(context), ended, setup.Party); }
        var results = await Task.WhenAll(Run(first), Run(second));
        Assert.Single(results, x => x.Outcome == PersonUsageRightMutationOutcome.Success);
        Assert.Single(results, x => x.Outcome == PersonUsageRightMutationOutcome.VersionConflict);
        Assert.True(await db.CanonicalUsageRights.CountAsync(x => x.GraveSiteId == setup.Site && x.Status == "Open") <= 1);
        Assert.Equal(ended.Version + 1, (await service.FindUsageRightAsync(ended.Id, Token))!.Version);
    }

    private static async Task<string> Snapshot(CemarisDbContext db, Guid site)
    {
        var rights = await db.CanonicalUsageRights.AsNoTracking().Include(x => x.HolderPeriods).Include(x => x.Revisions).Where(x => x.GraveSiteId == site).OrderBy(x => x.Id).ToArrayAsync();
        var ids = rights.Select(x => x.Id).ToArray();
        return JsonSerializer.Serialize(new { Rights = rights, Audits = await db.PersonUsageRightAudits.AsNoTracking().Where(x => ids.Contains(x.EntityId)).OrderBy(x => x.Id).ToArrayAsync() });
    }

    private async Task Hostwechsel(Guid id)
    {
        var path = $"/api/usage-rights/{id}";
        string saved;
        await using (var factory = SqlHost())
        {
            using var client = factory.CreateClient();
            Assert.Null(typeof(Program).Assembly.GetCustomAttributes(false).FirstOrDefault(x => x.GetType().Name == "UserSecretsIdAttribute"));
            await client.LoginAsync();
            saved = await client.GetStringAsync(path);
            (await client.SendWithCsrfAsync(HttpMethod.Post, "/api/auth/logout")).EnsureSuccessStatusCode();
        }
        await using (var factory = SqlHost())
        {
            using var client = factory.CreateClient();
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path)).StatusCode);
            await client.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
            Assert.Equal(saved, await client.GetStringAsync(path));
            (await client.SendWithCsrfAsync(HttpMethod.Post, "/api/auth/logout")).EnsureSuccessStatusCode();
        }
    }

    private Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> SqlHost() => new UsageRightLifecycleWebApplicationFactory().WithWebHostBuilder(builder =>
    {
        builder.UseSetting("IntegrationTests:Overrides:ReadModel:Provider", "SqlServer");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<CemarisDbContext>(); services.RemoveAll<DbContextOptions<CemarisDbContext>>();
            services.AddDbContext<CemarisDbContext>(options => options.UseSqlServer(fixture.DatabaseConnectionString));
        });
    });

    private sealed class EvidenceFailure(bool audit) : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            var entries = eventData.Context!.ChangeTracker.Entries().Count(x => x.State == EntityState.Added && (audit ? x.Entity is PersonUsageRightAuditEntity : x.Entity is UsageRightRevisionEntity));
            if (entries >= 2) throw new InvalidOperationException("Synthetischer Fehler im zweiten Nachweis.");
            return ValueTask.FromResult(result);
        }
    }

    private sealed class SaveBarrier : SaveChangesInterceptor
    {
        private int arrivals;
        private readonly TaskCompletionSource ready = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (Interlocked.Increment(ref arrivals) <= 2)
            {
                if (Volatile.Read(ref arrivals) == 2) ready.TrySetResult();
                await ready.Task.WaitAsync(TimeSpan.FromSeconds(20), cancellationToken);
            }
            return result;
        }
    }
}
