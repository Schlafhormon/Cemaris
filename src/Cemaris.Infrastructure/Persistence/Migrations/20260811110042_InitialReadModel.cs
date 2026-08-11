using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cemaris.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class InitialReadModel : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "ReadCases",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                IsSynthetic = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadCases", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "ReadDataQualityNotes",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Text = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadDataQualityNotes", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadDataQualityNotes_ReadCases_CaseId",
                    column: x => x.CaseId,
                    principalTable: "ReadCases",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReadDeceasedPersons",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FirstName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                LastName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                BirthDate = table.Column<DateOnly>(type: "date", nullable: true),
                DeathDate = table.Column<DateOnly>(type: "date", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadDeceasedPersons", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadDeceasedPersons_ReadCases_CaseId",
                    column: x => x.CaseId,
                    principalTable: "ReadCases",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReadEntitledPersons",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FirstName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                LastName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                OrganizationName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadEntitledPersons", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadEntitledPersons_ReadCases_CaseId",
                    column: x => x.CaseId,
                    principalTable: "ReadCases",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReadGraves",
            columns: table => new
            {
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Cemetery = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Field = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                GraveNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadGraves", x => x.CaseId);
                table.ForeignKey(
                    name: "FK_ReadGraves_ReadCases_CaseId",
                    column: x => x.CaseId,
                    principalTable: "ReadCases",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReadNotices",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                NoticeNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                NoticeDate = table.Column<DateOnly>(type: "date", nullable: true),
                DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                AssessedAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                CurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadNotices", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadNotices_ReadCases_CaseId",
                    column: x => x.CaseId,
                    principalTable: "ReadCases",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReadUsageRights",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                ValidFrom = table.Column<DateOnly>(type: "date", nullable: true),
                ValidUntil = table.Column<DateOnly>(type: "date", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadUsageRights", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadUsageRights_ReadCases_CaseId",
                    column: x => x.CaseId,
                    principalTable: "ReadCases",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReadBurials",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                DeceasedPersonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                BurialDate = table.Column<DateOnly>(type: "date", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadBurials", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadBurials_ReadCases_CaseId",
                    column: x => x.CaseId,
                    principalTable: "ReadCases",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_ReadBurials_ReadDeceasedPersons_DeceasedPersonId",
                    column: x => x.DeceasedPersonId,
                    principalTable: "ReadDeceasedPersons",
                    principalColumn: "Id");
            });

        migrationBuilder.CreateTable(
            name: "ReadAddresses",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                EntitledPersonId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Street = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                HouseNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                City = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                AdditionalInformation = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadAddresses", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadAddresses_ReadEntitledPersons_EntitledPersonId",
                    column: x => x.EntitledPersonId,
                    principalTable: "ReadEntitledPersons",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReadFeeItems",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                NoticeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                CurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadFeeItems", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadFeeItems_ReadNotices_NoticeId",
                    column: x => x.NoticeId,
                    principalTable: "ReadNotices",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReadUsageRightHolders",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UsageRightId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                EntitledPersonId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReadUsageRightHolders", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReadUsageRightHolders_ReadEntitledPersons_EntitledPersonId",
                    column: x => x.EntitledPersonId,
                    principalTable: "ReadEntitledPersons",
                    principalColumn: "Id");
                table.ForeignKey(
                    name: "FK_ReadUsageRightHolders_ReadUsageRights_UsageRightId",
                    column: x => x.UsageRightId,
                    principalTable: "ReadUsageRights",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_ReadAddresses_EntitledPersonId",
            table: "ReadAddresses",
            column: "EntitledPersonId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadBurials_CaseId",
            table: "ReadBurials",
            column: "CaseId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadBurials_DeceasedPersonId",
            table: "ReadBurials",
            column: "DeceasedPersonId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadDataQualityNotes_CaseId",
            table: "ReadDataQualityNotes",
            column: "CaseId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadDeceasedPersons_CaseId",
            table: "ReadDeceasedPersons",
            column: "CaseId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadEntitledPersons_CaseId",
            table: "ReadEntitledPersons",
            column: "CaseId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadFeeItems_NoticeId",
            table: "ReadFeeItems",
            column: "NoticeId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadNotices_CaseId",
            table: "ReadNotices",
            column: "CaseId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadUsageRightHolders_EntitledPersonId",
            table: "ReadUsageRightHolders",
            column: "EntitledPersonId");

        migrationBuilder.CreateIndex(
            name: "IX_ReadUsageRightHolders_UsageRightId_EntitledPersonId",
            table: "ReadUsageRightHolders",
            columns: ["UsageRightId", "EntitledPersonId"],
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_ReadUsageRights_CaseId",
            table: "ReadUsageRights",
            column: "CaseId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "ReadAddresses");

        migrationBuilder.DropTable(
            name: "ReadBurials");

        migrationBuilder.DropTable(
            name: "ReadDataQualityNotes");

        migrationBuilder.DropTable(
            name: "ReadFeeItems");

        migrationBuilder.DropTable(
            name: "ReadGraves");

        migrationBuilder.DropTable(
            name: "ReadUsageRightHolders");

        migrationBuilder.DropTable(
            name: "ReadDeceasedPersons");

        migrationBuilder.DropTable(
            name: "ReadNotices");

        migrationBuilder.DropTable(
            name: "ReadEntitledPersons");

        migrationBuilder.DropTable(
            name: "ReadUsageRights");

        migrationBuilder.DropTable(
            name: "ReadCases");
    }
}
