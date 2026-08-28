using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable IDE0161, CA1861

namespace Cemaris.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNoticeGenerationDraftDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactPoint",
                table: "LocalAccounts",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "LocalAccounts",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "LocalAccounts",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "LocalAccounts",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "LocalAccounts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Room",
                table: "LocalAccounts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LegalBasisVersionAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LegalBasisVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    Operation = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegalBasisVersionAudits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LegalBasisVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    VersionDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegalBasisVersions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NoticeGenerationAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NoticeDraftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExpectedNoticeDraftVersion = table.Column<long>(type: "bigint", nullable: false),
                    ActorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    Format = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    LegalBasisVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LegalBasisInternalVersion = table.Column<long>(type: "bigint", nullable: false),
                    Succeeded = table.Column<bool>(type: "bit", nullable: false),
                    ErrorCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoticeGenerationAudits", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LegalBasisVersionAudits_LegalBasisVersionId_ResultingVersion",
                table: "LegalBasisVersionAudits",
                columns: new[] { "LegalBasisVersionId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LegalBasisVersions_Name_VersionDate",
                table: "LegalBasisVersions",
                columns: new[] { "Name", "VersionDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NoticeGenerationAudits_NoticeDraftId_OccurredAtUtc",
                table: "NoticeGenerationAudits",
                columns: new[] { "NoticeDraftId", "OccurredAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LegalBasisVersionAudits");

            migrationBuilder.DropTable(
                name: "LegalBasisVersions");

            migrationBuilder.DropTable(
                name: "NoticeGenerationAudits");

            migrationBuilder.DropColumn(
                name: "ContactPoint",
                table: "LocalAccounts");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "LocalAccounts");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "LocalAccounts");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "LocalAccounts");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "LocalAccounts");

            migrationBuilder.DropColumn(
                name: "Room",
                table: "LocalAccounts");
        }
    }
}
