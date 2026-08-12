using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cemaris.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddCaseVersion : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(
            name: "Version",
            table: "ReadCases",
            type: "bigint",
            nullable: false,
            defaultValue: 1L);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Version",
            table: "ReadCases");
    }
}
