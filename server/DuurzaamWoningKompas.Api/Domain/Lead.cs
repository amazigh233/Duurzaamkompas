namespace DuurzaamWoningKompas.Api.Domain;

public sealed class Lead
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SubmissionId { get; set; } = string.Empty;
    public LeadStatus Status { get; set; } = LeadStatus.New;
    public ProductCategory ProductInterest { get; set; } = ProductCategory.General;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PrimaryGoal { get; set; } = string.Empty;
    public string DesiredStartTerm { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public LeadProperty Property { get; set; } = new();
    public EnergyProfile EnergyProfile { get; set; } = new();
    public LeadSource Source { get; set; } = new();
    public ICollection<LeadInterest> Interests { get; set; } = new List<LeadInterest>();
    public ICollection<ConsentRecord> ConsentRecords { get; set; } = new List<ConsentRecord>();
    public ICollection<LeadStatusHistory> StatusHistory { get; set; } = new List<LeadStatusHistory>();
    public ICollection<LeadNote> Notes { get; set; } = new List<LeadNote>();
}
