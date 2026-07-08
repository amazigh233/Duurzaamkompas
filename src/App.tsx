import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, submitContactMessage } from "./api/client";
import { articleMap, articles, solutionMap, solutions } from "./data";
import { Layout } from "./components/Layout";
import { Icon } from "./components/Icon";
import { SolutionCard } from "./components/SolutionCard";
import { ThuisbatterijCheck } from "./components/ThuisbatterijCheck";
import { Woningcheck } from "./components/Woningcheck";
import { MaatregelenKompas } from "./components/MaatregelenKompas";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import type { AdminPage } from "./components/admin/AdminDashboard";
import { openCookiePreferences } from "./components/CookieConsent";
import { siteConfig } from "./siteConfig";
import type { KnowledgeArticle, RouteState, SolutionSlug } from "./types";

interface SeoMetadata {
  title: string;
  description: string;
  noindex?: boolean;
}

const publicRouteRoots = new Set([
  "",
  "woningcheck",
  "thuisbatterij-check",
  "maatregelenkompas",
  "oplossingen",
  "hoe-werkt-het",
  "kennisbank",
  "over-ons",
  "contact",
  "partner-worden",
  "privacy",
  "algemene-voorwaarden",
  "cookiebeleid",
]);

function parseRoute(): RouteState {
  redirectLegacyPublicHashRoute();

  const hashRoute = parseAdminHashRoute();
  if (hashRoute) return hashRoute;

  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  const [first = "", second] = path.split("/");

  if (first === "admin") {
    if (!second || second === "dashboard") return { name: "admin-dashboard" };
    if (second === "login") return { name: "admin-login" };
    if (second === "leads") {
      const [, , leadId] = path.split("/");
      return leadId ? { name: "admin-lead-detail", leadId } : { name: "admin-leads" };
    }
    if (second === "calendar") return { name: "admin-calendar" };
    if (second === "reporting") return { name: "admin-reporting" };
    if (second === "settings") return { name: "admin-settings" };
  }

  if (!first) return { name: "home" };
  if (first === "woningcheck" && !second) return { name: "woningcheck" };
  if (first === "thuisbatterij-check" && !second) return { name: "thuisbatterij-check" };
  if (first === "maatregelenkompas" && !second) return { name: "maatregelenkompas" };
  if (first === "oplossingen" && second && solutionMap.has(second as SolutionSlug)) {
    return { name: "oplossing-detail", slug: second as SolutionSlug };
  }
  if (first === "oplossingen" && !second) return { name: "oplossingen" };
  if (first === "hoe-werkt-het" && !second) return { name: "hoe" };
  if (first === "kennisbank" && second && articleMap.has(second)) {
    return { name: "kennisbank-detail", articleSlug: second };
  }
  if (first === "kennisbank" && !second) return { name: "kennisbank" };
  if (first === "over-ons" && !second) return { name: "over" };
  if (first === "contact" && !second) return { name: "contact" };
  if (first === "partner-worden" && !second) return { name: "partner-worden" };
  if (first === "privacy" && !second) return { name: "privacy" };
  if (first === "algemene-voorwaarden" && !second) return { name: "algemene-voorwaarden" };
  if (first === "cookiebeleid" && !second) return { name: "cookiebeleid" };

  return { name: "not-found" };
}

function parseAdminHashRoute(): RouteState | null {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [first, second] = hash.split("/");

  if (first === "admin" && second === "leads") {
    const [, , leadId] = hash.split("/");
    return leadId ? { name: "admin-lead-detail", leadId } : { name: "admin-leads" };
  }
  if (first === "admin") return { name: "admin-dashboard" };

  return null;
}

function redirectLegacyPublicHashRoute() {
  const hash = window.location.hash;
  if (!hash.startsWith("#/")) return;

  const [hashPath, hashSearch = ""] = hash.slice(2).split("?");
  const [first = ""] = hashPath.split("/");
  if (!publicRouteRoots.has(first) || first === "admin") return;

  const cleanPath = hashPath ? `/${hashPath}` : "/";
  const nextSearch = mergeSearch(window.location.search, hashSearch);
  window.history.replaceState(null, "", `${cleanPath}${nextSearch}`);
}

function mergeSearch(currentSearch: string, hashSearch: string) {
  const params = new URLSearchParams(currentSearch);
  const hashParams = new URLSearchParams(hashSearch);
  hashParams.forEach((value, key) => params.set(key, value));
  const next = params.toString();
  return next ? `?${next}` : "";
}

function shouldHandleInAppClick(event: MouseEvent, anchor: HTMLAnchorElement) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const url = new URL(anchor.href);
  if (url.origin !== window.location.origin) return false;
  if (url.hash === "#main") return false;
  if (url.hash.startsWith("#/admin")) return false;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/openapi")) return false;

  const [first = ""] = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  return publicRouteRoots.has(first);
}

