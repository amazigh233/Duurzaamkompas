using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DuurzaamWoningKompas.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddThuisbatterijCampaignFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:lead_status", "new,contacted,appointment_scheduled,quote_created,won,lost")
                .Annotation("Npgsql:Enum:product_category", "general,thuisbatterij,warmtepomp,isolatie,zonnepanelen,laadpaal,airconditioning,energieadvies")
                .OldAnnotation("Npgsql:Enum:lead_status", "new,contacted,appointment_scheduled,quote_created,won,lost");

            migrationBuilder.AddColumn<string>(
                name: "ProductInterest",
                table: "leads",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                defaultValue: "General");

            migrationBuilder.AddColumn<string>(
                name: "Gclid",
                table: "lead_sources",
                type: "character varying(240)",
                maxLength: 240,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnergyContractType",
                table: "energy_profiles",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FeedInKwh",
                table: "energy_profiles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SolarPanelCount",
                table: "energy_profiles",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_leads_ProductInterest",
                table: "leads",
                column: "ProductInterest");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_leads_ProductInterest",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "ProductInterest",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "Gclid",
                table: "lead_sources");

            migrationBuilder.DropColumn(
                name: "EnergyContractType",
                table: "energy_profiles");

            migrationBuilder.DropColumn(
                name: "FeedInKwh",
                table: "energy_profiles");

            migrationBuilder.DropColumn(
                name: "SolarPanelCount",
                table: "energy_profiles");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:lead_status", "new,contacted,appointment_scheduled,quote_created,won,lost")
                .OldAnnotation("Npgsql:Enum:lead_status", "new,contacted,appointment_scheduled,quote_created,won,lost")
                .OldAnnotation("Npgsql:Enum:product_category", "general,thuisbatterij,warmtepomp,isolatie,zonnepanelen,laadpaal,airconditioning,energieadvies");
        }
    }
}
