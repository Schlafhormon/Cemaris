using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Migrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;

namespace Cemaris.IntegrationTests;

public sealed class UsageRightLifecycleSchemaTests
{
    [Fact]
    public void OfflineSqlUndMigrationErhaltenBestandsdatenUndModelldriftIstAusgeschlossen()
    {
        using var db = new CemarisDbContext(new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer("Server=127.0.0.1,1;Database=Cemaris_Offline_Artifact;Integrated Security=True;Connect Timeout=1;Encrypt=True").Options);
        Assert.False(db.Database.HasPendingModelChanges());
        var migration = new AddManualUsageRightLifecycle();
        Assert.All(migration.UpOperations, x => Assert.True(x is AddColumnOperation or CreateIndexOperation or DropIndexOperation or AddCheckConstraintOperation or AddForeignKeyOperation));
        var status = Assert.Single(migration.UpOperations.OfType<AddColumnOperation>(), x => x.Name == "Status");
        Assert.Equal("Open", status.DefaultValue);
        Assert.All(migration.UpOperations.OfType<AddColumnOperation>().Where(x => x.Name != "Status"), x => Assert.True(x.IsNullable));
        var sql = db.GetService<IMigrator>().GenerateScript("20260908062036_AddManualCaseFollowUps");
        Assert.Contains("[ManualGrantReviewConfirmed] bit NULL", sql, StringComparison.Ordinal);
        Assert.Contains("WHERE [Status] = N'Open'", sql, StringComparison.Ordinal);
        Assert.Contains("[Status] <> N'Voided'", sql, StringComparison.Ordinal);
        Assert.DoesNotContain("UPDATE [UsageRightRevisions]", sql, StringComparison.Ordinal);
        Assert.DoesNotContain("DELETE FROM", sql, StringComparison.Ordinal);
    }
}
