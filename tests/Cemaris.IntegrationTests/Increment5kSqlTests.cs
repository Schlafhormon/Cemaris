using System.Net;
using Cemaris.Application.Identity;
using Cemaris.Domain.Cemeteries;
using Cemaris.EdWaltMigration;
using Cemaris.Infrastructure.Maintenance;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Cemeteries;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.IntegrationTests;

[Trait("Category", "SqlServer")]
public sealed class Increment5kSqlTests(SqlServerIntegrationFixture fixture)
    : IClassFixture<SqlServerIntegrationFixture>
{
    [SqlServerFact]
    public async Task AllEnabledHttpFeaturesUseTheSqlProvider()
    {
        using var client = fixture.CreateAllFeaturesClient();

        var paths = new[]
        {
            "/api/search",
            "/api/master-data/cemeteries?includeInactive=true",
            "/api/burial-process/master-data",
            "/api/parties/directory?page=1&pageSize=10",
            "/api/program-configuration/usage-right-start-rules/",
        };
        foreach (var path in paths)
        {
            using var response = await client.GetAsync(path, CancellationToken.None);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        var marker = Guid.NewGuid().ToString("N");
        using var created = await client.SendWithCsrfAsync(
            HttpMethod.Post,
            "/api/parties",
            new
            {
                partyType = "Organization",
                firstName = (string?)null,
                lastName = (string?)null,
                organizationName = $"SYN-5K-SQL-{marker}",
                addresses = Array.Empty<object>(),
            });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        await using var db = CreateContext();
        Assert.True(await db.Parties.AnyAsync(
            item => item.OrganizationName == $"SYN-5K-SQL-{marker}"));
    }

    [SqlServerFact]
    public async Task DevelopmentAccountsAreCreatedOncePreservedAndMismatchAbortsAtomically()
    {
        await using var db = CreateContext();
        var maintenance = new DevelopmentDatabaseMaintenance(
            db,
            new PasswordHasher<LocalAccountSnapshot>(),
            new LocalAccountSecurityOptions(),
            TimeProvider.System,
            fixture.DatabaseName);

        var first = await maintenance.EnsureAccountsAsync(
            fixture.DatabaseName,
            "Sicheres-Testpasswort-Admin-5k",
            "Sicheres-Testpasswort-Sach-5k",
            CancellationToken.None);
        Assert.Equal(2, first.Created);
        var original = await db.LocalAccounts
            .AsNoTracking()
            .OrderBy(item => item.Username)
            .Select(item => new { item.Username, item.PasswordHash, item.SecurityStamp })
            .ToArrayAsync();

        var repeated = await maintenance.EnsureAccountsAsync(
            fixture.DatabaseName,
            "Anderes-Testpasswort-Admin-5k",
            "Anderes-Testpasswort-Sach-5k",
            CancellationToken.None);
        Assert.Equal(0, repeated.Created);
        Assert.Equal(2, repeated.Preserved);
        var preserved = await db.LocalAccounts
            .AsNoTracking()
            .OrderBy(item => item.Username)
            .Select(item => new { item.Username, item.PasswordHash, item.SecurityStamp })
            .ToArrayAsync();
        Assert.Equal(original, preserved);

        var admin = await db.LocalAccounts.SingleAsync(item => item.Username == "admin");
        var sach = await db.LocalAccounts.SingleAsync(item => item.Username == "sach");
        admin.Role = SystemRole.Sachbearbeitung.Value;
        db.LocalAccounts.Remove(sach);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => maintenance.EnsureAccountsAsync(
            fixture.DatabaseName,
            "Sicheres-Testpasswort-Admin-5k",
            "Sicheres-Testpasswort-Sach-5k",
            CancellationToken.None));
        db.ChangeTracker.Clear();
        Assert.False(await db.LocalAccounts.AnyAsync(item => item.Username == "sach"));
    }

    [SqlServerFact]
    public async Task AdditiveSyntheticDataAndCemeteryImportAreIdempotentAndReconciled()
    {
        await using var db = CreateContext();
        var ensure = await new SyntheticReadModelSeeder(db, fixture.DatabaseName)
            .EnsureAsync(fixture.DatabaseName, CancellationToken.None);
        Assert.Equal(0, ensure.CasesCreated);
        Assert.Equal(15, ensure.CasesPreserved);

        var marker = Guid.NewGuid().ToString("N");
        var desired = new DesiredCemetery(
            Guid.NewGuid(),
            $"Synthetischer Importfriedhof {marker}",
            $"S5K-{marker}",
            CemeteryMasterDataRules.UniqueKey($"Synthetischer Importfriedhof {marker}"),
            CemeteryMasterDataRules.UniqueKey($"S5K-{marker}"),
            $"PAYLOAD-{marker}",
            $"RECORD-{marker}");
        var desiredGraveType = new DesiredGraveType(
            Guid.NewGuid(),
            $"TARGET-{marker}",
            $"Synthetische Importgrabart {marker}",
            $"GT-{marker}",
            CemeteryMasterDataRules.UniqueKey($"Synthetische Importgrabart {marker}"),
            CemeteryMasterDataRules.UniqueKey($"GT-{marker}"),
            BurialForm.Mixed,
            true,
            $"GRAVE-TYPE-PAYLOAD-{marker}",
            [$"RECORD-{marker}"]);
        var desiredAssignment = new DesiredCemeteryGraveType(
            Guid.NewGuid(),
            desired.Id,
            desiredGraveType.Id,
            true,
            $"ASSIGNMENT-PAYLOAD-{marker}",
            $"RECORD-{marker}");
        var counts = new MigrationCounts(
            CurrentMasterRecords: 1,
            LegacyMasterRecords: 0,
            SharedVariantKeys: 0,
            CurrentOnlyVariantKeys: 1,
            LegacyOnlyVariantKeys: 0,
            SharedSafePayloadDifferences: 0,
            CemeteriesPlanned: 1,
            GraveTypesPlanned: 1,
            CemeteryGraveTypesPlanned: 1,
            GraveTypesExcludedWithoutBurialForm: 0,
            GraveRecords: 0,
            GraveRecordsExcludedWithoutGraveType: 0,
            GraveRecordsWithUnknownCemetery: 0,
            BlockingErrors: 0,
            NonBlockingFindings: 0);
        var plan = new CemeteryMigrationPlan(
            [desired],
            [desiredGraveType],
            [desiredAssignment],
            [],
            $"DATASET-{marker}",
            $"PLAN-{marker}",
            counts);
        var dryRun = new SafeMigrationReport(
            1,
            "dry-run",
            "success",
            DateTimeOffset.UtcNow,
            plan.DatasetFingerprint,
            plan.PlanFingerprint,
            counts,
            []);
        var importer = new SqlCemeteryImporter(db, TimeProvider.System, fixture.DatabaseName);

        var first = await importer.ApplyAsync(
            plan,
            dryRun,
            "Development",
            "SqlServer",
            fixture.DatabaseName,
            fixture.DatabaseName,
            CancellationToken.None);
        db.ChangeTracker.Clear();
        var second = await importer.ApplyAsync(
            plan,
            dryRun,
            "Development",
            "SqlServer",
            fixture.DatabaseName,
            fixture.DatabaseName,
            CancellationToken.None);
        db.ChangeTracker.Clear();
        var reconciliation = await importer.ReconcileAsync(
            plan,
            "Development",
            "SqlServer",
            fixture.DatabaseName,
            CancellationToken.None);

        Assert.Equal(1, first.CemeteriesCreated);
        Assert.Equal(1, first.GraveTypesCreated);
        Assert.Equal(1, first.CemeteryGraveTypesCreated);
        Assert.Equal(0, first.CemeteriesPreserved);
        Assert.Equal(0, second.CemeteriesCreated);
        Assert.Equal(0, second.GraveTypesCreated);
        Assert.Equal(0, second.CemeteryGraveTypesCreated);
        Assert.Equal(1, second.CemeteriesPreserved);
        Assert.Equal(1, second.GraveTypesPreserved);
        Assert.Equal(1, second.CemeteryGraveTypesPreserved);
        Assert.Equal("success", reconciliation.Status);
        Assert.Equal(1, reconciliation.CemeteriesMatching);
        Assert.Equal(1, reconciliation.GraveTypesMatching);
        Assert.Equal(1, reconciliation.CemeteryGraveTypesMatching);
        Assert.Single(await db.Cemeteries.Where(item => item.Id == desired.Id).ToArrayAsync());
        Assert.Single(await db.GraveTypes.Where(item => item.Id == desiredGraveType.Id).ToArrayAsync());
        Assert.Single(await db.CemeteryGraveTypes.Where(item => item.Id == desiredAssignment.Id).ToArrayAsync());
        Assert.Equal(3, await db.CemeteryMasterDataChanges
            .CountAsync(item => (item.EntityId == desired.Id ||
                                 item.EntityId == desiredGraveType.Id ||
                                 item.EntityId == desiredAssignment.Id) &&
                                item.ActorId == "cemaris-edwalt-master-data-migration"));
    }

    [SqlServerFact]
    public async Task ImportTargetConflictLeavesNoPartialChanges()
    {
        await using var db = CreateContext();
        var marker = Guid.NewGuid().ToString("N");
        var normalizedCode = CemeteryMasterDataRules.UniqueKey($"S5K-C-{marker}");
        db.Cemeteries.Add(new CemeteryEntity
        {
            Id = Guid.NewGuid(),
            Name = $"Synthetischer vorhandener Friedhof {marker}",
            NormalizedName = CemeteryMasterDataRules.UniqueKey($"Synthetischer vorhandener Friedhof {marker}"),
            Code = $"S5K-C-{marker}",
            NormalizedCode = normalizedCode,
            IsActive = true,
            Version = 1,
        });
        await db.SaveChangesAsync();
        var countBefore = await db.Cemeteries.CountAsync();
        var desired = new DesiredCemetery(
            Guid.NewGuid(),
            $"Synthetischer Konfliktfriedhof {marker}",
            $"S5K-C-{marker}",
            CemeteryMasterDataRules.UniqueKey($"Synthetischer Konfliktfriedhof {marker}"),
            normalizedCode,
            $"PAYLOAD-{marker}",
            $"RECORD-{marker}");
        var counts = new MigrationCounts(
            CurrentMasterRecords: 1,
            LegacyMasterRecords: 0,
            SharedVariantKeys: 0,
            CurrentOnlyVariantKeys: 1,
            LegacyOnlyVariantKeys: 0,
            SharedSafePayloadDifferences: 0,
            CemeteriesPlanned: 1,
            GraveTypesPlanned: 0,
            CemeteryGraveTypesPlanned: 0,
            GraveTypesExcludedWithoutBurialForm: 1,
            GraveRecords: 0,
            GraveRecordsExcludedWithoutGraveType: 0,
            GraveRecordsWithUnknownCemetery: 0,
            BlockingErrors: 0,
            NonBlockingFindings: 0);
        var plan = new CemeteryMigrationPlan(
            [desired],
            [],
            [],
            [],
            $"DATASET-{marker}",
            $"PLAN-{marker}",
            counts);
        var dryRun = new SafeMigrationReport(1, "dry-run", "success", DateTimeOffset.UtcNow, plan.DatasetFingerprint, plan.PlanFingerprint, counts, []);
        var importer = new SqlCemeteryImporter(db, TimeProvider.System, fixture.DatabaseName);

        await Assert.ThrowsAsync<InvalidOperationException>(() => importer.ApplyAsync(
            plan,
            dryRun,
            "Development",
            "SqlServer",
            fixture.DatabaseName,
            fixture.DatabaseName,
            CancellationToken.None));
        db.ChangeTracker.Clear();

        Assert.Equal(countBefore, await db.Cemeteries.CountAsync());
        Assert.False(await db.Cemeteries.AnyAsync(item => item.Id == desired.Id));
    }

    private CemarisDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer(fixture.DatabaseConnectionString)
            .Options);
}
