using DuurzaamWoningKompas.Api.Domain;

namespace DuurzaamWoningKompas.Api.Dtos;

public sealed record LeadCreatedResponse(Guid Id, LeadStatus Status, DateTimeOffset CreatedAt);

public sealed record LeadListItemResponse(
    Guid Id,
    LeadStatus Status,
    ProductCategory ProductInterest,
    string FullName,
    string Email,
    string? Phone,
    string Postcode,
    string PrimaryGoal,
    string DesiredStartTerm,
    string? UtmSource,
    string? UtmMedium,
    string? UtmCampaign,
    DateTimeOffset? LastContactAt,
    DateTimeOffset? NextFollowUpAt,
    string? FollowUpNote,
    DateTimeOffset CreatedAt);

public sealed record PagedLeadListResponse(
    LeadListItemResponse[] Items,
    int Total,
    int Page,
    int PageSize);

public sealed record LeadDetailResponse(
    Guid Id,
    LeadStatus Status,
    ProductCategory ProductInterest,
    string FullName,
    string Email,
    string? Phone,
    string PrimaryGoal,
    string DesiredStartTerm,
    DateTimeOffset? LastContactAt,
    DateTimeOffset? NextFollowUpAt,
    string? FollowUpNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    PropertyResponse Property,
    EnergyProfileResponse EnergyProfile,
    string[] Interests,
    ConsentResponse[] ConsentRecords,
    LeadSourceResponse Source,
    StatusHistoryResponse[] StatusHistory,
    LeadNoteResponse[] Notes,
    AppointmentResponse[] Appointments);

public sealed record PropertyResponse(
    string HomeType,
    string BuildYearRange,
    string SolarPanels,
    string Postcode,
    string HouseNumber);

public sealed record EnergyProfileResponse(
    int ElectricityUsageKwh,
    int GasUsageM3,
    int? SolarPanelCount,
    int? FeedInKwh,
    string? EnergyContractType);

public sealed record ConsentResponse(
    bool AdviceConsent,
    bool MatchingConsent,
    string ConsentText,
    string ConsentVersion,
    string SourceUrl,
    DateTimeOffset CreatedAt);

public sealed record LeadSourceResponse(
    string? UtmSource,
    string? UtmMedium,
    string? UtmCampaign,
    string? UtmTerm,
    string? UtmContent,
    string? Gclid,
    string? Referrer,
    string LandingPage);

public sealed record AdminLeadMetricsResponse(
    int NewLeads,
    int LeadsToday,
    int LeadsThisWeek,
    int ActiveLeads,
    int ToCall,
    decimal? ContactRate,
    int Appointments,
    int Quotes,
    int Won,
    int Lost,
    decimal? WonConversionRate);

public sealed record StatusHistoryResponse(
    LeadStatus? PreviousStatus,
    LeadStatus NewStatus,
    string Actor,
    string? Note,
    DateTimeOffset CreatedAt);

public sealed record LeadNoteResponse(Guid Id, string Text, string Actor, DateTimeOffset CreatedAt);

public sealed record DashboardBucketResponse(string Label, int Count);

public sealed record AdminDashboardResponse(
    AdminLeadMetricsResponse Metrics,
    LeadListItemResponse[] RecentLeads,
    DashboardBucketResponse[] LeadsPerStatus,
    DashboardBucketResponse[] LeadsPerSource,
    LeadListItemResponse[] OpenFollowUps);

public sealed record AppointmentResponse(
    Guid Id,
    Guid LeadId,
    string LeadName,
    ProductCategory ProductInterest,
    DateTimeOffset StartAt,
    DateTimeOffset? EndAt,
    string Type,
    string Status,
    string? Notes);

public sealed record AdminReportResponse(
    DashboardBucketResponse[] LeadsPerDay,
    DashboardBucketResponse[] LeadsPerWeek,
    DashboardBucketResponse[] LeadsPerMonth,
    DashboardBucketResponse[] LeadsPerProduct,
    DashboardBucketResponse[] LeadsPerSource,
    DashboardBucketResponse[] LeadsPerCampaign,
    int Appointments,
    int Quotes,
    int Won,
    int Lost,
    decimal? ConversionRate);
