using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerFinancialFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Deposit",
                table: "Customers",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "QuotedAmount",
                table: "Customers",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Rent",
                table: "Customers",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_CreatedDate",
                table: "Customers",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_OwnerPhone",
                table: "Customers",
                column: "OwnerPhone");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Status",
                table: "Customers",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_TenantPhone",
                table: "Customers",
                column: "TenantPhone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Customers_CreatedDate",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_OwnerPhone",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_Status",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_TenantPhone",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "Deposit",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "QuotedAmount",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "Rent",
                table: "Customers");
        }
    }
}
