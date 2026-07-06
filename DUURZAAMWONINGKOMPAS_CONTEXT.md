# DuurzaamWoningKompas --- Project Context

> Centrale bedrijfs- en productcontext voor Codex en andere coding
> agents. Lees dit bestand voordat je wijzigingen uitvoert.

## 1. Bedrijf

**DuurzaamWoningKompas** is een Nederlands consumentenplatform voor
woningverduurzaming. Het helpt woningeigenaren ontdekken welke
maatregelen passen bij hun woning, energieverbruik, budget en wensen.

Het platform is geen traditioneel installatiebedrijf. De gewenste
positionering is: onafhankelijk, betrouwbaar, deskundig, transparant,
modern en toegankelijk.

**Kernbelofte:** De juiste route naar een duurzame woning.

**Missie:** technische en commerciële complexiteit rondom
woningverduurzaming vertalen naar begrijpelijke keuzes en consumenten
begeleiden van oriëntatie naar advies en, indien gewenst, een passende
uitvoerende specialist.

## 2. Doelgroep

Primaire doelgroep: Nederlandse woningeigenaren die hun energiekosten
willen verlagen, minder gas willen gebruiken, hun eigen energie slimmer
willen benutten, meer wooncomfort zoeken of willen verduurzamen maar
niet weten waar te beginnen.

De doelgroep is niet noodzakelijk technisch. Gebruik helder Nederlands,
leg noodzakelijke vaktermen uit en vermijd overdreven commerciële taal.

Gebruik op consumentgerichte pagina's bij voorkeur **u/uw**, tenzij de
bestaande productstrategie expliciet anders bepaalt.

## 3. Productcategorieën

Het platform moet uitbreidbaar zijn voor:

-   Thuisbatterijen
-   Warmtepompen
-   Isolatie
-   Zonnepanelen
-   Laadpalen
-   Airconditioning
-   Energieadvies

De eerste commerciële focus mag beperkt zijn. Bouw de architectuur niet
onnodig groot, maar voorkom harde koppeling aan één productcategorie.

## 4. Bedrijfsmodel

De kernflow is:

`Bezoeker → Woningcheck → Woningprofiel → Adviesindicatie → Contactaanvraag → Kwalificatie → Matching → Afspraak/Advies → Offerte → Resultaat`

Mogelijke verdienmodellen:

-   vergoeding per gekwalificeerde lead;
-   vergoeding per geplande afspraak;
-   partnerabonnement;
-   exclusieve regionale samenwerking;
-   succesfee of commissie bij gerealiseerde verkoop;
-   hybride model.

De software mag niet hard gekoppeld worden aan één verdienmodel.

## 5. Centrale conversie: Woningcheck

De Woningcheck is de belangrijkste conversiefunnel.

Mogelijke invoer:

-   woningtype;
-   bouwjaar;
-   koop- of huursituatie indien relevant;
-   zonnepanelen;
-   aantal panelen of vermogen;
-   elektriciteitsverbruik;
-   teruglevering;
-   gasverbruik;
-   energielabel indien bekend;
-   huishouden;
-   huidige installaties;
-   interessegebieden;
-   hoofddoel;
-   gewenste starttermijn;
-   postcode en huisnummer;
-   naam;
-   telefoonnummer;
-   e-mailadres;
-   vereiste toestemmingen.

UX-regels:

-   één hoofdvraag per scherm;
-   duidelijke progress bar;
-   mobile-first;
-   minimale afleiding;
-   grote selecteerbare antwoordkaarten;
-   antwoorden behouden bij terugnavigeren;
-   autosave waar passend;
-   begrijpelijke validatie;
-   contactgegevens pas vragen nadat waarde en vertrouwen zijn
    opgebouwd;
-   geen dark patterns;
-   geen fake urgency;
-   geen vooraf aangevinkte toestemming;
-   duidelijk uitleggen wat er na verzending gebeurt.

Primaire CTA: **Start gratis woningcheck**

## 6. Lead lifecycle

Voorbeeldstatussen:

-   New
-   NeedsQualification
-   Qualified
-   Unqualified
-   Assigned
-   Accepted
-   Rejected
-   Contacted
-   AppointmentScheduled
-   AppointmentCompleted
-   QuoteCreated
-   Won
-   Lost
-   Nurture
-   Archived

