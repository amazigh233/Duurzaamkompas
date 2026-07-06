using System.Text.RegularExpressions;
using DuurzaamWoningKompas.Api.Domain;
using DuurzaamWoningKompas.Api.Dtos;

namespace DuurzaamWoningKompas.Api.Services;

public sealed class LeadValidationService
{
    private static readonly Regex EmailRegex = new(@"^\S+@\S+\.\S+$", RegexOptions.Compiled);
    private static readonly Regex PostcodeRegex = new(@"^[1-9][0-9]{3}\s?[A-Z]{2}$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public IDictionary<string, string[]> Validate(CreateLeadRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        var productInterest = request.ProductInterest ?? ProductCategory.General;

        if (string.IsNullOrWhiteSpace(request.SubmissionId) || request.SubmissionId.Trim().Length > 80)
        {
            errors["submissionId"] = ["De aanvraagreferentie ontbreekt of is ongeldig."];
        }

        if (productInterest != ProductCategory.Thuisbatterij)
        {
            RequireOption(errors, "woningtype", request.Woningtype, WoningcheckOptions.HomeTypes, "Kies een geldig woningtype.");
            RequireOption(errors, "bouwjaar", request.Bouwjaar, WoningcheckOptions.BuildYearRanges, "Kies een geldige bouwjaarperiode.");
        }

        RequireOption(errors, "zonnepanelen", request.Zonnepanelen, WoningcheckOptions.SolarPanelOptions, "Geef aan of de woning zonnepanelen heeft.");
        var allowedGoals = productInterest == ProductCategory.Thuisbatterij
            ? WoningcheckOptions.BatteryGoals
            : WoningcheckOptions.Goals;

        RequireOption(errors, "hoofddoel", request.Hoofddoel, allowedGoals, "Kies uw belangrijkste doel.");
        RequireOption(errors, "starttermijn", request.Starttermijn, WoningcheckOptions.StartTerms, "Kies een geldige starttermijn.");

        if (request.Stroomverbruik is null or < 0 or > 50000)
        {
            errors["stroomverbruik"] = ["Vul een realistische indicatie van het stroomverbruik in."];
        }

        if (productInterest != ProductCategory.Thuisbatterij && request.Gasverbruik is (null or < 0 or > 20000))
        {
            errors["gasverbruik"] = ["Vul een realistische indicatie van het gasverbruik in."];
        }

        if (productInterest == ProductCategory.Thuisbatterij)
        {
            if (request.Zonnepanelen == "Ja" && request.AantalZonnepanelen is (null or < 1 or > 80))
            {
                errors["aantalZonnepanelen"] = ["Vul een realistisch aantal zonnepanelen in."];
            }

            if (request.TerugleveringKwh is < 0 or > 50000)
            {
                errors["terugleveringKwh"] = ["Vul een realistische indicatie van de teruglevering in of laat het veld leeg."];
            }

            RequireOption(errors, "energiecontract", request.Energiecontract, WoningcheckOptions.EnergyContractTypes, "Kies een geldig type energiecontract.");
        }

        var interests = request.Interesses ?? [];
        if (interests.Length == 0 || interests.Any(interest => !WoningcheckOptions.Interests.Contains(interest)))
        {
            errors["interesses"] = ["Kies minimaal een geldig interessegebied."];
        }

        if (string.IsNullOrWhiteSpace(request.Postcode) || !PostcodeRegex.IsMatch(request.Postcode.Trim()))
        {
            errors["postcode"] = ["Vul een geldige Nederlandse postcode in."];
        }

        if (string.IsNullOrWhiteSpace(request.Huisnummer))
        {
            errors["huisnummer"] = ["Vul het huisnummer in."];
        }

        if (string.IsNullOrWhiteSpace(request.Naam))
        {
            errors["naam"] = ["Vul uw naam in."];
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !EmailRegex.IsMatch(request.Email.Trim()))
        {
            errors["email"] = ["Vul een geldig e-mailadres in."];
        }

        if (!string.IsNullOrWhiteSpace(request.Telefoon) && request.Telefoon.Trim().Length < 8)
        {
            errors["telefoon"] = ["Vul een geldig telefoonnummer in of laat het veld leeg."];
        }
        else if (productInterest == ProductCategory.Thuisbatterij && string.IsNullOrWhiteSpace(request.Telefoon))
        {
            errors["telefoon"] = ["Vul uw telefoonnummer in zodat we de aanvraag kunnen opvolgen."];
        }

        if (request.Consent is null)
        {
            errors["consent"] = ["Toestemming ontbreekt."];
        }
        else if (!request.Consent.AdviceConsent)
        {
            errors["consent.adviceConsent"] = ["Toestemming voor het ontvangen van uw woningadvies is verplicht."];
        }

        if (string.IsNullOrWhiteSpace(request.Consent?.SourceUrl))
        {
            errors["consent.sourceUrl"] = ["De bronpagina van de toestemming ontbreekt."];
        }

        if (request.Tracking is null)
        {
            errors["tracking"] = ["Trackinggegevens ontbreken."];
        }
        else if (string.IsNullOrWhiteSpace(request.Tracking.LandingPage))
        {
            errors["tracking.landingPage"] = ["De landingspagina ontbreekt."];
        }

        return errors;
    }

    private static void RequireOption(
        IDictionary<string, string[]> errors,
        string key,
        string? value,
        IReadOnlyCollection<string> options,
        string message)
    {
        if (string.IsNullOrWhiteSpace(value) || !options.Contains(value))
        {
            errors[key] = [message];
        }
    }
}
