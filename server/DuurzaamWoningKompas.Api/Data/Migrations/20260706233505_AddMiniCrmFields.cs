using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DuurzaamWoningKompas.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMiniCrmFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FollowUpNote",
                table: "leads",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastContactAt",
                table: "leads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "NextFollowUpAt",
                table: "leads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "appointments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_appointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_appointments_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_leads_LastContactAt",
                table: "leads",
                column: "LastContactAt");

            migrationBuilder.CreateIndex(
                name: "IX_leads_NextFollowUpAt",
                table: "leads",
                column: "NextFollowUpAt");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_LeadId",
                table: "appointments",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_StartAt",
                table: "appointments",
                column: "StartAt");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_Status",
                table: "appointments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointments");

            migrationBuilder.DropIndex(
                name: "IX_leads_LastContactAt",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "IX_leads_NextFollowUpAt",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "FollowUpNote",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "LastContactAt",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "NextFollowUpAt",
                table: "leads");
        }
    }
}
