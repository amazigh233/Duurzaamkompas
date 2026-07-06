namespace DuurzaamWoningKompas.Api.Domain;

public sealed class ConsentRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LeadId { get; set; }
    public bool AdviceConsent { get; set; }
    public bool MatchingConsent { get; set; }
    public string ConsentText { get; set; } = string.Empty;
    public string ConsentVersion { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
