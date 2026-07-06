namespace DuurzaamWoningKompas.Api.Dtos;

public sealed record ContactMessageRequest(
    string? Name,
    string? Email,
    string? Phone,
    string? Subject,
    string? Message,
    bool PrivacyConsent,
    string? SourceUrl,
    string? Honeypot);