Statussen moeten centraal beheerd worden. Gebruik geen verspreide magic
strings.

Bewaar statusgeschiedenis met relevante timestamps en actorinformatie.

## 7. Matching en routing

Leads moeten uiteindelijk routeerbaar zijn naar interne sales of externe
partners.

Mogelijke criteria:

-   postcode;
-   regio;
-   productcategorie;
-   woningtype;
-   gewenste starttermijn;
-   leadscore;
-   partnercapaciteit;
-   partnerbeschikbaarheid;
-   exclusiviteit;
-   eerdere toewijzingen;
-   actuele status.

Begin eenvoudig. Handmatige toewijzing is acceptabel voor de eerste MVP.
Automatiseer pas wanneer echte operationele patronen bekend zijn.

## 8. Lead scoring

MVP-scoring mag rule-based zijn.

Mogelijke signalen:

-   woningeigenaar;
-   relevante bestaande installatie;
-   passend energieprofiel;
-   concrete interesse;
-   korte starttermijn;
-   volledig woningprofiel;
-   contact bevestigd.

Gebruik geen onverklaarbare AI-score. Maak scoring uitlegbaar en bij
voorkeur configureerbaar. Bewaar waar mogelijk de redenen voor een
score.

## 9. Partnerportaal

Toekomstige functies:

-   toegewezen aanvragen bekijken;
-   accepteren of afwijzen;
-   status wijzigen;
-   contactmoment registreren;
-   afspraak registreren;
-   offertefase registreren;
-   gewonnen/verloren registreren;
-   verliesreden vastleggen;
-   filteren op periode, status, product en regio;
-   conversiestatistieken bekijken.

Een partner mag uitsluitend geautoriseerde gegevens zien. Autorisatie
moet server-side worden afgedwongen.

## 10. Adminomgeving

Minimaal gewenst:

-   leadlijst;
-   zoeken en filteren;
-   lead detail;
-   woningprofiel;
-   statusgeschiedenis;
-   notities;
-   partnerbeheer;
-   partnerregio's;
-   productcategorieën;
-   leadtoewijzingen;
-   bronnen en campagnes;
-   consentrecords;
-   gebruikers en rollen;
-   basisrapportage.

## 11. KPI's

Het systeem moet uiteindelijk kunnen meten:

-   bezoekers;
-   Woningcheck starts;
-   completion rate;
-   lead conversion rate;
-   cost per lead;
-   contact rate;
-   qualification rate;
-   appointment rate;
-   show rate;
-   quote rate;
-   close rate;
-   customer acquisition cost;
-   omzet per bron;
-   omzet per campagne;
-   omzet en conversie per partner;
-   tijd tot eerste contact;
-   doorlooptijd per funnelstap;
-   verliesredenen.

## 12. Merkidentiteit

Het merk moet voelen als:

-   betrouwbaar;
-   onafhankelijk;
-   deskundig;
-   transparant;
-   duurzaam;
-   modern;
-   toegankelijk;
-   praktisch;
-   rustig;
-   professioneel.

Het mag niet voelen als:

-   agressieve leadgenerator;
-   goedkoop affiliateplatform;
-   traditioneel installatiebedrijf;
-   generiek groen template;
-   futuristische AI-startup.

## 13. Visuele richting

Indicatieve design tokens:

``` text
Primary:    #163D32
Secondary:  #3F7D5B
Accent:     #E8A83E
Background: #F7F8F3
Surface:    #FFFFFF
Text:       #1E2925
```

Gebruik centrale design tokens/CSS variables. Vermijd verspreide
hardcoded kleuren.

Visuele principes:

-   veel witruimte;
-   duidelijke typografische hiërarchie;
-   rustige iconografie;
-   beperkt gebruik van groen;
-   warme accentkleur voor primaire CTA's;
-   subtiele motion;
-   goede contrasten;
-   mobile-first.

Logo-richting: een geometrische woningvorm waarin subtiel een
kompasnaald of navigatierichting is verwerkt. Vermijd standaard
blaadjes, recyclingiconen, wereldbollen en generieke AI-gradients.

## 14. Tone of voice

Schrijf behulpzaam, deskundig, rustig, duidelijk en eerlijk.

Vermijd onbewezen claims zoals:

