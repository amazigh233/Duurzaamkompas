# AGENTS.md — Codex Instructions for DuurzaamWoningKompas

## Project

This repository belongs to **DuurzaamWoningKompas**, a Dutch consumer platform for home sustainability advice, lead qualification, and partner matching.

Before changing code, always read:

1. `DUURZAAMWONINGKOMPAS_CONTEXT.md`
2. this `AGENTS.md`
3. relevant existing code and configuration files

The product must feel like a trustworthy Dutch consumer platform, not like an aggressive lead website or a generic installation company.

---

## Core Product Goal

Build a platform where homeowners can:

1. understand sustainable home improvement options;
2. complete a clear Woningcheck;
3. receive an advice indication;
4. submit a qualified request;
5. be matched with an internal team or partner installer.

Main conversion:

`Visitor → Woningcheck → Lead → Qualification → Assignment → Appointment/Quote → Result`

---

## Preferred Stack

Respect the existing repository first. If the project is still being created, use this preferred stack.

### Frontend

- React
- TypeScript
- Vite or Next.js, depending on existing setup
- Component-based architecture
- Mobile-first responsive design
- Schema-based form validation where useful
- Centralized API client
- Centralized design tokens

### Backend

- ASP.NET Core Web API
- C#
- REST endpoints
- OpenAPI/Swagger
- Clean separation between API, application logic, domain models, and infrastructure where reasonable
- Server-side validation
- Role- and policy-based authorization

### Database

- PostgreSQL
- ORM/migrations through the chosen backend approach
- Consistent primary key strategy
- Audit fields where relevant

---

## Non-Negotiable Development Rules

1. Inspect existing code before editing.
2. Do not create duplicate architecture.
3. Keep changes small and reviewable.
4. Do not rewrite large areas without explicit instruction.
5. Do not introduce unnecessary dependencies.
6. Do not upgrade packages unless required.
7. Do not commit secrets, API keys, passwords, tokens, connection strings, or private credentials.
8. Do not log sensitive personal data.
9. Do not invent reviews, partners, certifications, statistics, savings, or legal claims.
10. Do not leave visible lorem ipsum or placeholder content in production pages.
11. Do not rely only on frontend validation.
12. Do not rely only on frontend authorization.
13. Do not expose partner data across tenants.
14. Do not use magic strings for lead statuses, roles, or product categories.
15. Do not use `any` in TypeScript unless there is a documented reason.
16. Do not suppress errors without handling the root cause.
17. Do not make UI desktop-only.
18. Do not create fake urgency, countdown timers, pre-checked consent boxes, or dark patterns.
19. Do not make legal assumptions. Flag legal/privacy copy for review.
20. Always report changed files and checks performed.

---

## Frontend Standards

### TypeScript

Use strict, explicit types.

Prefer:

```ts
type LeadStatus = "New" | "NeedsQualification" | "Qualified" | "Assigned";
```

Avoid:

```ts
let status: any;
```

If statuses are shared with backend, use generated types or a central enum/constant mapping.

### Components

Keep components focused and reusable.

Good structure:

```text
src/
  components/
    layout/
    ui/
    woningcheck/
    leads/
    partners/
  pages/
  routes/
  services/
  api/
  hooks/
  lib/
  types/
  styles/
```

Avoid huge page files with all UI, state, API calls, and business logic mixed together.

### Required UI States

Every async UI must handle:

- loading
- empty
- success
- validation error
- server error
- unauthorized/forbidden where relevant

### Accessibility

Use:

- semantic HTML
- visible focus states
- keyboard-friendly controls
- labels for form fields
- accessible error messages
- sufficient color contrast
- reduced-motion support where animations exist

### Styling

Use central tokens or CSS variables.

Indicative tokens:

```css
:root {
  --color-primary: #163d32;
  --color-secondary: #3f7d5b;
  --color-accent: #e8a83e;
  --color-background: #f7f8f3;
  --color-surface: #ffffff;
  --color-text: #1e2925;
}
```

Do not hardcode brand colors repeatedly across files.

### Copywriting

Use clear Dutch.

Preferred tone:

- trustworthy
- calm
- helpful
- practical
- transparent

Use `u/uw` for consumer-facing copy unless the project already uses a different style consistently.

Avoid exaggerated claims.

Bad:

```text
Bespaar gegarandeerd duizenden euro's!
```

Better:

```text
Ontdek welke maatregelen mogelijk interessant zijn voor uw woning.
```

---

## Woningcheck Rules

The Woningcheck is the primary conversion funnel.

### UX

- One main question per step
- Clear progress indicator
- Large selectable cards
- Mobile-first layout
- Back button keeps answers
- Validate each step clearly
- Ask contact details near the end
- Explain what happens after submission
- No pre-checked consent
- No misleading urgency

### Suggested Steps

1. woningtype
2. bouwjaar
3. zonnepanelen
4. elektriciteitsverbruik
5. gasverbruik
6. interessegebieden
7. hoofddoel
8. gewenste starttermijn
9. postcode/huisnummer
10. contactgegevens
11. consent
12. result/thank-you screen

### Data

Store enough to qualify the lead, but apply data minimization.

Useful structures:

- Lead
- Property
- EnergyProfile
- LeadInterest
- ConsentRecord
- LeadSource
- Campaign

---

## Backend Standards

### API

Use clear RESTful endpoints.

Example direction:

```text
POST   /api/woningcheck/leads
GET    /api/admin/leads
GET    /api/admin/leads/{id}
PATCH  /api/admin/leads/{id}/status
POST   /api/admin/leads/{id}/notes
POST   /api/admin/leads/{id}/assignments
GET    /api/partner/leads
PATCH  /api/partner/leads/{id}/status
```

