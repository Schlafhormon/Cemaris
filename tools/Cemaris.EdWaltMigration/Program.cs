using System.Reflection;
using Cemaris.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Cemaris.EdWaltMigration;

internal static class MigrationProgram
{
    public static async Task<int> Main(string[] args)
    {
        if (args.Length is < 3 or > 4)
        {
            Console.Error.WriteLine("Aufruf: Cemaris.EdWaltMigration <analyze|dry-run|apply|reconcile> <Phase-2-Wurzel> <Phase-5-Wurzel> [Cemaris_Dev]");
            return 2;
        }

        var command = args[0];
        var phase2Root = ApprovedPaths.ValidatePhase2Root(args[1]);
        var workspace = ApprovedPaths.ValidateWorkspace(phase2Root, args[2]);
        var source = EdWaltPositiveListParser.Parse(phase2Root);

        if (command == "analyze")
        {
            var plan = CemeteryMigrationPlanner.Create(source);
            var report = MigrationReports.Create("analysis", plan);
            MigrationReports.Write(workspace, "analysis.json", report);
            Console.WriteLine(report.Status == "success" ? "Analyse erfolgreich." : "Analyse fehlgeschlagen.");
            return report.Status == "success" ? 0 : 1;
        }

        var decisions = LocalMigrationDecisions.ReadRequired(workspace, source.DatasetFingerprint);
        var mappedPlan = CemeteryMigrationPlanner.Create(source, decisions, requireCompleteMapping: true);

        if (command == "dry-run")
        {
            var report = MigrationReports.Create("dry-run", mappedPlan);
            MigrationReports.Write(workspace, "dry-run.json", report);
            Console.WriteLine(report.Status == "success" ? "Dry-run erfolgreich." : "Dry-run fehlgeschlagen.");
            return report.Status == "success" ? 0 : 1;
        }

        var configuration = new ConfigurationBuilder()
            .AddUserSecrets(Assembly.GetExecutingAssembly(), optional: false)
            .AddEnvironmentVariables()
            .Build();
        var connectionString = configuration.GetConnectionString("CemarisDatabase");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Die maschinenlokal autorisierte Cemaris-Verbindung fehlt.");
        }

        var options = new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer(connectionString)
            .Options;
        await using var dbContext = new CemarisDbContext(options);
        var importer = new SqlCemeteryImporter(dbContext, TimeProvider.System);

        if (command == "apply")
        {
            if (args.Length != 4)
            {
                throw new InvalidOperationException("Apply erfordert die ausdrückliche Cemaris_Dev-Bestätigung.");
            }

            var dryRun = MigrationReports.ReadDryRun(workspace);
            var report = await importer.ApplyAsync(
                mappedPlan,
                dryRun,
                configuration["DOTNET_ENVIRONMENT"],
                configuration["ReadModel:Provider"],
                configuration["Maintenance:ExpectedDatabase"],
                args[3],
                CancellationToken.None);
            MigrationReports.Write(workspace, "apply-result.json", report);
            Console.WriteLine("Import erfolgreich.");
            return 0;
        }

        if (command == "reconcile")
        {
            var report = await importer.ReconcileAsync(
                mappedPlan,
                configuration["DOTNET_ENVIRONMENT"],
                configuration["ReadModel:Provider"],
                configuration["Maintenance:ExpectedDatabase"],
                CancellationToken.None);
            MigrationReports.Write(workspace, "reconciliation.json", report);
            Console.WriteLine(report.Status == "success" ? "Reconciliation erfolgreich." : "Reconciliation fehlgeschlagen.");
            return report.Status == "success" ? 0 : 1;
        }

        Console.Error.WriteLine("Unbekannter Migrationsbefehl.");
        return 2;
    }
}
