# Privacy Implementation Notes

Datum: 2026-07-06

## Belangrijk

Deze notitie is technisch/productmatig. Privacyverklaring, algemene voorwaarden, consentteksten, bewaartermijnen en verwerkersafspraken moeten menselijk en juridisch worden beoordeeld vóór definitieve productiepublicatie.

## Gegevensstromen

### Woningcheck En ThuisbatterijCheck

Verwerkt:

- woningtype en bouwjaar waar gevraagd
- zonnepanelen en eventueel aantal panelen
- stroomverbruik, gasverbruik, teruglevering en energiecontract waar gevraagd
- interessegebieden, hoofddoel en starttermijn
- postcode en huisnummer
- naam, e-mail en telefoon waar gevraagd
- adviesconsent en optionele matchingconsent
- consenttekst, consentversie, timestamp en source URL
- UTM source, medium, campaign, term, content, gclid, referrer en landing page

Opslag:

- conceptantwoorden tijdelijk in localStorage
- lead, property, energy profile, interests, source en consent in PostgreSQL
- submission-id om dubbele leadopslag te voorkomen

### Contactformulier

Verwerkt:

- naam
- e-mailadres
- optioneel telefoonnummer
- onderwerp
- bericht
- privacybevestiging
- source URL
- honeypotveld voor spamdetectie

Opslag:

- contactberichten worden niet in de database opgeslagen
- interne notificatie via SMTP
- bij ontbrekende SMTP/contactconfiguratie geeft de API een fout, zodat berichten niet stil verdwijnen

## Consent

- Adviesconsent is verplicht voor leadsubmission.
- Matchingconsent is optioneel en apart.
- Checkboxes zijn niet vooraf aangevinkt.
- Cookievoorkeuren hebben noodzakelijke, analytische en marketingcategorieën.
- Consent Mode v2 staat standaard op `denied` voor analyticsopslag en alle advertentiewaarden, vóór GTM wordt geladen.
- Analytische dataLayer-events worden alleen geplaatst na analytische toestemming.
- `generate_lead` wordt alleen geplaatst na analytische en/of marketingtoestemming en uitsluitend na een succesvolle API-response.

## Cookies En Browseropslag

Huidige implementatie:

- `localStorage`: Woningcheck conceptantwoorden
- `localStorage`: ThuisbatterijCheck conceptantwoorden
- `localStorage`: UTM/gclid/referrer/landing page attributie voor leadcontext
- `localStorage`: submission-id en afgeronde leadreferentie tegen dubbele submissions
- `localStorage`: cookievoorkeuren en consentversie
- `localStorage`: submission-id's waarvoor `generate_lead` al is verwerkt, zodat refresh en een nieuwe browsersessie niet dubbel meten
- HttpOnly cookie `dwk-admin-session`: adminsessie

GTM wordt centraal geladen via de build-time variabele `VITE_GTM_ID`. GA4- en Google Ads-ID's staan niet in de frontend. De dataLayer bevat alleen routegegevens, funnelstappen, product-/leadtype, submission-id en veilige campagneattributie; formulierinhoud en persoonsgegevens worden niet meegestuurd.

## Beveiliging

- Admin API gebruikt server-side sessiecookie.
- Admincredentials staan niet in frontend environment variables.
- Partnerdata/tenant-scope is nog niet van toepassing omdat partnerportaal buiten MVP1 valt.
- Leadnotificatie logt bij SMTP-fout alleen lead-id, geen volledige persoonsgegevens.
- Contactnotificatiefouten loggen geen ingevulde contactgegevens.
- Backend valideert lead- en contactpayloads server-side.

## Reviewpunten Voor Productie

- Juridische bedrijfsnaam, KvK, btw, adres, contact- en privacy-e-mailadres invullen.
- Definitieve AVG-grondslagen bevestigen.
- Definitieve bewaartermijnen bepalen.
- Privacyverklaring juridisch beoordelen.
- Algemene voorwaarden juridisch beoordelen.
- Verwerkersovereenkomsten sluiten met hosting, database, SMTP, monitoring, analytics en advertentiepartijen waar nodig.
- Procedure voor inzage, correctie, verwijdering, bezwaar, beperking, dataportabiliteit en intrekking van toestemming vastleggen.
- Beslissen of IP-adressen/user agents voor consentregistratie nodig en proportioneel zijn; de MVP slaat deze nu niet als consentrecord op.
