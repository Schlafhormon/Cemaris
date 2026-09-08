using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cemaris.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddManualCaseFollowUps : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CaseFollowUps",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                Version = table.Column<long>(type: "bigint", nullable: false),
                CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CaseFollowUps", x => x.Id);
                table.UniqueConstraint("AK_CaseFollowUps_Id_CaseId", x => new { x.Id, x.CaseId });
                table.CheckConstraint("CK_CaseFollowUps_Status", "[Status] IN (N'Open', N'Completed', N'Cancelled')");
                table.CheckConstraint("CK_CaseFollowUps_Title", "LEN(LTRIM(RTRIM([Title]))) > 0");
                table.CheckConstraint("CK_CaseFollowUps_Version", "[Version] > 0");
                table.ForeignKey(
                    name: "FK_CaseFollowUps_ReadCases_CaseId",
                    column: x => x.CaseId,
                    principalTable: "ReadCases",
                    principalColumn: "Id");
            });

        migrationBuilder.CreateTable(
            name: "CaseFollowUpAudits",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FollowUpId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                Operation = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CaseFollowUpAudits", x => x.Id);
                table.ForeignKey(
                    name: "FK_CaseFollowUpAudits_CaseFollowUps_FollowUpId_CaseId",
                    columns: x => new { x.FollowUpId, x.CaseId },
                    principalTable: "CaseFollowUps",
                    principalColumns: ["Id", "CaseId"]);
            });

        migrationBuilder.CreateTable(
            name: "CaseFollowUpRevisions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FollowUpId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                Version = table.Column<long>(type: "bigint", nullable: false),
                CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                Operation = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CaseFollowUpRevisions", x => x.Id);
                table.CheckConstraint("CK_CaseFollowUpRevisions_OperationReason", "([Operation] = N'Created' AND [Version] = 1 AND [Reason] IS NULL) OR ([Operation] IN (N'Changed', N'Completed', N'Cancelled', N'Reopened') AND [Version] > 1 AND [Reason] IS NOT NULL AND LEN(LTRIM(RTRIM([Reason]))) > 0)");
                table.CheckConstraint("CK_CaseFollowUpRevisions_Status", "[Status] IN (N'Open', N'Completed', N'Cancelled')");
                table.CheckConstraint("CK_CaseFollowUpRevisions_Title", "LEN(LTRIM(RTRIM([Title]))) > 0");
                table.CheckConstraint("CK_CaseFollowUpRevisions_Version", "[Version] > 0");
                table.ForeignKey(
                    name: "FK_CaseFollowUpRevisions_CaseFollowUps_FollowUpId_CaseId",
                    columns: x => new { x.FollowUpId, x.CaseId },
                    principalTable: "CaseFollowUps",
                    principalColumns: ["Id", "CaseId"]);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CaseFollowUpAudits_FollowUpId_CaseId",
            table: "CaseFollowUpAudits",
            columns: ["FollowUpId", "CaseId"]);

        migrationBuilder.CreateIndex(
            name: "IX_CaseFollowUpAudits_FollowUpId_ResultingVersion",
            table: "CaseFollowUpAudits",
            columns: ["FollowUpId", "ResultingVersion"],
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_CaseFollowUpRevisions_FollowUpId_CaseId",
            table: "CaseFollowUpRevisions",
            columns: ["FollowUpId", "CaseId"]);

        migrationBuilder.CreateIndex(
            name: "IX_CaseFollowUpRevisions_FollowUpId_Version",
            table: "CaseFollowUpRevisions",
            columns: ["FollowUpId", "Version"],
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_CaseFollowUps_CaseId_DueDate_CreatedAtUtc_Id",
            table: "CaseFollowUps",
            columns: ["CaseId", "DueDate", "CreatedAtUtc", "Id"]);

        migrationBuilder.CreateIndex(
            name: "IX_CaseFollowUps_CaseId_Status_DueDate_CreatedAtUtc_Id",
            table: "CaseFollowUps",
            columns: ["CaseId", "Status", "DueDate", "CreatedAtUtc", "Id"]);

        migrationBuilder.CreateIndex(
            name: "IX_CaseFollowUps_DueDate_CreatedAtUtc_Id",
            table: "CaseFollowUps",
            columns: ["DueDate", "CreatedAtUtc", "Id"]);

        migrationBuilder.CreateIndex(
            name: "IX_CaseFollowUps_Status_DueDate_CreatedAtUtc_Id",
            table: "CaseFollowUps",
            columns: ["Status", "DueDate", "CreatedAtUtc", "Id"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "CaseFollowUpAudits");

        migrationBuilder.DropTable(
            name: "CaseFollowUpRevisions");

        migrationBuilder.DropTable(
            name: "CaseFollowUps");
    }
}
