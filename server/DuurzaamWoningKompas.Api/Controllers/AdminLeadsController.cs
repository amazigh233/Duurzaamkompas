using DuurzaamWoningKompas.Api.Data;
using DuurzaamWoningKompas.Api.Domain;
using DuurzaamWoningKompas.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DuurzaamWoningKompas.Api.Controllers;

[ApiController]
[Route("api/admin/leads")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminLeadsController(AppDbContext dbContext) : ControllerBase
{
    private static readonly LeadStatus[] ActiveStatuses =
    [
        LeadStatus.New,
        LeadStatus.Contacted,
        LeadStatus.AppointmentScheduled,
        LeadStatus.QuoteCreated
    ];

    [HttpGet]
    [ProducesResponseType(typeof(PagedLeadListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedLeadListResponse>> GetLeads(
        [FromQuery] string? query,
        [FromQuery] LeadStatus? status,
        [FromQuery] ProductCategory? product,
        [FromQuery] string? source,
        [FromQuery] string? campaign,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] LeadSortOption sort = LeadSortOption.Newest,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        var filters = NormalizeSearch(new LeadSearchRequest(query, status, product, source, campaign, from, to, sort, page, pageSize));
        var leadsQuery = BuildLeadQuery(filters);
        var total = await leadsQuery.CountAsync(cancellationToken);
        var leads = await ApplySort(leadsQuery, filters.Sort)
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedLeadListResponse(
            leads.Select(ToListItemResponse).ToArray(),
            total,
            filters.Page,
            filters.PageSize));
    }

    [HttpGet("metrics")]
    [ProducesResponseType(typeof(AdminLeadMetricsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminLeadMetricsResponse>> GetMetrics(CancellationToken cancellationToken)
    {
        return Ok(await BuildMetricsAsync(BuildLeadQuery(), cancellationToken));
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDashboardResponse>> GetDashboard(CancellationToken cancellationToken)
    {
        var metrics = await BuildMetricsAsync(BuildLeadQuery(), cancellationToken);
        var recentLeads = await BuildLeadQuery()
            .OrderByDescending(lead => lead.CreatedAt)
            .Take(6)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var openFollowUps = await BuildLeadQuery()
            .Where(lead => lead.NextFollowUpAt != null && ActiveStatuses.Contains(lead.Status))
            .OrderBy(lead => lead.NextFollowUpAt)
            .Take(8)
            .ToListAsync(cancellationToken);

        var statusRows = await dbContext.Leads
            .AsNoTracking()
            .GroupBy(lead => lead.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var sourceRows = await dbContext.LeadSources
            .AsNoTracking()
            .GroupBy(source => source.UtmSource ?? "Onbekend")
            .Select(group => new DashboardBucketResponse(group.Key, group.Count()))
            .OrderByDescending(group => group.Count)
            .Take(8)
            .ToArrayAsync(cancellationToken);

        return Ok(new AdminDashboardResponse(
            metrics,
            recentLeads.Select(ToListItemResponse).ToArray(),
            statusRows
                .OrderBy(row => row.Status)
                .Select(row => new DashboardBucketResponse(row.Status.ToString(), row.Count))
                .ToArray(),
            sourceRows,
            openFollowUps
                .Where(lead => lead.NextFollowUpAt <= now.AddMonths(1))
                .Select(ToListItemResponse)
                .ToArray()));
    }

    [HttpGet("report")]
    [ProducesResponseType(typeof(AdminReportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminReportResponse>> GetReport(CancellationToken cancellationToken)
    {
        var leads = await dbContext.Leads
            .AsNoTracking()
            .Include(lead => lead.Source)
            .Select(lead => new
            {
                lead.CreatedAt,
                lead.ProductInterest,
                lead.Status,
                Source = lead.Source.UtmSource,
                Campaign = lead.Source.UtmCampaign
            })
            .ToListAsync(cancellationToken);

        var appointmentCount = await dbContext.Appointments.CountAsync(cancellationToken);
        var total = leads.Count;
        var won = leads.Count(lead => lead.Status == LeadStatus.Won);

        return Ok(new AdminReportResponse(
            leads
                .GroupBy(lead => lead.CreatedAt.Date)
                .OrderBy(group => group.Key)
                .TakeLast(30)
                .Select(group => new DashboardBucketResponse(group.Key.ToString("yyyy-MM-dd"), group.Count()))
                .ToArray(),
            leads
                .GroupBy(lead => $"{lead.CreatedAt:yyyy}-W{GetIsoWeek(lead.CreatedAt):00}")
                .OrderBy(group => group.Key)
                .TakeLast(12)
                .Select(group => new DashboardBucketResponse(group.Key, group.Count()))
                .ToArray(),
            leads
                .GroupBy(lead => lead.CreatedAt.ToString("yyyy-MM"))
                .OrderBy(group => group.Key)
                .TakeLast(12)
                .Select(group => new DashboardBucketResponse(group.Key, group.Count()))
                .ToArray(),
            leads
                .GroupBy(lead => lead.ProductInterest.ToString())
                .Select(group => new DashboardBucketResponse(group.Key, group.Count()))
                .OrderByDescending(group => group.Count)
                .ToArray(),
            leads
                .GroupBy(lead => string.IsNullOrWhiteSpace(lead.Source) ? "Onbekend" : lead.Source)
                .Select(group => new DashboardBucketResponse(group.Key, group.Count()))
                .OrderByDescending(group => group.Count)
                .ToArray(),
            leads
                .GroupBy(lead => string.IsNullOrWhiteSpace(lead.Campaign) ? "Onbekend" : lead.Campaign)
                .Select(group => new DashboardBucketResponse(group.Key, group.Count()))
                .OrderByDescending(group => group.Count)
                .ToArray(),
            appointmentCount,
            leads.Count(lead => lead.Status == LeadStatus.QuoteCreated),
            won,
            leads.Count(lead => lead.Status == LeadStatus.Lost),
            total == 0 ? null : Math.Round(won / (decimal)total, 4)));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeadDetailResponse>> GetLead(Guid id, CancellationToken cancellationToken)
    {
        var lead = await LoadLeadDetail(id, cancellationToken);

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

        var now = DateTimeOffset.UtcNow;
        var previousStatus = lead.Status;
        lead.Status = request.Status;
        lead.LastContactAt = now;
        lead.UpdatedAt = now;
        dbContext.LeadStatusHistory.Add(new LeadStatusHistory
        {
            LeadId = lead.Id,
            PreviousStatus = previousStatus,
            NewStatus = request.Status,
            Actor = AdminActor(),
            Note = CleanOptional(request.Note),
            CreatedAt = now
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        var updatedLead = await LoadLeadDetail(id, cancellationToken);
        return Ok(ToDetailResponse(updatedLead!));
    }

    [HttpPatch("{id:guid}/follow-up")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeadDetailResponse>> UpdateFollowUp(
        Guid id,
        UpdateLeadFollowUpRequest request,
        CancellationToken cancellationToken)
    {
        var lead = await dbContext.Leads.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (lead is null)
        {
            return NotFound(new ApiError("NOT_FOUND", "Lead niet gevonden."));
        }

        var now = DateTimeOffset.UtcNow;
        lead.NextFollowUpAt = request.NextFollowUpAt;
        lead.FollowUpNote = CleanOptional(request.Note);
        lead.UpdatedAt = now;

        if (request.NextFollowUpAt is not null)
        {
            dbContext.LeadNotes.Add(new LeadNote
            {
                LeadId = lead.Id,
                Text = $"Opvolging gepland: {lead.FollowUpNote ?? "geen reden opgegeven"}",
                Actor = AdminActor(),
                CreatedAt = now
            });
        }

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

        var now = DateTimeOffset.UtcNow;
        dbContext.LeadNotes.Add(new LeadNote
        {
            LeadId = lead.Id,
            Text = request.Text.Trim(),
            Actor = AdminActor(),
            CreatedAt = now
        });
        lead.LastContactAt = now;
        lead.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        var updatedLead = await LoadLeadDetail(id, cancellationToken);
        return CreatedAtAction(nameof(GetLead), new { id = lead.Id }, ToDetailResponse(updatedLead!));
    }

    [HttpPost("{id:guid}/appointments")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeadDetailResponse>> AddAppointment(
        Guid id,
        CreateAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.StartAt == default)
        {
            return BadRequest(new ApiError("VALIDATION_ERROR", "Vul een geldige afspraakdatum in.", new Dictionary<string, string[]>
            {
                ["startAt"] = ["Vul een geldige afspraakdatum in."]
            }));
        }

        var lead = await dbContext.Leads.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (lead is null)
        {
            return NotFound(new ApiError("NOT_FOUND", "Lead niet gevonden."));
        }

        var now = DateTimeOffset.UtcNow;
        dbContext.Appointments.Add(new Appointment
        {
            LeadId = lead.Id,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            Type = CleanOptional(request.Type) ?? "Telefonisch advies",
            Status = CleanOptional(request.Status) ?? "Scheduled",
            Notes = CleanOptional(request.Notes),
            CreatedAt = now,
            UpdatedAt = now
        });

        if (lead.Status != LeadStatus.AppointmentScheduled)
        {
            var previousStatus = lead.Status;
            lead.Status = LeadStatus.AppointmentScheduled;
            dbContext.LeadStatusHistory.Add(new LeadStatusHistory
            {
                LeadId = lead.Id,
                PreviousStatus = previousStatus,
                NewStatus = LeadStatus.AppointmentScheduled,
                Actor = AdminActor(),
                Note = "Afspraak gepland.",
                CreatedAt = now
            });
        }

        lead.LastContactAt = now;
        lead.UpdatedAt = now;

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
            .Include(item => item.Appointments)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
    }

    private async Task<AdminLeadMetricsResponse> BuildMetricsAsync(IQueryable<Lead> leadsQuery, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        var weekStart = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));

        var total = await leadsQuery.CountAsync(cancellationToken);
        var newLeads = await leadsQuery.CountAsync(lead => lead.Status == LeadStatus.New, cancellationToken);
        var leadsToday = await leadsQuery.CountAsync(lead => lead.CreatedAt >= today, cancellationToken);
        var leadsThisWeek = await leadsQuery.CountAsync(lead => lead.CreatedAt >= weekStart, cancellationToken);
        var activeLeads = await leadsQuery.CountAsync(lead => ActiveStatuses.Contains(lead.Status), cancellationToken);
        var toCall = await leadsQuery.CountAsync(lead =>
            lead.Status == LeadStatus.New ||
            (lead.NextFollowUpAt != null && lead.NextFollowUpAt <= now && ActiveStatuses.Contains(lead.Status)),
            cancellationToken);
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
        var lost = await leadsQuery.CountAsync(lead => lead.Status == LeadStatus.Lost, cancellationToken);

        return new AdminLeadMetricsResponse(
            newLeads,
            leadsToday,
            leadsThisWeek,
            activeLeads,
            toCall,
            total == 0 ? null : Math.Round(contacted / (decimal)total, 4),
            appointments,
            quotes,
            won,
            lost,
            total == 0 ? null : Math.Round(won / (decimal)total, 4));
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
            lead.LastContactAt,
            lead.NextFollowUpAt,
            lead.FollowUpNote,
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
                .ToArray(),
            lead.Appointments
                .OrderByDescending(appointment => appointment.StartAt)
                .Select(appointment => new AppointmentResponse(
                    appointment.Id,
                    appointment.LeadId,
                    lead.FullName,
                    lead.ProductInterest,
                    appointment.StartAt,
                    appointment.EndAt,
                    appointment.Type,
                    appointment.Status,
                    appointment.Notes))
                .ToArray());
    }

    private static LeadListItemResponse ToListItemResponse(Lead lead)
    {
        return new LeadListItemResponse(
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
            lead.Source.UtmMedium,
            lead.Source.UtmCampaign,
            lead.LastContactAt,
            lead.NextFollowUpAt,
            lead.FollowUpNote,
            lead.CreatedAt);
    }

    private IQueryable<Lead> BuildLeadQuery(LeadSearchRequest? filters = null)
    {
        var leadsQuery = dbContext.Leads
            .AsNoTracking()
            .Include(lead => lead.Property)
            .Include(lead => lead.Source)
            .AsQueryable();

        if (filters is null)
        {
            return leadsQuery;
        }

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
                (lead.Source.Referrer != null && lead.Source.Referrer.ToLower().Contains(normalizedSource)));
        }

        if (!string.IsNullOrWhiteSpace(filters.Campaign))
        {
            var normalizedCampaign = filters.Campaign.Trim().ToLowerInvariant();
            leadsQuery = leadsQuery.Where(lead =>
                lead.Source.UtmCampaign != null && lead.Source.UtmCampaign.ToLower().Contains(normalizedCampaign));
        }

        if (!string.IsNullOrWhiteSpace(filters.Query))
        {
            var normalizedQuery = filters.Query.Trim().ToLowerInvariant();
            leadsQuery = leadsQuery.Where(lead =>
                lead.FullName.ToLower().Contains(normalizedQuery) ||
                lead.Email.ToLower().Contains(normalizedQuery) ||
                (lead.Phone != null && lead.Phone.ToLower().Contains(normalizedQuery)) ||
                lead.Property.Postcode.ToLower().Contains(normalizedQuery));
        }

        return leadsQuery;
    }

    private static IQueryable<Lead> ApplySort(IQueryable<Lead> query, LeadSortOption sort)
    {
        return sort switch
        {
            LeadSortOption.Oldest => query.OrderBy(lead => lead.CreatedAt),
            LeadSortOption.LastContact => query.OrderByDescending(lead => lead.LastContactAt ?? lead.UpdatedAt),
            LeadSortOption.NextFollowUp => query
                .OrderBy(lead => lead.NextFollowUpAt == null)
                .ThenBy(lead => lead.NextFollowUpAt),
            _ => query.OrderByDescending(lead => lead.CreatedAt)
        };
    }

    private static LeadSearchRequest NormalizeSearch(LeadSearchRequest filters)
    {
        var page = Math.Max(1, filters.Page);
        var pageSize = Math.Clamp(filters.PageSize, 10, 100);
        return filters with { Page = page, PageSize = pageSize };
    }

    private static string? CleanOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private string AdminActor()
    {
        return string.IsNullOrWhiteSpace(User.Identity?.Name) ? "admin" : User.Identity.Name!;
    }

    private static int GetIsoWeek(DateTimeOffset value)
    {
        return System.Globalization.ISOWeek.GetWeekOfYear(value.Date);
    }
}
