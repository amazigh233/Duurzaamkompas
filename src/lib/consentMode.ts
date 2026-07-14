import type { CookieConsentState } from "./cookieConsent";
import type { GoogleConsentSettings } from "./dataLayer";
import { pushGoogleConsentCommand } from "./dataLayer";

const deniedConsent: GoogleConsentSettings = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

let defaultInitialized = false;

export function initializeConsentMode(storedConsent: CookieConsentState | null): void {
  if (!defaultInitialized) {
    pushGoogleConsentCommand("default", { ...deniedConsent, wait_for_update: 500 });
    defaultInitialized = true;
  }

  if (storedConsent) {
    updateConsentMode(storedConsent);
  }
}

export function updateConsentMode(consent: Pick<CookieConsentState, "analytics" | "marketing">): void {
  pushGoogleConsentCommand("update", consentSettings(consent));
}

export function consentSettings(
  consent: Pick<CookieConsentState, "analytics" | "marketing">
): GoogleConsentSettings {
  return {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  };
}
