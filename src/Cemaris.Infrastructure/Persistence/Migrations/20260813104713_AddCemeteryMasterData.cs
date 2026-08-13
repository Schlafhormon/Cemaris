using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1861, IDE0161

namespace Cemaris.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCemeteryMasterData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GraveSiteId",
                table: "ReadGraves",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Cemeteries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NormalizedName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NormalizedCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cemeteries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CemeteryMasterDataChanges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityKind = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Operation = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CemeteryMasterDataChanges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GraveTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NormalizedName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NormalizedCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BurialForm = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GraveTypes", x => x.Id);
                    table.CheckConstraint("CK_GraveTypes_BurialForm", "[BurialForm] IN (N'EarthBurial', N'UrnBurial', N'Mixed')");
                });

            migrationBuilder.CreateTable(
                name: "CemeteryAreas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CemeteryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NormalizedName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NormalizedCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CemeteryAreas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CemeteryAreas_Cemeteries_CemeteryId",
                        column: x => x.CemeteryId,
                        principalTable: "Cemeteries",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CemeteryGraveTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CemeteryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GraveTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CemeteryGraveTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CemeteryGraveTypes_Cemeteries_CemeteryId",
                        column: x => x.CemeteryId,
                        principalTable: "Cemeteries",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CemeteryGraveTypes_GraveTypes_GraveTypeId",
                        column: x => x.GraveTypeId,
                        principalTable: "GraveTypes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CemeteryFields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    AreaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NormalizedName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NormalizedCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CemeteryFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CemeteryFields_CemeteryAreas_AreaId",
                        column: x => x.AreaId,
                        principalTable: "CemeteryAreas",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CemeteryRows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    FieldId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NormalizedName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NormalizedCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CemeteryRows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CemeteryRows_CemeteryFields_FieldId",
                        column: x => x.FieldId,
                        principalTable: "CemeteryFields",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GraveSites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CemeteryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AreaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FieldId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GraveTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GraveNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NormalizedGraveNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    IsBlocked = table.Column<bool>(type: "bit", nullable: false),
                    BlockNote = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    TargetCapacity = table.Column<int>(type: "int", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GraveSites", x => x.Id);
                    table.CheckConstraint("CK_GraveSites_OptionalHierarchy", "([AreaId] IS NOT NULL OR ([FieldId] IS NULL AND [RowId] IS NULL)) AND ([FieldId] IS NOT NULL OR [RowId] IS NULL)");
                    table.CheckConstraint("CK_GraveSites_Status", "[Status] IN (N'Available', N'Reserved', N'Occupied')");
                    table.CheckConstraint("CK_GraveSites_TargetCapacity", "[TargetCapacity] IS NULL OR [TargetCapacity] > 0");
                    table.ForeignKey(
                        name: "FK_GraveSites_Cemeteries_CemeteryId",
                        column: x => x.CemeteryId,
                        principalTable: "Cemeteries",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_GraveSites_CemeteryAreas_AreaId",
                        column: x => x.AreaId,
                        principalTable: "CemeteryAreas",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_GraveSites_CemeteryFields_FieldId",
                        column: x => x.FieldId,
                        principalTable: "CemeteryFields",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_GraveSites_CemeteryRows_RowId",
                        column: x => x.RowId,
                        principalTable: "CemeteryRows",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_GraveSites_GraveTypes_GraveTypeId",
                        column: x => x.GraveTypeId,
                        principalTable: "GraveTypes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReadGraves_GraveSiteId",
                table: "ReadGraves",
                column: "GraveSiteId");

            migrationBuilder.CreateIndex(
                name: "IX_Cemeteries_NormalizedCode",
                table: "Cemeteries",
                column: "NormalizedCode",
                unique: true,
                filter: "[NormalizedCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Cemeteries_NormalizedName",
                table: "Cemeteries",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryAreas_CemeteryId_NormalizedCode",
                table: "CemeteryAreas",
                columns: new[] { "CemeteryId", "NormalizedCode" },
                unique: true,
                filter: "[NormalizedCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryAreas_CemeteryId_NormalizedName",
                table: "CemeteryAreas",
                columns: new[] { "CemeteryId", "NormalizedName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryFields_AreaId_NormalizedCode",
                table: "CemeteryFields",
                columns: new[] { "AreaId", "NormalizedCode" },
                unique: true,
                filter: "[NormalizedCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryFields_AreaId_NormalizedName",
                table: "CemeteryFields",
                columns: new[] { "AreaId", "NormalizedName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryGraveTypes_CemeteryId_GraveTypeId",
                table: "CemeteryGraveTypes",
                columns: new[] { "CemeteryId", "GraveTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryGraveTypes_GraveTypeId",
                table: "CemeteryGraveTypes",
                column: "GraveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryMasterDataChanges_EntityKind_EntityId_ResultingVersion",
                table: "CemeteryMasterDataChanges",
                columns: new[] { "EntityKind", "EntityId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryRows_FieldId_NormalizedCode",
                table: "CemeteryRows",
                columns: new[] { "FieldId", "NormalizedCode" },
                unique: true,
                filter: "[NormalizedCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CemeteryRows_FieldId_NormalizedName",
                table: "CemeteryRows",
                columns: new[] { "FieldId", "NormalizedName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GraveSites_AreaId",
                table: "GraveSites",
                column: "AreaId");

            migrationBuilder.CreateIndex(
                name: "IX_GraveSites_CemeteryId_AreaId_FieldId_NormalizedGraveNumber",
                table: "GraveSites",
                columns: new[] { "CemeteryId", "AreaId", "FieldId", "NormalizedGraveNumber" },
                unique: true,
                filter: "[AreaId] IS NOT NULL AND [FieldId] IS NOT NULL AND [RowId] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GraveSites_CemeteryId_AreaId_FieldId_RowId_NormalizedGraveNumber",
                table: "GraveSites",
                columns: new[] { "CemeteryId", "AreaId", "FieldId", "RowId", "NormalizedGraveNumber" },
                unique: true,
                filter: "[AreaId] IS NOT NULL AND [FieldId] IS NOT NULL AND [RowId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GraveSites_CemeteryId_AreaId_NormalizedGraveNumber",
                table: "GraveSites",
                columns: new[] { "CemeteryId", "AreaId", "NormalizedGraveNumber" },
                unique: true,
                filter: "[AreaId] IS NOT NULL AND [FieldId] IS NULL AND [RowId] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GraveSites_CemeteryId_NormalizedGraveNumber",
                table: "GraveSites",
                columns: new[] { "CemeteryId", "NormalizedGraveNumber" },
                unique: true,
                filter: "[AreaId] IS NULL AND [FieldId] IS NULL AND [RowId] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GraveSites_FieldId",
                table: "GraveSites",
                column: "FieldId");

            migrationBuilder.CreateIndex(
                name: "IX_GraveSites_GraveTypeId",
                table: "GraveSites",
                column: "GraveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_GraveSites_RowId",
                table: "GraveSites",
                column: "RowId");

            migrationBuilder.CreateIndex(
                name: "IX_GraveTypes_NormalizedCode",
                table: "GraveTypes",
                column: "NormalizedCode",
                unique: true,
                filter: "[NormalizedCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GraveTypes_NormalizedName",
                table: "GraveTypes",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ReadGraves_GraveSites_GraveSiteId",
                table: "ReadGraves",
                column: "GraveSiteId",
                principalTable: "GraveSites",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReadGraves_GraveSites_GraveSiteId",
                table: "ReadGraves");

            migrationBuilder.DropTable(
                name: "CemeteryGraveTypes");

            migrationBuilder.DropTable(
                name: "CemeteryMasterDataChanges");

            migrationBuilder.DropTable(
                name: "GraveSites");

            migrationBuilder.DropTable(
                name: "CemeteryRows");

            migrationBuilder.DropTable(
                name: "GraveTypes");

            migrationBuilder.DropTable(
                name: "CemeteryFields");

            migrationBuilder.DropTable(
                name: "CemeteryAreas");

            migrationBuilder.DropTable(
                name: "Cemeteries");

            migrationBuilder.DropIndex(
                name: "IX_ReadGraves_GraveSiteId",
                table: "ReadGraves");

            migrationBuilder.DropColumn(
                name: "GraveSiteId",
                table: "ReadGraves");
        }
    }
}

#pragma warning restore CA1861, IDE0161