-   gegarandeerde besparing;
-   altijd rendabel;
-   beste van Nederland;
-   gegarandeerd laagste prijs;
-   gegarandeerde terugverdientijd.

Gebruik bij prognoses indicaties, aannames en bandbreedtes.

## 15. Publieke routes

Voorgestelde routes:

-   `/`
-   `/woningcheck`
-   `/woningcheck/resultaat`
-   `/oplossingen`
-   `/oplossingen/thuisbatterij`
-   `/oplossingen/warmtepomp`
-   `/oplossingen/isolatie`
-   `/oplossingen/zonnepanelen`
-   `/oplossingen/laadpaal`
-   `/oplossingen/airconditioning`
-   `/hoe-werkt-het`
-   `/kennisbank`
-   `/kennisbank/[slug]`
-   `/over-ons`
-   `/contact`
-   `/partner-worden`
-   `/privacy`
-   `/cookies`
-   `/admin/*`
-   `/partner/*`

## 16. Homepagevolgorde

1.  Header
2.  Hero met primaire CTA
3.  Trustbar
4.  Preview Woningcheck
5.  Oplossingscategorieën
6.  Hoe werkt het?
7.  Indicatieve mogelijkheden-/besparingsmodule
8.  Waarom DuurzaamWoningKompas?
9.  Kennisbank
10. Echte social proof wanneer beschikbaar
11. Eind-CTA
12. Footer

Gebruik geen verzonnen reviews, partners, keurmerken, projectaantallen
of besparingsstatistieken.

## 17. SEO-contentclusters

### Thuisbatterijen

Kosten, capaciteit, werking, terugverdientijd, dynamische contracten,
combinatie met zonnepanelen en situaties waarin een batterij wel of niet
interessant kan zijn.

### Warmtepompen

Soorten, hybride versus all-electric, geschiktheid woning, kosten,
geluid, stroomverbruik en isolatievoorwaarden.

### Isolatie

Dak-, spouwmuur-, vloer- en glasisolatie, comfort en energiegebruik.

### Zonnepanelen

Opbrengst, aantallen, omvormers, eigen verbruik en combinatie met
batterij.

### Laadpalen

Thuisladen, laadvermogen, load balancing en combinatie met zonnepanelen
of batterij.

Schrijf primair voor mensen. SEO mag UX en leesbaarheid niet
verslechteren.

## 18. Voorkeursarchitectuur

Inspecteer altijd eerst de bestaande repository en respecteer de
bestaande stack. Als nog geen definitieve architectuur bestaat, is de
voorkeursrichting:

### Frontend

-   React
-   TypeScript
-   herbruikbare componenten
-   centrale API client layer
-   forms met schema-validatie
-   responsive/mobile-first

### Backend

-   ASP.NET Core Web API
-   duidelijke scheiding van domeinlogica en infrastructuur
-   REST
-   OpenAPI
-   role- en policy-based authorization

### Database

-   PostgreSQL
-   migraties via gekozen ORM
-   consistente sleutelstrategie
-   auditvelden waar relevant

Mogelijke domeinentiteiten:

-   Lead
-   Property
-   EnergyProfile
-   ProductCategory
-   LeadInterest
-   LeadSource
-   Campaign
-   Partner
-   PartnerRegion
-   LeadAssignment
-   LeadStatusHistory
-   Appointment
-   QuoteOutcome
-   SaleOutcome
-   ConsentRecord
-   User
-   Role
-   Note

Dit is domeinrichting, geen opdracht om alles direct te bouwen.

## 19. Privacy en security

Het platform verwerkt persoonsgegevens en woning-/energiegegevens.

Daarom:

-   dataminimalisatie;
-   duidelijke doelen per gegeven;
-   consentregistratie waar toestemming de gekozen grondslag is;
-   consentversie, timestamp en context vastleggen;
-   privacyteksten versieerbaar maken;
-   bewaartermijnen ontwerpen;
-   inzage- en verwijderingsprocessen ondersteunen;
-   role-based access;
-   partnerdata strikt isoleren;
-   kritieke acties auditbaar maken;
-   geen persoonsgegevens of secrets loggen;
-   secrets nooit committen;
-   server-side autorisatie afdwingen.

