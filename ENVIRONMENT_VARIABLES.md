# Environment Variables

Gebruik `.env.example` als compacte kopieerbare lijst. Onderstaande tabel legt het doel uit.

## Frontend

| Variabele | Verplicht | Doel |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Alleen cross-origin | Basis-URL van de API. Leeg laten bij same-origin deployment. |
| `VITE_PUBLIC_SITE_URL` | Ja | Publieke canonical site-URL. |
| `VITE_PUBLIC_LEGAL_ENTITY_NAME` | Ja | Juridische bedrijfsnaam. Placeholder vervangen vóór productie. |
| `VITE_PUBLIC_KVK_NUMBER` | Ja | KvK-nummer. Placeholder vervangen vóór productie. |
| `VITE_PUBLIC_VAT_NUMBER` | Indien nodig | Btw-nummer indien publiek nodig. |
| `VITE_PUBLIC_CONTACT_EMAIL` | Ja | Zakelijk contactadres in footer/legal copy. |
| `VITE_PUBLIC_CONTACT_PHONE` | Ja | Zakelijk telefoonnummer of bewuste publieke contactkeuze. |
| `VITE_PUBLIC_CORRESPONDENCE_ADDRESS` | Ja | Vestigings- of correspondentieadres. |
| `VITE_PUBLIC_PRIVACY_EMAIL` | Ja | Contactadres voor privacyvragen. |
| `VITE_GOOGLE_ADS_CONVERSION_ID` | Alleen wanneer actief | Google Ads configuratie voor tagmanager, niet hardcoded in app. |
| `VITE_GOOGLE_ADS_CONVERSION_LABEL` | Alleen wanneer actief | Google Ads conversielabel voor tagmanager. |
| `VITE_ANALYTICS_PROVIDER` | Alleen wanneer actief | Documenteert gekozen analyticsprovider. |

Plaats nooit admincredentials of private API keys in `VITE_*` variabelen.

## Backend

| Variabele | Verplicht | Doel |
| --- | --- | --- |
| `ConnectionStrings__Postgres` | Ja | PostgreSQL connection string. Alleen via secrets/environment. |
| `ASPNETCORE_ENVIRONMENT` | Ja | `Production` in productie. |
| `Cors__AllowedOrigins__0` | Ja | Exacte frontend origin. Voeg extra origins toe met `__1`, `__2`, enzovoort. |
| `Admin__Username` | Ja | Admin loginnaam. |
| `Admin__Password` | Ja | Sterk adminwachtwoord. |
| `Admin__ApiKey` | Nee | Legacy header-key alleen voor gecontroleerde interne scenario's. |
| `Admin__AllowApiKeyHeader` | Ja | `false` voor publieke productie. |
| `SMTP_HOST` | Ja | TransIP SMTP-host: `smtp.transip.email`. Alleen server-side instellen. |
| `SMTP_PORT` | Ja | TransIP SMTP-poort: `465`. De backend gebruikt hiervoor SSL/TLS on connect. |
| `SMTP_USERNAME` | Ja | SMTP-gebruikersnaam: `info@duurzaamwoningkompas.nl`. |
| `SMTP_PASSWORD` | Ja | SMTP-wachtwoord via server secret manager. Nooit committen en niet in `appsettings*.json` plaatsen. |
| `SMTP_FROM_EMAIL` | Ja | Afzenderadres: `info@duurzaamwoningkompas.nl`. |
| `SMTP_FROM_NAME` | Ja | Afzendernaam: `DuurzaamWoningKompas`. |
| `SMTP_USE_SSL` | Ja | `true` voor TransIP poort 465. |
| `CONTACT_NOTIFICATION_EMAIL` | Ja | Ontvanger voor lead- en contactformuliernotificaties: `info@duurzaamwoningkompas.nl`. |
| `Notifications__AdminBaseUrl` | Aanbevolen | Basis-URL voor admin detail links in leadmails. Geen secret. |

De backend ondersteunt de oudere `Notifications__Smtp*` keys nog voor lokale testtools, maar productie moet de `SMTP_*` variabelen hierboven gebruiken.

## IMAP

IMAP is niet nodig voor de huidige backend. Stel deze waarden alleen in voor mailboxclients of toekomstige inkomende-mailfunctionaliteit:

| Variabele | Verplicht | Doel |
| --- | --- | --- |
| `IMAP_HOST` | Alleen voor mailboxclient/toekomstig inkomend | TransIP IMAP-host: `imap.transip.email`. |
| `IMAP_PORT` | Alleen voor mailboxclient/toekomstig inkomend | TransIP IMAP-poort: `993`. |
| `IMAP_USERNAME` | Alleen voor mailboxclient/toekomstig inkomend | Mailboxgebruikersnaam: `info@duurzaamwoningkompas.nl`. |
| `IMAP_PASSWORD` | Alleen voor mailboxclient/toekomstig inkomend | Mailboxwachtwoord via secret manager. Nooit committen. |
| `IMAP_USE_SSL` | Alleen voor mailboxclient/toekomstig inkomend | `true`. |

## Placeholders Die Eigenaar Moet Invullen

- Juridische bedrijfsnaam
- KvK-nummer
- Btw-nummer indien publiek nodig
- Correspondentie-/vestigingsadres
- Zakelijk e-mailadres
- Telefoonnummer
- Privacy e-mailadres
- Productiehostingprovider
- SMTP/e-mailleverancier: TransIP
- Analytics/Google Ads configuratie indien geactiveerd
