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
    string? UtmCampaign,
    DateTimeOffset CreatedAt);

public sealed record LeadDetailResponse(
    Guid Id,
    LeadStatus Status,
    ProductCategory ProductInterest,
    string FullName,
    string Email,
    string? Phone,
    string PrimaryGoal,
    string DesiredStartTerm,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    PropertyResponse Property,
    EnergyProfileResponse EnergyProfile,
    string[] Interests,
    ConsentResponse[] ConsentRecords,
    LeadSourceResponse Source,
    StatusHistoryResponse[] StatusHistory,
    LeadNoteResponse[] Notes);

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
    decimal? ContactRate,
    int Appointments,
    int Quotes,
    int Won,
    decimal? WonConversionRate);

public sealed record StatusHistoryResponse(
    LeadStatus? PreviousStatus,
    LeadStatus NewStatus,
    string Actor,
    string? Note,
    DateTimeOffset CreatedAt);

public sealed record LeadNoteResponse(Guid Id, string Text, string Actor, DateTimeOffset CreatedAt);
