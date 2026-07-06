using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DuurzaamWoningKompas.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadSubmissionId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubmissionId",
                table: "leads",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE leads
                SET "SubmissionId" = 'legacy-' || "Id"::text
                WHERE "SubmissionId" IS NULL OR "SubmissionId" = ''
                """);

            migrationBuilder.AlterColumn<string>(
                name: "SubmissionId",
                table: "leads",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_leads_SubmissionId",
                table: "leads",
                column: "SubmissionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_leads_SubmissionId",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "SubmissionId",
                table: "leads");
        }
    }
}
