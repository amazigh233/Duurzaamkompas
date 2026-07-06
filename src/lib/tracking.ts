import type { TrackingData } from "../types";
import { hasAnalyticsConsent, hasMarketingConsent } from "./cookieConsent";

const storageKey = "dwk_tracking";
const submittedLeadStorageKey = "dwk_submitted_lead_ids";

export type AnalyticsEventName =
  | "thuisbatterij_check_viewed"
  | "thuisbatterij_check_started"
  | "woningcheck_step_completed"
  | "lead_submitted";

export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

export function getTrackingData(): TrackingData {
  const current = captureCurrentTracking();

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as TrackingData;
      const merged = {
        ...parsed,
        ...withoutEmpty(current),
        landingPage: parsed.landingPage || current.landingPage,
        referrer: parsed.referrer || current.referrer,
      };
      localStorage.setItem(storageKey, JSON.stringify(merged));
      return {
        ...merged,
      };
    }

    localStorage.setItem(storageKey, JSON.stringify(current));
  } catch {
    return current;
  }

  return current;
}

export function trackAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (!hasAnalyticsConsent()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("dwk:analytics", {
      detail: {
        name,
        payload,
      },
    })
  );
}

export function trackLeadSubmittedOnce(leadId: string, payload: AnalyticsPayload = {}) {
  const submittedIds = readSubmittedLeadIds();
  if (submittedIds.includes(leadId)) {
    return;
  }

  const nextIds = [...submittedIds, leadId].slice(-20);
  sessionStorage.setItem(submittedLeadStorageKey, JSON.stringify(nextIds));
  trackAnalyticsEvent("lead_submitted", { ...payload, leadId });
  if (!hasMarketingConsent()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("dwk:conversion-ready", {
      detail: {
        leadId,
        payload,
      },
    })
  );
}

function captureCurrentTracking(): TrackingData {
  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: optional(params.get("utm_source")),
    utmMedium: optional(params.get("utm_medium")),
    utmCampaign: optional(params.get("utm_campaign")),
    utmTerm: optional(params.get("utm_term")),
    utmContent: optional(params.get("utm_content")),
    gclid: optional(params.get("gclid")),
    referrer: optional(document.referrer),
    landingPage: window.location.href,
  };
}

function optional(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function withoutEmpty(tracking: TrackingData): Partial<TrackingData> {
  return Object.fromEntries(Object.entries(tracking).filter(([, value]) => value !== undefined && value !== "")) as Partial<TrackingData>;
}

function readSubmittedLeadIds(): string[] {
  try {
    const raw = sessionStorage.getItem(submittedLeadStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}
