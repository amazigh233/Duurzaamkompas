using DuurzaamWoningKompas.Api.Dtos;

namespace DuurzaamWoningKompas.Api.Services;

public interface IContactNotificationService
{
    Task NotifyContactMessageAsync(ContactMessageRequest request, CancellationToken cancellationToken);
}
