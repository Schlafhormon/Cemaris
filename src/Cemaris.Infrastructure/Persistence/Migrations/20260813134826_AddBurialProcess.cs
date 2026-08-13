using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1861, IDE0161

namespace Cemaris.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBurialProcess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ReadBurials_DeceasedPersonId",
                table: "ReadBurials");

            migrationBuilder.AddColumn<Guid>(
                name: "GraveSiteId",
                table: "ReadBurials",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PlanningDate",
                table: "ReadBurials",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessStatus",
                table: "ReadBurials",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReadBurials_DeceasedPersonId",
                table: "ReadBurials",
                column: "DeceasedPersonId",
                unique: true,
                filter: "[DeceasedPersonId] IS NOT NULL AND [ProcessStatus] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ReadBurials_GraveSiteId",
                table: "ReadBurials",
                column: "GraveSiteId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ReadBurials_ProcessStatus",
                table: "ReadBurials",
                sql: "[ProcessStatus] IS NULL OR [ProcessStatus] IN (N'Draft', N'Planned', N'Confirmed', N'Performed', N'Completed')");

            migrationBuilder.AddForeignKey(
                name: "FK_ReadBurials_GraveSites_GraveSiteId",
                table: "ReadBurials",
                column: "GraveSiteId",
                principalTable: "GraveSites",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReadBurials_GraveSites_GraveSiteId",
                table: "ReadBurials");

            migrationBuilder.DropIndex(
                name: "IX_ReadBurials_DeceasedPersonId",
                table: "ReadBurials");

            migrationBuilder.DropIndex(
                name: "IX_ReadBurials_GraveSiteId",
                table: "ReadBurials");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ReadBurials_ProcessStatus",
                table: "ReadBurials");

            migrationBuilder.DropColumn(
                name: "GraveSiteId",
                table: "ReadBurials");

            migrationBuilder.DropColumn(
                name: "PlanningDate",
                table: "ReadBurials");

            migrationBuilder.DropColumn(
                name: "ProcessStatus",
                table: "ReadBurials");

            migrationBuilder.CreateIndex(
                name: "IX_ReadBurials_DeceasedPersonId",
                table: "ReadBurials",
                column: "DeceasedPersonId");
        }
    }
}
