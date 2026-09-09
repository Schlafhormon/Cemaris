using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cemaris.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddManualNoticeDraftLineItems : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "AmountMode",
            table: "NoticeDrafts",
            type: "nvarchar(16)",
            maxLength: 16,
            nullable: false,
            defaultValue: "LegacyTotal");

        migrationBuilder.AddColumn<string>(
            name: "AmountMode",
            table: "NoticeDraftRevisions",
            type: "nvarchar(16)",
            maxLength: 16,
            nullable: false,
            defaultValue: "LegacyTotal");

        migrationBuilder.CreateTable(
            name: "NoticeDraftLineItems",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                NoticeDraftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Position = table.Column<int>(type: "int", nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NoticeDraftLineItems", x => x.Id);
                table.CheckConstraint("CK_NoticeDraftLineItems_Values", "[Position] BETWEEN 1 AND 100 AND [Amount] > 0 AND LEN(LTRIM(RTRIM([Description]))) > 0");
                table.ForeignKey(
                    name: "FK_NoticeDraftLineItems_NoticeDrafts_NoticeDraftId",
                    column: x => x.NoticeDraftId,
                    principalTable: "NoticeDrafts",
                    principalColumn: "Id");
            });

        migrationBuilder.CreateTable(
            name: "NoticeDraftRevisionLineItems",
            columns: table => new
            {
                NoticeDraftRevisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                LineItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Position = table.Column<int>(type: "int", nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NoticeDraftRevisionLineItems", x => new { x.NoticeDraftRevisionId, x.LineItemId });
                table.CheckConstraint("CK_NoticeDraftRevisionLineItems_Values", "[Position] BETWEEN 1 AND 100 AND [Amount] > 0 AND LEN(LTRIM(RTRIM([Description]))) > 0");
                table.ForeignKey(
                    name: "FK_NoticeDraftRevisionLineItems_NoticeDraftRevisions_NoticeDraftRevisionId",
                    column: x => x.NoticeDraftRevisionId,
                    principalTable: "NoticeDraftRevisions",
                    principalColumn: "Id");
            });

        migrationBuilder.AddCheckConstraint(
            name: "CK_NoticeDrafts_AmountMode",
            table: "NoticeDrafts",
            sql: "[AmountMode] IN (N'LegacyTotal', N'LineItems')");

        migrationBuilder.AddCheckConstraint(
            name: "CK_NoticeDraftRevisions_AmountMode",
            table: "NoticeDraftRevisions",
            sql: "[AmountMode] IN (N'LegacyTotal', N'LineItems')");

        migrationBuilder.CreateIndex(
            name: "IX_NoticeDraftLineItems_NoticeDraftId_Position",
            table: "NoticeDraftLineItems",
            columns: ["NoticeDraftId", "Position"],
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_NoticeDraftRevisionLineItems_NoticeDraftRevisionId_Position",
            table: "NoticeDraftRevisionLineItems",
            columns: ["NoticeDraftRevisionId", "Position"],
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "NoticeDraftLineItems");

        migrationBuilder.DropTable(
            name: "NoticeDraftRevisionLineItems");

        migrationBuilder.DropCheckConstraint(
            name: "CK_NoticeDrafts_AmountMode",
            table: "NoticeDrafts");

        migrationBuilder.DropCheckConstraint(
            name: "CK_NoticeDraftRevisions_AmountMode",
            table: "NoticeDraftRevisions");

        migrationBuilder.DropColumn(
            name: "AmountMode",
            table: "NoticeDrafts");

        migrationBuilder.DropColumn(
            name: "AmountMode",
            table: "NoticeDraftRevisions");
    }
}
