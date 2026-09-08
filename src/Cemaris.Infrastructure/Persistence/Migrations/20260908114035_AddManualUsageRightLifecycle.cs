using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cemaris.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddManualUsageRightLifecycle : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_CanonicalUsageRights_GraveSiteId",
            table: "CanonicalUsageRights");

        migrationBuilder.AddColumn<Guid>(
            name: "OperationId",
            table: "PersonUsageRightAudits",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<bool>(name: "ManualGrantReviewConfirmed", table: "CanonicalUsageRights", type: "bit", nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "ManualReviewConfirmed",
            table: "CanonicalUsageRights",
            type: "bit",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "OperationId",
            table: "CanonicalUsageRights",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "PredecessorId",
            table: "CanonicalUsageRights",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Status",
            table: "CanonicalUsageRights",
            type: "nvarchar(16)",
            maxLength: 16,
            nullable: false,
            defaultValue: "Open");

        migrationBuilder.AddColumn<DateOnly>(
            name: "TerminationDate",
            table: "CanonicalUsageRights",
            type: "date",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "TerminationKind",
            table: "CanonicalUsageRights",
            type: "nvarchar(16)",
            maxLength: 16,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "TerminationReason",
            table: "CanonicalUsageRights",
            type: "nvarchar(1000)",
            maxLength: 1000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "TerminationSourceReference",
            table: "CanonicalUsageRights",
            type: "nvarchar(250)",
            maxLength: 250,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_CanonicalUsageRights_GraveSiteId",
            table: "CanonicalUsageRights",
            column: "GraveSiteId",
            unique: true,
            filter: "[Status] = N'Open'");

        migrationBuilder.CreateIndex(
            name: "IX_CanonicalUsageRights_PredecessorId",
            table: "CanonicalUsageRights",
            column: "PredecessorId",
            unique: true,
            filter: "[PredecessorId] IS NOT NULL AND [Status] <> N'Voided'");

        migrationBuilder.AddCheckConstraint(
            name: "CK_CanonicalUsageRights_Status",
            table: "CanonicalUsageRights",
            sql: "[Status] IN (N'Open', N'Ended', N'Voided') AND [Version] > 0 AND ([PredecessorId] IS NULL OR [PredecessorId] <> [Id])");

        migrationBuilder.AddCheckConstraint(
            name: "CK_CanonicalUsageRights_Termination",
            table: "CanonicalUsageRights",
            sql: "([Status] = N'Open' AND [TerminationDate] IS NULL) OR ([Status] = N'Ended' AND [TerminationDate] IS NOT NULL AND [TerminationDate] > [StartDate] AND [TerminationKind] IN (N'Returned', N'Other') AND [ManualReviewConfirmed] = 1 AND [TerminationReason] IS NOT NULL AND [TerminationSourceReference] IS NOT NULL) OR [Status] = N'Voided'");

        migrationBuilder.AddForeignKey(
            name: "FK_CanonicalUsageRights_CanonicalUsageRights_PredecessorId",
            table: "CanonicalUsageRights",
            column: "PredecessorId",
            principalTable: "CanonicalUsageRights",
            principalColumn: "Id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_CanonicalUsageRights_CanonicalUsageRights_PredecessorId",
            table: "CanonicalUsageRights");

        migrationBuilder.DropIndex(
            name: "IX_CanonicalUsageRights_GraveSiteId",
            table: "CanonicalUsageRights");

        migrationBuilder.DropIndex(
            name: "IX_CanonicalUsageRights_PredecessorId",
            table: "CanonicalUsageRights");

        migrationBuilder.DropCheckConstraint(
            name: "CK_CanonicalUsageRights_Status",
            table: "CanonicalUsageRights");

        migrationBuilder.DropCheckConstraint(
            name: "CK_CanonicalUsageRights_Termination",
            table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "OperationId",
            table: "PersonUsageRightAudits");

        migrationBuilder.DropColumn(name: "ManualGrantReviewConfirmed", table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "ManualReviewConfirmed",
            table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "OperationId",
            table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "PredecessorId",
            table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "Status",
            table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "TerminationDate",
            table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "TerminationKind",
            table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "TerminationReason",
            table: "CanonicalUsageRights");

        migrationBuilder.DropColumn(
            name: "TerminationSourceReference",
            table: "CanonicalUsageRights");

        migrationBuilder.CreateIndex(
            name: "IX_CanonicalUsageRights_GraveSiteId",
            table: "CanonicalUsageRights",
            column: "GraveSiteId",
            unique: true);
    }
}
