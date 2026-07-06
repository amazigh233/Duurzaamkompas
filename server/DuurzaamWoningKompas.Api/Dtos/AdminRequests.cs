using DuurzaamWoningKompas.Api.Domain;

namespace DuurzaamWoningKompas.Api.Dtos;

public sealed record LeadSearchRequest(
    string? Query,
    LeadStatus? Status,
    ProductCategory? Product,
    string? Source,
    DateTimeOffset? From,
    DateTimeOffset? To);

public sealed record UpdateLeadStatusRequest(LeadStatus Status, string? Note);

public sealed record AddLeadNoteRequest(string Text);
