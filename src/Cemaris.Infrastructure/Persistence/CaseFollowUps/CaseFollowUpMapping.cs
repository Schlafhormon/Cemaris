using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cemaris.Infrastructure.Persistence.CaseFollowUps;

internal static class CaseFollowUpMapping
{
    internal static void Configure(ModelBuilder model)
    {
        var entry = model.Entity<CaseFollowUpEntity>();
        Facts(entry, "CaseFollowUps");
        entry.Property(x => x.Version).IsConcurrencyToken();
        entry.HasAlternateKey(x => new { x.Id, x.CaseId });
        entry.HasOne(x => x.Case).WithMany().HasForeignKey(x => x.CaseId).OnDelete(DeleteBehavior.NoAction);
        entry.HasIndex(x => new { x.DueDate, x.CreatedAtUtc, x.Id });
        entry.HasIndex(x => new { x.Status, x.DueDate, x.CreatedAtUtc, x.Id });
        entry.HasIndex(x => new { x.CaseId, x.Status, x.DueDate, x.CreatedAtUtc, x.Id });
        entry.HasIndex(x => new { x.CaseId, x.DueDate, x.CreatedAtUtc, x.Id });

        var revision = model.Entity<CaseFollowUpRevisionEntity>();
        Facts(revision, "CaseFollowUpRevisions");
        revision.Property(x => x.Operation).HasMaxLength(32).IsRequired();
        revision.Property(x => x.Reason).HasMaxLength(1000);
        revision.Property(x => x.ActorId).HasMaxLength(200).IsRequired();
        revision.Property(x => x.ActorDisplayName).HasMaxLength(200).IsRequired();
        revision.HasIndex(x => new { x.FollowUpId, x.Version }).IsUnique();
        revision.HasOne<CaseFollowUpEntity>().WithMany(x => x.Revisions)
            .HasForeignKey(x => new { x.FollowUpId, x.CaseId }).HasPrincipalKey(x => new { x.Id, x.CaseId })
            .OnDelete(DeleteBehavior.NoAction);
        revision.ToTable("CaseFollowUpRevisions", t => t.HasCheckConstraint("CK_CaseFollowUpRevisions_OperationReason",
            "([Operation] = N'Created' AND [Version] = 1 AND [Reason] IS NULL) OR ([Operation] IN (N'Changed', N'Completed', N'Cancelled', N'Reopened') AND [Version] > 1 AND [Reason] IS NOT NULL AND LEN(LTRIM(RTRIM([Reason]))) > 0)"));

        var audit = model.Entity<CaseFollowUpAuditEntity>();
        audit.ToTable("CaseFollowUpAudits");
        audit.HasKey(x => x.Id);
        audit.Property(x => x.Operation).HasMaxLength(32).IsRequired();
        audit.Property(x => x.ActorId).HasMaxLength(200).IsRequired();
        audit.HasIndex(x => new { x.FollowUpId, x.ResultingVersion }).IsUnique();
        audit.HasOne<CaseFollowUpEntity>().WithMany().HasForeignKey(x => new { x.FollowUpId, x.CaseId })
            .HasPrincipalKey(x => new { x.Id, x.CaseId }).OnDelete(DeleteBehavior.NoAction);
    }

    private static void Facts<T>(EntityTypeBuilder<T> entity, string table) where T : class
    {
        entity.ToTable(table, t =>
        {
            t.HasCheckConstraint($"CK_{table}_Status", "[Status] IN (N'Open', N'Completed', N'Cancelled')");
            t.HasCheckConstraint($"CK_{table}_Version", "[Version] > 0");
            t.HasCheckConstraint($"CK_{table}_Title", "LEN(LTRIM(RTRIM([Title]))) > 0");
        });
        entity.HasKey("Id");
        entity.Property<string>("Title").HasMaxLength(200).IsRequired();
        entity.Property<string?>("Description").HasMaxLength(2000);
        entity.Property<string>("Status").HasMaxLength(32).IsRequired();
        entity.Property<DateOnly>("DueDate").HasColumnType("date");
    }
}
