namespace DuurzaamWoningKompas.Api.Domain;

public sealed class LeadNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LeadId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Actor { get; set; } = "admin";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
