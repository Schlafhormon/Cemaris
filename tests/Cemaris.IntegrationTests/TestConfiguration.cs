using Microsoft.AspNetCore.Hosting;

namespace Cemaris.IntegrationTests;

internal static class TestConfiguration
{
    public static void UseIsolatedCemarisSettings(
        this IWebHostBuilder builder,
        IReadOnlyDictionary<string, string?>? overrides = null)
    {
        var settings = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["ReadModel:Provider"] = "Synthetic",
            ["Features:CaseEditingEnabled"] = "false",
            ["Features:CaseFollowUpsEnabled"] = "false",
            ["Features:CemeteryMasterDataEditingEnabled"] = "false",
            ["Features:BurialProcessEditingEnabled"] = "false",
            ["Features:PersonUsageRightsEditingEnabled"] = "false",
            ["Features:UsageRightLifecycleEnabled"] = "false",
            ["Features:NoticeDraftEditingEnabled"] = "false",
            ["Features:NoticeGenerationEnabled"] = "false",
            ["Maintenance:ApplyMigrations"] = "false",
            ["Maintenance:EnsureDevelopmentAccounts"] = "false",
            ["Maintenance:EnsureSyntheticDevelopmentData"] = "false",
        };
        if (overrides is not null)
        {
            foreach (var item in overrides)
            {
                settings[item.Key] = item.Value;
            }
        }

        builder.UseSetting("IntegrationTests:IsolatedConfiguration", "true");
        foreach (var item in settings)
        {
            builder.UseSetting($"IntegrationTests:Overrides:{item.Key}", item.Value);
        }
    }
}
