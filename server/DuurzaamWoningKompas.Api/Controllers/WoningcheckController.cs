using DuurzaamWoningKompas.Api.Data;
using DuurzaamWoningKompas.Api.Domain;
using DuurzaamWoningKompas.Api.Dtos;
using DuurzaamWoningKompas.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DuurzaamWoningKompas.Api.Controllers;

[ApiController]
[Route("api/woningcheck")]
public sealed class WoningcheckController(
    AppDbContext dbContext,
    LeadValidationService validationService,
    ILeadNotificationService notificationService,
    ILogger<WoningcheckController> logger) : ControllerBase
{
    [HttpPost("leads")]
    [ProducesResponseType(typeof(LeadCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLead(CreateLeadRequest request, CancellationToken cancellationToken)
    {
        var validationErrors = validationService.Validate(request);
        if (validationErrors.Count > 0)
        {
            return BadRequest(new ApiError("VALIDATION_ERROR", "Controleer de ingevulde gegevens.", validationErrors));
        }

        var now = DateTimeOffset.UtcNow;
        var submissionId = request.SubmissionId!.Trim();
        var existingLead = await dbContext.Leads
            .AsNoTracking()
            .FirstOrDefaultAsync(lead => lead.SubmissionId == submissionId, cancellationToken);
        if (existingLead is not null)
        {
            return Ok(ToCreatedResponse(existingLead));
        }

        var productInterest = request.ProductInterest ?? ProductCategory.General;
        var consent = request.Consent!;
        var tracking = request.Tracking!;
        var lead = new Lead
        {
            SubmissionId = submissionId,
            Status = LeadStatus.New,
            ProductInterest = productInterest,
            FullName = request.Naam!.Trim(),
            Email = request.Email!.Trim().ToLowerInvariant(),
            Phone = string.IsNullOrWhiteSpace(request.Telefoon) ? null : request.Telefoon.Trim(),
            PrimaryGoal = request.Hoofddoel!.Trim(),
            DesiredStartTerm = request.Starttermijn!.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
            Property = new LeadProperty
            {
                HomeType = CleanOptional(request.Woningtype) ?? "Niet gevraagd in thuisbatterijcheck",
                BuildYearRange = CleanOptional(request.Bouwjaar) ?? "Niet gevraagd in thuisbatterijcheck",
                SolarPanels = request.Zonnepanelen!.Trim(),
                Postcode = NormalizePostcode(request.Postcode!),
                HouseNumber = request.Huisnummer!.Trim()
            },
            EnergyProfile = new EnergyProfile
            {
                ElectricityUsageKwh = request.Stroomverbruik!.Value,
                GasUsageM3 = request.Gasverbruik ?? 0,
                SolarPanelCount = request.AantalZonnepanelen,
                FeedInKwh = request.TerugleveringKwh,
                EnergyContractType = CleanOptional(request.Energiecontract)
            },
            Source = new LeadSource
            {
                UtmSource = CleanOptional(tracking.UtmSource),
                UtmMedium = CleanOptional(tracking.UtmMedium),
                UtmCampaign = CleanOptional(tracking.UtmCampaign),
                UtmTerm = CleanOptional(tracking.UtmTerm),
                UtmContent = CleanOptional(tracking.UtmContent),
                Gclid = CleanOptional(tracking.Gclid),
                Referrer = CleanOptional(tracking.Referrer),
                LandingPage = tracking.LandingPage!.Trim()
            }
        };

        foreach (var interest in request.Interesses.Distinct(StringComparer.Ordinal))
        {
            lead.Interests.Add(new LeadInterest { Value = interest.Trim() });
        }

        lead.ConsentRecords.Add(new ConsentRecord
        {
            AdviceConsent = consent.AdviceConsent,
            MatchingConsent = consent.MatchingConsent,
            ConsentText = string.IsNullOrWhiteSpace(consent.ConsentText)
                ? WoningcheckOptions.DefaultConsentText
                : consent.ConsentText.Trim(),
            ConsentVersion = string.IsNullOrWhiteSpace(consent.ConsentVersion)
                ? WoningcheckOptions.ConsentVersion
                : consent.ConsentVersion.Trim(),
            SourceUrl = consent.SourceUrl!.Trim(),
            CreatedAt = now
        });

        lead.StatusHistory.Add(new LeadStatusHistory
        {
            PreviousStatus = null,
            NewStatus = LeadStatus.New,
            Actor = "woningcheck",
            Note = "Lead aangemaakt via Woningcheck.",
            CreatedAt = now
        });

        dbContext.Leads.Add(lead);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var duplicateLead = await dbContext.Leads
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.SubmissionId == submissionId, cancellationToken);
            if (duplicateLead is not null)
            {
                return Ok(ToCreatedResponse(duplicateLead));
            }

            throw;
        }

        try
        {
            await notificationService.NotifyNewLeadAsync(lead, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Nieuwe lead notificatie gefaald voor lead {LeadId}; de lead blijft opgeslagen.", lead.Id);
        }

        return CreatedAtAction(nameof(AdminLeadsController.GetLead), "AdminLeads", new { id = lead.Id }, ToCreatedResponse(lead));
    }

    private static LeadCreatedResponse ToCreatedResponse(Lead lead)
    {
        return new LeadCreatedResponse(lead.Id, lead.Status, lead.CreatedAt);
    }

    private static string NormalizePostcode(string postcode)
    {
        var compact = postcode.Replace(" ", string.Empty, StringComparison.Ordinal).ToUpperInvariant();
        return compact.Length == 6 ? $"{compact[..4]} {compact[4..]}" : compact;
    }

    private static string? CleanOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
