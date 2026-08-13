using Cemaris.Infrastructure.Persistence.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.Persistence;

/// <summary>
/// Technical EF Core entry point for the deliberately narrow MVP read model.
/// The mappings are not an approved final cemetery domain model.
/// </summary>
public sealed class CemarisDbContext(DbContextOptions<CemarisDbContext> options) : DbContext(options)
{
    public DbSet<CaseReadEntity> Cases => Set<CaseReadEntity>();

    public DbSet<GraveReadEntity> Graves => Set<GraveReadEntity>();

    public DbSet<DeceasedReadEntity> DeceasedPersons => Set<DeceasedReadEntity>();

    public DbSet<BurialReadEntity> Burials => Set<BurialReadEntity>();

    public DbSet<UsageRightReadEntity> UsageRights => Set<UsageRightReadEntity>();

    public DbSet<EntitledPersonReadEntity> EntitledPersons => Set<EntitledPersonReadEntity>();

    public DbSet<NoticeReadEntity> Notices => Set<NoticeReadEntity>();

    public DbSet<CaseChangeEntity> CaseChanges => Set<CaseChangeEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        ConfigureCase(modelBuilder);
        ConfigureCaseChange(modelBuilder);
        ConfigureGrave(modelBuilder);
        ConfigureDeceasedPerson(modelBuilder);
        ConfigureBurial(modelBuilder);
        ConfigureUsageRight(modelBuilder);
        ConfigureEntitledPerson(modelBuilder);
        ConfigureNotice(modelBuilder);
        ConfigureDataQualityNote(modelBuilder);
    }

    private static void ConfigureCase(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CaseReadEntity>();
        entity.ToTable("ReadCases");
        entity.HasKey(item => item.Id);
        entity.Property(item => item.IsSynthetic).IsRequired();
        entity.Property(item => item.Version).IsConcurrencyToken().IsRequired();
        entity.Property(item => item.LastChangedByActorId).HasMaxLength(200);
        entity.Property(item => item.LastChangedByActorName).HasMaxLength(200);
        entity.HasOne(item => item.Grave)
            .WithOne(item => item.Case)
            .HasForeignKey<GraveReadEntity>(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureCaseChange(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CaseChangeEntity>();
        entity.ToTable("CaseChanges");
        entity.HasKey(item => item.Id);
        entity.Property(item => item.ActorId).HasMaxLength(200).IsRequired();
        entity.Property(item => item.ActorDisplayName).HasMaxLength(200).IsRequired();
        entity.Property(item => item.Operation).HasMaxLength(64).IsRequired();
        entity.HasIndex(item => new { item.CaseId, item.ResultingVersion }).IsUnique();
        entity.HasOne(item => item.Case)
            .WithMany(item => item.Changes)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private static void ConfigureGrave(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<GraveReadEntity>();
        entity.ToTable("ReadGraves");
        entity.HasKey(item => item.CaseId);
        entity.Property(item => item.Cemetery).HasMaxLength(200).IsRequired();
        entity.Property(item => item.Field).HasMaxLength(100);
        entity.Property(item => item.GraveNumber).HasMaxLength(100);
    }

    private static void ConfigureDeceasedPerson(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<DeceasedReadEntity>();
        entity.ToTable("ReadDeceasedPersons");
        entity.HasKey(item => item.Id);
        entity.Property(item => item.FirstName).HasMaxLength(200);
        entity.Property(item => item.LastName).HasMaxLength(200);
        entity.HasOne(item => item.Case)
            .WithMany(item => item.DeceasedPersons)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureBurial(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<BurialReadEntity>();
        entity.ToTable("ReadBurials");
        entity.HasKey(item => item.Id);
        entity.HasOne(item => item.Case)
            .WithMany(item => item.Burials)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(item => item.DeceasedPerson)
            .WithMany(item => item.Burials)
            .HasForeignKey(item => item.DeceasedPersonId)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private static void ConfigureUsageRight(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<UsageRightReadEntity>();
        entity.ToTable("ReadUsageRights");
        entity.HasKey(item => item.Id);
        entity.Property(item => item.Reference).HasMaxLength(100);
        entity.HasOne(item => item.Case)
            .WithMany(item => item.UsageRights)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);

        var holder = modelBuilder.Entity<UsageRightHolderReadEntity>();
        holder.ToTable("ReadUsageRightHolders");
        holder.HasKey(item => item.Id);
        holder.HasIndex(item => new { item.UsageRightId, item.EntitledPersonId }).IsUnique();
        holder.HasOne(item => item.UsageRight)
            .WithMany(item => item.Holders)
            .HasForeignKey(item => item.UsageRightId)
            .OnDelete(DeleteBehavior.Cascade);
        holder.HasOne(item => item.EntitledPerson)
            .WithMany(item => item.UsageRights)
            .HasForeignKey(item => item.EntitledPersonId)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private static void ConfigureEntitledPerson(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<EntitledPersonReadEntity>();
        entity.ToTable("ReadEntitledPersons");
        entity.HasKey(item => item.Id);
        entity.Property(item => item.FirstName).HasMaxLength(200);
        entity.Property(item => item.LastName).HasMaxLength(200);
        entity.Property(item => item.OrganizationName).HasMaxLength(250);
        entity.HasOne(item => item.Case)
            .WithMany(item => item.EntitledPersons)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);

        var address = modelBuilder.Entity<AddressReadEntity>();
        address.ToTable("ReadAddresses");
        address.HasKey(item => item.Id);
        address.Property(item => item.Street).HasMaxLength(200);
        address.Property(item => item.HouseNumber).HasMaxLength(30);
        address.Property(item => item.PostalCode).HasMaxLength(20);
        address.Property(item => item.City).HasMaxLength(200);
        address.Property(item => item.AdditionalInformation).HasMaxLength(250);
        address.HasOne(item => item.EntitledPerson)
            .WithMany(item => item.Addresses)
            .HasForeignKey(item => item.EntitledPersonId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureNotice(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<NoticeReadEntity>();
        entity.ToTable("ReadNotices");
        entity.HasKey(item => item.Id);
        entity.Property(item => item.NoticeNumber).HasMaxLength(100);
        entity.Property(item => item.AssessedAmount).HasPrecision(18, 2);
        entity.Property(item => item.CurrencyCode).HasMaxLength(3);
        entity.HasOne(item => item.Case)
            .WithMany(item => item.Notices)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);

        var feeItem = modelBuilder.Entity<FeeItemReadEntity>();
        feeItem.ToTable("ReadFeeItems");
        feeItem.HasKey(item => item.Id);
        feeItem.Property(item => item.Description).HasMaxLength(250);
        feeItem.Property(item => item.Amount).HasPrecision(18, 2);
        feeItem.Property(item => item.CurrencyCode).HasMaxLength(3);
        feeItem.HasOne(item => item.Notice)
            .WithMany(item => item.FeeItems)
            .HasForeignKey(item => item.NoticeId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureDataQualityNote(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<DataQualityNoteReadEntity>();
        entity.ToTable("ReadDataQualityNotes");
        entity.HasKey(item => item.Id);
        entity.Property(item => item.Text).HasMaxLength(1000).IsRequired();
        entity.HasOne(item => item.Case)
            .WithMany(item => item.DataQualityNotes)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
