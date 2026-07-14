# Launch Checklist

Checklist voor een gecontroleerde productie-lancering en eerste Google Ads test van DuurzaamWoningKompas.

## DNS

- Kies definitief productiedomein.
- Koppel het productiedomein aan de frontend hosting.
- Koppel het API-subdomein of dezelfde origin aan de ASP.NET Core API.
- Controleer `www` en apex-domain redirects.
- Zet lage TTL tijdens de eerste launchdag.

## HTTPS

- Forceer HTTPS voor frontend en backend.
- Controleer geldige TLS-certificaten voor alle gebruikte hostnames.
- Gebruik HSTS pas wanneer domein en redirects stabiel zijn.

## Frontend Environment

- Zet `VITE_API_BASE_URL` alleen wanneer frontend en API niet dezelfde origin gebruiken.
- Zet `VITE_GTM_ID=GTM-P9C3Q8TL` in de buildomgeving vóór `npm run build`.
- Zet nooit admin credentials of API-keys in Vite environment variables.
- Configureer hosting rewrites zodat `/thuisbatterij-check` direct naar de SPA entrypoint wijst.
- Controleer dat `/thuisbatterij-check?utm_source=google&utm_medium=cpc&utm_campaign=...&gclid=...` een HTTP 200 geeft.

## Backend Environment

- Stel `ConnectionStrings__Postgres` in via secret/environment management.
- Stel `Cors__AllowedOrigins__0` in op de exacte frontend origin.
- Stel `Admin__Username` en `Admin__Password` in met sterke productiecredentials.
- Laat `Admin__AllowApiKeyHeader=false` voor de publieke productieomgeving.
- Zet `ASPNETCORE_ENVIRONMENT=Production`.

## PostgreSQL

- Gebruik een aparte productiedatabase met beperkte applicatiegebruiker.
- Controleer opslaglocatie, encryptie-at-rest en toegangsrestricties.
- Test databaseconnectiviteit vanaf de backend runtime.

## Migrations

- Draai `dotnet ef database update` tegen productie tijdens een gepland releasevenster.
- Maak vooraf een databasebackup.
- Controleer dat de migration `AddLeadSubmissionId` is toegepast.

## SMTP

- Configureer `SMTP_HOST=smtp.transip.email`, `SMTP_PORT=465`, `SMTP_FROM_EMAIL=info@duurzaamwoningkompas.nl`, `SMTP_FROM_NAME=DuurzaamWoningKompas` en `SMTP_USE_SSL=true`.
- Configureer `CONTACT_NOTIFICATION_EMAIL=info@duurzaamwoningkompas.nl` voor lead- en contactformulierberichten.
- Stel `SMTP_USERNAME=info@duurzaamwoningkompas.nl` en `SMTP_PASSWORD` in via secrets.
- Test succesvolle verzending met een echte leadtest.
- Controleer dat leadopslag blijft werken wanneer SMTP tijdelijk faalt.
- Test contactformulierverzending en beide klantbevestigingen vanuit de productieomgeving.
- Draai `npm run test:production-email` met `DWK_PRODUCTION_SMOKE_TEST=send-real-email` na het instellen van de productie secrets.

## Admin Authentication

- Gebruik `/api/admin/session` voor login met HttpOnly cookie.
- Deel admincredentials alleen met bevoegde gebruikers.
- Controleer dat `/api/admin/leads` zonder sessie `401` of `503` geeft.
- Overweeg MFA of identity-provider-koppeling voor een bredere productie-uitrol.

## Privacy En Cookies

- Vervang privacy placeholders voor juridische entiteit, KvK, adres, privacy e-mail, hosting en e-mailleverancier.
- Vervang juridische bedrijfsgegevens in footer en voorwaarden.
- Laat privacy- en consentteksten juridisch reviewen voor livegang.
- Laat algemene voorwaarden juridisch reviewen voor livegang.
- Controleer dat consent niet vooraf is aangevinkt.
- Leg consenttekst, consentversie, timestamp en source URL vast.
- Publiceer een privacyverklaring en cookiebeleid voordat betaalde traffic start.
- Activeer analytics pas conform cookie/privacy-keuzes.
- Test cookie accepteren, weigeren en voorkeuren beheren.
- Test dat analytics/marketing niet laden vóór passende toestemming.