function useRoute() {
  const [route, setRoute] = useState<RouteState>(() => parseRoute());

  useEffect(() => {
    const sync = (scroll = true) => {
      setRoute(parseRoute());
      if (scroll) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    const onNavigate = () => sync();
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || !shouldHandleInAppClick(event, anchor)) return;

      const url = new URL(anchor.href);
      event.preventDefault();
      window.history.pushState(null, "", `${url.pathname}${url.search}`);
      sync();
    };

    window.addEventListener("hashchange", onNavigate);
    window.addEventListener("popstate", onNavigate);
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("hashchange", onNavigate);
      window.removeEventListener("popstate", onNavigate);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return route;
}

function applySeo(route: RouteState) {
  const siteName = "DuurzaamWoningKompas";
  const origin = window.location.origin;
  const path = window.location.pathname === "/" ? "/" : window.location.pathname.replace(/\/$/, "");
  const solution = route.name === "oplossing-detail" ? solutionMap.get(route.slug ?? "isolatie") : undefined;
  const article = route.name === "kennisbank-detail" ? articleMap.get(route.articleSlug ?? "") : undefined;

  const metadata: SeoMetadata = (() => {
    if (solution) {
      return {
        title: `${solution.title} verduurzamen | ${siteName}`,
        description: solution.summary,
      };
    }
    if (article) {
      return {
        title: `${article.title} | ${siteName}`,
        description: article.summary,
      };
    }

    switch (route.name) {
      case "home":
        return {
          title: `${siteName} - Onafhankelijk advies over woningverduurzaming`,
          description:
            "Doe de gratis woningcheck en ontdek welke verduurzamingsmaatregelen mogelijk passen bij uw woning, energieverbruik en wensen.",
        };
      case "woningcheck":
        return {
          title: `Gratis woningcheck | ${siteName}`,
          description: "Beantwoord enkele vragen en ontvang een rustige indicatie van verduurzamingsmaatregelen die mogelijk bij uw woning passen.",
        };
      case "thuisbatterij-check":
        return {
          title: `ThuisbatterijCheck | ${siteName}`,
          description: "Controleer of een thuisbatterij mogelijk bij uw zonnepanelen, verbruik en energiecontract past.",
        };
      case "maatregelenkompas":
        return {
          title: `MaatregelenKompas | ${siteName}`,
          description:
            "Speel met een voorlopige verduurzamingsroute en ontdek welke maatregelen mogelijk interessant zijn zonder contactgegevens achter te laten.",
        };
      case "oplossingen":
        return {
          title: `Oplossingen voor woningverduurzaming | ${siteName}`,
          description: "Bekijk rustige uitleg over isolatie, warmtepompen, zonnepanelen, thuisbatterijen, laadpalen en airconditioning.",
        };
      case "hoe":
        return {
          title: `Hoe werkt DuurzaamWoningKompas? | ${siteName}`,
          description: "Lees hoe de woningcheck werkt en hoe een aanvraag zorgvuldig kan worden opgevolgd.",
        };
      case "kennisbank":
        return {
          title: `Kennisbank woningverduurzaming | ${siteName}`,
          description: "Praktische uitleg over verduurzaming, subsidies en technische aandachtspunten voor Nederlandse woningeigenaren.",
        };
      case "over":
        return {
          title: `Over DuurzaamWoningKompas | ${siteName}`,
          description: "DuurzaamWoningKompas helpt woningeigenaren met onafhankelijke orientatie op woningverduurzaming.",
        };
      case "contact":
        return {
          title: `Contact | ${siteName}`,
          description: "Neem contact op met DuurzaamWoningKompas over de woningcheck, aanvragen of samenwerking.",
        };
      case "partner-worden":
        return {
          title: `Partner worden | ${siteName}`,
          description: "Lees hoe uitvoerende specialisten zich kunnen melden voor toekomstige samenwerking met DuurzaamWoningKompas.",
        };
      case "privacy":
        return {
          title: `Privacyverklaring | ${siteName}`,
          description: "Privacyverklaring voor verwerking van woningcheck-, contact- en campagnegegevens.",
        };
      case "algemene-voorwaarden":
        return {
          title: `Algemene voorwaarden | ${siteName}`,
          description: "Algemene voorwaarden voor het informatieplatform, woningchecks en vrijblijvende opvolging.",
        };
      case "cookiebeleid":
        return {
          title: `Cookiebeleid | ${siteName}`,
          description: "Uitleg over noodzakelijke opslag, analytische cookies, marketingcookies en cookievoorkeuren.",
        };
      case "admin-login":
      case "admin-dashboard":
      case "admin-leads":
      case "admin-lead-detail":
      case "admin-calendar":
      case "admin-reporting":
      case "admin-settings":
        return {
          title: `Admin CRM | ${siteName}`,
          description: "Afgeschermde interne CRM omgeving voor leadbeheer.",
          noindex: true,
        };
      default:
        return {
          title: `Pagina niet gevonden | ${siteName}`,
          description: "Deze pagina bestaat niet of is verplaatst.",
          noindex: true,
        };
    }
  })();

  document.title = metadata.title;
  setMeta("description", metadata.description);
  setMeta("robots", metadata.noindex ? "noindex, nofollow" : path.startsWith("/admin") ? "noindex, nofollow" : "index, follow");
  setLink("canonical", `${origin}${path}`);
  setProperty("og:title", metadata.title);
  setProperty("og:description", metadata.description);
  setProperty("og:type", article ? "article" : "website");
  setProperty("og:url", `${origin}${path}`);
}

function setMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function setProperty(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setLink(rel: string, href: string) {
  let element = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

export default function App() {
  const route = useRoute();

  useEffect(() => {
    applySeo(route);
  }, [route]);

  const page = useMemo(() => {
    switch (route.name) {
      case "home":
        return <HomePage />;
      case "woningcheck":
        return <Woningcheck />;
      case "thuisbatterij-check":
        return <ThuisbatterijCheck />;
      case "maatregelenkompas":
        return <MaatregelenKompas />;
      case "oplossingen":
        return <SolutionsPage />;
      case "oplossing-detail":
        return <SolutionDetail slug={route.slug ?? "isolatie"} />;
      case "hoe":
        return <HowPage />;
      case "kennisbank":
        return <KnowledgePage />;
      case "kennisbank-detail":
        return <KnowledgeDetailPage article={articleMap.get(route.articleSlug ?? "")} />;
      case "over":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "partner-worden":
        return <PartnerPage />;
      case "privacy":
        return <PrivacyPage />;
      case "algemene-voorwaarden":
        return <TermsPage />;
      case "cookiebeleid":
        return <CookiePolicyPage />;
      case "admin-login":
      case "admin-dashboard":
      case "admin-leads":
      case "admin-lead-detail":
      case "admin-calendar":
      case "admin-reporting":
      case "admin-settings":
        return <AdminDashboard page={adminPageFromRoute(route.name)} leadId={route.leadId} />;
      default:
        return <NotFoundPage />;
    }
  }, [route]);

  return isAdminRoute(route.name) ? page : <Layout>{page}</Layout>;
}

function isAdminRoute(name: RouteState["name"]) {
  return name.startsWith("admin");
}

function adminPageFromRoute(name: RouteState["name"]): AdminPage {
  switch (name) {
    case "admin-login":
      return "login";
    case "admin-leads":
      return "leads";
    case "admin-lead-detail":
      return "lead-detail";
    case "admin-calendar":
      return "calendar";
    case "admin-reporting":
      return "reporting";
    case "admin-settings":
      return "settings";
    default:
      return "dashboard";
  }
}

function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <span className="section-kicker">Onafhankelijk Nederlands verduurzamingsplatform</span>
            <h1>Welke verduurzaming past bij uw woning?</h1>
            <p className="lead">
              Doe de gratis woningcheck en krijg een rustige eerste richting op basis van uw woning, energieverbruik en
              wensen. U houdt zelf regie over eventuele vervolgstappen.
            </p>
            <div className="button-row">
              <a className="button button-primary button-large" href="/woningcheck">
                Start gratis woningcheck
              </a>
              <a className="button button-secondary button-large" href="/hoe-werkt-het">
                Bekijk hoe het werkt
              </a>
            </div>
            <p className="cta-note">Gratis en vrijblijvend. Contactgegevens vragen we pas wanneer de indicatie duidelijk is.</p>
          </div>
          <div className="hero-visual-stack">
            <figure className="photo-card hero-photo-card">
              <img
                src="/images/hero-woningadvies.jpg"
                alt="Nederlandse woning met zonnepanelen in een rustige straat"
              />
            </figure>
            <div className="hero-panel" aria-label="Woningcheck samenvatting">
              <span className="panel-kicker">Gratis woningcheck</span>
              <h2>Een helder vertrekpunt zonder verkoopdruk</h2>
              <div className="mini-steps">
                <span>1. Woning</span>
                <span>2. Energieverbruik</span>
                <span>3. Wensen</span>
                <span>4. Uitlegbare indicatie</span>
              </div>
              <a className="button button-primary" href="/woningcheck">
                Begin met uw woning
              </a>
              <p className="cta-note">Korte check, zonder verplichting.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-band">
        <div className="container three-grid">
          <article>
            <span className="trust-icon"><Icon name="shield" /></span>
            <h2>Onafhankelijk</h2>
            <p>De check vertrekt vanuit uw woning en wensen, niet vanuit een installateur of enkel product.</p>
          </article>
          <article>
            <span className="trust-icon"><Icon name="eye" /></span>
            <h2>Transparant</h2>
            <p>U ziet duidelijk welke aannames achter een indicatie zitten en wat nog beoordeeld moet worden.</p>
          </article>
          <article>
            <span className="trust-icon"><Icon name="handshake" /></span>
            <h2>Zorgvuldig</h2>
            <p>Contact of matching gebeurt alleen met expliciete toestemming. Geen vooraf aangevinkte keuzes.</p>
          </article>
        </div>
      </section>

      <section className="section maatregelen-preview-section">
        <div className="container split-section">
          <div>
            <span className="section-kicker">MaatregelenKompas</span>
            <h2>Probeer eerst rustig een mogelijke route</h2>
            <p>
              Speel met maximaal drie verduurzamingsmaatregelen en zet ze in de volgorde die voor u logisch voelt. U
              laat geen contactgegevens achter en ziet meteen welke stap om extra uitleg vraagt.
            </p>
            <div className="button-row">
              <a className="button button-primary" href="/maatregelenkompas">
                Speel het MaatregelenKompas
              </a>
              <a className="button button-secondary" href="/woningcheck">
                Start gratis woningcheck
              </a>
            </div>
          </div>
          <div className="preview-card maatregelen-preview-card">
            <ol>
              <li>Kies maximaal drie maatregelen</li>
              <li>Zet uw route in volgorde</li>
              <li>Lees wat nog beoordeeld moet worden</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split-section">
          <div>
            <span className="section-kicker">De woningcheck</span>
            <h2>Uw persoonlijke verduurzamingsroute begint hier</h2>
            <p>
              Een korte flow met grote antwoordkaarten, begrijpelijke vragen en duidelijke validatie. Contactgegevens
              komen pas aan het einde, wanneer duidelijk is waarvoor ze nodig zijn.
            </p>
          </div>
          <div className="preview-card">
            <ol>
              <li>Woningtype en bouwjaar</li>
              <li>Zonnepanelen, stroom en gas</li>
              <li>Interesses en starttermijn</li>
              <li>Adres, contact en consent</li>
              <li>Indicatief resultaat</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section muted-section">
        <div className="container">
          <div className="section-media-head">
            <div className="section-head">
              <span className="section-kicker">Oplossingen</span>
              <h2>Verduurzaming in logische stappen</h2>
              <p>Bekijk de belangrijkste categorieen en gebruik de woningcheck om te bepalen wat voor uw situatie past.</p>
            </div>
            <figure className="photo-card section-photo-card">
              <img
                src="/images/verduurzaming-maatregelen.jpg"
                alt="Dak met zonnepanelen en geisoleerde ramen bij een Nederlandse woning"
              />
              <figcaption className="photo-caption">
                Illustratief beeld van mogelijke maatregelen. Geschiktheid verschilt per woning.
              </figcaption>
            </figure>
          </div>
          <div className="cards-grid">
            {solutions.slice(0, 6).map((solution) => (
              <SolutionCard key={solution.slug} solution={solution} />
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}

function SolutionsPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">Oplossingen</span>
          <h1>Welke maatregel past bij uw woning?</h1>
          <p>Elke woning vraagt om een andere volgorde. Deze pagina geeft overzicht zonder verkoopdruk.</p>
        </div>
        <div className="cards-grid">
          {solutions.map((solution) => (
            <SolutionCard key={solution.slug} solution={solution} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionDetail({ slug }: { slug: SolutionSlug }) {
  const solution = solutionMap.get(slug) ?? solutions[0];

  return (
    <section className="section">
      <div className="container detail-grid">
        <article>
          <a className="back-link" href="/oplossingen">
            Terug naar oplossingen
          </a>
          <span className="section-kicker">{solution.eyebrow}</span>
          <h1>{solution.title}</h1>
          <p className="lead">{solution.summary}</p>
          <h2>Geschikt wanneer</h2>
          <ul className="plain-list">
            {solution.idealFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2>Logische vervolgstappen</h2>
          <ul className="plain-list">
            {solution.nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <aside className="side-card">
          <h2>Niet zeker of dit past?</h2>
          <p>De woningcheck combineert woningtype, bouwjaar, energieverbruik en wensen tot een eerste indicatie.</p>
          <a className="button button-primary" href="/woningcheck">
            Doe de woningcheck
          </a>
        </aside>
      </div>
    </section>
  );
}

function HowPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">Hoe werkt het?</span>
          <h1>Van orientatie naar een passende vervolgstap</h1>
        </div>
        <div className="three-grid">
          <article className="info-card">
            <h2>1. Vertel over uw woning</h2>
            <p>U vult enkele basisgegevens in over woningtype, bouwjaar, energieverbruik en wensen.</p>
          </article>
          <article className="info-card">
            <h2>2. Ontvang richting</h2>
            <p>U krijgt een uitlegbare indicatie van maatregelen die mogelijk logisch zijn voor uw situatie.</p>
          </article>
          <article className="info-card">
            <h2>3. Kies zelf de vervolgstap</h2>
            <p>Alleen met expliciete toestemming kan later een vrijblijvende matching met een specialist volgen.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

function KnowledgePage() {
  const subsidySources = [
    { href: "https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren", label: "RVO - ISDE voor woningeigenaren" },
    { href: "https://www.verbeterjehuis.nl/energiesubsidiewijzer", label: "Verbeterjehuis - Energiesubsidiewijzer" },
    { href: "https://www.rijksoverheid.nl/vraag-en-antwoord/energie-thuis/subsidie-isolatie-huis", label: "Rijksoverheid - subsidie voor isolatie" },
    { href: "https://www.milieucentraal.nl/energie-besparen/zonnepanelen/thuisbatterij-zonne-energie-opslaan/", label: "Milieu Centraal - thuisbatterij" },
  ];

  return (
    <section className="section muted-section">
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">Kennisbank</span>
          <h1>Praktische uitleg over woningverduurzaming</h1>
          <p>
            Subsidies en voorwaarden veranderen regelmatig. Controleer voor een aanvraag altijd de actuele voorwaarden
            bij RVO, uw gemeente of de Energiesubsidiewijzer.
          </p>
        </div>
        <aside className="source-card" aria-label="Bronnen en actualiteit subsidie-informatie">
          <div>
            <span className="section-kicker">Subsidie-informatie</span>
            <h2>Actueel houden voor aanvraag</h2>
            <p>
              Deze kennisbank geeft richting, geen juridisch of financieel advies. Laat bedragen, meldcodes en lokale
              regelingen altijd controleren voordat u een maatregel koopt of aanvraagt.
            </p>
          </div>
          <div className="source-links">
            {subsidySources.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            ))}
          </div>
        </aside>
        <div className="cards-grid">
          {articles.map((article) => (
            <a className="article-card" href={`/kennisbank/${article.slug}`} key={article.slug}>
              <span>{article.category}</span>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
              <span className="text-link">Lees rustig verder</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function KnowledgeDetailPage({ article }: { article?: KnowledgeArticle }) {
  if (!article) return <NotFoundPage />;

  return (
    <section className="section muted-section">
      <div className="container detail-grid">
        <article>
          <a className="back-link" href="/kennisbank">
            Terug naar kennisbank
          </a>
          <span className="section-kicker">{article.category}</span>
          <h1>{article.title}</h1>
          <p className="lead">{article.summary}</p>
          <h2>Wat betekent dit voor uw woning?</h2>
          <p>
            Gebruik dit artikel als eerste orientatie. Of een maatregel logisch is, hangt af van uw woning, verbruik,
            wensen en actuele voorwaarden. De Woningcheck helpt om die informatie gestructureerd te verzamelen.
          </p>
          <h2>Belangrijke nuance</h2>
          <p>
            Deze kennisbank geeft richting en geen juridisch, financieel of definitief technisch advies. Controleer
            subsidies, regelingen en productvoorwaarden altijd bij actuele officiele bronnen of een deskundige.
          </p>
        </article>
        <aside className="side-card">
          <h2>Wilt u dit toepassen op uw situatie?</h2>
          <p>De Woningcheck combineert woningkenmerken, energieverbruik en interesses tot een eerste indicatie.</p>
          <a className="button button-primary" href="/woningcheck">
            Start gratis woningcheck
          </a>
        </aside>
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="section">
      <div className="container narrow">
        <span className="section-kicker">Over ons</span>
        <h1>Betere informatie, betere keuze, passende match</h1>
        <p className="lead">
          DuurzaamWoningKompas helpt woningeigenaren verduurzaming begrijpelijk te maken. Het platform verkoopt zelf
          geen installaties en legt de nadruk op orientatie, transparantie en toestemming.
        </p>
        <p>
          De productvisie is om consumenten stap voor stap te begeleiden van eerste inzicht naar een passende
          vervolgstap, zonder agressieve leadgeneratie of onduidelijke claims.
        </p>
      </div>
    </section>
  );
}

function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    privacyConsent: false,
    website: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const patch = (partial: Partial<typeof form>) => {
    setForm((current) => ({ ...current, ...partial }));
    setError("");
    setFieldErrors({});
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");
    setFieldErrors({});

    try {
      await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim(),
        message: form.message.trim(),
        privacyConsent: form.privacyConsent,
        sourceUrl: window.location.href,
        honeypot: form.website,
      });
      setSuccess(true);
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        privacyConsent: false,
        website: "",
      });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.response.message);
        setFieldErrors(caught.response.errors ?? {});
      } else {
        setError("Uw bericht kon niet worden verzonden. Probeer het later opnieuw.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="section">
      <div className="container detail-grid">
        <div>
          <span className="section-kicker">Contact</span>
          <h1>Heeft u een vraag?</h1>
          <p className="lead">
            Stel uw vraag over de Woningcheck, een lopende aanvraag of een mogelijke samenwerking. Voor persoonlijk
            woningadvies blijft de Woningcheck de meest complete route.
          </p>
          <a className="button button-secondary" href="/woningcheck">
            Start gratis woningcheck
          </a>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <div className="field-grid">
            <label>
              Naam
              <input value={form.name} onChange={(event) => patch({ name: event.target.value })} autoComplete="name" />
            </label>
            <label>
              E-mailadres
              <input type="email" value={form.email} onChange={(event) => patch({ email: event.target.value })} autoComplete="email" />
            </label>
          </div>
          <label>
            Telefoonnummer optioneel
            <input value={form.phone} onChange={(event) => patch({ phone: event.target.value })} autoComplete="tel" />
          </label>
          <label>
            Onderwerp
            <input value={form.subject} onChange={(event) => patch({ subject: event.target.value })} />
          </label>
          <label>
            Bericht
            <textarea value={form.message} onChange={(event) => patch({ message: event.target.value })} rows={6} />
          </label>
          <label className="hp-field" aria-hidden="true">
            Website
            <input value={form.website} onChange={(event) => patch({ website: event.target.value })} tabIndex={-1} autoComplete="off" />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.privacyConsent}
              onChange={(event) => patch({ privacyConsent: event.target.checked })}
            />
            <span>Ik ga ermee akkoord dat DuurzaamWoningKompas mijn bericht verwerkt om contact met mij op te nemen.</span>
          </label>
          {error ? (
            <div className="form-error" role="alert">
              <p>{error}</p>
              <FieldErrors errors={fieldErrors} />
            </div>
          ) : null}
          {success ? <p className="form-success" role="status">Bedankt. Uw bericht is ontvangen.</p> : null}
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Bericht verzenden...
              </>
            ) : (
              "Bericht verzenden"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

function FieldErrors({ errors }: { errors: Record<string, string[]> }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;

  return (
    <ul>
      {entries.flatMap(([field, messages]) =>
        messages.map((message) => (
          <li key={`${field}-${message}`}>
            {field}: {message}
          </li>
        ))
      )}
    </ul>
  );
}

function PartnerPage() {
  return (
    <section className="section muted-section">
      <div className="container narrow">
        <span className="section-kicker">Partner worden</span>
        <h1>Samenwerken rond zorgvuldige verduurzamingsvragen</h1>
        <p className="lead">
          DuurzaamWoningKompas werkt met een zorgvuldig kwalificatieproces voor woningeigenaren. De nadruk ligt op
          informatie, aanvraagopvolging en toestemming.
        </p>
        <p>
          Uitvoerende specialisten kunnen zich melden via het contactformulier. Deel kort uw regio, specialisme en de
          manier waarop u consumenten informeert. We doen geen publieke claims over partners voordat samenwerking feitelijk
          is vastgelegd.
        </p>
        <a className="button button-primary" href="/contact">
          Neem contact op
        </a>
      </div>
    </section>
  );
}

function PrivacyPage() {
  const responsibleParty = siteConfig.legalEntityName || siteConfig.siteName;
  const identityParts = [
    `Verwerkingsverantwoordelijke: ${responsibleParty}, handelend onder de naam DuurzaamWoningKompas.`,
    siteConfig.kvkNumber ? `KvK: ${siteConfig.kvkNumber}.` : "",
    siteConfig.correspondenceAddress ? `Correspondentieadres: ${siteConfig.correspondenceAddress}.` : "",
  ].filter(Boolean);

  return (
    <section className="section">
      <div className="container narrow legal-copy">
        <span className="section-kicker">Privacy</span>
        <h1>Privacyverklaring</h1>
        <p className="lead">Versie 2026-07-06. Deze verklaring beschrijft hoe DuurzaamWoningKompas met persoonsgegevens omgaat.</p>
        <h2>1. Verantwoordelijke</h2>
        <p>
          {identityParts.join(" ")} Contact voor privacyvragen:{" "}
          <a href={`mailto:${siteConfig.privacyEmail}`}>{siteConfig.privacyEmail}</a>.
        </p>
        <h2>2. Welke persoonsgegevens verwerken wij?</h2>
        <p>Wij kunnen naam, e-mailadres, telefoonnummer, postcode, huisnummer, woningkenmerken, energiegegevens, interessegebieden, starttermijn, aanvraagstatus en interne opvolgnotities verwerken.</p>
        <h2>3. Gegevens uit de Woningcheck</h2>
        <p>De Woningcheck gebruikt woningtype, bouwjaar, zonnepanelen, stroom- en gasverbruik, interesses, hoofddoel, starttermijn en adresindicatie om een aanvraag te beoordelen en op te volgen.</p>
        <h2>4. Contactgegevens</h2>
        <p>Contactgegevens gebruiken wij om te reageren op uw aanvraag of contactbericht. Telefoon is bij de algemene Woningcheck optioneel en bij de ThuisbatterijCheck nodig voor opvolging.</p>
        <h2>5. Woning- en energiegegevens</h2>
        <p>Deze gegevens helpen om de vraag te kwalificeren. De uitkomst is indicatief en geen definitief technisch, juridisch of financieel advies.</p>
        <h2>6. Technische gegevens</h2>
        <p>Wij verwerken technisch noodzakelijke gegevens zoals bronpagina, browseropslag voor tussentijdse antwoorden, sessiecookies voor admin en serverlogs die nodig zijn voor veiligheid en werking.</p>
        <h2>7. Campagne- en attributiegegevens</h2>
        <p>Als aanwezig slaan wij utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, referrer en landingspagina op bij een aanvraag.</p>
        <h2>8. Waarom verwerken wij gegevens?</h2>
        <p>Voor het tonen van de website, het uitvoeren van de Woningcheck, opvolgen van aanvragen, beantwoorden van contactberichten, administreren van status en meten van campagnekwaliteit zonder onnodige persoonsgegevens in analytics.</p>
        <h2>9. Mogelijke AVG-grondslagen</h2>
        <p>Afhankelijk van de situatie kan verwerking gebaseerd zijn op toestemming, uitvoering van een verzoek, gerechtvaardigd belang of wettelijke verplichting.</p>
        <h2>10. Bewaartermijnen</h2>
        <p>Wij bewaren gegevens niet langer dan nodig voor aanvraagopvolging, administratie, beveiliging en eventuele wettelijke verplichtingen.</p>
        <h2>11. Ontvangers</h2>
        <p>Gegevens kunnen worden ingezien door bevoegde interne gebruikers en, alleen waar passend en toegestaan, door een uitvoerende specialist voor opvolging of matching.</p>
        <h2>12. Verwerkers en technische leveranciers</h2>
        <p>Wij kunnen hosting-, database-, e-mail-, analytics- en advertentieleveranciers gebruiken wanneer zij nodig zijn voor de dienst en passend zijn ingericht.</p>
        <h2>13. Hosting</h2>
        <p>De website en aanvraagverwerking draaien bij technische leveranciers die nodig zijn voor hosting, database en beveiliging.</p>
        <h2>14. E-mailleverancier</h2>
        <p>E-mailnotificaties lopen via TransIP SMTP. Wachtwoorden worden alleen als server-side omgevingsvariabelen ingesteld.</p>
        <h2>15. Analytics en advertenties</h2>
        <p>Analytics- en marketingtags worden pas geactiveerd wanneer ze technisch zijn geconfigureerd en de vereiste toestemming is gegeven.</p>
        <h2>16. Beveiliging</h2>
        <p>Wij gebruiken server-side validatie, afgeschermde adminroutes, HttpOnly sessiecookies, omgevingsvariabelen voor secrets en beperken logging van persoonsgegevens.</p>
        <h2>17-24. Uw rechten</h2>
        <p>U kunt vragen om inzage, correctie, verwijdering, beperking, bezwaar, dataportabiliteit waar van toepassing en intrekking van toestemming waar verwerking daarop is gebaseerd.</p>
        <h2>25. Klachtmogelijkheid</h2>
        <p>U kunt een klacht indienen bij de Autoriteit Persoonsgegevens als u vindt dat uw gegevens niet zorgvuldig worden verwerkt.</p>
        <h2>26. Contact</h2>
        <p>Voor privacyvragen gebruikt u <a href={`mailto:${siteConfig.privacyEmail}`}>{siteConfig.privacyEmail}</a> of het contactformulier.</p>
        <h2>27. Wijzigingen</h2>
        <p>Deze verklaring kan worden aangepast wanneer de dienstverlening, techniek of wetgeving verandert. De datum bovenaan toont de actuele versie.</p>
        <h2>28. Versienummer en datum</h2>
        <p>Deze verklaring heeft versie 2026-07-06. Bij wijzigingen wordt de versie of datum aangepast.</p>
      </div>
    </section>
  );
}

function TermsPage() {
  const providerName = siteConfig.legalEntityName || siteConfig.siteName;
  const providerDetails = [
    `Aanbieder: ${providerName}`,
    siteConfig.kvkNumber ? `KvK ${siteConfig.kvkNumber}` : "",
    siteConfig.correspondenceAddress ? `correspondentieadres ${siteConfig.correspondenceAddress}` : "",
    `e-mail ${siteConfig.contactEmail}`,
  ].filter(Boolean).join(", ");

  return (
    <section className="section">
      <div className="container narrow legal-copy">
        <span className="section-kicker">Voorwaarden</span>
        <h1>Algemene voorwaarden</h1>
        <p className="lead">Versie 2026-07-06. Voorwaarden voor het informatieplatform van DuurzaamWoningKompas.</p>
        {[
          ["1. Definities", "DuurzaamWoningKompas: het platform dat informatie, woningchecks en aanvraagopvolging rond woningverduurzaming aanbiedt. Gebruiker: de consument of zakelijke bezoeker van de website."],
          ["2. Identiteit", `${providerDetails}.`],
          ["3. Toepasselijkheid", "Deze voorwaarden gelden voor gebruik van de website, Woningcheck, ThuisbatterijCheck, contactformulieren en vrijblijvende opvolging."],
          ["4. Dienstverlening", "DuurzaamWoningKompas geeft informatie, verzamelt aanvragen en kan helpen bij een passende vervolgstap. Het platform presenteert zich niet als uitvoerende installateur."],
          ["5. Indicatief karakter", "Woningchecks, scores en teksten zijn informatief en indicatief. Definitieve geschiktheid vraagt altijd verdere beoordeling door een deskundige partij."],
          ["6. Geen garantie", "Wij garanderen geen besparing, rendement, terugverdientijd, subsidie, beschikbaarheid van producten of acceptatie door een uitvoerder."],
          ["7. Informatie van gebruiker", "De gebruiker is verantwoordelijk voor juiste en volledige gegevens. Onjuiste gegevens kunnen leiden tot een minder passende indicatie."],
          ["8. Contactaanvragen", "Bij verzending mag DuurzaamWoningKompas contact opnemen om de vraag te beantwoorden of de aanvraag op te volgen."],
          ["9. Matching met derden", "Een mogelijke introductie of matching met derde partijen gebeurt alleen waar passend binnen de gekozen consent- en privacy-inrichting."],
          ["10. Externe uitvoerders", "Externe uitvoerders zijn zelf verantwoordelijk voor hun advies, offerte, planning, uitvoering, garanties en naleving van wet- en regelgeving."],
          ["11. Offertes", "Offertes van derde partijen komen niet namens DuurzaamWoningKompas tot stand, tenzij dat later uitdrukkelijk schriftelijk anders wordt afgesproken."],
          ["12. Overeenkomsten", "Een eventuele overeenkomst voor installatie of advies ontstaat tussen gebruiker en de betreffende uitvoerende partij."],
          ["13. Beschikbaarheid", "Wij proberen de website beschikbaar te houden, maar kunnen geen ononderbroken werking garanderen."],
          ["14. Intellectueel eigendom", "Teksten, ontwerp, merknaam en software blijven eigendom van DuurzaamWoningKompas of rechthebbenden."],
          ["15. Misbruik", "Het is niet toegestaan de website te misbruiken, beveiliging te omzeilen of formulieren geautomatiseerd te belasten."],
          ["16. Aansprakelijkheid", "Voor zover wettelijk toegestaan is aansprakelijkheid beperkt tot directe schade die aantoonbaar door een toerekenbare tekortkoming van DuurzaamWoningKompas is veroorzaakt."],
          ["17. Overmacht", "Wij zijn niet aansprakelijk voor vertraging of uitval door omstandigheden buiten onze redelijke invloed."],
          ["18. Klachten", "Klachten kunnen via het contactformulier worden gemeld. We reageren zo zorgvuldig mogelijk."],
          ["19. Privacy", "Op verwerking van persoonsgegevens is de privacyverklaring van toepassing."],
          ["20. Wijzigingen", "Deze voorwaarden kunnen wijzigen. De gepubliceerde versie vermeldt de datum."],
          ["21. Recht en geschillen", "Op deze voorwaarden is Nederlands recht van toepassing, voor zover dwingend consumentenrecht niet anders bepaalt."],
        ].map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </section>
  );
}

function CookiePolicyPage() {
  return (
    <section className="section">
      <div className="container narrow legal-copy">
        <span className="section-kicker">Cookies</span>
        <h1>Cookiebeleid</h1>
        <p className="lead">Versie 2026-07-06. Dit beleid sluit aan op de huidige technische implementatie.</p>
        <h2>Wat zijn cookies en vergelijkbare technieken?</h2>
        <p>Cookies, localStorage en sessionStorage bewaren kleine gegevens in uw browser. Ze kunnen nodig zijn voor werking, voorkeuren, meting of advertenties.</p>
        <h2>Noodzakelijke opslag</h2>
        <p>De Woningcheck bewaart tussentijdse antwoorden tijdelijk in localStorage. Na verzending wordt een submission-id en ontvangen leadreferentie bewaard om dubbele submissions te voorkomen. Admin gebruikt een HttpOnly sessiecookie.</p>
        <h2>Voorkeuren</h2>
        <p>Uw cookievoorkeuren worden opgeslagen in localStorage onder een consentversie. Niet-noodzakelijke categorieen zijn niet vooraf aangevinkt.</p>
        <h2>Analytische cookies</h2>
        <p>Wij kunnen analytische cookies of vergelijkbare technieken gebruiken om de werking en kwaliteit van de website te meten, alleen binnen de gekozen cookievoorkeuren.</p>
        <h2>Marketingcookies</h2>
        <p>Marketingcookies of advertentietags worden alleen gebruikt nadat passende marketingtoestemming is gegeven.</p>
        <h2>Derde partijen en bewaartermijnen</h2>
        <p>Wanneer externe leveranciers voor analytics of advertenties worden gebruikt, gebeurt dat binnen de gekozen cookievoorkeuren. Browseropslag blijft staan totdat u deze wist of uw voorkeur wijzigt.</p>
        <h2>Toestemming wijzigen</h2>
        <p>
          Gebruik de link Cookievoorkeuren in de footer of{" "}
          <button className="inline-link-button" type="button" onClick={openCookiePreferences}>
            open hier uw cookievoorkeuren
          </button>{" "}
          om uw keuze opnieuw te openen en aan te passen.
        </p>
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="section">
      <div className="container narrow">
        <h1>Pagina niet gevonden</h1>
        <p>Deze pagina bestaat niet of is verplaatst.</p>
        <a className="button button-primary" href="/">
          Naar de homepage
        </a>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container">
        <span className="section-kicker">Gratis en vrijblijvend</span>
        <h2>Krijg rustig inzicht in een logische verduurzamingsroute</h2>
        <p>Start met de woningcheck en ontvang een indicatie op basis van uw antwoorden, zonder verplichting.</p>
        <a className="button button-primary button-large" href="/woningcheck">
          Start gratis woningcheck
        </a>
      </div>
    </section>
  );
}
