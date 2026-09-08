using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cemaris.Api.Contracts;
using Cemaris.Application.CaseFollowUps;
using Cemaris.Application.Identity;
using Cemaris.Domain.CaseFollowUps;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.CaseFollowUps;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.CaseFollowUps;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerCaseFollowUpTests(SqlServerIntegrationFixture fixture) : IClassFixture<SqlServerIntegrationFixture>
{
    [SqlServerFact]
    public async Task PersistenzParallelrennenRollbackFilterparitaetUndUnveraenderterAltbestand()
    {
        Assert.True(fixture.LegacyMigrationPreservedNullableAttribution);
        Assert.True(fixture.LegacyBurialRemainedReadable);
        var options = new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(fixture.DatabaseConnectionString).Options;
        var caseId = SyntheticCaseFollowUpStoreTests.CaseId;
        var coordinator = new SyntheticStoreCoordinator();
        var synthetic = new SyntheticCaseFollowUpStore(coordinator, new(coordinator: coordinator));
        var ids = new[] { Guid.Parse("ffffffff-ffff-ffff-ffff-000000000001"), Guid.Parse("00000000-0000-0000-0000-000000000002") };
        var initial = SyntheticCaseFollowUpStoreTests.Mutation();
        var otherInitial = SyntheticCaseFollowUpStoreTests.Mutation();
        string before;
        await using (var setup = new CemarisDbContext(options))
        {
            before = System.Text.Json.JsonSerializer.Serialize(await new EfCaseReadStore(setup).FindAsync(caseId, CancellationToken.None));
            var store = new EfCaseFollowUpStore(setup);
            foreach (var id in ids.Reverse())
            {
                var mutation = id == ids[0] ? initial : otherInitial;
                var facts = new CaseFollowUpFacts("Synthetischer SQL-Gleichstand", null, new(2024, 2, 29));
                Assert.Equal(CaseFollowUpOutcome.Success, (await store.CreateAsync(caseId, id, facts, mutation, CancellationToken.None)).Outcome);
                await synthetic.CreateAsync(caseId, id, facts, mutation, CancellationToken.None);
            }
            for (var i = 0; i < 11; i++)
            {
                var id = Guid.NewGuid(); var mutation = SyntheticCaseFollowUpStoreTests.Mutation();
                var facts = new CaseFollowUpFacts("Synthetischer SQL-Seitentest", "Kein Listeninhalt", new(2026, 9, 10));
                Assert.Equal(CaseFollowUpOutcome.Success, (await store.CreateAsync(caseId, id, facts, mutation, CancellationToken.None)).Outcome);
                await synthetic.CreateAsync(caseId, id, facts, mutation, CancellationToken.None);
                if (i < 2)
                {
                    var transition = SyntheticCaseFollowUpStoreTests.Mutation(i == 0 ? CaseFollowUpOperation.Completed : CaseFollowUpOperation.Cancelled);
                    Assert.Equal(CaseFollowUpOutcome.Success, (await store.ChangeAsync(caseId, id, 1, null, transition, CancellationToken.None)).Outcome);
                    await synthetic.ChangeAsync(caseId, id, 1, null, transition, CancellationToken.None);
                }
            }
        }
        await using (var read = new CemarisDbContext(options))
        {
            var store = new EfCaseFollowUpStore(read);
            Assert.Equal(1, (await store.FindAsync(caseId, ids[0], CancellationToken.None))!.State.Version);
            Assert.Equal(13, await read.CaseFollowUps.CountAsync());
            foreach (var query in new[] { new CaseFollowUpQuery(DueUntil: new(2024, 2, 29)), new(Status: null), new(Status: null, Page: 2), new(Status: null, Page: 3), new(Status: CaseFollowUpStatus.Cancelled), new(Status: CaseFollowUpStatus.Completed) })
            {
                var expected = (await synthetic.ReadAsync(caseId, query, CancellationToken.None))!;
                var actual = (await store.ReadAsync(caseId, query, CancellationToken.None))!;
                Assert.Equal(expected.TotalMatches, actual.TotalMatches);
                Assert.Equal(expected.Items.Select(x => x.Id), actual.Items.Select(x => x.Id));
            }
        }
        foreach (var broken in new[] { SyntheticCaseFollowUpStoreTests.Mutation(CaseFollowUpOperation.Completed) with { AuditId = initial.AuditId },
            SyntheticCaseFollowUpStoreTests.Mutation(CaseFollowUpOperation.Completed) with { RevisionId = otherInitial.RevisionId } })
        {
            await using var context = new CemarisDbContext(options);
            await Assert.ThrowsAsync<DbUpdateException>(() => new EfCaseFollowUpStore(context).ChangeAsync(caseId, ids[0], 1, null, broken, CancellationToken.None));
            await using var verification = new CemarisDbContext(options);
            Assert.Equal(1, (await verification.CaseFollowUps.SingleAsync(x => x.Id == ids[0])).Version);
            Assert.Equal(1, await verification.CaseFollowUpRevisions.CountAsync(x => x.FollowUpId == ids[0]));
            Assert.Equal(1, await verification.CaseFollowUpAudits.CountAsync(x => x.FollowUpId == ids[0]));
        }
        var barrier = new ConcurrentSaveBarrier();
        var concurrentOptions = new DbContextOptionsBuilder<CemarisDbContext>().UseSqlServer(fixture.DatabaseConnectionString).AddInterceptors(barrier).Options;
        async Task<CaseFollowUpResult> Compete()
        {
            await using var context = new CemarisDbContext(concurrentOptions);
            return await new EfCaseFollowUpStore(context).ChangeAsync(caseId, ids[0], 1, null,
                SyntheticCaseFollowUpStoreTests.Mutation(CaseFollowUpOperation.Completed), CancellationToken.None);
        }
        var results = await Task.WhenAll(Compete(), Compete());
        Assert.Single(results, x => x.Outcome == CaseFollowUpOutcome.Success);
        Assert.Single(results, x => x.Outcome == CaseFollowUpOutcome.VersionConflict);
        await using var final = new CemarisDbContext(options);
        Assert.Equal(2, await final.CaseFollowUpRevisions.CountAsync(x => x.FollowUpId == ids[0]));
        Assert.Equal(2, await final.CaseFollowUpAudits.CountAsync(x => x.FollowUpId == ids[0]));
        Assert.Equal(before, System.Text.Json.JsonSerializer.Serialize(await new EfCaseReadStore(final).FindAsync(caseId, CancellationToken.None)));
        await VerifyHostRestartAsync();
    }

    private async Task VerifyHostRestartAsync()
    {
        var json = new JsonSerializerOptions(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
        var caseId = SyntheticCaseFollowUpStoreTests.OtherCaseId;
        string path;
        string saved;
        await using (var host = new SqlFollowUpHost(fixture.DatabaseConnectionString))
        {
            using var client = host.CreateClient();
            using var scope = host.Services.CreateScope();
            Assert.IsType<EfCaseFollowUpStore>(scope.ServiceProvider.GetRequiredService<ICaseFollowUpStore>());
            Assert.IsType<TestLocalAccountStore>(scope.ServiceProvider.GetRequiredService<ILocalAccountStore>());
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            foreach (var key in new[] { "Maintenance:ApplyMigrations", "Maintenance:EnsureDevelopmentAccounts", "Maintenance:EnsureSyntheticDevelopmentData", "Features:NoticeGenerationEnabled" })
                Assert.False(configuration.GetValue<bool>(key));
            Assert.Null(typeof(Program).Assembly.GetCustomAttributes(false).FirstOrDefault(x => x.GetType().Name == "UserSecretsIdAttribute"));
            await client.LoginAsync();
            var response = await client.SendWithCsrfAsync(HttpMethod.Post, $"/api/cases/{caseId}/follow-ups",
                new { title = "Synthetischer SQL-Wiederanlauf", description = "Bleibt nach Hostwechsel erhalten", dueDate = "2026-09-10" });
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var view = (await response.Content.ReadFromJsonAsync<CaseFollowUpView>(json))!;
            path = $"/api/case-follow-ups/{view.State.Id}?caseId={caseId}";
            var changed = await client.SendWithCsrfAsync(HttpMethod.Put, path,
                new { title = "Synthetisch verschoben", description = "Historie bleibt erhalten", dueDate = "2026-09-11", reason = "Vor Hostende verschoben" }, "\"1\"");
            Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
            saved = await client.GetStringAsync(path);
            (await client.SendWithCsrfAsync(HttpMethod.Post, "/api/auth/logout")).EnsureSuccessStatusCode();
        }
        await using (var restarted = new SqlFollowUpHost(fixture.DatabaseConnectionString))
        {
            using var client = restarted.CreateClient();
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path)).StatusCode);
            await client.LoginAsync("test-sach", TestIdentity.CaseWorkerPassword);
            var response = await client.GetAsync(path);
            Assert.Equal("\"2\"", response.Headers.ETag!.ToString());
            Assert.Equal(saved, await response.Content.ReadAsStringAsync());
            var view = (await response.Content.ReadFromJsonAsync<CaseFollowUpView>(json))!;
            Assert.Equal(2, view.Revisions.Count);
            Assert.Equal("Vor Hostende verschoben", view.Revisions[1].Reason);
            var stale = await client.SendWithCsrfAsync(HttpMethod.Put, path,
                new { title = "Veralteter Versuch", dueDate = "2026-09-12", reason = "Alte Version" }, "\"1\"");
            Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);
            (await client.SendWithCsrfAsync(HttpMethod.Post, "/api/auth/logout")).EnsureSuccessStatusCode();
        }
        await using var disabled = new SqlFollowUpHost(fixture.DatabaseConnectionString, enabled: false);
        using var disabledClient = disabled.CreateClient();
        (await disabledClient.GetAsync("/health")).EnsureSuccessStatusCode();
        var info = (await disabledClient.GetFromJsonAsync<SystemInformationResponse>("/api/system/info"))!;
        Assert.False(info.CaseFollowUpsEnabled);
        Assert.False(info.NoticeGenerationEnabled);
        Assert.Equal(HttpStatusCode.NotFound, (await disabledClient.GetAsync("/api/case-follow-ups")).StatusCode);
    }

    private sealed class SqlFollowUpHost(string connectionString, bool enabled = true) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseIsolatedCemarisSettings(new Dictionary<string, string?>
            {
                ["ReadModel:Provider"] = "SqlServer",
                ["Features:CaseFollowUpsEnabled"] = enabled.ToString(),
            });
            builder.ConfigureServices(services =>
            {
                TestIdentity.ConfigureAccounts(services);
                services.RemoveAll<CemarisDbContext>();
                services.RemoveAll<DbContextOptions<CemarisDbContext>>();
                services.AddDbContext<CemarisDbContext>(options => options.UseSqlServer(connectionString));
            });
        }
    }

    private sealed class ConcurrentSaveBarrier : SaveChangesInterceptor
    {
        private int arrivals;
        private readonly TaskCompletionSource ready = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData,
            InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (eventData.Context!.ChangeTracker.Entries<CaseFollowUpEntity>().Any(x => x.State == EntityState.Modified))
            {
                if (Interlocked.Increment(ref arrivals) == 2) ready.TrySetResult();
                await ready.Task.WaitAsync(TimeSpan.FromSeconds(20), cancellationToken);
            }
            return result;
        }
    }
}
