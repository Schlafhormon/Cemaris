using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cemaris.Api.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace Cemaris.IntegrationTests;

public sealed class CaseEditingEndpointTests(CaseEditingWebApplicationFactory factory)
    : IClassFixture<CaseEditingWebApplicationFactory>
{
    [Fact]
    public async Task EnabledDevelopmentReportsCapabilityAndDocumentsWriteEndpoints()
    {
        using var client = factory.CreateClient();

        var information = await client.GetFromJsonAsync<SystemInformationResponse>(
            "/api/system/info",
            CancellationToken.None);
        var openApiResponse = await client.GetAsync("/openapi/v1.json", CancellationToken.None);
        using var document = JsonDocument.Parse(await openApiResponse.Content.ReadAsStreamAsync(
            CancellationToken.None));
        var paths = document.RootElement.GetProperty("paths");

        Assert.NotNull(information);
        Assert.True(information.CaseEditingEnabled);
        Assert.True(paths.TryGetProperty("/api/cases", out _));
        Assert.True(paths.TryGetProperty("/api/cases/{caseId}/grave", out _));
        Assert.True(paths.TryGetProperty("/api/cases/{caseId}/deceased-persons", out _));
        Assert.True(paths.TryGetProperty("/api/cases/{caseId}/burials", out _));
    }

    [Fact]
    public async Task CompleteFlowWritesSearchesAndReadsOneCanonicalSyntheticCase()
    {
        using var client = factory.CreateClient();

        var (created, etag) = await CreateCaseAsync(client, "  Synthetischer Schreibfriedhof  ");
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.True(created.IsSynthetic);
        Assert.Equal(1, created.Version);
        Assert.Equal("Synthetischer Schreibfriedhof", created.Grave.Cemetery);

        var personResponse = await SendWithEtagAsync(
            client,
            HttpMethod.Post,
            $"/api/cases/{created.Id}/deceased-persons",
            etag,
            new
            {
                firstName = "  Testvorname-Schreibfall ",
                lastName = " Testname-Schreibfall ",
                birthDate = "1950-01-02",
                deathDate = "2026-01-03",
            });
        var withPerson = await ReadCaseAsync(personResponse);
        var person = Assert.Single(withPerson.DeceasedPersons);
        Assert.NotEqual(Guid.Empty, person.Id);
        Assert.Equal("Testvorname-Schreibfall", person.FirstName);

        var burialResponse = await SendWithEtagAsync(
            client,
            HttpMethod.Post,
            $"/api/cases/{created.Id}/burials",
            GetEtag(personResponse),
            new { deceasedPersonId = person.Id, burialDate = "2026-01-10" });
        var withBurial = await ReadCaseAsync(burialResponse);
        var burial = Assert.Single(withBurial.Burials);
        Assert.NotEqual(Guid.Empty, burial.Id);

        var graveResponse = await SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{created.Id}/grave",
            GetEtag(burialResponse),
            new
            {
                cemetery = "Synthetischer Schreibfriedhof geändert",
                field = " Testfeld S ",
                graveNumber = " SYN-900 ",
            });

        var changedPersonResponse = await SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{created.Id}/deceased-persons/{person.Id}",
            GetEtag(graveResponse),
            new
            {
                firstName = "Testvorname-Neu",
                lastName = "Testname-Schreibfall",
                birthDate = "1950-01-02",
                deathDate = "2026-01-03",
            });

        var changedBurialResponse = await SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{created.Id}/burials/{burial.Id}",
            GetEtag(changedPersonResponse),
            new { deceasedPersonId = person.Id, burialDate = "2026-01-11" });
        var finalMutation = await ReadCaseAsync(changedBurialResponse);

        Assert.Equal(6, finalMutation.Version);
        Assert.Equal("SYN-900", finalMutation.Grave.GraveNumber);
        Assert.Equal("Testvorname-Neu", finalMutation.DeceasedPersons[0].FirstName);
        Assert.Equal(new DateOnly(2026, 1, 11), finalMutation.Burials[0].BurialDate);

        var search = await client.GetFromJsonAsync<SearchCasesResponse>(
            "/api/search?firstName=Testvorname-Neu&graveNumber=SYN-900",
            CancellationToken.None);
        Assert.NotNull(search);
        Assert.Equal(created.Id, Assert.Single(search.Items).CaseId);

        var detailResponse = await client.GetAsync($"/api/cases/{created.Id}", CancellationToken.None);
        var detail = await ReadCaseAsync(detailResponse);
        Assert.Equal(finalMutation.Id, detail.Id);
        Assert.Equal(finalMutation.Version, detail.Version);
        Assert.Equal(finalMutation.Grave, detail.Grave);
        Assert.Equal(finalMutation.DeceasedPersons, detail.DeceasedPersons);
        Assert.Equal(finalMutation.Burials, detail.Burials);
        Assert.Equal("\"6\"", GetEtag(detailResponse));
    }

    [Fact]
    public async Task MissingAndStaleIfMatchHaveNoPartialWriteEffect()
    {
        using var client = factory.CreateClient();
        var (created, etag) = await CreateCaseAsync(client, "Synthetischer Konfliktfriedhof");

        var missingHeader = await client.PutAsJsonAsync(
            $"/api/cases/{created.Id}/grave",
            new { cemetery = "Nicht gespeichert" },
            CancellationToken.None);
        Assert.Equal((HttpStatusCode)428, missingHeader.StatusCode);

        var successful = await SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{created.Id}/grave",
            etag,
            new { cemetery = "Synthetischer Konfliktfriedhof neu" });
        Assert.Equal(HttpStatusCode.OK, successful.StatusCode);

        var stale = await SendWithEtagAsync(
            client,
            HttpMethod.Post,
            $"/api/cases/{created.Id}/deceased-persons",
            etag,
            new { firstName = "Darf-nicht-gespeichert-werden", lastName = (string?)null });
        Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);

        var current = await client.GetFromJsonAsync<CaseResponse>(
            $"/api/cases/{created.Id}",
            CancellationToken.None);
        Assert.NotNull(current);
        Assert.Equal(2, current.Version);
        Assert.Equal("Synthetischer Konfliktfriedhof neu", current.Grave.Cemetery);
        Assert.Empty(current.DeceasedPersons);
    }

    [Fact]
    public async Task ConcurrentMutationsWithSameVersionCommitExactlyOnce()
    {
        using var client = factory.CreateClient();
        var (created, etag) = await CreateCaseAsync(client, "Synthetischer Parallelfriedhof");

        var firstTask = SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{created.Id}/grave",
            etag,
            new { cemetery = "Synthetischer Parallelfriedhof A" });
        var secondTask = SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{created.Id}/grave",
            etag,
            new { cemetery = "Synthetischer Parallelfriedhof B" });

        var responses = await Task.WhenAll(firstTask, secondTask);
        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.OK);
        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.PreconditionFailed);

        var current = await client.GetFromJsonAsync<CaseResponse>(
            $"/api/cases/{created.Id}",
            CancellationToken.None);
        Assert.NotNull(current);
        Assert.Equal(2, current.Version);
        Assert.True(
            current.Grave.Cemetery is "Synthetischer Parallelfriedhof A"
                or "Synthetischer Parallelfriedhof B");
    }

    [Fact]
    public async Task ForeignPersonReferenceAndUnknownChildAreRejectedWithoutVersionChange()
    {
        using var client = factory.CreateClient();
        var (firstCase, firstEtag) = await CreateCaseAsync(client, "Synthetischer Referenzfriedhof A");
        var (secondCase, secondEtag) = await CreateCaseAsync(client, "Synthetischer Referenzfriedhof B");

        var personResponse = await SendWithEtagAsync(
            client,
            HttpMethod.Post,
            $"/api/cases/{secondCase.Id}/deceased-persons",
            secondEtag,
            new { firstName = "Synthetischer Fremdbezug", lastName = (string?)null });
        var foreignPerson = Assert.Single((await ReadCaseAsync(personResponse)).DeceasedPersons);

        var invalidReference = await SendWithEtagAsync(
            client,
            HttpMethod.Post,
            $"/api/cases/{firstCase.Id}/burials",
            firstEtag,
            new { deceasedPersonId = foreignPerson.Id, burialDate = "2026-02-03" });
        var validation = await invalidReference.Content.ReadFromJsonAsync<ValidationProblemDetails>(
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.BadRequest, invalidReference.StatusCode);
        Assert.NotNull(validation);
        Assert.Contains("deceasedPersonId", validation.Errors.Keys);

        var unknownChild = await SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{firstCase.Id}/deceased-persons/{Guid.NewGuid()}",
            firstEtag,
            new { firstName = "Synthetisch", lastName = "Unbekannt" });
        Assert.Equal(HttpStatusCode.NotFound, unknownChild.StatusCode);

        var unknownCase = await SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{Guid.NewGuid()}/grave",
            "\"1\"",
            new { cemetery = "Synthetischer unbekannter Fall" });
        Assert.Equal(HttpStatusCode.NotFound, unknownCase.StatusCode);

        var unchanged = await client.GetFromJsonAsync<CaseResponse>(
            $"/api/cases/{firstCase.Id}",
            CancellationToken.None);
        Assert.NotNull(unchanged);
        Assert.Equal(1, unchanged.Version);
        Assert.Empty(unchanged.Burials);
        Assert.Empty(unchanged.DeceasedPersons);
    }

    [Fact]
    public async Task ServerValidationReturnsFieldErrors()
    {
        using var client = factory.CreateClient();

        var missingCemetery = await client.PostAsJsonAsync(
            "/api/cases",
            new { cemetery = "   ", field = "Testfeld", graveNumber = "1" },
            CancellationToken.None);
        var cemeteryProblem = await missingCemetery.Content
            .ReadFromJsonAsync<ValidationProblemDetails>(CancellationToken.None);

        Assert.Equal(HttpStatusCode.BadRequest, missingCemetery.StatusCode);
        Assert.NotNull(cemeteryProblem);
        Assert.Contains("cemetery", cemeteryProblem.Errors.Keys);

        var (created, etag) = await CreateCaseAsync(client, "Synthetischer Validierungsfriedhof");
        var invalidName = await SendWithEtagAsync(
            client,
            HttpMethod.Post,
            $"/api/cases/{created.Id}/deceased-persons",
            etag,
            new { firstName = " ", lastName = " " });
        Assert.Equal(HttpStatusCode.BadRequest, invalidName.StatusCode);

        var tooLong = await SendWithEtagAsync(
            client,
            HttpMethod.Put,
            $"/api/cases/{created.Id}/grave",
            etag,
            new { cemetery = new string('S', 201) });
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);
    }

    private static async Task<(CaseResponse Case, string Etag)> CreateCaseAsync(
        HttpClient client,
        string cemetery)
    {
        var response = await client.PostAsJsonAsync(
            "/api/cases",
            new { cemetery, field = "Testfeld", graveNumber = "SYN-001" },
            CancellationToken.None);
        var created = await ReadCaseAsync(response);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal($"/api/cases/{created.Id}", response.Headers.Location?.OriginalString);
        return (created, GetEtag(response));
    }

    private static async Task<HttpResponseMessage> SendWithEtagAsync(
        HttpClient client,
        HttpMethod method,
        string uri,
        string etag,
        object body)
    {
        using var request = new HttpRequestMessage(method, uri)
        {
            Content = JsonContent.Create(body),
        };
        request.Headers.TryAddWithoutValidation("If-Match", etag);
        return await client.SendAsync(request, CancellationToken.None);
    }

    private static async Task<CaseResponse> ReadCaseAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadFromJsonAsync<CaseResponse>(CancellationToken.None);
        Assert.NotNull(content);
        return content;
    }

    private static string GetEtag(HttpResponseMessage response) =>
        response.Headers.ETag?.ToString()
        ?? throw new Xunit.Sdk.XunitException("Die Antwort enthält keinen ETag.");
}
