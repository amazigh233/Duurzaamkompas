using DuurzaamWoningKompas.Api.Domain;

namespace DuurzaamWoningKompas.Api.Dtos;

public sealed record CreateLeadRequest(
    string? SubmissionId,
    ProductCategory? ProductInterest,
    string? Woningtype,
    string? Bouwjaar,
    string? Zonnepanelen,
    int? AantalZonnepanelen,
    int? Stroomverbruik,
    int? TerugleveringKwh,
    string? Energiecontract,
    int? Gasverbruik,
    string[] Interesses,
    string? Hoofddoel,
    string? Starttermijn,
    string? Postcode,
    string? Huisnummer,
    string? Naam,
    string? Email,
    string? Telefoon,
    ConsentRequest? Consent,
    TrackingRequest? Tracking);

public sealed record ConsentRequest(
    bool AdviceConsent,
    bool MatchingConsent,
    string? ConsentText,
    string? ConsentVersion,
    string? SourceUrl);

public sealed record TrackingRequest(
    string? UtmSource,
    string? UtmMedium,
    string? UtmCampaign,
    string? UtmTerm,
    string? UtmContent,
    string? Gclid,
    string? Referrer,
    string? LandingPage);
