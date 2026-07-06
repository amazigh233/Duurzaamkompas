using System.Net;
using DuurzaamWoningKompas.Api.Domain;
using Microsoft.Extensions.Options;

namespace DuurzaamWoningKompas.Api.Services;

public sealed class SmtpLeadNotificationService(
    IOptions<LeadNotificationOptions> options,
    IEmailSender emailSender,
    ILogger<SmtpLeadNotificationService> logger) : ILeadNotificationService
{
    public async Task NotifyNewLeadAsync(Lead lead, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (!emailSender.IsConfigured ||
            string.IsNullOrWhiteSpace(settings.ToEmail) ||
            string.IsNullOrWhiteSpace(settings.FromEmail))
        {
            logger.LogWarning("Nieuwe lead notificatie overgeslagen: SMTP of ontvanger is niet geconfigureerd.");
            return;
        }

        await SendLeadEmailAsync(
            BuildInternalNotification(lead, settings),
            "Nieuwe lead notificatie gefaald voor lead {LeadId}; de lead blijft opgeslagen.",
            lead.Id,
            cancellationToken);

        await SendLeadEmailAsync(
            BuildCustomerConfirmation(lead, settings),
            "Woningcheck ontvangstbevestiging gefaald voor lead {LeadId}; de lead blijft opgeslagen.",
            lead.Id,
            cancellationToken);
    }

    private async Task SendLeadEmailAsync(
        EmailMessage message,
        string logMessage,
        Guid leadId,
        CancellationToken cancellationToken)
    {
        try
        {
            await emailSender.SendAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, logMessage, leadId);
        }
    }

    private static EmailMessage BuildInternalNotification(Lead lead, LeadNotificationOptions settings)
    {
        var source = string.Join(" / ", new[]
            {
                lead.Source.UtmSource,
                lead.Source.UtmMedium,
                lead.Source.UtmCampaign
            }
            .Where(value => !string.IsNullOrWhiteSpace(value)));
        var adminLink = BuildAdminLink(settings.AdminBaseUrl, lead.Id);
        var reference = lead.Id.ToString("N")[..8].ToUpperInvariant();

        var textBody = string.Join(Environment.NewLine, [
            "Er is een nieuwe Woningcheck-aanvraag ontvangen.",
            string.Empty,
            $"Referentie: {reference}",
            $"Lead-id: {lead.Id}",
            $"Status: {lead.Status}",
            $"Productinteresse: {lead.ProductInterest}",
            $"Naam: {lead.FullName}",
            $"Telefoon: {lead.Phone ?? "-"}",
            $"E-mail: {lead.Email}",
            $"Doel: {lead.PrimaryGoal}",
            $"Termijn: {lead.DesiredStartTerm}",
            $"Woning: {lead.Property.HomeType}, {lead.Property.BuildYearRange}",
            $"Postcodegebied: {lead.Property.Postcode}",
            $"Campagnebron: {(string.IsNullOrWhiteSpace(source) ? "-" : source)}",
            $"GCLID aanwezig: {(string.IsNullOrWhiteSpace(lead.Source.Gclid) ? "Nee" : "Ja")}",
            adminLink is null ? string.Empty : $"Admin detail: {adminLink}",
            string.Empty,
            "Log in op het admin-dashboard om de aanvraag te beoordelen."
        ]);

        var htmlBody = WrapHtml("Nieuwe Woningcheck-aanvraag", string.Join(Environment.NewLine, [
            "<p>Er is een nieuwe Woningcheck-aanvraag ontvangen.</p>",
            "<table>",
            Row("Referentie", reference),
            Row("Lead-id", lead.Id.ToString()),
            Row("Status", lead.Status.ToString()),
            Row("Productinteresse", lead.ProductInterest.ToString()),
            Row("Naam", lead.FullName),
            Row("Telefoon", lead.Phone ?? "-"),
            Row("E-mail", lead.Email),
            Row("Doel", lead.PrimaryGoal),
            Row("Termijn", lead.DesiredStartTerm),
            Row("Woning", $"{lead.Property.HomeType}, {lead.Property.BuildYearRange}"),
            Row("Postcodegebied", lead.Property.Postcode),
            Row("Campagnebron", string.IsNullOrWhiteSpace(source) ? "-" : source),
            Row("GCLID aanwezig", string.IsNullOrWhiteSpace(lead.Source.Gclid) ? "Nee" : "Ja"),
            "</table>",
            adminLink is null ? string.Empty : $"""<p><a class="button" href="{Html(adminLink)}">Open lead in admin</a></p>""",
            "<p>Beoordeel de aanvraag zorgvuldig voordat u opvolging of matching start.</p>"
        ]));

        return new EmailMessage(
            settings.ToEmail!,
            "Nieuwe Woningcheck-aanvraag - DuurzaamWoningKompas",
            textBody,
            htmlBody,
            settings.FromEmail,
            settings.FromName);
    }

    private static EmailMessage BuildCustomerConfirmation(Lead lead, LeadNotificationOptions settings)
    {
        var reference = lead.Id.ToString("N")[..8].ToUpperInvariant();
        var firstName = lead.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? lead.FullName;

        var textBody = string.Join(Environment.NewLine, [
            $"Beste {firstName},",
            string.Empty,
            "Dank u wel voor het invullen van de Woningcheck van DuurzaamWoningKompas.",
            $"Wij hebben uw aanvraag ontvangen onder referentie {reference}.",
            string.Empty,
            "We bekijken uw woninggegevens, energieprofiel en interesses. Daarna nemen we contact met u op als er een passende vervolgstap is of als we nog een vraag hebben.",
            string.Empty,
            "Deze ontvangstbevestiging is geen definitief energieadvies en bevat geen garantie op besparing of geschiktheid.",
            string.Empty,
            "Met vriendelijke groet,",
            "DuurzaamWoningKompas"
        ]);

        var htmlBody = WrapHtml("Uw Woningcheck is ontvangen", string.Join(Environment.NewLine, [
            $"<p>Beste {Html(firstName)},</p>",
            "<p>Dank u wel voor het invullen van de Woningcheck van DuurzaamWoningKompas.</p>",
            $"""<p class="reference">Referentie: <strong>{Html(reference)}</strong></p>""",
            "<p>We bekijken uw woninggegevens, energieprofiel en interesses. Daarna nemen we contact met u op als er een passende vervolgstap is of als we nog een vraag hebben.</p>",
            "<p class=\"note\">Deze ontvangstbevestiging is geen definitief energieadvies en bevat geen garantie op besparing of geschiktheid.</p>",
            "<p>Met vriendelijke groet,<br>DuurzaamWoningKompas</p>"
        ]));

        return new EmailMessage(
            lead.Email,
            "Uw Woningcheck is ontvangen",
            textBody,
            htmlBody,
            settings.FromEmail,
            settings.FromName);
    }

    private static string? BuildAdminLink(string? adminBaseUrl, Guid leadId)
    {
        if (string.IsNullOrWhiteSpace(adminBaseUrl))
        {
            return null;
        }

        return $"{adminBaseUrl.TrimEnd('/')}/#/admin/leads/{leadId}";
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
    .button { background: #163d32; border-radius: 6px; color: #ffffff; display: inline-block; padding: 11px 16px; text-decoration: none; }
    .reference { background: #f7f8f3; border-left: 4px solid #e8a83e; padding: 12px 14px; }
    .note { color: #5f6b65; font-size: 14px; }
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
