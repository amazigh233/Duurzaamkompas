namespace DuurzaamWoningKompas.Api.Services;

public sealed record EmailMessage(
    string ToEmail,
    string Subject,
    string TextBody,
    string HtmlBody,
    string? ReplyToEmail = null,
    string? ReplyToName = null);
