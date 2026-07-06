# Launch Audit

Datum: 2026-07-06

## Samenvatting

De bestaande MVP bevatte al een werkende React/Vite frontend, ASP.NET Core API, PostgreSQL migrations, Woningcheck, ThuisbatterijCheck, UTM/GCLID-opslag, leadnotificatie en admin leadbeheer. De belangrijkste launchgaten zaten in contactfunctionaliteit, legal/cookiepagina's, cookieconsent, footer, technische SEO-documenten en productieconfiguratie.

## P0 - blokkeert livegang

- Opgelost: `/contact` had nog geen werkend formulier of backend endpoint.
- Opgelost: `/algemene-voorwaarden`, `/cookiebeleid` en `/partner-worden` ontbraken.
- Opgelost: cookiebanner en permanente link voor cookievoorkeuren ontbraken.
- Opgelost: footer bevatte niet alle vereiste links en bedrijfsgegevens-placeholders.
- Opgelost: technische SEO-basis miste `robots.txt`, `sitemap.xml`, canonical en route-specifieke metadata.
- Opgelost: contactnotificatieconfiguratie `CONTACT_NOTIFICATION_EMAIL` ontbrak in voorbeeldconfiguratie.

## P1 - oplossen vóór betaalde advertenties

- Opgelost: privacyverklaring was te summier voor launchvoorbereiding.
- Opgelost: algemene voorwaarden ontbraken voor de huidige MVP-rol als informatie- en aanvraagplatform.
- Opgelost: cookiebeleid sloot nog niet aan op daadwerkelijke localStorage/sessionStorage/admin-cookie implementatie.
- Opgelost: contactformulier heeft nu server-side validatie, privacybevestiging, honeypot en rate limiting.
- Opgelost: route-metadata, Open Graph en noindex voor niet-bestaande routes zijn toegevoegd.
- Opgelost: launchdocumentatie is uitgebreid met deployment, environment, SEO en privacy-notities.

## P2 - kan na eerste marktvalidatie

- Juridische bedrijfsgegevens, KvK, btw, adres, privacy e-mailadres en e-mailleverancier moeten door de eigenaar worden ingevuld.
- Privacyverklaring en algemene voorwaarden vereisen menselijke/juridische review.
- Externe analytics en Google Ads tags zijn bewust nog niet geactiveerd; de consentarchitectuur en `dwk:conversion-ready` hook zijn voorbereid.
- MFA of identity-provider voor admin is aanbevolen voor bredere productie-uitrol.
- Exacte bewaartermijnen en operationele AVG-processen moeten organisatorisch worden vastgesteld.

## Gecontroleerde onderdelen

- Frontend routing, publieke pagina's, nested routes en legacy publieke hash-redirects.
- Woningcheck en ThuisbatterijCheck inclusief validatie, duplicate-submit bescherming en consent.
- API leadopslag, server-side leadvalidatie, idempotente `submissionId`, SMTP-fouttolerantie bij leads.
- Admin login/logout, leadlijst, filters, detail, statuswijziging, notities en statushistorie.
- UTM/GCLID/referrer/landing page opslag.
- Repository hygiene via `.gitignore`.
