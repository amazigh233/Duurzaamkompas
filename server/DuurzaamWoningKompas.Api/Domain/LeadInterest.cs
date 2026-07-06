namespace DuurzaamWoningKompas.Api.Domain;

public sealed class LeadInterest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LeadId { get; set; }
    public string Value { get; set; } = string.Empty;
}
