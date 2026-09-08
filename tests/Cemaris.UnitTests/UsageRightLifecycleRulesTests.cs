using System.Text.Json;
using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;

namespace Cemaris.UnitTests;

public sealed class UsageRightLifecycleRulesTests
{
    [Theory]
    [InlineData("2024-02-29", true)]
    [InlineData("2024-03-01", false)]
    [InlineData("2024-02-28", false)]
    public void ExklusiveDatumsgrenzenUndSchaltjahr(string date, bool valid)
    {
        void Validate() => UsageRightLifecycleRules.ValidateTermination(DateOnly.Parse(date, System.Globalization.CultureInfo.InvariantCulture), new(2020, 1, 1), new(2024, 2, 28), new(2024, 2, 29), UsageRightTerminationKind.Returned, "SYN", "SYN", true);
        if (valid) Validate(); else Assert.Throws<UsageRightValidationException>(Validate);
    }

    [Theory]
    [InlineData(null, "SYN", true)]
    [InlineData(" ", "SYN", true)]
    [InlineData("SYN", " ", true)]
    [InlineData("SYN", "SYN", false)]
    public void PflichtangabenUndBestaetigung(string? reason, string? reference, bool confirmed)
    {
        Assert.ThrowsAny<Exception>(() => UsageRightLifecycleRules.ValidateTermination(new(2026, 9, 2), new(2020, 1, 1), new(2020, 1, 1), new(2026, 9, 8), UsageRightTerminationKind.Other, reason, reference, confirmed));
    }

    [Fact]
    public void LaengenWerdenNachTrimGeprueftUndUngueltigeArtAbgewiesen()
    {
        void Validate(string reason, string reference, UsageRightTerminationKind kind = UsageRightTerminationKind.Other) => UsageRightLifecycleRules.ValidateTermination(new(2026, 9, 2), new(2020, 1, 1), new(2020, 1, 1), new(2026, 9, 8), kind, reason, reference, true);
        Validate(" " + new string('x', 1000) + " ", " " + new string('x', 250) + " ");
        Assert.Throws<PartyValidationException>(() => Validate(new string('x', 1001), "SYN"));
        Assert.Throws<PartyValidationException>(() => Validate("SYN", new string('x', 251)));
        Assert.Throws<UsageRightValidationException>(() => Validate("SYN", "SYN", (UsageRightTerminationKind)99));
    }

    [Fact]
    public void HistorischesJsonBleibtOhneErfundeneBeendigungsfaktenLesbar()
    {
        var view = JsonSerializer.Deserialize<UsageRightView>("""
            {"id":"10000000-0000-0000-0000-000000000001","graveSiteId":"10000000-0000-0000-0000-000000000002","startDate":"2020-01-01","endDate":"2050-01-01","sourceReference":"SYN","usageRightStartRuleId":"10000000-0000-0000-0000-000000000003","startRuleCodeSnapshot":"SYN","startRuleDisplayNameSnapshot":"SYN","version":1,"holderPeriods":[],"revisions":[]}
            """, JsonSerializerOptions.Web)!;
        Assert.Equal(UsageRightStatus.Open, view.Status); Assert.Null(view.Termination); Assert.Null(view.PredecessorId); Assert.Null(view.OperationId);
    }
}
