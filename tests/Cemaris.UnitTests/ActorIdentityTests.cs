using Cemaris.Application.Identity;

namespace Cemaris.UnitTests;

public sealed class ActorIdentityTests
{
    [Fact]
    public void ExactlyTwoConfirmedRolesCanBeResolved()
    {
        Assert.Equal(
            ["Sachbearbeitung", "Administration"],
            SystemRole.All.Select(item => item.Value));
        Assert.Same(SystemRole.Sachbearbeitung, SystemRole.Parse("Sachbearbeitung"));
        Assert.Same(SystemRole.Administration, SystemRole.Parse("Administration"));
        Assert.Throws<ArgumentOutOfRangeException>(() => SystemRole.Parse("Unbekannte-Rolle"));
    }

    [Fact]
    public void DevelopmentActorIsFixedSyntheticAndUsesConfirmedCaseWorkerRole()
    {
        var provider = new SyntheticDevelopmentActorProvider();

        Assert.Equal("synthetic-development-case-worker", provider.Current.Id);
        Assert.Equal("Synthetische Development-Sachbearbeitung", provider.Current.DisplayName);
        Assert.Same(SystemRole.Sachbearbeitung, provider.Current.Role);
        Assert.Same(provider.Current, new SyntheticDevelopmentActorProvider().Current);
    }
}
