using Cemaris.Infrastructure.Persistence.Cemeteries;
using Cemaris.Infrastructure.Persistence.Identity;
using Cemaris.Infrastructure.Persistence.PersonUsageRights;
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

    public DbSet<LocalAccountEntity> LocalAccounts => Set<LocalAccountEntity>();
    public DbSet<CemeteryEntity> Cemeteries => Set<CemeteryEntity>();
    public DbSet<CemeteryAreaEntity> CemeteryAreas => Set<CemeteryAreaEntity>();
    public DbSet<CemeteryFieldEntity> CemeteryFields => Set<CemeteryFieldEntity>();
    public DbSet<CemeteryRowEntity> CemeteryRows => Set<CemeteryRowEntity>();
    public DbSet<GraveTypeEntity> GraveTypes => Set<GraveTypeEntity>();
    public DbSet<CemeteryGraveTypeEntity> CemeteryGraveTypes => Set<CemeteryGraveTypeEntity>();
    public DbSet<GraveSiteEntity> GraveSites => Set<GraveSiteEntity>();
    public DbSet<CemeteryMasterDataChangeEntity> CemeteryMasterDataChanges => Set<CemeteryMasterDataChangeEntity>();
    public DbSet<PartyEntity> Parties => Set<PartyEntity>();
    public DbSet<PartyAddressEntity> PartyAddresses => Set<PartyAddressEntity>();
    public DbSet<PartyRevisionEntity> PartyRevisions => Set<PartyRevisionEntity>();
    public DbSet<UsageRightEntity> CanonicalUsageRights => Set<UsageRightEntity>();
    public DbSet<UsageRightHolderPeriodEntity> UsageRightHolderPeriods => Set<UsageRightHolderPeriodEntity>();
    public DbSet<UsageRightRevisionEntity> UsageRightRevisions => Set<UsageRightRevisionEntity>();
    public DbSet<UsageRightStartRuleEntity> UsageRightStartRules => Set<UsageRightStartRuleEntity>();
    public DbSet<UsageRightStartRuleRevisionEntity> UsageRightStartRuleRevisions => Set<UsageRightStartRuleRevisionEntity>();
    public DbSet<PersonUsageRightAuditEntity> PersonUsageRightAudits => Set<PersonUsageRightAuditEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        ConfigureCase(modelBuilder);
        ConfigureLocalAccount(modelBuilder);
        ConfigureCaseChange(modelBuilder);
        ConfigureGrave(modelBuilder);
        ConfigureDeceasedPerson(modelBuilder);
        ConfigureBurial(modelBuilder);
        ConfigureUsageRight(modelBuilder);
        ConfigureEntitledPerson(modelBuilder);
        ConfigureNotice(modelBuilder);
        ConfigureDataQualityNote(modelBuilder);
        ConfigureCemeteryMasterData(modelBuilder);
        ConfigurePersonUsageRights(modelBuilder);
    }

    private static void ConfigurePersonUsageRights(ModelBuilder modelBuilder)
    {
        var party = modelBuilder.Entity<PartyEntity>();
        party.ToTable("Parties", table => table.HasCheckConstraint("CK_Parties_TypeNames", "([PartyType] = N'NaturalPerson' AND [FirstName] IS NOT NULL AND [LastName] IS NOT NULL AND [OrganizationName] IS NULL) OR ([PartyType] = N'Organization' AND [FirstName] IS NULL AND [LastName] IS NULL AND [OrganizationName] IS NOT NULL)"));
        party.HasKey(x => x.Id); party.Property(x => x.PartyType).HasMaxLength(32).IsRequired(); party.Property(x => x.FirstName).HasMaxLength(200); party.Property(x => x.LastName).HasMaxLength(200); party.Property(x => x.OrganizationName).HasMaxLength(250); party.Property(x => x.NormalizedName).HasMaxLength(500).IsRequired(); party.Property(x => x.Version).IsConcurrencyToken();

        var address = modelBuilder.Entity<PartyAddressEntity>();
        address.ToTable("PartyAddresses", table => table.HasCheckConstraint("CK_PartyAddresses_Period", "[ValidUntilExclusive] IS NULL OR [ValidUntilExclusive] > [ValidFromInclusive]"));
        address.HasKey(x => x.Id); address.Property(x => x.Street).HasMaxLength(200).IsRequired(); address.Property(x => x.HouseNumber).HasMaxLength(30).IsRequired(); address.Property(x => x.PostalCode).HasMaxLength(20).IsRequired(); address.Property(x => x.City).HasMaxLength(200).IsRequired(); address.Property(x => x.AdditionalInformation).HasMaxLength(250); address.Property(x => x.NormalizedAddress).HasMaxLength(1000).IsRequired();
        address.HasAlternateKey(x => new { x.PartyId, x.Id });
        address.HasOne(x => x.Party).WithMany(x => x.Addresses).HasForeignKey(x => x.PartyId).OnDelete(DeleteBehavior.NoAction);
        party.HasOne<PartyAddressEntity>().WithMany()
            .HasForeignKey(nameof(PartyEntity.Id), nameof(PartyEntity.CurrentPrimaryAddressId))
            .HasPrincipalKey(nameof(PartyAddressEntity.PartyId), nameof(PartyAddressEntity.Id))
            .OnDelete(DeleteBehavior.NoAction);

        var partyRevision = modelBuilder.Entity<PartyRevisionEntity>(); ConfigureRevision(partyRevision, "PartyRevisions"); partyRevision.HasIndex(x => new { x.PartyId, x.ResultingVersion }).IsUnique(); partyRevision.Property(x => x.StateJson).HasColumnType("nvarchar(max)").IsRequired(); partyRevision.HasOne<PartyEntity>().WithMany(x => x.Revisions).HasForeignKey(x => x.PartyId).OnDelete(DeleteBehavior.NoAction);

        var right = modelBuilder.Entity<UsageRightEntity>(); right.ToTable("CanonicalUsageRights", table => table.HasCheckConstraint("CK_CanonicalUsageRights_Dates", "[EndDate] > [StartDate]")); right.HasKey(x => x.Id); right.Property(x => x.SourceReference).HasMaxLength(250).IsRequired(); right.Property(x => x.StartRuleCodeSnapshot).HasMaxLength(50).IsRequired(); right.Property(x => x.StartRuleDisplayNameSnapshot).HasMaxLength(200).IsRequired(); right.Property(x => x.Version).IsConcurrencyToken(); right.HasIndex(x => x.GraveSiteId).IsUnique(); right.HasOne<Cemeteries.GraveSiteEntity>().WithMany().HasForeignKey(x => x.GraveSiteId).OnDelete(DeleteBehavior.NoAction); right.HasOne<UsageRightStartRuleEntity>().WithMany().HasForeignKey(x => x.UsageRightStartRuleId).OnDelete(DeleteBehavior.NoAction);
        var holder = modelBuilder.Entity<UsageRightHolderPeriodEntity>(); holder.ToTable("UsageRightHolderPeriods", table => table.HasCheckConstraint("CK_UsageRightHolderPeriods_Period", "[ValidUntilExclusive] IS NULL OR [ValidUntilExclusive] > [ValidFromInclusive]")); holder.HasKey(x => x.Id); holder.HasIndex(x => x.UsageRightId).IsUnique().HasFilter("[ValidUntilExclusive] IS NULL"); holder.HasOne<UsageRightEntity>().WithMany(x => x.HolderPeriods).HasForeignKey(x => x.UsageRightId).OnDelete(DeleteBehavior.NoAction); holder.HasOne<PartyEntity>().WithMany().HasForeignKey(x => x.PartyId).OnDelete(DeleteBehavior.NoAction);
        var rightRevision = modelBuilder.Entity<UsageRightRevisionEntity>(); ConfigureRevision(rightRevision, "UsageRightRevisions"); rightRevision.HasIndex(x => new { x.UsageRightId, x.ResultingVersion }).IsUnique(); rightRevision.Property(x => x.StateJson).HasColumnType("nvarchar(max)").IsRequired(); rightRevision.HasOne<UsageRightEntity>().WithMany(x => x.Revisions).HasForeignKey(x => x.UsageRightId).OnDelete(DeleteBehavior.NoAction);

        var rule = modelBuilder.Entity<UsageRightStartRuleEntity>(); rule.ToTable("UsageRightStartRules"); rule.HasKey(x => x.Id); rule.Property(x => x.Code).HasMaxLength(50).IsRequired(); rule.Property(x => x.DisplayName).HasMaxLength(200).IsRequired(); rule.Property(x => x.Version).IsConcurrencyToken(); rule.HasIndex(x => x.CemeteryId).IsUnique(); rule.HasOne<CemeteryEntity>().WithMany().HasForeignKey(x => x.CemeteryId).OnDelete(DeleteBehavior.NoAction);
        var ruleRevision = modelBuilder.Entity<UsageRightStartRuleRevisionEntity>(); ConfigureRevision(ruleRevision, "UsageRightStartRuleRevisions"); ruleRevision.Property(x => x.Code).HasMaxLength(50).IsRequired(); ruleRevision.Property(x => x.DisplayName).HasMaxLength(200).IsRequired(); ruleRevision.HasIndex(x => new { x.UsageRightStartRuleId, x.ResultingVersion }).IsUnique(); ruleRevision.HasOne<UsageRightStartRuleEntity>().WithMany(x => x.Revisions).HasForeignKey(x => x.UsageRightStartRuleId).OnDelete(DeleteBehavior.NoAction);

        var audit = modelBuilder.Entity<PersonUsageRightAuditEntity>(); audit.ToTable("PersonUsageRightAudits"); audit.HasKey(x => x.Id); audit.Property(x => x.EntityType).HasMaxLength(64).IsRequired(); audit.Property(x => x.Operation).HasMaxLength(64).IsRequired(); audit.Property(x => x.ActorId).HasMaxLength(200).IsRequired(); audit.Property(x => x.ActorDisplayName).HasMaxLength(200).IsRequired(); audit.HasIndex(x => new { x.EntityType, x.EntityId, x.ResultingVersion }).IsUnique();
    }

    private static void ConfigureRevision<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<T> entity, string table) where T : class
    {
        entity.ToTable(table); entity.HasKey("Id"); entity.Property<string>("MutationType").HasMaxLength(64).IsRequired(); entity.Property<string>("Reason").HasMaxLength(1000); entity.Property<string>("ActorId").HasMaxLength(200).IsRequired(); entity.Property<string>("ActorDisplayName").HasMaxLength(200).IsRequired();
    }

    private static void ConfigureLocalAccount(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<LocalAccountEntity>();
        entity.ToTable("LocalAccounts", table =>
        {
            table.HasCheckConstraint(
                "CK_LocalAccounts_Role",
                "[Role] IN (N'Sachbearbeitung', N'Administration')");
            table.HasCheckConstraint(
                "CK_LocalAccounts_FailedLoginAttempts",
                "[FailedLoginAttempts] >= 0 AND [FailedLoginAttempts] <= 5");
        });
        entity.HasKey(item => item.Id);
        entity.Property(item => item.Username).HasMaxLength(100).IsRequired();
        entity.Property(item => item.NormalizedUsername).HasMaxLength(100).IsRequired();
        entity.Property(item => item.DisplayName).HasMaxLength(200).IsRequired();
        entity.Property(item => item.Role).HasMaxLength(32).IsRequired();
        entity.Property(item => item.PasswordHash).HasMaxLength(1000).IsRequired();
        entity.Property(item => item.Version).IsRowVersion();
        entity.HasIndex(item => item.NormalizedUsername).IsUnique();
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
        entity.HasOne(item => item.GraveSite)
            .WithMany()
            .HasForeignKey(item => item.GraveSiteId)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private static void ConfigureCemeteryMasterData(ModelBuilder modelBuilder)
    {
        ConfigureCemetery(modelBuilder.Entity<CemeteryEntity>());
        ConfigureLevel(modelBuilder.Entity<CemeteryAreaEntity>(), "CemeteryAreas", "CemeteryId", "Cemeteries");
        ConfigureLevel(modelBuilder.Entity<CemeteryFieldEntity>(), "CemeteryFields", "AreaId", "CemeteryAreas");
        ConfigureLevel(modelBuilder.Entity<CemeteryRowEntity>(), "CemeteryRows", "FieldId", "CemeteryFields");

        var graveType = modelBuilder.Entity<GraveTypeEntity>();
        graveType.ToTable("GraveTypes", table => table.HasCheckConstraint("CK_GraveTypes_BurialForm", "[BurialForm] IN (N'EarthBurial', N'UrnBurial', N'Mixed')"));
        ConfigureVersioned(graveType);
        ConfigureNameAndCode(graveType);
        graveType.Property(x => x.BurialForm).HasMaxLength(32).IsRequired();
        graveType.Property(x => x.Note).HasMaxLength(2000);
        graveType.HasIndex(x => x.NormalizedName).IsUnique();
        graveType.HasIndex(x => x.NormalizedCode).IsUnique().HasFilter("[NormalizedCode] IS NOT NULL");

        var assignment = modelBuilder.Entity<CemeteryGraveTypeEntity>();
        assignment.ToTable("CemeteryGraveTypes");
        ConfigureVersioned(assignment);
        assignment.HasIndex(x => new { x.CemeteryId, x.GraveTypeId }).IsUnique();
        assignment.HasOne<CemeteryEntity>().WithMany().HasForeignKey(x => x.CemeteryId).OnDelete(DeleteBehavior.NoAction);
        assignment.HasOne<GraveTypeEntity>().WithMany().HasForeignKey(x => x.GraveTypeId).OnDelete(DeleteBehavior.NoAction);

        var graveSite = modelBuilder.Entity<GraveSiteEntity>();
        graveSite.ToTable("GraveSites", table =>
        {
            table.HasCheckConstraint("CK_GraveSites_Status", "[Status] IN (N'Available', N'Reserved', N'Occupied')");
            table.HasCheckConstraint("CK_GraveSites_TargetCapacity", "[TargetCapacity] IS NULL OR [TargetCapacity] > 0");
            table.HasCheckConstraint("CK_GraveSites_OptionalHierarchy", "([AreaId] IS NOT NULL OR ([FieldId] IS NULL AND [RowId] IS NULL)) AND ([FieldId] IS NOT NULL OR [RowId] IS NULL)");
        });
        ConfigureVersioned(graveSite);
        graveSite.Property(x => x.GraveNumber).HasMaxLength(50).IsRequired();
        graveSite.Property(x => x.NormalizedGraveNumber).HasMaxLength(50).IsRequired();
        graveSite.Property(x => x.Status).HasMaxLength(32).IsRequired();
        graveSite.Property(x => x.BlockNote).HasMaxLength(2000);
        graveSite.Property(x => x.Note).HasMaxLength(2000);
        graveSite.HasIndex(x => new { x.CemeteryId, x.NormalizedGraveNumber }).IsUnique()
            .HasFilter("[AreaId] IS NULL AND [FieldId] IS NULL AND [RowId] IS NULL");
        graveSite.HasIndex(x => new { x.CemeteryId, x.AreaId, x.NormalizedGraveNumber }).IsUnique()
            .HasFilter("[AreaId] IS NOT NULL AND [FieldId] IS NULL AND [RowId] IS NULL");
        graveSite.HasIndex(x => new { x.CemeteryId, x.AreaId, x.FieldId, x.NormalizedGraveNumber }).IsUnique()
            .HasFilter("[AreaId] IS NOT NULL AND [FieldId] IS NOT NULL AND [RowId] IS NULL");
        graveSite.HasIndex(x => new { x.CemeteryId, x.AreaId, x.FieldId, x.RowId, x.NormalizedGraveNumber }).IsUnique()
            .HasFilter("[AreaId] IS NOT NULL AND [FieldId] IS NOT NULL AND [RowId] IS NOT NULL");
        graveSite.HasOne(x => x.Cemetery).WithMany().HasForeignKey(x => x.CemeteryId).OnDelete(DeleteBehavior.NoAction);
        graveSite.HasOne(x => x.Area).WithMany().HasForeignKey(x => x.AreaId).OnDelete(DeleteBehavior.NoAction);
        graveSite.HasOne(x => x.Field).WithMany().HasForeignKey(x => x.FieldId).OnDelete(DeleteBehavior.NoAction);
        graveSite.HasOne(x => x.Row).WithMany().HasForeignKey(x => x.RowId).OnDelete(DeleteBehavior.NoAction);
        graveSite.HasOne(x => x.GraveType).WithMany().HasForeignKey(x => x.GraveTypeId).OnDelete(DeleteBehavior.NoAction);

        var change = modelBuilder.Entity<CemeteryMasterDataChangeEntity>();
        change.ToTable("CemeteryMasterDataChanges");
        change.HasKey(x => x.Id);
        change.Property(x => x.EntityKind).HasMaxLength(32).IsRequired();
        change.Property(x => x.ActorId).HasMaxLength(200).IsRequired();
        change.Property(x => x.ActorDisplayName).HasMaxLength(200).IsRequired();
        change.Property(x => x.Operation).HasMaxLength(32).IsRequired();
        change.HasIndex(x => new { x.EntityKind, x.EntityId, x.ResultingVersion }).IsUnique();
    }

    private static void ConfigureCemetery(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<CemeteryEntity> entity)
    {
        entity.ToTable("Cemeteries");
        ConfigureVersioned(entity);
        ConfigureNameAndCode(entity);
        entity.Property(x => x.Address).HasMaxLength(500);
        entity.Property(x => x.Note).HasMaxLength(2000);
        entity.HasIndex(x => x.NormalizedName).IsUnique();
        entity.HasIndex(x => x.NormalizedCode).IsUnique().HasFilter("[NormalizedCode] IS NOT NULL");
    }

    private static void ConfigureLevel<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<T> entity, string table, string parentColumn, string parentTable) where T : CemeteryLevelEntity
    {
        entity.ToTable(table);
        ConfigureVersioned(entity);
        ConfigureNameAndCode(entity);
        entity.Property(x => x.ParentId).HasColumnName(parentColumn);
        entity.Property(x => x.Note).HasMaxLength(2000);
        entity.HasIndex(x => new { x.ParentId, x.NormalizedName }).IsUnique();
        entity.HasIndex(x => new { x.ParentId, x.NormalizedCode }).IsUnique().HasFilter("[NormalizedCode] IS NOT NULL");
        entity.HasOne(parentTable == "Cemeteries" ? typeof(CemeteryEntity) : parentTable == "CemeteryAreas" ? typeof(CemeteryAreaEntity) : typeof(CemeteryFieldEntity))
            .WithMany().HasForeignKey(nameof(CemeteryLevelEntity.ParentId)).OnDelete(DeleteBehavior.NoAction);
    }

    private static void ConfigureVersioned<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<T> entity) where T : VersionedMasterDataEntity
    {
        entity.HasKey(x => x.Id);
        entity.Property(x => x.IsActive).IsRequired();
        entity.Property(x => x.Version).IsConcurrencyToken().IsRequired();
    }

    private static void ConfigureNameAndCode<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<T> entity) where T : VersionedMasterDataEntity
    {
        entity.Property("Name").HasMaxLength(200).IsRequired();
        entity.Property("NormalizedName").HasMaxLength(200).IsRequired();
        entity.Property("Code").HasMaxLength(50);
        entity.Property("NormalizedCode").HasMaxLength(50);
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
        entity.ToTable("ReadBurials", table => table.HasCheckConstraint(
            "CK_ReadBurials_ProcessStatus",
            "[ProcessStatus] IS NULL OR [ProcessStatus] IN (N'Draft', N'Planned', N'Confirmed', N'Performed', N'Completed')"));
        entity.HasKey(item => item.Id);
        entity.Property(item => item.ProcessStatus).HasMaxLength(32);
        entity.HasIndex(item => item.DeceasedPersonId)
            .IsUnique()
            .HasFilter("[DeceasedPersonId] IS NOT NULL AND [ProcessStatus] IS NOT NULL");
        entity.HasOne(item => item.Case)
            .WithMany(item => item.Burials)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(item => item.DeceasedPerson)
            .WithMany(item => item.Burials)
            .HasForeignKey(item => item.DeceasedPersonId)
            .OnDelete(DeleteBehavior.NoAction);
        entity.HasOne(item => item.GraveSite)
            .WithMany()
            .HasForeignKey(item => item.GraveSiteId)
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
