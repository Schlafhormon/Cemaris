using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.CaseFollowUps;
using Cemaris.Infrastructure.Persistence.Migrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;

namespace Cemaris.IntegrationTests;

public sealed class CaseFollowUpSchemaTests
{
    [Fact]
    public void MigrationIstAdditivUndDasModellBesitztKeineDrift()
    {
        using var db = new CemarisDbContext(new DbContextOptionsBuilder<CemarisDbContext>()
            .UseSqlServer("Server=127.0.0.1,1;Database=Cemaris_Offline_Artifact;Integrated Security=True;Connect Timeout=1;Encrypt=True").Options);
        var migration = new AddManualCaseFollowUps();
        Assert.All(migration.UpOperations, operation => Assert.True(operation is CreateTableOperation or CreateIndexOperation));
        Assert.Equal(["CaseFollowUps", "CaseFollowUpAudits", "CaseFollowUpRevisions"],
            migration.UpOperations.OfType<CreateTableOperation>().Select(x => x.Name));
        Assert.All(migration.DownOperations, operation => Assert.StartsWith("CaseFollowUp", Assert.IsType<DropTableOperation>(operation).Name, StringComparison.Ordinal));
        Assert.False(db.Database.HasPendingModelChanges());
        var model = db.GetService<IDesignTimeModel>().Model;
        var entry = model.FindEntityType(typeof(CaseFollowUpEntity))!;
        Assert.True(entry.FindProperty("Version")!.IsConcurrencyToken);
        Assert.Equal("date", entry.FindProperty("DueDate")!.GetColumnType());
        Assert.Equal(200, entry.FindProperty("Title")!.GetMaxLength());
        Assert.Equal(2000, entry.FindProperty("Description")!.GetMaxLength());
        var audit = model.FindEntityType(typeof(CaseFollowUpAuditEntity))!;
        Assert.Equal(["ActorId", "CaseId", "FollowUpId", "Id", "OccurredAtUtc", "Operation", "ResultingVersion"], audit.GetProperties().Select(x => x.Name).Order(StringComparer.Ordinal));
        foreach (var type in new[] { typeof(CaseFollowUpRevisionEntity), typeof(CaseFollowUpAuditEntity) })
        {
            var foreignKey = Assert.Single(model.FindEntityType(type)!.GetForeignKeys());
            Assert.Equal(["FollowUpId", "CaseId"], foreignKey.Properties.Select(x => x.Name));
            Assert.Equal(DeleteBehavior.NoAction, foreignKey.DeleteBehavior);
        }
    }
}
