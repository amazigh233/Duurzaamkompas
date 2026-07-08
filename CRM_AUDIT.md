# CRM audit

## Wat al bestaat

- Frontend: React + TypeScript + Vite met een bestaande `AdminDashboard` component.
- Backend: ASP.NET Core API met EF Core/PostgreSQL en bestaande leadopslag.
- Domein: `Lead`, `LeadProperty`, `EnergyProfile`, `LeadInterest`, `LeadSource`, `ConsentRecord`, `LeadStatusHistory` en `LeadNote`.
- Statussen: centraal via `LeadStatus` met `New`, `Contacted`, `AppointmentScheduled`, `QuoteCreated`, `Won` en `Lost`.
- Admin sessie: cookie-authenticatie is al geconfigureerd met HttpOnly cookie, SameSite Lax, sliding expiration en 401/403 API responses.
- Leadbeheer: bestaande admin endpoints voor leadlijst, metrics, leaddetail, statuswijziging en notities.
- Tracking: UTM, GCLID, landing page en referrer worden opgeslagen in `LeadSource`.
- Consent: advies- en matchingtoestemming worden opgeslagen met tekst, versie, bron-URL en timestamp.
- Notificatie: nieuwe leads worden eerst opgeslagen; SMTP-fouten worden daarna afgevangen en loggen alleen het lead-id.

## Wat hergebruikt kan worden

- De bestaande lead-entiteiten en navigaties vormen de basis voor het CRM.
- `LeadStatusHistory` kan worden gebruikt voor status- en activity timeline.
- `LeadNote` kan worden gebruikt voor chronologische interne notities.
- `LeadSource` dekt acquisitiebron, campagne en GCLID af.
- De bestaande centrale API client kan uitgebreid worden voor CRM endpoints.
- De bestaande CSS tokens en statuskleuren passen bij de rustige groene huisstijl.

## Wat ontbreekt

- Admin routes zijn frontendmatig nog hash-gebaseerd en niet opgesplitst in `/admin/login`, `/admin/dashboard`, `/admin/leads`, `/admin/leads/:id`, `/admin/calendar` en `/admin/settings`.
- Admin lead endpoints gebruiken nog een API-key filter als fallback; dit moet worden vervangen door server-side authorization policies.
- Login gebruikt configureerbare gebruikersnaam/wachtwoordvergelijking, maar nog geen gehashte password-verificatie.
- Er is geen rate limiting op login.
- Leadlijst mist campagnefilter, sortering, pagination, laatste contact en volgende opvolging.
- Dashboard mist echte KPI's voor week, actieve leads, nog te bellen, openstaande follow-ups, statusverdeling en bronnen.
- Er is nog geen follow-up datamodel.
- Er is nog geen appointment datamodel of kalenderroute.
- Er is nog geen rapportageroute.
- Activity timeline combineert nog niet alle gebeurtenissen.
- Responsive CRM shell met sidebar/topbar ontbreekt.

## Securityrisico's

- `AdminApiKeyFilter` laat, indien geconfigureerd, toegang toe via `X-Admin-Api-Key`. Dat is ongeschikt voor het CRM en vergroot het risico dat admin secrets in clients of tooling belanden.
- Plaintext `Admin:Password` configuratie is minder veilig dan een server-side hash. Productie moet `Admin:PasswordHash` gebruiken via environment variables/secrets.
- Login heeft nog geen specifieke brute-force rate limiting.
- Admin endpoints missen expliciete `[Authorize]` policies.
- Bij cookie-auth moet CSRF-risico worden meegewogen. SameSite Lax helpt, maar production-hardening moet ook CORS en cookie settings blijven beperken tot vertrouwde origins.

## Implementatieplan

1. Vervang admin endpointbeveiliging door een `AdminOnly` authorization policy en verwijder API-key toegang uit de admin leadcontroller.
2. Voeg veilige admin loginverificatie toe met `Admin:PasswordHash` via PBKDF2 en behoud plaintext password alleen als development fallback met documentatie.
3. Voeg rate limiting toe op `POST /api/admin/session`.
4. Breid het bestaande leadmodel minimaal uit met follow-upvelden en voeg een kleine `Appointment` entiteit toe.
5. Breid admin DTO's/endpoints uit voor dashboard, lead filtering/sortering/pagination, leaddetail, status, notities, follow-ups, afspraken en rapportage.
6. Bouw de React adminomgeving als CRM shell met loginpagina, protected routes, sidebar, topbar, dashboard, leadlijst, pipeline, leaddetail, kalender, rapportage en instellingen.
7. Gebruik alleen echte opgeslagen data; geen fake cijfers, reviews, omzet of partnerdata.
8. Run frontend build/typecheck en backend restore/build/tests. Maak daarna `CRM_IMPLEMENTATION_REPORT.md`.
