namespace DuurzaamWoningKompas.Api.Domain;

public sealed class LeadStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LeadId { get; set; }
    public LeadStatus? PreviousStatus { get; set; }
    public LeadStatus NewStatus { get; set; }
    public string Actor { get; set; } = "system";
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