Juridische teksten en consentflows moeten vóór productie juridisch
worden beoordeeld. Codex mag juridische aannames niet als feiten
presenteren.

## 20. Multi-tenancy

Een partnergebruiker mag alleen gegevens zien waarvoor de gebruiker en
partnerorganisatie geautoriseerd zijn.

Vertrouw nooit uitsluitend op:

-   verborgen frontendknoppen;
-   browser route guards;
-   een partner-id uit een onbeveiligde queryparameter.

Elke relevante backendquery moet partner-/tenant-scoping afdwingen.

## 21. MVP-fasen

### MVP 1

-   homepage;
-   oplossingenpagina's;
-   Woningcheck;
-   leadopslag;
-   consentregistratie;
-   admin leadlijst;
-   lead detail;
-   statusbeheer;
-   bron- en UTM-opslag;
-   nieuwe-lead notificatie;
-   basisanalytics.

### MVP 2

-   partnerbeheer;
-   regio's;
-   handmatige leadtoewijzing;
-   partnerlogin;
-   partnerpipeline;
-   statusupdates;
-   afspraakregistratie.

### MVP 3

-   automatische routing;
-   configureerbare scoring;
-   uitgebreid analyticsdashboard;
-   campagne-attributie;
-   nurtureflows;
-   integraties;
-   geavanceerde calculators.

Bouw geen latere fase voordat de kernfunnel stabiel is, tenzij expliciet
gevraagd.

## 22. Regels voor Codex

1.  Lees relevante bestaande code voordat je wijzigt.
2.  Begrijp architectuur en conventies.
3.  Maak geen parallelle architectuur zonder noodzaak.
4.  Controleer bestaande componenten voordat je duplicaten maakt.
5.  Houd wijzigingen klein, logisch en reviewbaar.
6.  Los root causes op.
7.  Behoud bestaande functionaliteit tenzij wijziging expliciet gevraagd
    is.
8.  Voeg geen mockdata toe aan productieflows zonder duidelijke
    scheiding.
9.  Verzin geen reviews, partners, certificeringen, statistieken of
    claims.
10. Gebruik geen lorem ipsum op zichtbare productpagina's.
11. Gebruik strikte typing en vermijd `any` waar mogelijk.
12. Centraliseer API-calls en design tokens.
13. Gebruik semantische HTML.
14. Bouw responsive en mobile-first.
15. Voeg loading-, empty-, success- en error states toe.
16. Valideer client-side én server-side.
17. Log geen gevoelige persoonsgegevens.
18. Plaats secrets nooit in source control.
19. Vermijd magic strings en magic numbers.
20. Verwijder ongebruikte code.
21. Voeg tests toe voor kritieke businesslogica.
22. Controleer desktop en mobiel.
23. Voer relevante linting, typechecks, builds en tests uit.
24. Rapporteer gewijzigde bestanden en uitgevoerde checks.
25. Voeg geen zware dependency toe voor een klein probleem.
26. Upgrade dependencies niet zonder noodzaak.
27. Vraag alleen verduidelijking wanneer een veilige keuze niet uit
    context of bestaande code is af te leiden.

## 23. Definition of Done

Een feature is klaar wanneer:

-   de functionele flow werkt;
-   validatie aanwezig is;
-   foutafhandeling aanwezig is;
-   loading states aanwezig zijn;
-   mobiel gedrag gecontroleerd is;
-   toegankelijkheid redelijk gecontroleerd is;
-   server-side autorisatie correct is waar relevant;
-   persoonsgegevens niet onnodig worden gelogd;
-   code aansluit op bestaande conventies;
-   lint/typecheck/build slagen indien beschikbaar;
-   kritieke businesslogica getest is waar passend;
-   geen onbedoelde placeholdercontent zichtbaar blijft.

## 24. Productvisie

DuurzaamWoningKompas moet uitgroeien tot een digitaal platform dat
consumenten helpt navigeren door woningverduurzaming en passende vraag
koppelt aan betrouwbare uitvoering.

De kern is niet zoveel mogelijk formulieren verzamelen.

De kern is:

**betere informatie → betere keuze → passende match → meetbaar
resultaat**

Iedere ontwerp-, content- en codebeslissing moet bijdragen aan
vertrouwen, duidelijkheid, conversie, privacy en schaalbaarheid.
