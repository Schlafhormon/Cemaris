using Cemaris.Api.Security;
using Cemaris.Application.Identity;
using Cemaris.Application.NoticeDrafts;
using Cemaris.Domain.NoticeDrafts;

namespace Cemaris.UnitTests;

public sealed class NoticeDraftRulesTests
{
    [Theory]
    [InlineData("SYNFP", 2026, 1, 6, "SYNFP.2026000001")]
    [InlineData("SYNFP", 2027, 42, 4, "SYNFP.20270042")]
    public void NoticeNumberUsesProductUtcYearAndFixedWidth(
        string product,
        int year,
        int runningNumber,
        int width,
        string expected)
    {
        Assert.Equal(expected, NoticeDraftRules.FormatNoticeNumber(product, year, runningNumber, width));
    }

    [Fact]
    public void AmountIsPositiveEurCompatibleAndNeverRounded()
    {
        Assert.Equal(0.01m, NoticeDraftRules.ValidateAmount(0.01m));
        Assert.Equal(NoticeDraftRules.MaximumAmount, NoticeDraftRules.ValidateAmount(NoticeDraftRules.MaximumAmount));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftRules.ValidateAmount(0m));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftRules.ValidateAmount(1.001m));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftRules.ValidateAmount(NoticeDraftRules.MaximumAmount + 0.01m));
        Assert.Equal("EUR", NoticeDraftRules.Currency);
    }

    [Fact]
    public void TextWidthAndSequenceBoundsAreStrict()
    {
        Assert.Equal("SYNFP", NoticeDraftRules.FinancialProduct("  SYNFP  "));
        Assert.Equal(999_999, NoticeDraftRules.MaximumRunningNumber(6));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftRules.FinancialProduct(new string('x', 51)));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftRules.AccountAssignment(" "));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftRules.FeeReasonOrSource(new string('x', 501)));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftRules.MutationReason(new string('x', 1001)));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftRules.RunningNumberWidth(0));
        Assert.Throws<NoticeNumberSequenceExhaustedException>(() => NoticeDraftRules.FormatNoticeNumber("SYNFP", 2026, 10, 1));
    }

    [Fact]
    public void NoticeDraftPolicyAllowsExactlyBothSystemRoles()
    {
        Assert.Equal(SystemRole.All, CemarisPolicies.Matrix[CemarisPolicies.NoticeDrafts]);
        Assert.Equal([SystemRole.Administration], CemarisPolicies.Matrix[CemarisPolicies.ProgramConfiguration]);
    }

    [Fact]
    public void StatusSetContainsOnlyDraftAndDiscarded()
    {
        Assert.Equal([NoticeDraftStatus.Draft, NoticeDraftStatus.Discarded], Enum.GetValues<NoticeDraftStatus>());
    }

    [Fact]
    public async Task ServiceRejectsMissingPayerConfirmationAndReasonsBeforeAnyStoreEffect()
    {
        var store = new RecordingStore();
        var service = new NoticeDraftService(store, new ActorProvider(), TimeProvider.System);
        var validCreate = new CreateNoticeDraftCommand(
            Guid.NewGuid(), true, 1m, new(2026, 8, 26), new(2026, 9, 26), "KONTO", "Quelle");

        await Assert.ThrowsAsync<NoticeDraftValidationException>(() => service.CreateDraftAsync(
            Guid.NewGuid(),
            validCreate with { PayerSelectionConfirmed = false },
            CancellationToken.None));
        await Assert.ThrowsAsync<NoticeDraftValidationException>(() => service.CreateDraftAsync(
            Guid.NewGuid(),
            validCreate with { PayerPartyId = Guid.Empty },
            CancellationToken.None));
        await Assert.ThrowsAsync<NoticeDraftValidationException>(() => service.CorrectDraftAsync(
            Guid.NewGuid(),
            1,
            new(validCreate.PayerPartyId, false, 1m, validCreate.NoticeDate, validCreate.DueDate, "KONTO", "Quelle", " "),
            CancellationToken.None));
        await Assert.ThrowsAsync<NoticeDraftValidationException>(() => service.DiscardDraftAsync(
            Guid.NewGuid(),
            1,
            new(" "),
            CancellationToken.None));
        await Assert.ThrowsAsync<NoticeDraftValidationException>(() => service.ChangeConfigurationAsync(
            Guid.NewGuid(),
            1,
            new("SYNFP", 6, " "),
            CancellationToken.None));
        Assert.Equal(0, store.Mutations);
    }

    private sealed class ActorProvider : ICurrentActorProvider
    {
        public ActorIdentity Current { get; } = new("unit-6b", "Synthetischer Unit-Akteur", SystemRole.Sachbearbeitung);
    }

    private sealed class RecordingStore : INoticeDraftStore
    {
        internal int Mutations { get; private set; }
        public Task<IReadOnlyList<NoticeDraftListItem>?> ReadForCaseAsync(Guid caseId, CancellationToken token) => Task.FromResult<IReadOnlyList<NoticeDraftListItem>?>([]);
        public Task<NoticeDraftView?> FindDraftAsync(Guid id, CancellationToken token) => Task.FromResult<NoticeDraftView?>(null);
        public Task<NoticeNumberConfigurationView?> FindConfigurationAsync(CancellationToken token) => Task.FromResult<NoticeNumberConfigurationView?>(null);
        public Task<NoticeDraftMutationResult> CreateDraftAsync(Guid id, Guid caseId, CreateNoticeDraftCommand command, NoticeDraftMutation mutation, CancellationToken token) => Result(id);
        public Task<NoticeDraftMutationResult> CorrectDraftAsync(Guid id, long expectedVersion, CorrectNoticeDraftCommand command, NoticeDraftMutation mutation, CancellationToken token) => Result(id);
        public Task<NoticeDraftMutationResult> DiscardDraftAsync(Guid id, long expectedVersion, DiscardNoticeDraftCommand command, NoticeDraftMutation mutation, CancellationToken token) => Result(id);
        public Task<NoticeDraftMutationResult> CreateConfigurationAsync(Guid id, SaveNoticeNumberConfigurationCommand command, NoticeDraftMutation mutation, CancellationToken token) => Result(id);
        public Task<NoticeDraftMutationResult> ChangeConfigurationAsync(Guid id, long expectedVersion, SaveNoticeNumberConfigurationCommand command, NoticeDraftMutation mutation, CancellationToken token) => Result(id);
        private Task<NoticeDraftMutationResult> Result(Guid id) { Mutations++; return Task.FromResult(new NoticeDraftMutationResult(NoticeDraftMutationOutcome.Success, id, 1)); }
    }
}
