using DuurzaamWoningKompas.Api.Data;
using DuurzaamWoningKompas.Api.Domain;
using DuurzaamWoningKompas.Api.Dtos;
using DuurzaamWoningKompas.Api.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DuurzaamWoningKompas.Api.Controllers;

[ApiController]
[Route("api/admin/leads")]
[ServiceFilter(typeof(AdminApiKeyFilter))]
public sealed class AdminLeadsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(LeadListItemResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LeadListItemResponse>>> GetLeads(
        [FromQuery] string? query,
        [FromQuery] LeadStatus? status,
        [FromQuery] ProductCategory? product,
        [FromQuery] string? source,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var leadsQuery = BuildLeadQuery(new LeadSearchRequest(query, status, product, source, from, to));

        var leads = await leadsQuery
            .OrderByDescending(lead => lead.CreatedAt)
            .Take(100)
            .Select(lead => new LeadListItemResponse(
                lead.Id,
                lead.Status,
                lead.ProductInterest,
                lead.FullName,
                lead.Email,
                lead.Phone,
                lead.Property.Postcode,
                lead.PrimaryGoal,
                lead.DesiredStartTerm,
                lead.Source.UtmSource,
                lead.Source.UtmCampaign,
                lead.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(leads);
    }

    [HttpGet("metrics")]
    [ProducesResponseType(typeof(AdminLeadMetricsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminLeadMetricsResponse>> GetMetrics(
        [FromQuery] string? query,
        [FromQuery] LeadStatus? status,
        [FromQuery] ProductCategory? product,
        [FromQuery] string? source,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var leadsQuery = BuildLeadQuery(new LeadSearchRequest(query, status, product, source, from, to));
        var today = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero);

        var total = await leadsQuery.CountAsync(cancellationToken);
        var newLeads = await leadsQuery.CountAsync(lead => lead.Status == LeadStatus.New, cancellationToken);
        var leadsToday = await leadsQuery.CountAsync(lead => lead.CreatedAt >= today, cancellationToken);
        var contacted = await leadsQuery.CountAsync(lead =>
            lead.Status == LeadStatus.Contacted ||
            lead.Status == LeadStatus.AppointmentScheduled ||
            lead.Status == LeadStatus.QuoteCreated ||
            lead.Status == LeadStatus.Won ||
            lead.Status == LeadStatus.Lost,
            cancellationToken);
        var appointments = await leadsQuery.CountAsync(lead => lead.Status == LeadStatus.AppointmentScheduled, cancellationToken);
        var quotes = await leadsQuery.CountAsync(lead => lead.Status == LeadStatus.QuoteCreated, cancellationToken);
        var won = await leadsQuery.CountAsync(lead => lead.Status == LeadStatus.Won, cancellationToken);

        return Ok(new AdminLeadMetricsResponse(
            newLeads,
            leadsToday,
            total == 0 ? null : Math.Round(contacted / (decimal)total, 4),
            appointments,
            quotes,
            won,
            total == 0 ? null : Math.Round(won / (decimal)total, 4)));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeadDetailResponse>> GetLead(Guid id, CancellationToken cancellationToken)
    {
        var lead = await dbContext.Leads
            .AsNoTracking()
            .Include(item => item.Property)
            .Include(item => item.EnergyProfile)
            .Include(item => item.Source)
            .Include(item => item.Interests)
            .Include(item => item.ConsentRecords)
            .Include(item => item.StatusHistory)
            .Include(item => item.Notes)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (lead is null)
        {
            return NotFound(new ApiError("NOT_FOUND", "Lead niet gevonden."));
        }

        return Ok(ToDetailResponse(lead));
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeadDetailResponse>> UpdateStatus(
        Guid id,
        UpdateLeadStatusRequest request,
        CancellationToken cancellationToken)
    {
        var lead = await dbContext.Leads.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (lead is null)
        {
            return NotFound(new ApiError("NOT_FOUND", "Lead niet gevonden."));
        }

        if (lead.Status == request.Status)
        {
            return BadRequest(new ApiError("STATUS_UNCHANGED", "De lead heeft deze status al."));
        }

        var previousStatus = lead.Status;
        lead.Status = request.Status;
        lead.UpdatedAt = DateTimeOffset.UtcNow;
        dbContext.LeadStatusHistory.Add(new LeadStatusHistory
        {
            LeadId = lead.Id,
            PreviousStatus = previousStatus,
            NewStatus = request.Status,
            Actor = "admin",
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        var updatedLead = await LoadLeadDetail(id, cancellationToken);
        return Ok(ToDetailResponse(updatedLead!));
    }

    [HttpPost("{id:guid}/notes")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeadDetailResponse>> AddNote(
        Guid id,
        AddLeadNoteRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new ApiError("VALIDATION_ERROR", "Vul een notitie in.", new Dictionary<string, string[]>
            {
                ["text"] = ["Vul een notitie in."]
            }));
        }

        var lead = await dbContext.Leads.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (lead is null)
        {
            return NotFound(new ApiError("NOT_FOUND", "Lead niet gevonden."));
        }

        dbContext.LeadNotes.Add(new LeadNote
        {
            LeadId = lead.Id,
            Text = request.Text.Trim(),
            Actor = "admin",
            CreatedAt = DateTimeOffset.UtcNow
        });
        lead.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        var updatedLead = await LoadLeadDetail(id, cancellationToken);
        return CreatedAtAction(nameof(GetLead), new { id = lead.Id }, ToDetailResponse(updatedLead!));
    }

    private async Task<Lead?> LoadLeadDetail(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Leads
            .AsNoTracking()
            .Include(item => item.Property)
            .Include(item => item.EnergyProfile)
            .Include(item => item.Source)
            .Include(item => item.Interests)
            .Include(item => item.ConsentRecords)
            .Include(item => item.StatusHistory)
            .Include(item => item.Notes)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
    }

    private static LeadDetailResponse ToDetailResponse(Lead lead)
    {
        return new LeadDetailResponse(
            lead.Id,
            lead.Status,
            lead.ProductInterest,
            lead.FullName,
            lead.Email,
            lead.Phone,
            lead.PrimaryGoal,
            lead.DesiredStartTerm,
            lead.CreatedAt,
            lead.UpdatedAt,
            new PropertyResponse(
                lead.Property.HomeType,
                lead.Property.BuildYearRange,
                lead.Property.SolarPanels,
                lead.Property.Postcode,
                lead.Property.HouseNumber),
            new EnergyProfileResponse(
                lead.EnergyProfile.ElectricityUsageKwh,
                lead.EnergyProfile.GasUsageM3,
                lead.EnergyProfile.SolarPanelCount,
                lead.EnergyProfile.FeedInKwh,
                lead.EnergyProfile.EnergyContractType),
            lead.Interests.OrderBy(interest => interest.Value).Select(interest => interest.Value).ToArray(),
            lead.ConsentRecords
                .OrderByDescending(consent => consent.CreatedAt)
                .Select(consent => new ConsentResponse(
                    consent.AdviceConsent,
                    consent.MatchingConsent,
                    consent.ConsentText,
                    consent.ConsentVersion,
                    consent.SourceUrl,
                    consent.CreatedAt))
                .ToArray(),
            new LeadSourceResponse(
                lead.Source.UtmSource,
                lead.Source.UtmMedium,
                lead.Source.UtmCampaign,
                lead.Source.UtmTerm,
                lead.Source.UtmContent,
                lead.Source.Gclid,
                lead.Source.Referrer,
                lead.Source.LandingPage),
            lead.StatusHistory
                .OrderByDescending(history => history.CreatedAt)
                .Select(history => new StatusHistoryResponse(
                    history.PreviousStatus,
                    history.NewStatus,
                    history.Actor,
                    history.Note,
                    history.CreatedAt))
                .ToArray(),
            lead.Notes
                .OrderByDescending(note => note.CreatedAt)
                .Select(note => new LeadNoteResponse(note.Id, note.Text, note.Actor, note.CreatedAt))
                .ToArray());
    }

    private IQueryable<Lead> BuildLeadQuery(LeadSearchRequest filters)
    {
        var leadsQuery = dbContext.Leads
            .AsNoTracking()
            .Include(lead => lead.Property)
            .Include(lead => lead.Source)
            .AsQueryable();

        if (filters.Status.HasValue)
        {
            leadsQuery = leadsQuery.Where(lead => lead.Status == filters.Status.Value);
        }

        if (filters.Product.HasValue)
        {
            leadsQuery = leadsQuery.Where(lead => lead.ProductInterest == filters.Product.Value);
        }

        if (filters.From.HasValue)
        {
            leadsQuery = leadsQuery.Where(lead => lead.CreatedAt >= filters.From.Value);
        }

        if (filters.To.HasValue)
        {
            var to = filters.To.Value.TimeOfDay == TimeSpan.Zero ? filters.To.Value.AddDays(1) : filters.To.Value;
            leadsQuery = leadsQuery.Where(lead => lead.CreatedAt < to);
        }

        if (!string.IsNullOrWhiteSpace(filters.Source))
        {
            var normalizedSource = filters.Source.Trim().ToLowerInvariant();
            leadsQuery = leadsQuery.Where(lead =>
                (lead.Source.UtmSource != null && lead.Source.UtmSource.ToLower().Contains(normalizedSource)) ||
                (lead.Source.UtmMedium != null && lead.Source.UtmMedium.ToLower().Contains(normalizedSource)) ||
                (lead.Source.UtmCampaign != null && lead.Source.UtmCampaign.ToLower().Contains(normalizedSource)));
        }

        if (!string.IsNullOrWhiteSpace(filters.Query))
        {
            var normalizedQuery = filters.Query.Trim().ToLowerInvariant();
            leadsQuery = leadsQuery.Where(lead =>
                lead.FullName.ToLower().Contains(normalizedQuery) ||
                lead.Email.ToLower().Contains(normalizedQuery) ||
                (lead.Phone != null && lead.Phone.ToLower().Contains(normalizedQuery)) ||
                lead.Property.Postcode.ToLower().Contains(normalizedQuery) ||
                lead.PrimaryGoal.ToLower().Contains(normalizedQuery));
        }

        return leadsQuery;
    }
}
