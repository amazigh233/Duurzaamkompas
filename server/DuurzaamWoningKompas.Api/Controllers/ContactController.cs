using System.Text.RegularExpressions;
using DuurzaamWoningKompas.Api.Dtos;
using DuurzaamWoningKompas.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DuurzaamWoningKompas.Api.Controllers;

[ApiController]
[Route("api/contact")]
public sealed class ContactController(
    IContactNotificationService notificationService,
    ContactRateLimitStore rateLimitStore,
    ILogger<ContactController> logger) : ControllerBase
{
    private static readonly Regex EmailRegex = new(@"^\S+@\S+\.\S+$", RegexOptions.Compiled);

    [HttpPost("messages")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> CreateMessage(ContactMessageRequest request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.Honeypot))
        {
            return NoContent();
        }

        var rateLimitKey = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (!rateLimitStore.IsAllowed(rateLimitKey, DateTimeOffset.UtcNow))
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new ApiError(
                "RATE_LIMITED",
                "Er zijn te veel contactpogingen gedaan. Probeer het later opnieuw."));
        }

        var errors = Validate(request);
        if (errors.Count > 0)
        {
            return BadRequest(new ApiError("VALIDATION_ERROR", "Controleer de ingevulde gegevens.", errors));
        }

        try
        {
            await notificationService.NotifyContactMessageAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Contactnotificatie verzenden is mislukt.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new ApiError(
                "CONTACT_NOTIFICATION_FAILED",
                "Uw bericht kon niet worden verzonden. Probeer het later opnieuw."));
        }

        return NoContent();
    }

    private static IDictionary<string, string[]> Validate(ContactMessageRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 180)
        {
            errors["name"] = ["Vul uw naam in."];
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !EmailRegex.IsMatch(request.Email.Trim()) || request.Email.Trim().Length > 260)
        {
            errors["email"] = ["Vul een geldig e-mailadres in."];
        }

        if (!string.IsNullOrWhiteSpace(request.Phone) && request.Phone.Trim().Length < 8)
        {
            errors["phone"] = ["Vul een geldig telefoonnummer in of laat het veld leeg."];
        }

        if (string.IsNullOrWhiteSpace(request.Subject) || request.Subject.Trim().Length > 160)
        {
            errors["subject"] = ["Vul een onderwerp in van maximaal 160 tekens."];
        }

        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Trim().Length < 10 || request.Message.Trim().Length > 4000)
        {
            errors["message"] = ["Vul een bericht in van 10 tot 4000 tekens."];
        }

        if (!request.PrivacyConsent)
        {
            errors["privacyConsent"] = ["Bevestig dat wij uw bericht mogen verwerken om contact op te nemen."];
        }

        if (string.IsNullOrWhiteSpace(request.SourceUrl) || request.SourceUrl.Trim().Length > 600)
        {
            errors["sourceUrl"] = ["De bronpagina ontbreekt."];
        }

        return errors;
    }
}
