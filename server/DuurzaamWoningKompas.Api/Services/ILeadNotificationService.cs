using DuurzaamWoningKompas.Api.Domain;

namespace DuurzaamWoningKompas.Api.Services;

public interface ILeadNotificationService
{
    Task NotifyNewLeadAsync(Lead lead, CancellationToken cancellationToken);
}
