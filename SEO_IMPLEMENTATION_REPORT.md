# SEO Implementation Report

Datum: 2026-07-06

## Geimplementeerd

- Publieke routes gebruiken crawlbare URL's zonder publieke hash-routing.
- Legacy publieke hash-routes worden client-side genormaliseerd naar schone paden.
- Route-specifieke `title`, `meta description`, canonical, Open Graph title/description/type/url en robots metadata worden in `App.tsx` gezet.
- Admin en onbekende routes krijgen `noindex, nofollow`.
- `public/robots.txt` toegevoegd.
- `public/sitemap.xml` toegevoegd met publieke homepage, checks, oplossingen, kennisbankartikelen en legal routes.
- `index.html` bevat baseline Open Graph metadata en feitelijke `Organization`/`WebSite` JSON-LD.
- Geen fake `Review`, `AggregateRating`, `LocalBusiness`, adres, certificering of keurmerk-schema toegevoegd.
- Publieke pagina's gebruiken semantische headings en crawlbare interne links.

## Publieke Launchroutes

- `/`
- `/woningcheck`
- `/thuisbatterij-check`
- `/oplossingen`
- `/oplossingen/thuisbatterij`
- `/oplossingen/warmtepomp`
- `/oplossingen/isolatie`
- `/oplossingen/zonnepanelen`
- `/oplossingen/laadpaal`
- `/oplossingen/airconditioning`
- `/hoe-werkt-het`
- `/kennisbank`
- `/kennisbank/*`
- `/over-ons`
- `/contact`
- `/partner-worden`
- `/privacy`
- `/algemene-voorwaarden`
- `/cookiebeleid`

## Productiecontroles

- Controleer dat `https://www.duurzaamwoningkompas.nl/robots.txt` HTTP 200 geeft.
- Controleer dat `https://www.duurzaamwoningkompas.nl/sitemap.xml` HTTP 200 geeft.
- Controleer SPA fallback voor directe route access en refresh.
- Controleer canonical host na definitieve domeinkeuze.
- Dien sitemap in bij Google Search Console.
- Controleer dat adminroutes niet worden geindexeerd.
- Controleer Open Graph afbeelding en metadata met een previewtool.

## Bewuste Beperkingen

- Sitemap gebruikt de verwachte productiehost `https://www.duurzaamwoningkompas.nl`; pas aan als het definitieve domein anders is.
- Geen Article JSON-LD per kennisbankartikel in de MVP, omdat artikelen nog conceptueel en beperkt zijn.
- Geen ratings, reviews of lokale bedrijfsgegevens zonder feitelijke onderbouwing.
