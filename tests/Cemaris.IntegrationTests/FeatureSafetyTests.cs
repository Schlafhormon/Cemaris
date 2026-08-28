using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Cemaris.IntegrationTests;

public sealed class FeatureSafetyTests
{
    [Fact]
    public void EditingActivationOutsideDevelopmentFailsAtStartup()
    {
        using var factory = new UnsafeProductionFactory();

        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());

        Assert.Contains(
            "Case editing may be enabled only in the Development environment",
            FlattenMessages(exception),
            StringComparison.Ordinal);
    }

    [Fact]
    public void BurialProcessActivationOutsideDevelopmentFailsAtStartup()
    {
        using var factory = new UnsafeBurialProcessProductionFactory();
        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        Assert.Contains("Burial-process editing may be enabled only in Development", FlattenMessages(exception), StringComparison.Ordinal);
    }

    [Fact]
    public void CemeteryMasterDataActivationOutsideDevelopmentFailsAtStartup()
    {
        using var factory = new UnsafeCemeteryMasterDataProductionFactory();
        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        Assert.Contains(
            "Cemetery master-data editing may be enabled only in Development",
            FlattenMessages(exception),
            StringComparison.Ordinal);
    }

    [Fact]
    public void PersonUsageRightsActivationOutsideDevelopmentFailsAtStartup()
    {
        using var factory = new UnsafePersonUsageRightsProductionFactory();
        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        Assert.Contains("Person and usage-right editing may be enabled only in Development", FlattenMessages(exception), StringComparison.Ordinal);
    }

    [Fact]
    public void NoticeDraftActivationOutsideDevelopmentFailsAtStartup()
    {
        using var factory = new UnsafeNoticeDraftProductionFactory();
        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        Assert.Contains("Notice-draft editing may be enabled only in Development", FlattenMessages(exception), StringComparison.Ordinal);
    }

    [Fact]
    public void NoticeGenerationActivationOutsideDevelopmentFailsAtStartup()
    {
        using var factory = new UnsafeNoticeGenerationProductionFactory();
        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        Assert.Contains("Notice generation may be enabled only in Development", FlattenMessages(exception), StringComparison.Ordinal);
    }

    [Fact]
    public void NoticeGenerationRequiresEveryDependentCapability()
    {
        using var factory = new IncompleteNoticeGenerationDevelopmentFactory();
        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        Assert.Contains("requires every dependent Development capability", FlattenMessages(exception), StringComparison.Ordinal);
    }

    private static string FlattenMessages(Exception exception)
    {
        var messages = new List<string>();
        for (var current = exception; current is not null; current = current.InnerException!)
        {
            messages.Add(current.Message);
            if (current.InnerException is null)
            {
                break;
            }
        }

        return string.Join(" | ", messages);
    }

    private sealed class UnsafeProductionFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Features:CaseEditingEnabled", "true");
        }
    }

    private sealed class UnsafeBurialProcessProductionFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Features:BurialProcessEditingEnabled", "true");
        }
    }

    private sealed class UnsafeCemeteryMasterDataProductionFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Features:CemeteryMasterDataEditingEnabled", "true");
        }
    }

    private sealed class UnsafePersonUsageRightsProductionFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Features:PersonUsageRightsEditingEnabled", "true");
        }
    }

    private sealed class UnsafeNoticeDraftProductionFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Features:NoticeDraftEditingEnabled", "true");
        }
    }

    private sealed class UnsafeNoticeGenerationProductionFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Features:NoticeGenerationEnabled", "true");
        }
    }

    private sealed class IncompleteNoticeGenerationDevelopmentFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Features:NoticeGenerationEnabled", "true");
        }
    }
}
