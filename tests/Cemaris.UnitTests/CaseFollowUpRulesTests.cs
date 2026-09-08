using Cemaris.Application.CaseFollowUps;
using Cemaris.Application.Identity;
using Cemaris.Domain.CaseFollowUps;

namespace Cemaris.UnitTests;

public sealed class CaseFollowUpRulesTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" \t\n ")]
    public void PflichtfelderWeisenLeereWerteAb(string? value)
    {
        Assert.Throws<CaseFollowUpValidationException>(() => CaseFollowUpFacts.Create(value, null, new(2024, 2, 29)));
        Assert.Throws<CaseFollowUpValidationException>(() => CaseFollowUpRules.Reason(value));
    }

    [Fact]
    public void NormalisierungGrenzenUndVergangenerSchalttag()
    {
        Assert.Equal(new("Titel", null, new(2024, 2, 29)), CaseFollowUpFacts.Create(" Titel ", " \n ", new(2024, 2, 29)));
        Assert.Equal("Text", CaseFollowUpFacts.Create("Titel", " Text ", DateOnly.MinValue).Description);
        Assert.Equal(200, CaseFollowUpFacts.Create(new('x', 200), new('x', 2000), DateOnly.MaxValue).Title.Length);
        Assert.Equal(1000, CaseFollowUpRules.Reason(new('x', 1000)).Length);
        Assert.Throws<CaseFollowUpValidationException>(() => CaseFollowUpFacts.Create(new('x', 201), null, DateOnly.MinValue));
        Assert.Throws<CaseFollowUpValidationException>(() => CaseFollowUpFacts.Create("Titel", new('x', 2001), DateOnly.MinValue));
        Assert.Throws<CaseFollowUpValidationException>(() => CaseFollowUpRules.Reason(new('x', 1001)));
        Assert.Throws<CaseFollowUpValidationException>(() => CaseFollowUpFacts.Create("Titel", null, null));
    }

    [Theory]
    [InlineData(CaseFollowUpStatus.Open, CaseFollowUpOperation.Completed, CaseFollowUpStatus.Completed)]
    [InlineData(CaseFollowUpStatus.Open, CaseFollowUpOperation.Cancelled, CaseFollowUpStatus.Cancelled)]
    [InlineData(CaseFollowUpStatus.Completed, CaseFollowUpOperation.Reopened, CaseFollowUpStatus.Open)]
    [InlineData(CaseFollowUpStatus.Cancelled, CaseFollowUpOperation.Reopened, CaseFollowUpStatus.Open)]
    public void UebergaengeErhaltenFaktenUndFallbezug(CaseFollowUpStatus before, CaseFollowUpOperation operation, CaseFollowUpStatus after)
    {
        var state = State(before);
        var next = CaseFollowUpChanges.Apply(state, null, Mutation(operation));
        Assert.Equal(state with { Status = after, Version = 2, UpdatedAtUtc = Mutation(operation).OccurredAtUtc }, next);
    }

    [Fact]
    public void AlleNichtErlaubtenUebergaengeSindKonflikte()
    {
        foreach (var status in Enum.GetValues<CaseFollowUpStatus>())
            foreach (var operation in Enum.GetValues<CaseFollowUpOperation>())
            {
                if ((status == CaseFollowUpStatus.Open && operation is CaseFollowUpOperation.Changed or CaseFollowUpOperation.Completed or CaseFollowUpOperation.Cancelled)
                    || (status != CaseFollowUpStatus.Open && operation == CaseFollowUpOperation.Reopened)) continue;
                Assert.Null(CaseFollowUpChanges.Apply(State(status), null, Mutation(operation)));
            }
    }

    [Fact]
    public void UnveraenderteAngabenUndFehlenderGrundHabenKeineTeilwirkung()
    {
        var state = State(CaseFollowUpStatus.Open);
        Assert.Throws<CaseFollowUpValidationException>(() => CaseFollowUpChanges.Apply(state,
            CaseFollowUpFacts.Create(" Titel ", " ", state.DueDate), Mutation(CaseFollowUpOperation.Changed)));
        Assert.Throws<CaseFollowUpValidationException>(() => CaseFollowUpChanges.Apply(state,
            new("Neu", null, state.DueDate), Mutation(CaseFollowUpOperation.Changed) with { Reason = " " }));
        Assert.Equal(1, state.Version);
        Assert.Equal("Titel", state.Title);
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(1, 1)]
    [InlineData(1, 100)]
    [InlineData(int.MaxValue, 50)]
    public void PaginationIstBegrenzt(int page, int pageSize) =>
        Assert.Throws<CaseFollowUpValidationException>(() => new CaseFollowUpQuery(Page: page, PageSize: pageSize).Validate());

    private static CaseFollowUpState State(CaseFollowUpStatus status) => new(Guid.NewGuid(), Guid.NewGuid(), "Titel", null,
        new(2024, 2, 29), status, 1, DateTimeOffset.UnixEpoch, DateTimeOffset.UnixEpoch);
    private static CaseFollowUpMutation Mutation(CaseFollowUpOperation operation) => new(Guid.NewGuid(), Guid.NewGuid(), operation,
        "Synthetische Begründung", new("synthetic", "Synthetische Sachbearbeitung", SystemRole.Sachbearbeitung), DateTimeOffset.UnixEpoch.AddDays(1));
}
