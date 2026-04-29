using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddInitiatedDateToCustomer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "InitiatedDate",
                table: "Customers",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InitiatedDate",
                table: "Customers");
        }
    }
}
