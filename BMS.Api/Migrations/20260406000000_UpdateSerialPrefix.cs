using Microsoft.EntityFrameworkCore.Migrations;

namespace BMS.Api.Migrations
{
    public partial class UpdateSerialPrefix : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update any existing serial numbers that start with "IN" to use the new "AE" prefix.
            migrationBuilder.Sql(
                "UPDATE \"Customers\" SET \"SerialNumber\" = 'AE' || SUBSTRING(\"SerialNumber\" FROM 3) WHERE \"SerialNumber\" LIKE 'IN%';");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert the prefix change if needed.
            migrationBuilder.Sql(
                "UPDATE \"Customers\" SET \"SerialNumber\" = 'IN' || SUBSTRING(\"SerialNumber\" FROM 3) WHERE \"SerialNumber\" LIKE 'AE%';");
        }
    }
}