## Google Ads Conversion Setup

- Gebruik `/thuisbatterij-check` als finale advertentielanding.
- Zorg dat UTM parameters en `gclid` aan advertentie-URL's worden toegevoegd.
- Koppel conversiemeting in GTM aan het Custom Event `generate_lead` en gebruik `submission_id` voor deduplicatie waar de tag dit ondersteunt.
- Test met Google Tag Assistant voordat de campagne live gaat.
- Test dat refresh op de bedankstatus geen dubbele conversie-event veroorzaakt.

## Analytics Setup

- Meet minimaal `page_view`, `woningcheck_started`, `woningcheck_step_completed`, `generate_lead` en `contact_form_submitted`.
- Vermijd persoonsgegevens in analytics payloads.
- Controleer consent mode/cookie-instellingen voor EU/Nederland.

## Backup Strategy

- Plan dagelijkse PostgreSQL backups.
- Test restore naar een aparte database.
- Documenteer bewaartermijnen en wie restore mag uitvoeren.

## Monitoring

- Monitor API health, 5xx errors, databaseconnecties en SMTP-fouten.
- Monitor `/api/health`.
- Stel alerts in voor lead submission failures en admin login anomalies.
- Controleer logs op afwezigheid van persoonsgegevens in applicatielogregels.

## Rollback Procedure

- Bewaar het vorige deploybare frontend artifact.
- Bewaar de vorige backend release.
- Maak voor migrations altijd een backup; database rollback gebeurt via restore of een expliciet rollbackplan.
- Pauzeer Google Ads campagnes direct bij tracking-, leadopslag- of privacyproblemen.

## Go/No-Go Checklist

- [ ] Domein definitief gekozen.
- [ ] DNS voor apex en `www` ingesteld.
- [ ] HTTPS actief voor frontend en API.
- [ ] Frontend deployment met SPA fallback getest.
- [ ] API deployment getest via `/api/health`.
- [ ] PostgreSQL productieconnection string via secrets ingesteld.
- [ ] EF migrations tegen productie uitgevoerd na backup.
- [ ] Backup- en restoreprocedure getest.
- [ ] SMTP ingesteld voor leadnotificaties.
- [ ] `CONTACT_NOTIFICATION_EMAIL` ingesteld en contactformulier getest.
- [ ] Admin authentication ingesteld met sterke productiecredentials.
- [ ] `Admin__AllowApiKeyHeader=false` in publieke productie.
- [ ] Privacy placeholders vervangen.
- [ ] Juridische bedrijfsgegevens vervangen.
- [ ] Privacyverklaring juridisch beoordeeld.
- [ ] Algemene voorwaarden juridisch beoordeeld.
- [ ] Cookiebeleid gecontroleerd tegen werkelijke productieconfiguratie.
- [ ] Cookie consent getest: accepteren, weigeren en voorkeuren beheren.
- [ ] Analytics consent getest voordat analyticsprovider wordt geactiveerd.
- [ ] Google Ads conversion getest met marketingtoestemming.
- [ ] `robots.txt` getest.
- [ ] `sitemap.xml` getest en ingediend bij Search Console.
- [ ] Canonical host en routecanonical getest.
- [ ] Mobile layout getest voor homepage, contact, Woningcheck en ThuisbatterijCheck.
- [ ] Directe route access en refresh getest.
- [ ] Lead end-to-end getest vanaf `/thuisbatterij-check` met UTM en gclid.
- [ ] Admin login, leadlijst, detail, notitie, statusupdate en logout getest.
- [ ] Monitoring op API health, 5xx, database en SMTP ingericht.
- [ ] Error alerts voor lead submission failures en contact notification failures ingericht.
- [ ] Rollbackprocedure bekend bij eigenaar/beheerder.
- [ ] Google Ads campagnes pas live na volledige lead- en consenttest.
