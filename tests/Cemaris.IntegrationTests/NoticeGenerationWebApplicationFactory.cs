using Cemaris.Application.NoticeGeneration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Cemaris.IntegrationTests;

public sealed class NoticeGenerationWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly string TempPath = FindTempPath();
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseIsolatedCemarisSettings(new Dictionary<string, string?>
        {
            ["Features:CaseEditingEnabled"] = "true",
            ["Features:CemeteryMasterDataEditingEnabled"] = "true",
            ["Features:BurialProcessEditingEnabled"] = "true",
            ["Features:PersonUsageRightsEditingEnabled"] = "true",
            ["Features:NoticeDraftEditingEnabled"] = "true",
            ["Features:NoticeGenerationEnabled"] = "true",
        });
        builder.UseSetting("NoticeGeneration:TemplateRoot", "Templates");
        builder.UseSetting("NoticeGeneration:TemplateFileName", "Cemaris-Beisetzungsgebuehren-Testvorlage.docx");
        builder.UseSetting("NoticeGeneration:TempRoot", "notice-generation-integration-temp");
        builder.UseSetting("NoticeGeneration:LibreOfficeExecutablePath", Environment.ProcessPath);
        builder.ConfigureServices(services =>
        {
            TestIdentity.ConfigureAccounts(services);
            services.RemoveAll<INoticePdfConverter>();
            services.AddSingleton<INoticePdfConverter, SyntheticPdfConverter>();
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = NoticeDraftAdministratorAuthenticationHandler.SchemeName;
                options.DefaultChallengeScheme = NoticeDraftAdministratorAuthenticationHandler.SchemeName;
                options.DefaultForbidScheme = NoticeDraftAdministratorAuthenticationHandler.SchemeName;
            }).AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, NoticeDraftAdministratorAuthenticationHandler>(
                NoticeDraftAdministratorAuthenticationHandler.SchemeName, _ => { });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (Directory.Exists(TempPath) && !Directory.EnumerateFileSystemEntries(TempPath).Any()) Directory.Delete(TempPath);
    }

    private static string FindTempPath()
    {
        for (var current = new DirectoryInfo(AppContext.BaseDirectory); current is not null; current = current.Parent)
            if (Directory.Exists(Path.Combine(current.FullName, ".git"))) return Path.Combine(current.FullName, "src", "Cemaris.Api", "notice-generation-integration-temp");
        throw new InvalidOperationException("Repository root not found.");
    }

    private sealed class SyntheticPdfConverter : INoticePdfConverter
    {
        public Task<byte[]> ConvertAsync(byte[] document, CancellationToken token) =>
            Task.FromResult<byte[]>("%PDF-1.7\n% synthetic integration fixture"u8.ToArray());
    }
}
