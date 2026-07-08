using DuurzaamWoningKompas.Api.Domain;

namespace DuurzaamWoningKompas.Api.Dtos;

public sealed record LeadSearchRequest(
    string? Query,
    LeadStatus? Status,
    ProductCategory? Product,
    string? Source,
    string? Campaign,
    DateTimeOffset? From,
    DateTimeOffset? To,
    LeadSortOption Sort,
    int Page,
    int PageSize);

public enum LeadSortOption
{
    Newest,
    Oldest,
    LastContact,
    NextFollowUp
}

public sealed record UpdateLeadStatusRequest(LeadStatus Status, string? Note);

public sealed record AddLeadNoteRequest(string Text);

public sealed record UpdateLeadFollowUpRequest(DateTimeOffset? NextFollowUpAt, string? Note);

public sealed record CreateAppointmentRequest(
    DateTimeOffset StartAt,
    DateTimeOffset? EndAt,
    string? Type,
    string? Status,
    string? Notes);
