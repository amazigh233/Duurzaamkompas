namespace DuurzaamWoningKompas.Api.Domain;

public sealed class LeadProperty
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LeadId { get; set; }
    public string HomeType { get; set; } = string.Empty;
    public string BuildYearRange { get; set; } = string.Empty;
    public string SolarPanels { get; set; } = string.Empty;
    public string Postcode { get; set; } = string.Empty;
    public string HouseNumber { get; set; } = string.Empty;
}
