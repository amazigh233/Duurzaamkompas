# Deployment

Pragmatisch productieplan voor DuurzaamWoningKompas MVP.

## 1. Voorwaarden

- Node `20.19.0` volgens `.nvmrc`.
- .NET SDK met `net10.0` support.
- PostgreSQL database.
- SMTP-account voor lead- en contactnotificaties.
- Productiedomein en exacte frontend/API origins.

## 2. Frontend

```bash
nvm use
npm install
npm run build
```

Deploy de inhoud van `dist/` naar de frontend hosting.

Hosting moet SPA fallback ondersteunen:

- `/`, `/woningcheck`, `/thuisbatterij-check`, `/oplossingen/*`, `/kennisbank/*`, `/contact`, `/privacy`, `/algemene-voorwaarden` en `/cookiebeleid` serveren `index.html`.
- `/api/*` en `/openapi/*` mogen niet naar `index.html` worden herschreven wanneer API en frontend dezelfde host delen.
- `robots.txt` en `sitemap.xml` moeten als statische bestanden bereikbaar zijn.

## 3. Backend

```bash
dotnet restore
dotnet build server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj
dotnet test server/DuurzaamWoningKompas.Api.Tests/DuurzaamWoningKompas.Api.Tests.csproj
```

Runtime:

```bash
dotnet server/DuurzaamWoningKompas.Api/bin/Release/net10.0/DuurzaamWoningKompas.Api.dll
```

Gebruik in productie:

- `ASPNETCORE_ENVIRONMENT=Production`
- HTTPS voor publieke API
- exacte `Cors__AllowedOrigins__0`
- secrets via platform secret manager, niet via source control

## 4. Database

Maak vóór migraties een backup. Draai daarna:

```bash
dotnet ef database update \
  --project server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj \
  --startup-project server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj
```

Controleer daarna `/api/health` en voer een testlead uit.

## 5. SMTP Via TransIP

Configureer SMTP uitsluitend op de backend/productieserver. Zet geen SMTP- of IMAP-wachtwoorden in `appsettings.json`, `appsettings.Production.json`, frontend environment variables of source control.

Productievariabelen:

```bash
SMTP_HOST=smtp.transip.email
SMTP_PORT=465
SMTP_USERNAME=info@duurzaamwoningkompas.nl
SMTP_PASSWORD=<SECRET_FROM_ENVIRONMENT>
SMTP_FROM_EMAIL=info@duurzaamwoningkompas.nl
SMTP_FROM_NAME=DuurzaamWoningKompas
SMTP_USE_SSL=true
CONTACT_NOTIFICATION_EMAIL=info@duurzaamwoningkompas.nl
```

MailKit wordt gebruikt voor SMTP. Bij `SMTP_PORT=465` en `SMTP_USE_SSL=true` gebruikt de backend SSL/TLS on connect, passend bij TransIP poort 465.

IMAP is niet nodig voor de huidige backend. Gebruik deze waarden alleen voor mailboxclients of toekomstige inkomende-mailfunctionaliteit:

```bash
IMAP_HOST=imap.transip.email
IMAP_PORT=993
IMAP_USERNAME=info@duurzaamwoningkompas.nl
IMAP_PASSWORD=<MAILBOX_PASSWORD_NOT_COMMITTED>
IMAP_USE_SSL=true
```

Test SMTP vanuit de productieomgeving:

- nieuwe Woningcheck lead
- ThuisbatterijCheck lead
- contactformulier
- ontvangstbevestiging naar klant na Woningcheck
- ontvangstbevestiging naar klant na contactformulier
- tijdelijke SMTP-storing bij leadopslag

Leadopslag moet bij SMTP-storing blijven bestaan. Contactberichten worden niet opgeslagen; daarom geeft het contactformulier een serverfout wanneer de interne contactnotificatie niet kan worden verzonden.

Na het instellen van de secrets kan de productie smoke-test vanaf de productieomgeving worden uitgevoerd. Gebruik een mailbox die u kunt controleren als testontvanger:

```bash
DWK_PRODUCTION_SMOKE_TEST=send-real-email \
DWK_PRODUCTION_API_URL=https://www.duurzaamwoningkompas.nl \
DWK_SMOKE_TEST_RECIPIENT_EMAIL=info@duurzaamwoningkompas.nl \
npm run test:production-email
```

De script controleert standaard ook of de TransIP SMTP- en IMAP-variabelen in de runtime omgeving staan. Wanneer u de test vanaf een beheerwerkplek tegen de productie-API draait in plaats van op de productieserver, kan alleen voor die situatie `DWK_SKIP_SERVER_ENV_CHECK=true` worden meegegeven.

## 6. Google Ads En Analytics

Er is geen hardcoded Google Ads ID. Productietags moeten luisteren naar:

- `dwk:analytics` voor analytische events na analytische toestemming
- `dwk:conversion-ready` voor conversie na marketingtoestemming

Configureer tags pas na controle van de cookiebanner en toestemming.

## 7. Rollback

- Bewaar het vorige frontend artifact.
- Bewaar de vorige backend release.
- Maak vóór migrations een databasebackup.
- Pauzeer Google Ads direct bij problemen met tracking, leadopslag, consent of contact.
