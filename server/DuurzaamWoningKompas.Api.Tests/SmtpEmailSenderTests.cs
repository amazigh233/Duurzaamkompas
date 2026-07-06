using DuurzaamWoningKompas.Api.Services;
using MailKit.Security;

namespace DuurzaamWoningKompas.Api.Tests;

public sealed class SmtpEmailSenderTests
{
    [Fact]
    public void GetSecureSocketOptions_uses_ssl_on_connect_for_transip_port_465()
    {
        var options = new LeadNotificationOptions
        {
            SmtpPort = 465,
            UseSsl = true
        };

        var socketOptions = SmtpEmailSender.GetSecureSocketOptions(options);

        Assert.Equal(SecureSocketOptions.SslOnConnect, socketOptions);
    }

    [Fact]
    public void GetSecureSocketOptions_can_disable_tls_for_local_smtp_tests()
    {
        var options = new LeadNotificationOptions
        {
            SmtpPort = 2526,
            UseSsl = false
        };

        var socketOptions = SmtpEmailSender.GetSecureSocketOptions(options);

        Assert.Equal(SecureSocketOptions.None, socketOptions);
    }
}
