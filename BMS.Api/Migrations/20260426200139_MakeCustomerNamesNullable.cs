using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeCustomerNamesNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NotificationLogs_CustomerId_Type_SentAt",
                table: "NotificationLogs");

            migrationBuilder.AlterColumn<string>(
                name: "TenantName",
                table: "Customers",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "OwnerName",
                table: "Customers",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_CustomerId",
                table: "NotificationLogs",
                column: "CustomerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NotificationLogs_CustomerId",
                table: "NotificationLogs");

            migrationBuilder.AlterColumn<string>(
                name: "TenantName",
                table: "Customers",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "OwnerName",
                table: "Customers",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_CustomerId_Type_SentAt",
                table: "NotificationLogs",
                columns: new[] { "CustomerId", "Type", "SentAt" });
        }
    }
}
