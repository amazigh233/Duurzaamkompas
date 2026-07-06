namespace DuurzaamWoningKompas.Api.Domain;

public sealed class LeadSource
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LeadId { get; set; }
    public string? UtmSource { get; set; }
    public string? UtmMedium { get; set; }
    public string? UtmCampaign { get; set; }
    public string? UtmTerm { get; set; }
    public string? UtmContent { get; set; }
    public string? Gclid { get; set; }
    public string? Referrer { get; set; }
    public string LandingPage { get; set; } = string.Empty;
}