Adapt to existing conventions if the repo already has a pattern.

### Validation

Validate server-side for:

- required fields
- valid email
- valid phone format where applicable
- valid postcode format
- valid enum/status transitions
- consent requirements
- authorization and ownership

### Authorization

Admin and partner APIs must be protected.

Partner users may only access assigned leads for their own partner organization.

Never trust partner IDs from the frontend without server-side checks.

### Errors

Return consistent errors.

Suggested shape:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Controleer de ingevulde gegevens.",
  "errors": {
    "email": ["Vul een geldig e-mailadres in."]
  }
}
```

Do not leak stack traces or sensitive implementation details.

---

## Domain Rules

### Lead Statuses

Lead statuses should be centralized.

Suggested lifecycle:

```text
New
NeedsQualification
Qualified
Unqualified
Assigned
Accepted
Rejected
Contacted
AppointmentScheduled
AppointmentCompleted
QuoteCreated
Won
Lost
Nurture
Archived
```

Status transitions should be intentional. Avoid random free-text status values.

### Lead Assignment

Assignments should store:

- lead id
- partner id or internal team id
- assigned by
- assigned at
- current assignment status
- accepted/rejected timestamp
- rejection reason where applicable

### Status History

Every important status change should create history:

- previous status
- new status
- actor
- timestamp
- optional note/reason

### Consent

Consent records should store:

- consent text/version
- timestamp
- source URL
- IP address only if legally/technically justified
- user agent only if necessary
- related lead id
- allowed contact purposes
- allowed sharing/matching purposes

Legal/privacy implementation must be reviewed before production.

---

## Database Guidelines

Prefer normalized data for core business entities.

Suggested fields for most tables:

```text
id
created_at
updated_at
created_by
updated_by
```

Use soft delete only where there is a clear business reason.

Use indexes for:

- lead status
- created date
- postcode/region
- assigned partner
- source/campaign
- email/phone where search requires it

Do not store secrets in the database unless encrypted and necessary.

---

## Privacy & Security

This project processes personal data.

Required practices:

- collect only needed data;
- protect admin and partner routes;
- scope partner data server-side;
- avoid logging personal data;
- avoid exposing raw internal IDs when unnecessary;
- use environment variables for secrets;
- prepare for deletion/export requests;
- version privacy and consent copy;
- never show one partner another partner's leads.

Any production release must include a privacy/legal review.

---

## Analytics & Tracking

Track funnel performance without violating privacy.

Useful events:

- homepage_viewed
- woningcheck_started
- woningcheck_step_completed
- woningcheck_abandoned
- lead_submitted
- lead_qualified
- lead_assigned
- appointment_scheduled
- quote_created
- lead_won
- lead_lost

Store UTM parameters:

- utm_source
- utm_medium
- utm_campaign
- utm_term
- utm_content
- landing_page
- referrer

Do not use analytics in a way that conflicts with cookie/privacy settings.

---

## Testing Guidelines

Add tests for critical business logic.

Prioritize tests for:

- lead validation
- status transitions
- scoring rules
- routing rules
- partner authorization
- consent persistence
- API error behavior
- Woningcheck form validation

Frontend tests are useful for:

- Woningcheck navigation
- step validation
- successful submission
- error states
- progress indicator
- contact/consent step

---

## Build & Check Commands

Before finishing, inspect the project to determine the correct commands.

Common examples:

### Frontend

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm test
```

### Backend

```bash
dotnet restore
dotnet build
dotnet test
```

Only report commands that were actually run. If a command cannot be run, explain why.

---

## MVP Scope Discipline

Build in this order unless instructed otherwise.

### MVP 1

- public homepage
- solution pages
- Woningcheck
- lead storage
- consent storage
- admin lead list
- lead detail page
- status management
- source/UTM capture
- new lead notification
- basic analytics

### MVP 2

- partner management
- region management
- manual lead assignment
- partner login
- partner lead pipeline
- appointment registration
- partner status updates

### MVP 3

- automatic routing
- configurable lead scoring
- analytics dashboard
- campaign attribution
- nurture flows
- integrations
- advanced calculators

Do not overbuild MVP 3 during MVP 1.

---

## UI Sections

Homepage should generally include:

1. Header
2. Hero
3. Trustbar
4. Woningcheck preview
5. Solution grid
6. How it works
7. Indicative possibilities or savings module
8. Why DuurzaamWoningKompas
9. Knowledge section
10. Real social proof when available
11. Final CTA
12. Footer

Primary CTA:

```text
Start gratis woningcheck
```

---

## Content Rules

Allowed style:

```text
Doe de gratis woningcheck en ontdek welke verduurzamingsmaatregelen mogelijk passen bij uw woning.
```

Avoid:

```text
Wij garanderen de hoogste besparing en laagste prijs.
```

Never invent:

- customer reviews
- partner logos
- awards
- certifications
- case studies
- completed project counts
- exact savings
- legal guarantees

Use placeholders only when clearly marked as development-only and not visible as real public content.

---

## Code Quality

Prefer clear code over clever code.

Good naming examples:

```ts
submitWoningcheckLead()
calculateLeadScore()
assignLeadToPartner()
validateConsent()
```

Bad naming examples:

```ts
doStuff()
handleData()
process()
magic()
```

Avoid deeply nested logic. Extract functions where it improves readability.

---

## Final Response Requirements for Codex

After completing a task, report:

1. Summary of what changed
2. Files changed
3. Checks run
4. Checks not run and why
5. Known limitations or follow-up needed

Do not claim success for checks that were not run.

---

## Product North Star

Every change must support:

**better information → better choice → better match → measurable result**

Trust, clarity, conversion, privacy, and scalability are more important than flashy design.
