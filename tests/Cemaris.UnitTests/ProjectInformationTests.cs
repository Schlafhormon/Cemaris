using Cemaris.Application.System;

namespace Cemaris.UnitTests;

public sealed class ProjectInformationTests
{
    [Fact]
    public void CurrentStatusExplicitlyMarksProjectAsNotProductionReady()
    {
        var status = ProjectInformation.Current;

        Assert.False(status.ProductionReady);
        Assert.Equal("Konzeptions- und Anforderungsphase", status.Phase);
    }
}
