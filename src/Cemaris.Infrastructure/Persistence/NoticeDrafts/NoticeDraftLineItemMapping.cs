using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.Persistence.NoticeDrafts;

internal static class NoticeDraftLineItemMapping
{
    internal static void Configure(ModelBuilder model)
    {
        model.Entity<NoticeDraftEntity>().Property(x => x.AmountMode).HasMaxLength(16).HasDefaultValue("LegacyTotal").IsRequired();
        model.Entity<NoticeDraftRevisionEntity>().Property(x => x.AmountMode).HasMaxLength(16).HasDefaultValue("LegacyTotal").IsRequired();
        model.Entity<NoticeDraftEntity>().ToTable("NoticeDrafts", t => t.HasCheckConstraint("CK_NoticeDrafts_AmountMode", "[AmountMode] IN (N'LegacyTotal', N'LineItems')"));
        model.Entity<NoticeDraftRevisionEntity>().ToTable("NoticeDraftRevisions", t => t.HasCheckConstraint("CK_NoticeDraftRevisions_AmountMode", "[AmountMode] IN (N'LegacyTotal', N'LineItems')"));
        var current = model.Entity<NoticeDraftLineItemEntity>();
        current.ToTable("NoticeDraftLineItems", t =>
        {
            t.HasCheckConstraint("CK_NoticeDraftLineItems_Values", "[Position] BETWEEN 1 AND 100 AND [Amount] > 0 AND LEN(LTRIM(RTRIM([Description]))) > 0");
        });
        current.HasKey(x => x.Id);
        current.Property(x => x.Id).ValueGeneratedNever();
        current.Property(x => x.Description).HasMaxLength(500).IsRequired();
        current.Property(x => x.Amount).HasPrecision(18, 2);
        current.HasIndex(x => new { x.NoticeDraftId, x.Position }).IsUnique();
        current.HasOne<NoticeDraftEntity>().WithMany(x => x.LineItems).HasForeignKey(x => x.NoticeDraftId).OnDelete(DeleteBehavior.NoAction);
        var history = model.Entity<NoticeDraftRevisionLineItemEntity>();
        history.ToTable("NoticeDraftRevisionLineItems", t =>
        {
            t.HasCheckConstraint("CK_NoticeDraftRevisionLineItems_Values", "[Position] BETWEEN 1 AND 100 AND [Amount] > 0 AND LEN(LTRIM(RTRIM([Description]))) > 0");
        });
        history.HasKey(x => new { x.NoticeDraftRevisionId, x.LineItemId });
        history.Property(x => x.Description).HasMaxLength(500).IsRequired();
        history.Property(x => x.Amount).HasPrecision(18, 2);
        history.HasIndex(x => new { x.NoticeDraftRevisionId, x.Position }).IsUnique();
        history.HasOne<NoticeDraftRevisionEntity>().WithMany(x => x.LineItems).HasForeignKey(x => x.NoticeDraftRevisionId).OnDelete(DeleteBehavior.NoAction);
    }
}
