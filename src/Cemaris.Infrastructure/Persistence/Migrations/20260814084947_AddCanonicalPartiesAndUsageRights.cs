using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1861, IDE0161

namespace Cemaris.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCanonicalPartiesAndUsageRights : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PersonUsageRightAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    Operation = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonUsageRightAudits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UsageRightStartRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CemeteryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageRightStartRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsageRightStartRules_Cemeteries_CemeteryId",
                        column: x => x.CemeteryId,
                        principalTable: "Cemeteries",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CanonicalUsageRights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GraveSiteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    SourceReference = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    UsageRightStartRuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartRuleCodeSnapshot = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StartRuleDisplayNameSnapshot = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CanonicalUsageRights", x => x.Id);
                    table.CheckConstraint("CK_CanonicalUsageRights_Dates", "[EndDate] > [StartDate]");
                    table.ForeignKey(
                        name: "FK_CanonicalUsageRights_GraveSites_GraveSiteId",
                        column: x => x.GraveSiteId,
                        principalTable: "GraveSites",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CanonicalUsageRights_UsageRightStartRules_UsageRightStartRuleId",
                        column: x => x.UsageRightStartRuleId,
                        principalTable: "UsageRightStartRules",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UsageRightStartRuleRevisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UsageRightStartRuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    MutationType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageRightStartRuleRevisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsageRightStartRuleRevisions_UsageRightStartRules_UsageRightStartRuleId",
                        column: x => x.UsageRightStartRuleId,
                        principalTable: "UsageRightStartRules",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UsageRightRevisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UsageRightId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    MutationType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StateJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageRightRevisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsageRightRevisions_CanonicalUsageRights_UsageRightId",
                        column: x => x.UsageRightId,
                        principalTable: "CanonicalUsageRights",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Parties",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartyType = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    OrganizationName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CurrentPrimaryAddressId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parties", x => x.Id);
                    table.CheckConstraint("CK_Parties_TypeNames", "([PartyType] = N'NaturalPerson' AND [FirstName] IS NOT NULL AND [LastName] IS NOT NULL AND [OrganizationName] IS NULL) OR ([PartyType] = N'Organization' AND [FirstName] IS NULL AND [LastName] IS NULL AND [OrganizationName] IS NOT NULL)");
                });

            migrationBuilder.CreateTable(
                name: "PartyAddresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Street = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    HouseNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    City = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AdditionalInformation = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    NormalizedAddress = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ValidFromInclusive = table.Column<DateOnly>(type: "date", nullable: false),
                    ValidUntilExclusive = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartyAddresses", x => x.Id);
                    table.UniqueConstraint("AK_PartyAddresses_PartyId_Id", x => new { x.PartyId, x.Id });
                    table.CheckConstraint("CK_PartyAddresses_Period", "[ValidUntilExclusive] IS NULL OR [ValidUntilExclusive] > [ValidFromInclusive]");
                    table.ForeignKey(
                        name: "FK_PartyAddresses_Parties_PartyId",
                        column: x => x.PartyId,
                        principalTable: "Parties",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PartyRevisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    MutationType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StateJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartyRevisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PartyRevisions_Parties_PartyId",
                        column: x => x.PartyId,
                        principalTable: "Parties",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UsageRightHolderPeriods",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UsageRightId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ValidFromInclusive = table.Column<DateOnly>(type: "date", nullable: false),
                    ValidUntilExclusive = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageRightHolderPeriods", x => x.Id);
                    table.CheckConstraint("CK_UsageRightHolderPeriods_Period", "[ValidUntilExclusive] IS NULL OR [ValidUntilExclusive] > [ValidFromInclusive]");
                    table.ForeignKey(
                        name: "FK_UsageRightHolderPeriods_CanonicalUsageRights_UsageRightId",
                        column: x => x.UsageRightId,
                        principalTable: "CanonicalUsageRights",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UsageRightHolderPeriods_Parties_PartyId",
                        column: x => x.PartyId,
                        principalTable: "Parties",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CanonicalUsageRights_GraveSiteId",
                table: "CanonicalUsageRights",
                column: "GraveSiteId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CanonicalUsageRights_UsageRightStartRuleId",
                table: "CanonicalUsageRights",
                column: "UsageRightStartRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_Parties_Id_CurrentPrimaryAddressId",
                table: "Parties",
                columns: new[] { "Id", "CurrentPrimaryAddressId" });

            migrationBuilder.CreateIndex(
                name: "IX_PartyRevisions_PartyId_ResultingVersion",
                table: "PartyRevisions",
                columns: new[] { "PartyId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PersonUsageRightAudits_EntityType_EntityId_ResultingVersion",
                table: "PersonUsageRightAudits",
                columns: new[] { "EntityType", "EntityId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsageRightHolderPeriods_PartyId",
                table: "UsageRightHolderPeriods",
                column: "PartyId");

            migrationBuilder.CreateIndex(
                name: "IX_UsageRightHolderPeriods_UsageRightId",
                table: "UsageRightHolderPeriods",
                column: "UsageRightId",
                unique: true,
                filter: "[ValidUntilExclusive] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UsageRightRevisions_UsageRightId_ResultingVersion",
                table: "UsageRightRevisions",
                columns: new[] { "UsageRightId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsageRightStartRuleRevisions_UsageRightStartRuleId_ResultingVersion",
                table: "UsageRightStartRuleRevisions",
                columns: new[] { "UsageRightStartRuleId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsageRightStartRules_CemeteryId",
                table: "UsageRightStartRules",
                column: "CemeteryId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Parties_PartyAddresses_Id_CurrentPrimaryAddressId",
                table: "Parties",
                columns: new[] { "Id", "CurrentPrimaryAddressId" },
                principalTable: "PartyAddresses",
                principalColumns: new[] { "PartyId", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Parties_PartyAddresses_Id_CurrentPrimaryAddressId",
                table: "Parties");

            migrationBuilder.DropTable(
                name: "PartyRevisions");

            migrationBuilder.DropTable(
                name: "PersonUsageRightAudits");

            migrationBuilder.DropTable(
                name: "UsageRightHolderPeriods");

            migrationBuilder.DropTable(
                name: "UsageRightRevisions");

            migrationBuilder.DropTable(
                name: "UsageRightStartRuleRevisions");

            migrationBuilder.DropTable(
                name: "CanonicalUsageRights");

            migrationBuilder.DropTable(
                name: "UsageRightStartRules");

            migrationBuilder.DropTable(
                name: "PartyAddresses");

            migrationBuilder.DropTable(
                name: "Parties");
        }
    }
}
