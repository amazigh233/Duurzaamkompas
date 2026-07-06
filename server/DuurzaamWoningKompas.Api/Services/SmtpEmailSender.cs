using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace DuurzaamWoningKompas.Api.Services;

public sealed class SmtpEmailSender(IOptions<LeadNotificationOptions> options) : IEmailSender
{
    public bool IsConfigured
    {
        get
        {
            var settings = options.Value;
            return !string.IsNullOrWhiteSpace(settings.SmtpHost) &&
                !string.IsNullOrWhiteSpace(settings.FromEmail);
        }
    }

    public async Task SendAsync(EmailMessage email, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (!IsConfigured)
        {
            throw new InvalidOperationException("SMTP is not configured.");
        }

        var host = CleanOptional(settings.SmtpHost) ?? throw new InvalidOperationException("SMTP host is not configured.");
        var fromEmail = CleanOptional(settings.FromEmail) ?? throw new InvalidOperationException("SMTP from email is not configured.");
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(CleanOptional(settings.FromName) ?? fromEmail, fromEmail));
        message.To.Add(MailboxAddress.Parse(email.ToEmail));
        message.ReplyTo.Add(new MailboxAddress(
            CleanOptional(email.ReplyToName) ?? CleanOptional(settings.FromName) ?? fromEmail,
            CleanOptional(email.ReplyToEmail) ?? fromEmail));
        message.Subject = email.Subject;
        message.Body = new BodyBuilder
        {
            TextBody = email.TextBody,
            HtmlBody = email.HtmlBody
        }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(host, settings.SmtpPort, GetSecureSocketOptions(settings), cancellationToken);

        if (!string.IsNullOrWhiteSpace(settings.SmtpUsername))
        {
            await client.AuthenticateAsync(settings.SmtpUsername, settings.SmtpPassword ?? string.Empty, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    internal static SecureSocketOptions GetSecureSocketOptions(LeadNotificationOptions settings)
    {
        if (!settings.UseSsl)
        {
            return SecureSocketOptions.None;
        }

        return settings.SmtpPort == 465
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;
    }

    private static string? CleanOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
