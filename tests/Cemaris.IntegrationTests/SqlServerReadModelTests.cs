using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Cemaris.Api.Contracts;
using Cemaris.Application.Cases;
using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class SqlServerReadModelTests(SqlServerIntegrationFixture fixture)
    : IClassFixture<SqlServerIntegrationFixture>
{
    [SqlServerFact]
    public async Task MigrationAndSeedCreateExpectedSyntheticDataset()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer(fixture.DatabaseConnectionString)
            .Options;
        await using var dbContext = new CemarisDbContext(options);

        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
        var caseCount = await dbContext.Cases.CountAsync();
        var changeCount = await dbContext.CaseChanges.CountAsync();

        Assert.Empty(pendingMigrations);
        Assert.True(fixture.LegacyMigrationPreservedNullableAttribution);
        Assert.Equal(15, fixture.SeededCaseCount);
        Assert.Equal(15, fixture.SeededChangeCount);
        Assert.True(caseCount >= fixture.SeededCaseCount);
        Assert.True(changeCount >= fixture.SeededChangeCount);
        Assert.True(await dbContext.Cases.AllAsync(item => item.IsSynthetic));
        Assert.Equal(15, fixture.SeedResult.CasesWritten);
        Assert.Equal(1, fixture.SeedResult.SkippedUnresolvedUsageRightHolders);
        Assert.Equal(15, fixture.SeedResult.ChangesWritten);
    }

    [SqlServerFact]
    public async Task SearchRunsThroughEfStoreWithFilteringAndLimit()
    {
        using var client = fixture.CreateClient();

        var allResponse = await client.GetAsync("/api/search", CancellationToken.None);
        var allResults = await allResponse.Content.ReadFromJsonAsync<SearchResponse>(
            CancellationToken.None);
        var filteredResponse = await client.GetAsync(
            "/api/search?name=Muster-Testperson&cemetery=Testfriedhof%20Nord",
            CancellationToken.None);
        var filteredResults = await filteredResponse.Content.ReadFromJsonAsync<SearchResponse>(
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, allResponse.StatusCode);
        Assert.NotNull(allResults);
        Assert.True(allResults.TotalMatches >= fixture.SeededCaseCount);
        Assert.Equal(10, allResults.Items.Count);
        Assert.True(allResults.IsTruncated);

        Assert.Equal(HttpStatusCode.OK, filteredResponse.StatusCode);
        Assert.NotNull(filteredResults);
        var match = Assert.Single(filteredResults.Items);
        Assert.Equal("1001", match.GraveNumber);
        Assert.Equal(2, match.DeceasedPersons.Count);
        Assert.Contains("SYN-B-2024-0001", match.NoticeNumbers);
    }

    [SqlServerFact]
    public async Task DetailPreservesCompleteAndIncompleteRelationships()
    {
        using var client = fixture.CreateClient();

        var complete = await client.GetFromJsonAsync<CaseOverview>(
            "/api/cases/00000000-0000-0000-0000-000000000001",
            CancellationToken.None);
        var incomplete = await client.GetFromJsonAsync<CaseOverview>(
            "/api/cases/00000000-0000-0000-0000-000000000002",
            CancellationToken.None);

        Assert.NotNull(complete);
        Assert.Equal(2, complete.DeceasedPersons.Count);
        Assert.Single(complete.UsageRights[0].EntitledPersonIds);
        Assert.Equal(2, complete.EntitledPersons[0].Addresses.Count);

        Assert.NotNull(incomplete);
        Assert.Null(incomplete.Burials[0].DeceasedPersonId);
        Assert.Empty(incomplete.UsageRights[0].EntitledPersonIds);
        Assert.Equal(3, incomplete.DataQualityNotes.Count);
    }

    [SqlServerFact]
    public async Task WritePathUsesSameProjectionAndRejectsStaleVersionAtomically()
    {
        using var client = fixture.CreateClient();

        var createResponse = await client.PostAsJsonAsync(
            "/api/cases",
            new
            {
                cemetery = "Synthetischer SQL-Schreibfriedhof",
                field = "Testfeld SQL",
                graveNumber = "SYN-SQL-1",
            },
            CancellationToken.None);
        var created = await createResponse.Content.ReadFromJsonAsync<CaseResponse>(
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(created);
        Assert.True(created.IsSynthetic);
        Assert.Equal(1, created.Version);
        Assert.Equal(SyntheticDevelopmentActorProvider.ActorDisplayName, created.LastChange?.ActorDisplayName);

        using var firstChange = new HttpRequestMessage(
            HttpMethod.Put,
            $"/api/cases/{created.Id}/grave")
        {
            Content = JsonContent.Create(new
            {
                cemetery = "Synthetischer SQL-Schreibfriedhof neu",
                field = "Testfeld SQL",
                graveNumber = "SYN-SQL-2",
            }),
        };
        firstChange.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"1\""));
        var firstResponse = await client.SendAsync(firstChange, CancellationToken.None);
        var changedGrave = await firstResponse.Content.ReadFromJsonAsync<CaseResponse>(
            CancellationToken.None);
        Assert.NotNull(changedGrave);

        using var addPerson = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/cases/{created.Id}/deceased-persons")
        {
            Content = JsonContent.Create(new
            {
                firstName = "Synthetische SQL-Testperson",
                lastName = "Providerparität",
            }),
        };
        addPerson.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"2\""));
        var personResponse = await client.SendAsync(addPerson, CancellationToken.None);
        var withPerson = await personResponse.Content.ReadFromJsonAsync<CaseResponse>(
            CancellationToken.None);
        Assert.NotNull(withPerson);
        var person = Assert.Single(withPerson.DeceasedPersons);

        using var addBurial = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/cases/{created.Id}/burials")
        {
            Content = JsonContent.Create(new
            {
                deceasedPersonId = person.Id,
                burialDate = "2026-03-04",
            }),
        };
        addBurial.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"3\""));
        var burialResponse = await client.SendAsync(addBurial, CancellationToken.None);
        var withBurial = await burialResponse.Content.ReadFromJsonAsync<CaseResponse>(
            CancellationToken.None);
        Assert.NotNull(withBurial);
        var burial = Assert.Single(withBurial.Burials);

        using var changePerson = new HttpRequestMessage(
            HttpMethod.Put,
            $"/api/cases/{created.Id}/deceased-persons/{person.Id}")
        {
            Content = JsonContent.Create(new
            {
                firstName = "Synthetische SQL-Testperson geändert",
                lastName = "Providerparität",
            }),
        };
        changePerson.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"4\""));
        var changedPersonResponse = await client.SendAsync(changePerson, CancellationToken.None);

        using var changeBurial = new HttpRequestMessage(
            HttpMethod.Put,
            $"/api/cases/{created.Id}/burials/{burial.Id}")
        {
            Content = JsonContent.Create(new
            {
                deceasedPersonId = person.Id,
                burialDate = "2026-03-05",
            }),
        };
        changeBurial.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"5\""));
        var changedBurialResponse = await client.SendAsync(changeBurial, CancellationToken.None);

        using var staleChange = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/cases/{created.Id}/deceased-persons")
        {
            Content = JsonContent.Create(new
            {
                firstName = "Nicht gespeichert",
                lastName = "SQL-Konflikt",
            }),
        };
        staleChange.Headers.IfMatch.Add(EntityTagHeaderValue.Parse("\"1\""));
        var staleResponse = await client.SendAsync(staleChange, CancellationToken.None);

        var detail = await client.GetFromJsonAsync<CaseResponse>(
            $"/api/cases/{created.Id}",
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, personResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, burialResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, changedPersonResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, changedBurialResponse.StatusCode);
        Assert.Equal(HttpStatusCode.PreconditionFailed, staleResponse.StatusCode);
        Assert.NotNull(detail);
        Assert.Equal(6, detail.Version);
        Assert.Equal("SYN-SQL-2", detail.Grave.GraveNumber);
        Assert.Equal("Synthetische SQL-Testperson geändert", Assert.Single(detail.DeceasedPersons).FirstName);
        Assert.Equal(new DateOnly(2026, 3, 5), Assert.Single(detail.Burials).BurialDate);

        var options = new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer(fixture.DatabaseConnectionString)
            .Options;
        await using var dbContext = new CemarisDbContext(options);
        var changes = await dbContext.CaseChanges
            .Where(item => item.CaseId == created.Id)
            .OrderBy(item => item.ResultingVersion)
            .ToArrayAsync();
        Assert.Equal(6, changes.Length);
        Assert.Equal([1L, 2L, 3L, 4L, 5L, 6L], changes.Select(item => item.ResultingVersion));
        Assert.Equal(
            [
                CaseChangeOperation.CaseCreated,
                CaseChangeOperation.GraveChanged,
                CaseChangeOperation.DeceasedPersonAdded,
                CaseChangeOperation.BurialAdded,
                CaseChangeOperation.DeceasedPersonChanged,
                CaseChangeOperation.BurialChanged,
            ],
            changes.Select(item => Enum.Parse<CaseChangeOperation>(item.Operation)));
        Assert.All(changes, item =>
        {
            Assert.Equal(SyntheticDevelopmentActorProvider.ActorId, item.ActorId);
            Assert.Equal(SyntheticDevelopmentActorProvider.ActorDisplayName, item.ActorDisplayName);
            Assert.Equal(TimeSpan.Zero, item.OccurredAtUtc.Offset);
        });
    }

    [SqlServerFact]
    public async Task ConcurrentSqlMutationsWithSameVersionHaveOneWinnerAndOneAuditRow()
    {
        using var client = fixture.CreateClient();
        var createResponse = await client.PostAsJsonAsync(
            "/api/cases",
            new { cemetery = "Synthetischer SQL-Parallelfriedhof" },
            CancellationToken.None);
        var created = await createResponse.Content.ReadFromJsonAsync<CaseResponse>(
            CancellationToken.None);
        Assert.NotNull(created);
        var etag = createResponse.Headers.ETag?.ToString();
        Assert.NotNull(etag);

        var responses = await Task.WhenAll(
            SendGraveChangeAsync(client, created.Id, etag, "Synthetischer SQL-Parallelfriedhof A"),
            SendGraveChangeAsync(client, created.Id, etag, "Synthetischer SQL-Parallelfriedhof B"));

        Assert.Single(responses, item => item.StatusCode == HttpStatusCode.OK);
        Assert.Single(responses, item => item.StatusCode == HttpStatusCode.PreconditionFailed);

        var options = new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer(fixture.DatabaseConnectionString)
            .Options;
        await using var dbContext = new CemarisDbContext(options);
        var savedCase = await dbContext.Cases.SingleAsync(item => item.Id == created.Id);
        var changes = await dbContext.CaseChanges
            .Where(item => item.CaseId == created.Id)
            .OrderBy(item => item.ResultingVersion)
            .ToArrayAsync();

        Assert.Equal(2, savedCase.Version);
        Assert.Equal(2, changes.Length);
        Assert.Equal([1L, 2L], changes.Select(item => item.ResultingVersion));
        Assert.Equal(savedCase.LastChangedAtUtc, changes[1].OccurredAtUtc);
        Assert.Equal(savedCase.LastChangedByActorName, changes[1].ActorDisplayName);
    }

    [SqlServerFact]
    public async Task SqlAuditPersistenceFailureRollsBackFactsVersionAndLastAttribution()
    {
        var options = new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer(fixture.DatabaseConnectionString)
            .Options;
        var caseId = Guid.NewGuid();
        var occurredAtUtc = new DateTimeOffset(2026, 8, 13, 9, 0, 0, TimeSpan.Zero);
        var caseRecord = CaseRecord.CreateSynthetic(
            caseId,
            GraveReference.Create("Synthetischer SQL-Rollbackfriedhof", null, "SYN-SQL-RB-1"));
        var createdChange = new CaseChange(
            Guid.NewGuid(),
            caseId,
            caseRecord.Version,
            occurredAtUtc,
            SyntheticDevelopmentActorProvider.Actor,
            CaseChangeOperation.CaseCreated,
            null);

        await using (var createContext = new CemarisDbContext(options))
        {
            await new EfCaseWriteStore(createContext).CreateAsync(
                caseRecord,
                createdChange,
                CancellationToken.None);
        }

        var failingChange = new CaseChange(
            createdChange.Id,
            caseId,
            caseRecord.Version.Next(),
            occurredAtUtc.AddMinutes(1),
            SyntheticDevelopmentActorProvider.Actor,
            CaseChangeOperation.GraveChanged,
            null);
        await using (var failingContext = new CemarisDbContext(options))
        {
            await Assert.ThrowsAsync<DbUpdateException>(() =>
                new EfCaseWriteStore(failingContext).ChangeGraveAsync(
                    caseId,
                    caseRecord.Version,
                    GraveReference.Create("Darf nicht gespeichert werden", null, "SYN-SQL-RB-2"),
                    failingChange,
                    CancellationToken.None));
        }

        await using var verificationContext = new CemarisDbContext(options);
        var savedCase = await verificationContext.Cases
            .Include(item => item.Grave)
            .SingleAsync(item => item.Id == caseId);
        var changes = await verificationContext.CaseChanges
            .Where(item => item.CaseId == caseId)
            .ToArrayAsync();

        Assert.Equal(1, savedCase.Version);
        Assert.Equal("Synthetischer SQL-Rollbackfriedhof", savedCase.Grave?.Cemetery);
        Assert.Equal(occurredAtUtc, savedCase.LastChangedAtUtc);
        Assert.Single(changes);
    }

    private static async Task<HttpResponseMessage> SendGraveChangeAsync(
        HttpClient client,
        Guid caseId,
        string etag,
        string cemetery)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, $"/api/cases/{caseId}/grave")
        {
            Content = JsonContent.Create(new { cemetery }),
        };
        request.Headers.IfMatch.Add(EntityTagHeaderValue.Parse(etag));
        return await client.SendAsync(request, CancellationToken.None);
    }
}
