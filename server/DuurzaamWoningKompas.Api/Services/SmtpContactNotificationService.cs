using System.Net;
using DuurzaamWoningKompas.Api.Dtos;
using Microsoft.Extensions.Options;

namespace DuurzaamWoningKompas.Api.Services;

public sealed class SmtpContactNotificationService(
    IOptions<LeadNotificationOptions> options,
    IEmailSender emailSender,
    ILogger<SmtpContactNotificationService> logger) : IContactNotificationService
{
    public async Task NotifyContactMessageAsync(ContactMessageRequest request, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var recipient = string.IsNullOrWhiteSpace(settings.ContactNotificationEmail)
            ? settings.ToEmail
            : settings.ContactNotificationEmail;
        if (!emailSender.IsConfigured ||
            string.IsNullOrWhiteSpace(settings.FromEmail) ||
            string.IsNullOrWhiteSpace(recipient))
        {
            logger.LogWarning("Contactnotificatie kan niet worden verzonden: SMTP of CONTACT_NOTIFICATION_EMAIL is niet geconfigureerd.");
            throw new InvalidOperationException("Contact notification email is not configured.");
        }

        await emailSender.SendAsync(BuildInternalNotification(request, settings, recipient), cancellationToken);

        try
        {
            await emailSender.SendAsync(BuildCustomerConfirmation(request, settings), cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Contactformulier ontvangstbevestiging verzenden is mislukt nadat de interne notificatie is verzonden.");
        }
    }

    private static EmailMessage BuildInternalNotification(
        ContactMessageRequest request,
        LeadNotificationOptions settings,
        string recipient)
    {
        var subject = CleanRequired(request.Subject);
        var textBody = string.Join(Environment.NewLine, [
            "Er is een contactbericht ontvangen via DuurzaamWoningKompas.",
            string.Empty,
            $"Naam: {CleanRequired(request.Name)}",
            $"E-mail: {CleanRequired(request.Email)}",
            $"Telefoon: {CleanOptional(request.Phone) ?? "-"}",
            $"Onderwerp: {subject}",
            $"Bronpagina: {CleanRequired(request.SourceUrl)}",
            string.Empty,
            "Bericht:",
            CleanRequired(request.Message)
        ]);

        var htmlBody = WrapHtml("Nieuw contactbericht", string.Join(Environment.NewLine, [
            "<p>Er is een contactbericht ontvangen via DuurzaamWoningKompas.</p>",
            "<table>",
            Row("Naam", CleanRequired(request.Name)),
            Row("E-mail", CleanRequired(request.Email)),
            Row("Telefoon", CleanOptional(request.Phone) ?? "-"),
            Row("Onderwerp", subject),
            Row("Bronpagina", CleanRequired(request.SourceUrl)),
            "</table>",
            "<h2>Bericht</h2>",
            $"<p>{Html(CleanRequired(request.Message)).Replace(Environment.NewLine, "<br>", StringComparison.Ordinal)}</p>"
        ]));

        return new EmailMessage(
            recipient,
            $"Contactformulier: {subject}",
            textBody,
            htmlBody,
            settings.FromEmail,
            settings.FromName);
    }

    private static EmailMessage BuildCustomerConfirmation(ContactMessageRequest request, LeadNotificationOptions settings)
    {
        var name = CleanRequired(request.Name);
        var firstName = name.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? name;

        var textBody = string.Join(Environment.NewLine, [
            $"Beste {firstName},",
            string.Empty,
            "Dank u wel voor uw bericht aan DuurzaamWoningKompas.",
            "Wij hebben uw contactaanvraag ontvangen en komen hier zo zorgvuldig mogelijk op terug.",
            string.Empty,
            $"Onderwerp: {CleanRequired(request.Subject)}",
            string.Empty,
            "Met vriendelijke groet,",
            "DuurzaamWoningKompas"
        ]);

        var htmlBody = WrapHtml("Uw bericht is ontvangen", string.Join(Environment.NewLine, [
            $"<p>Beste {Html(firstName)},</p>",
            "<p>Dank u wel voor uw bericht aan DuurzaamWoningKompas.</p>",
            "<p>Wij hebben uw contactaanvraag ontvangen en komen hier zo zorgvuldig mogelijk op terug.</p>",
            $"<p><strong>Onderwerp:</strong> {Html(CleanRequired(request.Subject))}</p>",
            "<p>Met vriendelijke groet,<br>DuurzaamWoningKompas</p>"
        ]));

        return new EmailMessage(
            CleanRequired(request.Email),
            "Uw bericht is ontvangen",
            textBody,
            htmlBody,
            settings.FromEmail,
            settings.FromName);
    }

    private static string CleanRequired(string? value)
    {
        return value?.Trim() ?? string.Empty;
    }

    private static string? CleanOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string Row(string label, string value)
    {
        return $"<tr><th>{Html(label)}</th><td>{Html(value)}</td></tr>";
    }

    private static string WrapHtml(string title, string content)
    {
        return $$"""
<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>{{Html(title)}}</title>
</head>
<body style="margin:0;background:#f7f8f3;color:#1e2925;font-family:Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;padding:28px 18px;">
    <div style="border-top:5px solid #163d32;background:#ffffff;padding:28px;border-radius:8px;">
      <p style="margin:0 0 8px;color:#3f7d5b;font-size:13px;font-weight:bold;letter-spacing:.02em;text-transform:uppercase;">DuurzaamWoningKompas</p>
      <h1 style="margin:0 0 18px;color:#163d32;font-size:24px;line-height:1.25;">{{Html(title)}}</h1>
      {{content}}
    </div>
  </div>
  <style>
    table { border-collapse: collapse; width: 100%; margin: 18px 0; }
    th { color: #163d32; padding: 8px 12px 8px 0; text-align: left; vertical-align: top; width: 180px; }
    td { padding: 8px 0; vertical-align: top; }
    h2 { color: #163d32; font-size: 18px; margin-top: 24px; }
  </style>
</body>
</html>
""";
    }

    private static string Html(string value)
    {
        return WebUtility.HtmlEncode(value);
    }
}
