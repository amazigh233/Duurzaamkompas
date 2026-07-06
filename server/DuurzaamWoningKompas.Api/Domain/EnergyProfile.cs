namespace DuurzaamWoningKompas.Api.Domain;

public sealed class EnergyProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LeadId { get; set; }
    public int ElectricityUsageKwh { get; set; }
    public int GasUsageM3 { get; set; }
    public int? SolarPanelCount { get; set; }
    public int? FeedInKwh { get; set; }
    public string? EnergyContractType { get; set; }
}
