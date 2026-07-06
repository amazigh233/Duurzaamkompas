import { useEffect, useState } from "react";
import { readCookieConsent, writeCookieConsent } from "../lib/cookieConsent";

const openEventName = "dwk:open-cookie-preferences";

export function openCookiePreferences() {
  window.dispatchEvent(new Event(openEventName));
}

export function getCookiePreference() {
  return readCookieConsent();
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    if (stored) {
      window.dispatchEvent(new CustomEvent("dwk:cookie-consent-changed", { detail: stored }));
      return;
    }

    setVisible(true);
  }, []);

  useEffect(() => {
    const open = () => {
      const stored = readCookieConsent();
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      setExpanded(true);
      setVisible(true);
    };

    window.addEventListener(openEventName, open);
    return () => window.removeEventListener(openEventName, open);
  }, []);

  const closeWith = (next: { analytics: boolean; marketing: boolean }) => {
    writeCookieConsent(next);
    setVisible(false);
    setExpanded(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
      <div>
        <h2 id="cookie-title">Cookievoorkeuren</h2>
        <p>
          We gebruiken noodzakelijke opslag voor de website en formulieren. Analytische en marketingcookies worden pas
          geactiveerd nadat u daarvoor kiest.
        </p>
        {expanded ? (
          <div className="cookie-options">
            <label className="checkbox-row">
              <input type="checkbox" checked disabled />
              <span>Noodzakelijk: nodig voor formulieren, sessies en cookievoorkeuren.</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
              <span>Analytisch: helpt funnelprestaties te meten zonder persoonsgegevens in events.</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
              <span>Marketing: alleen nodig voor advertentie- en conversietags zoals Google Ads.</span>
            </label>
          </div>
        ) : null}
      </div>
      <div className="cookie-actions">
        <button className="button button-secondary" type="button" onClick={() => closeWith({ analytics: false, marketing: false })}>
          Weigeren
        </button>
        <button className="button button-secondary" type="button" onClick={() => setExpanded((current) => !current)}>
          Voorkeuren beheren
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={() => closeWith(expanded ? { analytics, marketing } : { analytics: true, marketing: true })}
        >
          Accepteren
        </button>
      </div>
    </div>
  );
}
