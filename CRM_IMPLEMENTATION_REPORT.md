# CRM implementation report

## Samenvatting

Gebouwd binnen de bestaande DuurzaamWoningKompas applicatie:

- Afgeschermde admin routes: `/admin/login`, `/admin/dashboard`, `/admin/leads`, `/admin/leads/:id`, `/admin/calendar`, `/admin/reporting` en `/admin/settings`.
- Professionele CRM shell met sidebar, topbar, globale zoekfunctie, dashboard, leadlijst, pipeline, leaddetail, follow-ups, afspraken en rapportage.
- Server-side admin authorization via cookie-authenticatie en `AdminOnly` policy.
- Follow-up velden op bestaande `Lead` records.
- Minimale interne afspraken-entiteit gekoppeld aan bestaande leads.
- Dashboard, rapportage, leadlijst, follow-up en afspraak endpoints op echte opgeslagen data.

## Gewijzigde bestanden

- `CRM_AUDIT.md`
- `CRM_IMPLEMENTATION_REPORT.md`
- `server/DuurzaamWoningKompas.Api/Controllers/AdminAppointmentsController.cs`
- `server/DuurzaamWoningKompas.Api/Controllers/AdminLeadsController.cs`
- `server/DuurzaamWoningKompas.Api/Controllers/AdminSessionController.cs`
- `server/DuurzaamWoningKompas.Api/Controllers/OpenApiController.cs`
- `server/DuurzaamWoningKompas.Api/Data/AppDbContext.cs`
- `server/DuurzaamWoningKompas.Api/Data/Migrations/20260706233505_AddMiniCrmFields.cs`
- `server/DuurzaamWoningKompas.Api/Data/Migrations/20260706233505_AddMiniCrmFields.Designer.cs`
- `server/DuurzaamWoningKompas.Api/Data/Migrations/AppDbContextModelSnapshot.cs`
- `server/DuurzaamWoningKompas.Api/Domain/Appointment.cs`
- `server/DuurzaamWoningKompas.Api/Domain/Lead.cs`
- `server/DuurzaamWoningKompas.Api/Dtos/AdminRequests.cs`
- `server/DuurzaamWoningKompas.Api/Dtos/LeadResponse.cs`
- `server/DuurzaamWoningKompas.Api/Program.cs`
- `server/DuurzaamWoningKompas.Api/Security/AdminApiKeyFilter.cs` verwijderd
- `server/DuurzaamWoningKompas.Api/Services/AdminAuthOptions.cs`
- `server/DuurzaamWoningKompas.Api/Services/AdminPasswordVerifier.cs`
- `server/DuurzaamWoningKompas.Api/appsettings.json`
- `src/App.tsx`
- `src/api/client.ts`
- `src/components/admin/AdminDashboard.tsx`
- `src/styles.css`
- `src/types.ts`

## Databasewijzigingen

Nieuwe migration: `20260706233505_AddMiniCrmFields`.

Toegevoegd aan `leads`:

- `LastContactAt`
- `NextFollowUpAt`
- `FollowUpNote`

Nieuwe tabel:

- `appointments`

Velden:

- `Id`
- `LeadId`
- `StartAt`
- `EndAt`
- `Type`
- `Status`
- `Notes`
- `CreatedAt`
- `UpdatedAt`

Indexes toegevoegd voor:

- `leads.LastContactAt`
- `leads.NextFollowUpAt`
- `appointments.LeadId`
- `appointments.StartAt`
- `appointments.Status`

## Nieuwe en gewijzigde endpoints

- `GET /api/admin/leads`
- `GET /api/admin/leads/metrics`
- `GET /api/admin/leads/dashboard`
- `GET /api/admin/leads/report`
- `GET /api/admin/leads/{id}`
- `PATCH /api/admin/leads/{id}/status`
- `PATCH /api/admin/leads/{id}/follow-up`
- `POST /api/admin/leads/{id}/notes`
- `POST /api/admin/leads/{id}/appointments`
- `GET /api/admin/appointments`
- `POST /api/admin/session` uitgebreid met rate limiting en password hash support

## Securitykeuzes

- Admin endpoints gebruiken nu `[Authorize(Policy = "AdminOnly")]`.
- De API-key admin filter is verwijderd.
- Login gebruikt secure HttpOnly cookie-authenticatie.
- Productie-login vereist `Admin:PasswordHash`; plaintext `Admin:Password` werkt alleen als development fallback.
- Password hash verifier gebruikt PBKDF2-SHA256 met minimaal 100.000 iteraties.
- Login heeft rate limiting: 5 pogingen per 5 minuten per IP-adres.
- Admin secrets horen in environment variables/secrets en niet in de React/Vite bundle.
- CORS blijft credentialed maar beperkt tot geconfigureerde trusted origins.

## Uitgevoerde checks

- `dotnet build server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj`
- `dotnet test server/DuurzaamWoningKompas.Api.Tests/DuurzaamWoningKompas.Api.Tests.csproj`
- `dotnet ef migrations add AddMiniCrmFields --project server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj --startup-project server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj --output-dir Data/Migrations`
- `dotnet ef migrations list --project server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj --startup-project server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj --no-connect`
- `npx tsc --noEmit`
- `npm run build`

## Checks met waarschuwingen

- `npm run build` eindigde met exitcode 0, maar Vite gaf een Node syntax warning: `Unexpected token '??='`.
- Lokale runtime: Node `v14.15.3`, npm `6.14.9`.
- `package.json` vereist Node `^20.19.0 || >=22.12.0`; voor een betrouwbare Vite build moet Node worden geüpdatet.
- EF CLI gaf een waarschuwing dat toolversie `9.0.4` ouder is dan runtime `10.0.9`; migration generatie en build slaagden wel.
- `dotnet ef migrations list --no-connect` kon niet bepalen welke migrations in de database zijn toegepast, omdat bewust zonder databaseconnectie is gecontroleerd.

## Niet uitgevoerd

- Geen database migration toegepast op een echte PostgreSQL database.
- Geen browser/e2e test uitgevoerd.
- Geen productie login handmatig getest met echte `Admin:PasswordHash`.

## Bekende beperkingen

- Er is geen externe agenda-integratie gebouwd.
- Er is geen partnerportaal, lead marketplace, automatische leadverkoop, AI scoring of workflow automation gebouwd.
- Follow-up is bewust eenvoudig: datum/tijd en korte reden op de lead.
- Afspraken hebben een minimaal intern model.
- Rapportage toont geen omzet, omdat omzet niet betrouwbaar in het datamodel staat.
- Legal/privacy copy blijft reviewplichtig voor productie.
