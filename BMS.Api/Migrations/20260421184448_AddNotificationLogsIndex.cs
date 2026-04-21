using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationLogsIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NotificationLogs_CustomerId",
                table: "NotificationLogs");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_CustomerId_Type_SentAt",
                table: "NotificationLogs",
                columns: new[] { "CustomerId", "Type", "SentAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NotificationLogs_CustomerId_Type_SentAt",
                table: "NotificationLogs");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_CustomerId",
                table: "NotificationLogs",
                column: "CustomerId");
        }
    }
}
