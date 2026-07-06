namespace DuurzaamWoningKompas.Api.Services;

public sealed class LeadNotificationOptions
{
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public string? FromEmail { get; set; }
    public string? FromName { get; set; }
    public string? ToEmail { get; set; }
    public string? ContactNotificationEmail { get; set; }
    public string? AdminBaseUrl { get; set; }
    public bool UseSsl { get; set; } = true;

    public bool EnableSsl
    {
        get => UseSsl;
        set => UseSsl = value;
    }
}
