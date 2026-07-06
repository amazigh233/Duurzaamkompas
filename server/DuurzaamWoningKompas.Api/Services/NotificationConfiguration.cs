namespace DuurzaamWoningKompas.Api.Services;

public static class NotificationConfiguration
{
    public static void ApplyEnvironmentOverrides(LeadNotificationOptions options, IConfiguration configuration)
    {
        options.SmtpHost = FirstConfigured(configuration["SMTP_HOST"], options.SmtpHost);
        options.SmtpPort = ParseInt(configuration["SMTP_PORT"], options.SmtpPort);
        options.SmtpUsername = FirstConfigured(configuration["SMTP_USERNAME"], options.SmtpUsername);
        options.SmtpPassword = FirstConfigured(configuration["SMTP_PASSWORD"], options.SmtpPassword);
        options.FromEmail = FirstConfigured(configuration["SMTP_FROM_EMAIL"], options.FromEmail);
        options.FromName = FirstConfigured(configuration["SMTP_FROM_NAME"], options.FromName);
        options.ToEmail = FirstConfigured(configuration["CONTACT_NOTIFICATION_EMAIL"], options.ToEmail);
        options.ContactNotificationEmail = FirstConfigured(configuration["CONTACT_NOTIFICATION_EMAIL"], options.ContactNotificationEmail);
        options.UseSsl = ParseBool(configuration["SMTP_USE_SSL"], options.UseSsl);
    }

    private static string? FirstConfigured(string? primary, string? fallback)
    {
        return string.IsNullOrWhiteSpace(primary) ? fallback : primary.Trim();
    }

    private static int ParseInt(string? value, int fallback)
    {
        return int.TryParse(value, out var parsed) ? parsed : fallback;
    }

    private static bool ParseBool(string? value, bool fallback)
    {
        return bool.TryParse(value, out var parsed) ? parsed : fallback;
    }
}
