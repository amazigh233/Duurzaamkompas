# DuurzaamWoningKompas

MVP voor een Nederlands consumentenplatform rond woningverduurzaming.

## Onderdelen

- React + TypeScript + Vite frontend.
- ASP.NET Core Web API backend.
- PostgreSQL opslag via Entity Framework Core migrations.
- Woningcheck met lead-, consent- en UTM/source-opslag.
- ThuisbatterijCheck voor Google Ads readiness.
- Contactformulier met server-side validatie, honeypot, rate limiting en SMTP-notificatie.
- Cookiebanner met accepteren, weigeren en voorkeuren beheren.
- Admin leadbeheer via server-side sessiecookie.

## Lokale configuratie

Gebruik `.env.example` als overzicht van benodigde waarden. Zet secrets niet in source control.

Frontend tooling gebruikt Vite 8 en vereist Node 20.19 of nieuwer:

```bash
nvm use
npm install
```

Backend environment variables:

```bash
export ConnectionStrings__Postgres="Host=localhost;Port=5432;Database=duurzaamwoningkompas;Username=postgres;Password=postgres"
export Admin__Username="admin"
export Admin__Password="kies-een-sterk-lokaal-wachtwoord"
```

Optioneel voor lokale notificatietests. Productie gebruikt TransIP via server-side SMTP-variabelen:

```bash
export SMTP_HOST="smtp.transip.email"
export SMTP_PORT="465"
export SMTP_USERNAME="info@duurzaamwoningkompas.nl"
export SMTP_PASSWORD="[zet-dit-via-een-lokale-secret]"
export SMTP_FROM_EMAIL="info@duurzaamwoningkompas.nl"
export SMTP_FROM_NAME="DuurzaamWoningKompas"
export SMTP_USE_SSL="true"
export CONTACT_NOTIFICATION_EMAIL="info@duurzaamwoningkompas.nl"
export Notifications__AdminBaseUrl="http://localhost:5173"
```

IMAP (`imap.transip.email:993`) is alleen bedoeld voor mailboxclients of toekomstige inkomende-mailfunctionaliteit en wordt niet door de huidige backend gebruikt.

## Database

Maak een PostgreSQL database aan en voer daarna de migrations uit:

```bash
dotnet ef database update --project server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj
```

## Starten

Backend:

```bash
dotnet run --project server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj
```

Frontend:

```bash
npm run dev
```

De Vite devserver proxyt `/api` en `/openapi` naar `http://localhost:5244`.

Adminbeheer gebruikt een server-side sessiecookie via `/api/admin/session`. Zet geen admin secrets in Vite environment variables. De legacy header `X-Admin-Api-Key` werkt alleen wanneer `Admin__AllowApiKeyHeader=true` expliciet op de backend is gezet en is niet bedoeld voor de publieke frontend.

Cookievoorkeuren dispatchen `dwk:cookie-consent-changed`. Succesvolle lead submission dispatcht `dwk:conversion-ready`; gebruik dit event voor Google Ads conversies en laad marketingtags pas na passende consent.

## Routing en hosting

Publieke pagina's gebruiken crawlbare URL's zoals `/oplossingen`, `/oplossingen/thuisbatterij`, `/kennisbank/thuisbatterij-kosten`, `/contact`, `/privacy`, `/algemene-voorwaarden` en `/cookiebeleid`. Oude publieke hashroutes worden client-side genormaliseerd naar deze paden. Adminroutes blijven voorlopig hash-based via `#/admin`.

Configureer productiehosting als SPA fallback: onbekende publieke frontendpaden moeten `index.html` serveren, terwijl `/api/*` en `/openapi/*` naar de backend blijven gaan.

## Checks

```bash
npm run build
dotnet build server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj
dotnet list server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj package --vulnerable --include-transitive
```

Browser launch-check tegen draaiende lokale frontend en API:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5301" PLAYWRIGHT_API_URL="http://127.0.0.1:5299" npm run test:e2e
```

Voor lokale HTTP-tests van admin-login moet de API in `Development` draaien, omdat productiecookies bewust `Secure` zijn en dus HTTPS vereisen.

Volledige lokale launch-check met tijdelijke PostgreSQL database, fake SMTP, API, frontend en browserflow:

```bash
npm run test:launch
```
