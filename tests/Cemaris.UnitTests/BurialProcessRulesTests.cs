using Cemaris.Domain.Cases;

namespace Cemaris.UnitTests;

public sealed class BurialProcessRulesTests
{
    [Fact]
    public void OnlyTheSevenDecidedTransitionsAreAllowed()
    {
        var allowed = new HashSet<(BurialProcessStatus, BurialProcessStatus)>
        {
            (BurialProcessStatus.Draft, BurialProcessStatus.Planned),
            (BurialProcessStatus.Planned, BurialProcessStatus.Draft),
            (BurialProcessStatus.Planned, BurialProcessStatus.Confirmed),
            (BurialProcessStatus.Confirmed, BurialProcessStatus.Planned),
            (BurialProcessStatus.Confirmed, BurialProcessStatus.Performed),
            (BurialProcessStatus.Performed, BurialProcessStatus.Completed),
            (BurialProcessStatus.Completed, BurialProcessStatus.Performed),
        };

        foreach (var from in Enum.GetValues<BurialProcessStatus>())
            foreach (var to in Enum.GetValues<BurialProcessStatus>())
            {
                Assert.Equal(allowed.Contains((from, to)), BurialProcessRules.IsTransitionAllowed(from, to));
            }
    }

    [Fact]
    public void RequiredDatesAndChronologyAreValidatedWithoutTimesOrTimeZones()
    {
        var today = new DateOnly(2026, 8, 13);
        var planned = BurialProcessRecord.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), BurialProcessStatus.Planned, null, null);
        var performed = BurialProcessRecord.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), BurialProcessStatus.Performed, today, null);
        var future = BurialProcessRecord.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), BurialProcessStatus.Performed, today, today.AddDays(1));
        var beforeDeath = BurialProcessRecord.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), BurialProcessStatus.Performed, today, new DateOnly(2026, 1, 1));

        Assert.Equal("planningDate", Assert.Throws<BurialProcessValidationException>(() => BurialProcessRules.Validate(planned, null, null, today)).Field);
        Assert.Equal("actualBurialDate", Assert.Throws<BurialProcessValidationException>(() => BurialProcessRules.Validate(performed, null, null, today)).Field);
        Assert.Equal("actualBurialDate", Assert.Throws<BurialProcessValidationException>(() => BurialProcessRules.Validate(future, null, null, today)).Field);
        Assert.Equal("actualBurialDate", Assert.Throws<BurialProcessValidationException>(() => BurialProcessRules.Validate(beforeDeath, new DateOnly(1950, 1, 1), new DateOnly(2026, 2, 1), today)).Field);
        Assert.Equal("deathDate", Assert.Throws<BurialProcessValidationException>(() => BurialProcessRules.ValidatePersonDates(today, today.AddDays(-1))).Field);
    }
}
