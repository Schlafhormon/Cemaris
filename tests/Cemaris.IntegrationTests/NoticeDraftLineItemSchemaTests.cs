using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Migrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;

namespace Cemaris.IntegrationTests;

public sealed class NoticeDraftLineItemSchemaTests
{
    [Fact]
    public void OfflineMigrationIsAdditiveKeepsHistoryAndMatchesModel()
    {
        using var db = new CemarisDbContext(new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer("Server=127.0.0.1,1;Database=Cemaris_Offline_M3a;Integrated Security=True;Connect Timeout=1;Encrypt=True").Options);
        Assert.False(db.Database.HasPendingModelChanges());
        var migration = new AddManualNoticeDraftLineItems();
        Assert.All(migration.UpOperations, x => Assert.True(x is AddColumnOperation or CreateTableOperation or CreateIndexOperation or AddCheckConstraintOperation));
        Assert.Equal(2, migration.UpOperations.OfType<CreateTableOperation>().Count());
        Assert.All(migration.UpOperations.OfType<AddColumnOperation>(), x => Assert.Equal("LegacyTotal", x.DefaultValue));
        var sql = db.GetService<IMigrator>().GenerateScript("20260908114035_AddManualUsageRightLifecycle");
        Assert.Contains("decimal(18,2)", sql, StringComparison.Ordinal);
        Assert.Contains("CREATE UNIQUE INDEX [IX_NoticeDraftLineItems_NoticeDraftId_Position]", sql, StringComparison.Ordinal);
        Assert.DoesNotContain("UPDATE ", sql, StringComparison.Ordinal);
        Assert.DoesNotContain("DELETE ", sql, StringComparison.Ordinal);
        Assert.DoesNotContain("DROP ", sql, StringComparison.Ordinal);
        Assert.DoesNotContain("ReadFeeItems", sql, StringComparison.Ordinal);
    }
}
