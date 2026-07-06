using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DuurzaamWoningKompas.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialMvpSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:lead_status", "new,contacted,appointment_scheduled,quote_created,won,lost");

            migrationBuilder.CreateTable(
                name: "leads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    FullName = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Email = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    Phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    PrimaryGoal = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DesiredStartTerm = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_leads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "consent_records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdviceConsent = table.Column<bool>(type: "boolean", nullable: false),
                    MatchingConsent = table.Column<bool>(type: "boolean", nullable: false),
                    ConsentText = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: false),
                    ConsentVersion = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SourceUrl = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_consent_records", x => x.Id);
                    table.ForeignKey(
                        name: "FK_consent_records_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "energy_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectricityUsageKwh = table.Column<int>(type: "integer", nullable: false),
                    GasUsageM3 = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_energy_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_energy_profiles_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lead_interests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Value = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lead_interests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lead_interests_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lead_notes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Actor = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lead_notes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lead_notes_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lead_properties",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    HomeType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    BuildYearRange = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SolarPanels = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Postcode = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    HouseNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lead_properties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lead_properties_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lead_sources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    UtmSource = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    UtmMedium = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    UtmCampaign = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    UtmTerm = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    UtmContent = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    Referrer = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: true),
                    LandingPage = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lead_sources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lead_sources_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lead_status_history",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    NewStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Actor = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Note = table.Column<string>(type: "character varying(800)", maxLength: 800, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lead_status_history", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lead_status_history_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_consent_records_LeadId",
                table: "consent_records",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_energy_profiles_LeadId",
                table: "energy_profiles",
                column: "LeadId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_lead_interests_LeadId",
                table: "lead_interests",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_lead_interests_Value",
                table: "lead_interests",
                column: "Value");

            migrationBuilder.CreateIndex(
                name: "IX_lead_notes_LeadId",
                table: "lead_notes",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_lead_properties_LeadId",
                table: "lead_properties",
                column: "LeadId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_lead_properties_Postcode",
                table: "lead_properties",
                column: "Postcode");

            migrationBuilder.CreateIndex(
                name: "IX_lead_sources_LeadId",
                table: "lead_sources",
                column: "LeadId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_lead_sources_UtmCampaign",
                table: "lead_sources",
                column: "UtmCampaign");

            migrationBuilder.CreateIndex(
                name: "IX_lead_sources_UtmSource",
                table: "lead_sources",
                column: "UtmSource");

            migrationBuilder.CreateIndex(
                name: "IX_lead_status_history_LeadId",
                table: "lead_status_history",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_leads_CreatedAt",
                table: "leads",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_leads_Email",
                table: "leads",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_leads_Status",
                table: "leads",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "consent_records");

            migrationBuilder.DropTable(
                name: "energy_profiles");

            migrationBuilder.DropTable(
                name: "lead_interests");

            migrationBuilder.DropTable(
                name: "lead_notes");

            migrationBuilder.DropTable(
                name: "lead_properties");

            migrationBuilder.DropTable(
                name: "lead_sources");

            migrationBuilder.DropTable(
                name: "lead_status_history");

            migrationBuilder.DropTable(
                name: "leads");
        }
    }
}
