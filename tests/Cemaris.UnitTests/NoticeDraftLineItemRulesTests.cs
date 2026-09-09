using Cemaris.Domain.NoticeDrafts;

namespace Cemaris.UnitTests;

public sealed class NoticeDraftLineItemRulesTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("0")]
    [InlineData("0.00")]
    [InlineData("-1")]
    [InlineData("1.001")]
    [InlineData("1e2")]
    [InlineData("1,20")]
    [InlineData(" 1.20")]
    [InlineData("+1")]
    [InlineData("10000000000000000.00")]
    public void RejectsInvalidMoney(string? text) =>
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.ParseAmount(text, "amount"));

    [Fact]
    public void AddsCentsAndMaximumExactlyAndMaterializesStableOrderedIds()
    {
        PreparedNoticeDraftLineItem[] items = [new(null, "  Erste  ", .10m), new(null, "Zweite", .20m)];
        Assert.Equal(.30m, NoticeDraftLineItemRules.Total(items));
        var rows = NoticeDraftLineItemRules.Materialize(items, []);
        Assert.Equal("Erste", rows[0].Description);
        Assert.Equal("0.10", rows[0].AmountExact);
        var reversed = NoticeDraftLineItemRules.Materialize(rows.Reverse().Select(x => new PreparedNoticeDraftLineItem(x.Id, x.Description, x.Amount)).ToArray(), rows.Select(x => x.Id));
        Assert.Equal(rows[1].Id, reversed[0].Id);
        Assert.Equal(Enumerable.Range(1, 2), reversed.Select(x => x.Position));
        Assert.Equal(NoticeDraftRules.MaximumAmount, NoticeDraftLineItemRules.ParseAmount("9999999999999999.99", "amount"));
        Assert.Equal("9999999999999999.99", NoticeDraftLineItemRules.Exact(NoticeDraftRules.MaximumAmount));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Total([new(null, "Max", NoticeDraftRules.MaximumAmount), new(null, "Cent", .01m)]));
    }

    [Fact]
    public void RejectsMissingRowsDescriptionsAndInvalidIdentities()
    {
        var id = Guid.NewGuid();
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Total(null));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Total([]));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Total([null!]));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Total(Enumerable.Repeat(new PreparedNoticeDraftLineItem(null, "A", 1), 101).ToArray()));
        foreach (var description in new[] { " ", new string('A', 501), "A\u0001B" })
            Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Total([new(null, description, 1)]));
        Assert.Equal(100m, NoticeDraftLineItemRules.Total(Enumerable.Repeat(new PreparedNoticeDraftLineItem(null, new string('A', 500), 1), 100).ToArray()));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Total([new(id, "A", 1), new(id, "B", 2)]));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Total([new(Guid.Empty, "A", 1)]));
        Assert.Throws<NoticeDraftValidationException>(() => NoticeDraftLineItemRules.Materialize([new(id, "Fremd", 1)], []));
    }
}
