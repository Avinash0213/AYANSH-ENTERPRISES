using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentFieldsToSataraVisit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AgentName",
                table: "SataraVisits",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AgentPhoneNumber",
                table: "SataraVisits",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgentName",
                table: "SataraVisits");

            migrationBuilder.DropColumn(
                name: "AgentPhoneNumber",
                table: "SataraVisits");
        }
    }
}
