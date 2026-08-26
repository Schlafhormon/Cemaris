using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable IDE0161, CA1861

namespace Cemaris.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCanonicalManualNoticeDrafts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NoticeNumberConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SingletonKey = table.Column<byte>(type: "tinyint", nullable: false),
                    FinancialProduct = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RunningNumberWidth = table.Column<int>(type: "int", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoticeNumberConfigurations", x => x.Id);
                    table.CheckConstraint("CK_NoticeNumberConfigurations_Singleton", "[SingletonKey] = 1");
                    table.CheckConstraint("CK_NoticeNumberConfigurations_Width", "[RunningNumberWidth] BETWEEN 1 AND 9");
                });

            migrationBuilder.CreateTable(
                name: "NoticeNumberSequences",
                columns: table => new
                {
                    Year = table.Column<int>(type: "int", nullable: false),
                    LastIssuedNumber = table.Column<int>(type: "int", nullable: false),
                    Version = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoticeNumberSequences", x => x.Year);
                    table.CheckConstraint("CK_NoticeNumberSequences_Values", "[Year] > 0 AND [LastIssuedNumber] >= 0");
                });

            migrationBuilder.CreateTable(
                name: "NoticeDrafts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayerPartyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayerDisplayNameSnapshot = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    NoticeNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AssignmentYear = table.Column<int>(type: "int", nullable: false),
                    RunningNumber = table.Column<int>(type: "int", nullable: false),
                    NoticeNumberConfigurationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NoticeNumberConfigurationVersion = table.Column<long>(type: "bigint", nullable: false),
                    FinancialProductSnapshot = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RunningNumberWidthSnapshot = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    NoticeDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    AccountAssignment = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FeeReasonOrSource = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoticeDrafts", x => x.Id);
                    table.CheckConstraint("CK_NoticeDrafts_Amount", "[TotalAmount] > 0");
                    table.CheckConstraint("CK_NoticeDrafts_Currency", "[Currency] = N'EUR'");
                    table.CheckConstraint("CK_NoticeDrafts_NumberFacts", "[AssignmentYear] > 0 AND [RunningNumber] > 0 AND [RunningNumberWidthSnapshot] BETWEEN 1 AND 9");
                    table.CheckConstraint("CK_NoticeDrafts_Status", "[Status] IN (N'Draft', N'Discarded')");
                    table.ForeignKey(
                        name: "FK_NoticeDrafts_NoticeNumberConfigurations_NoticeNumberConfigurationId",
                        column: x => x.NoticeNumberConfigurationId,
                        principalTable: "NoticeNumberConfigurations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NoticeDrafts_Parties_PayerPartyId",
                        column: x => x.PayerPartyId,
                        principalTable: "Parties",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NoticeDrafts_ReadCases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "ReadCases",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NoticeNumberConfigurationAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NoticeNumberConfigurationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    Operation = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoticeNumberConfigurationAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NoticeNumberConfigurationAudits_NoticeNumberConfigurations_NoticeNumberConfigurationId",
                        column: x => x.NoticeNumberConfigurationId,
                        principalTable: "NoticeNumberConfigurations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NoticeNumberConfigurationRevisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NoticeNumberConfigurationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    MutationType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FinancialProduct = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RunningNumberWidth = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoticeNumberConfigurationRevisions", x => x.Id);
                    table.CheckConstraint("CK_NoticeNumberConfigurationRevisions_Width", "[RunningNumberWidth] BETWEEN 1 AND 9");
                    table.ForeignKey(
                        name: "FK_NoticeNumberConfigurationRevisions_NoticeNumberConfigurations_NoticeNumberConfigurationId",
                        column: x => x.NoticeNumberConfigurationId,
                        principalTable: "NoticeNumberConfigurations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NoticeDraftAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NoticeDraftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    Operation = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoticeDraftAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NoticeDraftAudits_NoticeDrafts_NoticeDraftId",
                        column: x => x.NoticeDraftId,
                        principalTable: "NoticeDrafts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NoticeDraftRevisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NoticeDraftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResultingVersion = table.Column<long>(type: "bigint", nullable: false),
                    MutationType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ActorDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayerPartyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayerDisplayNameSnapshot = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    NoticeNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AssignmentYear = table.Column<int>(type: "int", nullable: false),
                    RunningNumber = table.Column<int>(type: "int", nullable: false),
                    NoticeNumberConfigurationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NoticeNumberConfigurationVersion = table.Column<long>(type: "bigint", nullable: false),
                    FinancialProductSnapshot = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RunningNumberWidthSnapshot = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    NoticeDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    AccountAssignment = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FeeReasonOrSource = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoticeDraftRevisions", x => x.Id);
                    table.CheckConstraint("CK_NoticeDraftRevisions_Amount", "[TotalAmount] > 0");
                    table.CheckConstraint("CK_NoticeDraftRevisions_Currency", "[Currency] = N'EUR'");
                    table.CheckConstraint("CK_NoticeDraftRevisions_Status", "[Status] IN (N'Draft', N'Discarded')");
                    table.ForeignKey(
                        name: "FK_NoticeDraftRevisions_NoticeDrafts_NoticeDraftId",
                        column: x => x.NoticeDraftId,
                        principalTable: "NoticeDrafts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_NoticeDraftAudits_NoticeDraftId_ResultingVersion",
                table: "NoticeDraftAudits",
                columns: new[] { "NoticeDraftId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NoticeDraftRevisions_NoticeDraftId_ResultingVersion",
                table: "NoticeDraftRevisions",
                columns: new[] { "NoticeDraftId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NoticeDrafts_CaseId_CreatedAtUtc_Id",
                table: "NoticeDrafts",
                columns: new[] { "CaseId", "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_NoticeDrafts_NoticeNumber",
                table: "NoticeDrafts",
                column: "NoticeNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NoticeDrafts_NoticeNumberConfigurationId",
                table: "NoticeDrafts",
                column: "NoticeNumberConfigurationId");

            migrationBuilder.CreateIndex(
                name: "IX_NoticeDrafts_PayerPartyId",
                table: "NoticeDrafts",
                column: "PayerPartyId");

            migrationBuilder.CreateIndex(
                name: "IX_NoticeNumberConfigurationAudits_NoticeNumberConfigurationId_ResultingVersion",
                table: "NoticeNumberConfigurationAudits",
                columns: new[] { "NoticeNumberConfigurationId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NoticeNumberConfigurationRevisions_NoticeNumberConfigurationId_ResultingVersion",
                table: "NoticeNumberConfigurationRevisions",
                columns: new[] { "NoticeNumberConfigurationId", "ResultingVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NoticeNumberConfigurations_SingletonKey",
                table: "NoticeNumberConfigurations",
                column: "SingletonKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NoticeDraftAudits");

            migrationBuilder.DropTable(
                name: "NoticeDraftRevisions");

            migrationBuilder.DropTable(
                name: "NoticeNumberConfigurationAudits");

            migrationBuilder.DropTable(
                name: "NoticeNumberConfigurationRevisions");

            migrationBuilder.DropTable(
                name: "NoticeNumberSequences");

            migrationBuilder.DropTable(
                name: "NoticeDrafts");

            migrationBuilder.DropTable(
                name: "NoticeNumberConfigurations");
        }
    }
}

#pragma warning restore IDE0161, CA1861
