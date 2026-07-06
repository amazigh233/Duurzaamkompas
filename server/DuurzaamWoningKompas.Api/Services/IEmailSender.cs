namespace DuurzaamWoningKompas.Api.Services;

public interface IEmailSender
{
    bool IsConfigured { get; }

    Task SendAsync(EmailMessage email, CancellationToken cancellationToken);
}
