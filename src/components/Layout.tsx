import { useState } from "react";
import type { ReactNode } from "react";
import { CookieConsent, openCookiePreferences } from "./CookieConsent";
import { Brand } from "./Logo";
import { siteConfig } from "../siteConfig";

const navItems = [
  { href: "/woningcheck", label: "Woningcheck" },
  { href: "/thuisbatterij-check", label: "ThuisbatterijCheck" },
  { href: "/oplossingen", label: "Oplossingen" },
  { href: "/hoe-werkt-het", label: "Hoe werkt het" },
  { href: "/kennisbank", label: "Kennisbank" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
];

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Naar hoofdinhoud
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <a href="/" className="brand-link" onClick={() => setOpen(false)}>
            <Brand />
          </a>
          <nav className="desktop-nav" aria-label="Hoofdmenu">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <a className="button button-primary" href="/woningcheck">
              Start gratis woningcheck
            </a>
            <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Menu">
              <span />
            </button>
          </div>
        </div>
        {open ? (
          <nav className="mobile-nav" aria-label="Mobiel menu">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
            <a className="button button-primary" href="/woningcheck" onClick={() => setOpen(false)}>
              Start gratis woningcheck
            </a>
          </nav>
        ) : null}
      </header>
      <main id="main">{children}</main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

function Footer() {
  const companyDetails = [
    siteConfig.legalEntityName ? `Juridische bedrijfsnaam: ${siteConfig.legalEntityName}` : "",
    siteConfig.kvkNumber ? `KvK: ${siteConfig.kvkNumber}` : "",
    siteConfig.vatNumber ? `Btw-nummer: ${siteConfig.vatNumber}` : "",
    siteConfig.correspondenceAddress ? `Correspondentieadres: ${siteConfig.correspondenceAddress}` : "",
  ].filter(Boolean);

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>
            De juiste route naar een duurzame woning. Onafhankelijke informatie, een heldere woningcheck en een
            vrijblijvende vervolgstap.
          </p>
          {companyDetails.length > 0 ? (
            <p className="footer-company">
              {companyDetails.map((detail) => (
                <span key={detail}>
                  {detail}
                  <br />
                </span>
              ))}
            </p>
          ) : null}
        </div>
        <div>
          <h2>Platform</h2>
          <a href="/woningcheck">Woningcheck</a>
          <a href="/thuisbatterij-check">ThuisbatterijCheck</a>
          <a href="/maatregelenkompas">MaatregelenKompas</a>
          <a href="/oplossingen">Oplossingen</a>
          <a href="/hoe-werkt-het">Hoe werkt het?</a>
          <a href="/kennisbank">Kennisbank</a>
          <a href="/over-ons">Over ons</a>
        </div>
        <div>
          <h2>Contact</h2>
          <a href="/contact">Contact opnemen</a>
          <a href="/partner-worden">Partner worden</a>
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
          {siteConfig.contactPhone ? <span>{siteConfig.contactPhone}</span> : null}
        </div>
        <div>
          <h2>Juridisch</h2>
          <a href="/privacy">Privacyverklaring</a>
          <a href="/algemene-voorwaarden">Algemene voorwaarden</a>
          <a href="/cookiebeleid">Cookiebeleid</a>
          <button className="footer-link-button" type="button" onClick={openCookiePreferences}>
            Cookievoorkeuren
          </button>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 DuurzaamWoningKompas</span>
        <span>Informatieplatform voor woningverduurzaming. Geen installateur of financieel adviseur.</span>
      </div>
    </footer>
  );
}
