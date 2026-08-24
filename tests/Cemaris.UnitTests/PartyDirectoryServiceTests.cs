using Cemaris.Application.Identity;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Parties;

namespace Cemaris.UnitTests;

public sealed class PartyDirectoryServiceTests
{
    [Fact]
    public async Task DirectoryUsesDefaultsAndReturnsZeroPagesForAnEmptyStore()
    {
        var store = new DirectoryStoreStub([], 0);
        var result = await CreateService(store).ReadPartyDirectoryAsync("   ");

        Assert.Null(store.NormalizedQuery);
        Assert.Equal(0, store.Offset);
        Assert.Equal(10, store.PageSize);
        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalMatches);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(0, result.TotalPages);
    }

    [Fact]
    public async Task DirectoryTrimsAndNormalizesTheFilterBeforePaging()
    {
        var item = new PartySearchItem(Guid.NewGuid(), PartyType.NaturalPerson, "Synthetik Müller", null);
        var store = new DirectoryStoreStub([item], 11);
        var result = await CreateService(store).ReadPartyDirectoryAsync("  synthetik   müller  ", 2, 10);

        Assert.Equal("SYNTHETIK MÜLLER", store.NormalizedQuery);
        Assert.Equal(10, store.Offset);
        Assert.Equal(10, store.PageSize);
        Assert.Equal([item], result.Items);
        Assert.Equal(11, result.TotalMatches);
        Assert.Equal(2, result.Page);
        Assert.Equal(2, result.TotalPages);
    }

    [Fact]
    public async Task DirectoryKeepsMetadataForAnEmptyOutOfRangePage()
    {
        var store = new DirectoryStoreStub([], 11);
        var result = await CreateService(store).ReadPartyDirectoryAsync(null, 5, 10);

        Assert.Empty(result.Items);
        Assert.Equal(11, result.TotalMatches);
        Assert.Equal(5, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(2, result.TotalPages);
    }

    [Theory]
    [InlineData("x")]
    public async Task DirectoryRejectsTooShortNonEmptyFilters(string query)
    {
        var exception = await Assert.ThrowsAsync<PartyValidationException>(() =>
            CreateService(new DirectoryStoreStub([], 0)).ReadPartyDirectoryAsync(query));

        Assert.Equal("query", exception.Field);
    }

    [Fact]
    public async Task DirectoryRejectsFiltersOverTwoHundredCharacters()
    {
        var exception = await Assert.ThrowsAsync<PartyValidationException>(() =>
            CreateService(new DirectoryStoreStub([], 0)).ReadPartyDirectoryAsync(new string('x', 201)));

        Assert.Equal("query", exception.Field);
    }

    [Theory]
    [InlineData(0, 10, "page")]
    [InlineData(1, 0, "pageSize")]
    [InlineData(1, 51, "pageSize")]
    [InlineData(2147483647, 50, "page")]
    public async Task DirectoryRejectsInvalidOrOverflowingPagination(int page, int pageSize, string field)
    {
        var store = new DirectoryStoreStub([], 0);
        var exception = await Assert.ThrowsAsync<PartyValidationException>(() =>
            CreateService(store).ReadPartyDirectoryAsync(null, page, pageSize));

        Assert.Equal(field, exception.Field);
        Assert.Equal(0, store.CallCount);
    }

    private static PersonUsageRightService CreateService(IPersonUsageRightStore store) =>
        new(store, new ActorProvider(), TimeProvider.System);

    private sealed class ActorProvider : ICurrentActorProvider
    {
        public ActorIdentity Current { get; } = new(
            "synthetic-directory-actor",
            "Synthetische Verzeichnis-Sachbearbeitung",
            SystemRole.Sachbearbeitung);
    }

    private sealed class DirectoryStoreStub(IReadOnlyList<PartySearchItem> items, int totalMatches) : IPersonUsageRightStore
    {
        public string? NormalizedQuery { get; private set; }
        public int Offset { get; private set; }
        public int PageSize { get; private set; }
        public int CallCount { get; private set; }

        public Task<PartyDirectoryStoreResult> ReadPartyDirectoryAsync(string? normalizedQuery, int offset, int pageSize, CancellationToken token)
        {
            NormalizedQuery = normalizedQuery;
            Offset = offset;
            PageSize = pageSize;
            CallCount++;
            return Task.FromResult(new PartyDirectoryStoreResult(items, totalMatches));
        }

        public Task<IReadOnlyList<PartySearchItem>> SearchPartiesAsync(string query, CancellationToken token) => throw new NotSupportedException();
        public Task<PartyView?> FindPartyAsync(Guid id, CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> CreatePartyAsync(Guid id, CreatePartyCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> CorrectPartyAsync(Guid id, long expected, CorrectPartyCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> AddPartyAddressAsync(Guid id, long expected, AddPartyAddressCommand command, Guid addressId, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> CorrectPartyAddressAsync(Guid id, Guid addressId, long expected, CorrectPartyAddressCommand command, PersonUsageRightAudit audit, DateOnly today, CancellationToken token) => throw new NotSupportedException();
        public Task<UsageRightView?> FindUsageRightAsync(Guid id, CancellationToken token) => throw new NotSupportedException();
        public Task<UsageRightView?> FindUsageRightByGraveSiteAsync(Guid id, CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> CreateUsageRightAsync(Guid id, CreateUsageRightCommand command, Guid holderId, PersonUsageRightAudit audit, CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> TransferUsageRightAsync(Guid id, long expected, TransferUsageRightCommand command, Guid holderId, PersonUsageRightAudit audit, CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> ExtendUsageRightAsync(Guid id, long expected, ExtendUsageRightCommand command, PersonUsageRightAudit audit, CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> CorrectUsageRightAsync(Guid id, long expected, CorrectUsageRightCommand command, PersonUsageRightAudit audit, CancellationToken token) => throw new NotSupportedException();
        public Task<IReadOnlyList<UsageRightStartRuleView>> ReadStartRulesAsync(CancellationToken token) => throw new NotSupportedException();
        public Task<PersonUsageRightMutationResult> SaveStartRuleAsync(Guid id, long? expected, SaveUsageRightStartRuleCommand command, PersonUsageRightAudit audit, CancellationToken token) => throw new NotSupportedException();
    }
}
