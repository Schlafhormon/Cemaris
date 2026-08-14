using Cemaris.Application.Cases;

namespace Cemaris.UnitTests;

public sealed class CaseReadServiceTests
{
    [Fact]
    public async Task SearchRejectsSingleCharacterTextFilter()
    {
        var service = CreateService([CreateCase(1, "Testfriedhof", "Testfeld", "1", "Testperson")]);

        var exception = await Assert.ThrowsAsync<SearchValidationException>(() =>
            service.SearchAsync(new SearchCriteria(Name: "T"), CancellationToken.None));

        Assert.Contains("name", exception.Errors.Keys);
    }

    [Fact]
    public async Task SearchAllowsSingleCharacterNumberFilter()
    {
        var service = CreateService([CreateCase(1, "Testfriedhof", "Testfeld", "1", "Testperson")]);

        var result = await service.SearchAsync(
            new SearchCriteria(GraveNumber: "1", NoticeNumber: "1"),
            CancellationToken.None);

        Assert.Single(result.Items);
    }

    [Fact]
    public async Task SearchCombinesSetFiltersWithAndLogic()
    {
        var service = CreateService([
            CreateCase(1, "Testfriedhof Nord", "Testfeld", "1", "Alpha-Testperson"),
            CreateCase(2, "Testfriedhof Süd", "Testfeld", "2", "Alpha-Testperson"),
            CreateCase(3, "Testfriedhof Nord", "Testfeld", "3", "Beta-Testperson"),
        ]);

        var result = await service.SearchAsync(
            new SearchCriteria(Name: "Alpha-Testperson", Cemetery: "Testfriedhof Nord"),
            CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(Id(1), item.CaseId);
    }

    [Fact]
    public async Task SearchAppliesConfiguredLimitWithoutPagination()
    {
        var cases = Enumerable.Range(1, 12)
            .Select(index => CreateCase(
                index,
                "Testfriedhof",
                $"Testfeld {index:00}",
                index.ToString(System.Globalization.CultureInfo.InvariantCulture),
                $"Testperson-{index:00}"))
            .ToArray();
        var service = CreateService(cases, maximumResults: 10);

        var result = await service.SearchAsync(new SearchCriteria(), CancellationToken.None);

        Assert.Equal(10, result.Items.Count);
        Assert.Equal(12, result.TotalMatches);
        Assert.Equal(10, result.Limit);
        Assert.True(result.IsTruncated);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(2, result.TotalPages);
    }

    [Fact]
    public async Task SearchReturnsStableRequestedPage()
    {
        var cases = Enumerable.Range(1, 12)
            .Select(index => CreateCase(
                index,
                "Testfriedhof",
                $"Testfeld {index:00}",
                index.ToString(System.Globalization.CultureInfo.InvariantCulture),
                $"Testperson-{index:00}"))
            .ToArray();
        var service = CreateService(cases, maximumResults: 10);

        var first = await service.SearchAsync(new SearchCriteria(), 1, 5, CancellationToken.None);
        var second = await service.SearchAsync(new SearchCriteria(), 2, 5, CancellationToken.None);

        Assert.Equal(5, first.Items.Count);
        Assert.Equal(5, second.Items.Count);
        Assert.Empty(first.Items.Select(item => item.CaseId).Intersect(second.Items.Select(item => item.CaseId)));
        Assert.Equal(2, second.Page);
        Assert.Equal(5, second.PageSize);
        Assert.Equal(3, second.TotalPages);
    }

    [Theory]
    [InlineData(0, 5, "page")]
    [InlineData(1, 0, "pageSize")]
    [InlineData(1, 11, "pageSize")]
    public async Task SearchRejectsInvalidPagination(int page, int pageSize, string field)
    {
        var service = CreateService([CreateCase(1, "Testfriedhof", "Testfeld", "1", "Testperson")]);

        var exception = await Assert.ThrowsAsync<SearchValidationException>(() =>
            service.SearchAsync(new SearchCriteria(), page, pageSize, CancellationToken.None));

        Assert.Contains(field, exception.Errors.Keys);
    }

    [Fact]
    public async Task SearchSortsExactBeforePrefixBeforePartialAndThenStably()
    {
        var service = CreateService([
            CreateCase(1, "Testfriedhof B", "Testfeld", "4", "Alt-Muster"),
            CreateCase(2, "Testfriedhof C", "Testfeld", "3", "Muster-Testperson"),
            CreateCase(3, "Testfriedhof D", "Testfeld", "2", "Muster"),
            CreateCase(4, "Testfriedhof A", "Testfeld", "1", "Alt-Muster"),
        ]);

        var result = await service.SearchAsync(
            new SearchCriteria(Name: "Muster"),
            CancellationToken.None);

        Assert.Equal(
            [Id(3), Id(2), Id(4), Id(1)],
            result.Items.Select(item => item.CaseId));
    }

    private static CaseReadService CreateService(
        IReadOnlyList<CaseOverview> cases,
        int maximumResults = 10) =>
        new(new StubCaseReadStore(cases), maximumResults);

    private static CaseOverview CreateCase(
        int id,
        string cemetery,
        string field,
        string graveNumber,
        string lastName)
    {
        var caseId = Id(id);
        var deceasedId = Id(100 + id);

        return new CaseOverview(
            caseId,
            true,
            1,
            new GraveDetails(cemetery, field, graveNumber),
            [
                new DeceasedDetails(
                    deceasedId,
                    "Testvorname",
                    lastName,
                    new DateOnly(1950, 1, 1),
                    new DateOnly(2024, 1, 1)),
            ],
            [new BurialDetails(Id(200 + id), deceasedId, new DateOnly(2024, 1, 10))],
            [],
            [],
            [
                new NoticeDetails(
                    Id(300 + id),
                    graveNumber,
                    null,
                    null,
                    null,
                    null,
                    []),
            ],
            []);
    }

    private static Guid Id(int value) =>
        Guid.Parse($"00000000-0000-0000-0000-{value:000000000000}");

    private sealed class StubCaseReadStore(IReadOnlyList<CaseOverview> cases) : ICaseReadStore
    {
        public Task<CaseSearchStoreResult> SearchAsync(
            SearchCriteria criteria,
            int offset,
            int maximumResults,
            CancellationToken cancellationToken) =>
            Task.FromResult(InMemoryCaseSearch.Search(cases, criteria, maximumResults, offset));

        public Task<CaseOverview?> FindAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(cases.SingleOrDefault(item => item.Id == id));
    }
}
