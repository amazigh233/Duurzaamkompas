import { updateConsentMode } from "./consentMode";
import { pushDataLayerEvent } from "./dataLayer";

export const cookieConsentVersion = "2026-07-06";
const storageKey = "dwk_cookie_consent";

export interface CookieConsentState {
  version: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}

export function readCookieConsent(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed.version !== cookieConsentVersion || parsed.necessary !== true) return null;

    return {
      version: parsed.version,
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent(partial: { analytics: boolean; marketing: boolean }): CookieConsentState {
  const state: CookieConsentState = {
    version: cookieConsentVersion,
    necessary: true,
    analytics: partial.analytics,
    marketing: partial.marketing,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(storageKey, JSON.stringify(state));
  updateConsentMode(state);
  pushDataLayerEvent("cookie_consent_updated", {
    analytics: state.analytics,
    marketing: state.marketing,
    consent_version: state.version,
  });
  window.dispatchEvent(new CustomEvent("dwk:cookie-consent-updated", { detail: state }));
  window.dispatchEvent(new CustomEvent("dwk:cookie-consent-changed", { detail: state }));
  return state;
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return readCookieConsent()?.marketing === true;
}
