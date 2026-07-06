using DuurzaamWoningKompas.Api.Domain;
using DuurzaamWoningKompas.Api.Dtos;
using DuurzaamWoningKompas.Api.Services;

namespace DuurzaamWoningKompas.Api.Tests;

public sealed class LeadValidationServiceTests
{
    private readonly LeadValidationService _validator = new();

    [Fact]
    public void Validate_accepts_complete_woningcheck_request()
    {
        var errors = _validator.Validate(ValidRequest());

        Assert.Empty(errors);
    }

    [Fact]
    public void Validate_requires_advice_consent()
    {
        var request = ValidRequest() with
        {
            Consent = ValidConsent() with { AdviceConsent = false }
        };

        var errors = _validator.Validate(request);

        Assert.True(errors.ContainsKey("consent.adviceConsent"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("1234")]
    [InlineData("0123 AB")]
    [InlineData("1234 ABC")]
    public void Validate_rejects_invalid_postcodes(string postcode)
    {
        var request = ValidRequest() with { Postcode = postcode };

        var errors = _validator.Validate(request);

        Assert.True(errors.ContainsKey("postcode"));
    }

    [Fact]
    public void Validate_rejects_unknown_interest_values()
    {
        var request = ValidRequest() with { Interesses = ["Lagere energierekening", "Niet bestaande maatregel"] };

        var errors = _validator.Validate(request);

        Assert.True(errors.ContainsKey("interesses"));
    }

    [Fact]
    public void Validate_accepts_thuisbatterij_request_without_generic_home_fields()
    {
        var request = ValidRequest() with
        {
            ProductInterest = ProductCategory.Thuisbatterij,
            Woningtype = null,
            Bouwjaar = null,
            Zonnepanelen = "Ja",
            AantalZonnepanelen = 12,
            TerugleveringKwh = 1800,
            Energiecontract = "Dynamisch",
            Gasverbruik = null,
            Hoofddoel = "Meer eigen zonnestroom gebruiken",
            Telefoon = "0612345678"
        };

        var errors = _validator.Validate(request);

        Assert.Empty(errors);
    }

    [Fact]
    public void Validate_requires_phone_for_thuisbatterij_request()
    {
        var request = ValidRequest() with
        {
            ProductInterest = ProductCategory.Thuisbatterij,
            Zonnepanelen = "Ja",
            AantalZonnepanelen = 12,
            Energiecontract = "Vast",
            Gasverbruik = null,
            Hoofddoel = "Ik wil vooral persoonlijk advies",
            Telefoon = ""
        };

        var errors = _validator.Validate(request);

        Assert.True(errors.ContainsKey("telefoon"));
    }

    [Fact]
    public void LeadStatus_contains_only_mvp_statuses()
    {
        var statuses = Enum.GetNames<LeadStatus>();

        Assert.Equal(
            ["New", "Contacted", "AppointmentScheduled", "QuoteCreated", "Won", "Lost"],
            statuses);
    }

    private static CreateLeadRequest ValidRequest()
    {
        return new CreateLeadRequest(
            SubmissionId: Guid.NewGuid().ToString("N"),
            ProductInterest: ProductCategory.General,
            Woningtype: "Tussenwoning",
            Bouwjaar: "1975 - 1991",
            Zonnepanelen: "Nee",
            AantalZonnepanelen: null,
            Stroomverbruik: 3000,
            TerugleveringKwh: null,
            Energiecontract: null,
            Gasverbruik: 1200,
            Interesses: ["Lagere energierekening"],
            Hoofddoel: "Lagere maandlasten",
            Starttermijn: "Binnen 6-12 maanden",
            Postcode: "1234 AB",
            Huisnummer: "12",
            Naam: "Test Aanvraag",
            Email: "test@example.com",
            Telefoon: "",
            Consent: ValidConsent(),
            Tracking: new TrackingRequest(
                UtmSource: "local",
                UtmMedium: "manual",
                UtmCampaign: "mvp-test",
                UtmTerm: null,
                UtmContent: null,
                Gclid: "test-gclid",
                Referrer: null,
                LandingPage: "http://localhost:5173/"));
    }

    private static ConsentRequest ValidConsent()
    {
        return new ConsentRequest(
            AdviceConsent: true,
            MatchingConsent: false,
            ConsentText: WoningcheckOptions.DefaultConsentText,
            ConsentVersion: WoningcheckOptions.ConsentVersion,
            SourceUrl: "http://localhost:5173/#/woningcheck");
    }
}
