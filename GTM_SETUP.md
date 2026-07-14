# Google Tag Manager Setup

Deze frontend gebruikt Google Tag Manager-container `GTM-P9C3Q8TL` via de build-time variabele `VITE_GTM_ID`. GA4 Measurement ID's en Google Ads Conversion ID's/labels horen uitsluitend in GTM en niet in de frontendcode.

Er staat bewust geen GTM-`noscript` iframe in `index.html`: zonder JavaScript kan de cookiebanner geen expliciete analytics- of marketingtoestemming registreren. Het iframe toch laden zou de vereiste consentflow omzeilen.

## DataLayer-contract

Alle events gebruiken `window.dataLayer` en bevatten geen naam, e-mailadres, telefoonnummer, adres, volledige postcode, vrije tekst of andere direct identificerende formulierdata.

| Event | Parameters | Moment |
| --- | --- | --- |
| `page_view` | `page_path`, `page_location`, `page_title` | Eerste toegestane view en iedere SPA-navigatie |
| `woningcheck_started` | `funnel` | Eerste geldige stapovergang |
| `woningcheck_step_completed` | `funnel`, `step` | Na validatie en vóór de volgende stap |
| `generate_lead` | `lead_type`, `product_interest`, `submission_id`, `source`, `campaign` | Uitsluitend na succesvolle lead-API-response, eenmaal per submission |
| `contact_form_submitted` | geen | Uitsluitend na succesvolle contact-API-response |
| `cookie_consent_updated` | `analytics`, `marketing`, `consent_version` | Na opslaan van cookievoorkeuren |

`page_location` bevat alleen origin, pad en eventueel `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` en `gclid`. Andere queryparameters worden verwijderd.

## 1. Container en Google tag

1. Open container `GTM-P9C3Q8TL` en maak eerst een nieuwe workspace.
2. Maak een Google tag met de GA4 Measurement ID (`G-...`) uit de juiste GA4-webstream.
3. Schakel automatische pageviews in deze tag uit; de SPA stuurt zelf `page_view`.
4. Gebruik een Custom Event-trigger met eventnaam `page_view`.
5. Stel bij Consent Settings aanvullende toestemming `analytics_storage` in.
6. Publiceer nog niet; test eerst in Preview Mode.

## 2. Data Layer Variables

Maak Data Layer Variables (Version 2) voor:

- `page_path`
- `page_location`
- `page_title`
- `funnel`
- `step`
- `lead_type`
- `product_interest`
- `submission_id`
- `source`
- `campaign`

## 3. GA4 events

Maak GA4 Event-tags die de eerder gemaakte Google tag gebruiken:

- Event `page_view`, trigger Custom Event `page_view`, met `page_path`, `page_location` en `page_title`.
- Event `woningcheck_started`, trigger gelijknamig Custom Event, met `funnel`.
- Event `woningcheck_step_completed`, trigger gelijknamig Custom Event, met `funnel` en `step`.
- Event `generate_lead`, trigger Custom Event `generate_lead`, met `lead_type`, `product_interest`, `submission_id`, `source` en `campaign`.
- Event `contact_form_submitted`, trigger gelijknamig Custom Event, zonder formulierparameters.

Alle GA4-tags vereisen aanvullend `analytics_storage`.

## 4. Google Ads-conversie

1. Maak in Google Ads een websiteconversie voor een ingediende lead.
2. Kies implementatie via Google Tag Manager en kopieer Conversion ID en Conversion Label naar GTM.
3. Maak een Google Ads Conversion Tracking-tag met die waarden.
4. Gebruik de Custom Event-trigger `generate_lead`.
5. Gebruik `submission_id` als unieke Order ID/Transaction ID als dit veld beschikbaar is in de gebruikte tagtemplate; dit versterkt deduplicatie naast de frontenddeduplicatie.
6. Vereis `ad_storage`, `ad_user_data` en `ad_personalization` bij Consent Settings.
7. Stuur geen enhanced-conversion user data: de dataLayer bevat bewust geen PII.

## 5. Conversion Linker

1. Voeg een Conversion Linker-tag toe.
2. Trigger op All Pages.
3. Vereis `ad_storage`, `ad_user_data` en `ad_personalization`.
4. Schakel cross-domain linking alleen in wanneer daar een aantoonbare productbehoefte en gecontroleerde domeinlijst voor bestaat.

## 6. Consent Mode v2 controleren

Vóór GTM worden deze defaults geplaatst:

```text
analytics_storage: denied
ad_storage: denied
ad_user_data: denied
ad_personalization: denied
```

Analytics-toestemming verleent alleen `analytics_storage`. Marketingtoestemming verleent de drie advertentiewaarden. Controleer in Preview Mode bij elke keuze dat tags alleen bij hun vereiste consentstatus vuren.

## 7. Preview Mode-test

1. Open GTM Preview, verbind met de HTTPS-productie- of acceptatie-URL en wis vooraf siteopslag.
2. Controleer vóór een keuze de Consent Initialization/defaultwaarden en dat GA4/Ads-tags niet vuren.
3. Kies **Alleen noodzakelijk** en controleer dat alle niet-noodzakelijke tags geblokkeerd blijven.
4. Sta alleen analytics toe en controleer `page_view` plus funnel-events; Ads en Conversion Linker blijven geblokkeerd.
5. Sta marketing toe en controleer de advertentieconsentwaarden en Conversion Linker.
6. Navigeer via interne links en browser terug/vooruit; iedere echte locatie krijgt precies één `page_view`.
7. Verstuur een testlead met toestemming en controleer: API 2xx, lead zichtbaar in CRM, één `generate_lead`, één GA4-event en één Ads-conversietag.
8. Refresh de resultaatpagina, gebruik terug/vooruit en open dezelfde check opnieuw. Er mag geen tweede `generate_lead` voor dezelfde `submission_id` ontstaan.
9. Forceer een API-fout en controleer dat geen `generate_lead` of `contact_form_submitted` ontstaat.
10. Controleer in de dataLayer-tab expliciet dat geen naam, e-mail, telefoon, adres, postcode of vrije tekst staat.

## 8. Publiceren en nacontrole

Publiceer de container pas nadat Preview Mode slaagt. Controleer daarna GA4 DebugView/Realtime, Google Ads Tag Diagnostics en de CRM-testlead. Documenteer de container-versie die bij de release hoort.
