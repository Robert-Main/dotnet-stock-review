using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PokemonReview.Migrations
{
    /// <inheritdoc />
    public partial class SeedRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "8bd15299-83c4-4e10-b942-6b488e4e8c6f", "8bb432d3-1665-4cfe-88c6-8ee99fb0821b", "User", "USER" },
                    { "bbcdcd82-02b4-4021-8b0f-6185ef8dcd0b", "142030af-311e-4811-bd86-7b35e6a738ee", "Admin", "ADMIN" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "8bd15299-83c4-4e10-b942-6b488e4e8c6f");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "bbcdcd82-02b4-4021-8b0f-6185ef8dcd0b");
        }
    }
}
