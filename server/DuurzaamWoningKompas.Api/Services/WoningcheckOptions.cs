namespace DuurzaamWoningKompas.Api.Services;

public static class WoningcheckOptions
{
    public static readonly string[] HomeTypes =
    [
        "Tussenwoning",
        "Hoekwoning",
        "Twee-onder-een-kap",
        "Vrijstaande woning",
        "Appartement"
    ];

    public static readonly string[] BuildYearRanges =
    [
        "Voor 1945",
        "1945 - 1975",
        "1975 - 1991",
        "1992 - 2005",
        "Na 2005"
    ];

    public static readonly string[] SolarPanelOptions = ["Ja", "Nee", "Weet ik niet"];

    public static readonly string[] Interests =
    [
        "Lagere energierekening",
        "Minder gas gebruiken",
        "Zelf opgewekte stroom opslaan",
        "Meer wooncomfort",
        "Koelen in de zomer",
        "Elektrische auto thuis laden",
        "Ik weet het nog niet"
    ];

    public static readonly string[] Goals =
    [
        "Lagere maandlasten",
        "Minder gas gebruiken",
        "Meer comfort",
        "Voorbereiden op de toekomst",
        "Eerst onafhankelijk advies"
    ];

    public static readonly string[] StartTerms =
    [
        "Zo snel mogelijk",
        "Binnen 3 maanden",
        "Binnen 6-12 maanden",
        "Ik orienteer me nog"
    ];

    public static readonly string[] EnergyContractTypes =
    [
        "Vast",
        "Variabel",
        "Dynamisch",
        "Weet ik niet"
    ];

    public static readonly string[] BatteryGoals =
    [
        "Meer eigen zonnestroom gebruiken",
        "Minder afhankelijk zijn van het net",
        "Inspelen op dynamische energieprijzen",
        "Voorbereiden op toekomstige veranderingen",
        "Ik wil vooral persoonlijk advies"
    ];

    public const string ConsentVersion = "2026-07-05";

    public const string DefaultConsentText =
        "Ja, ik wil mijn persoonlijke woningadvies ontvangen en ga akkoord met de privacyverklaring. Optionele matching met een specialist gebeurt alleen wanneer ik daarvoor apart toestemming geef.";
}
