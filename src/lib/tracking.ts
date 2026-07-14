import type { TrackingData } from "../types";
import { hasAnalyticsConsent, hasMarketingConsent } from "./cookieConsent";
import { pushDataLayerEvent } from "./dataLayer";

const storageKey = "dwk_tracking";
const submittedLeadStorageKey = "dwk_submitted_lead_ids";
const funnelEventStorageKey = "dwk_tracked_funnel_events";
const inMemoryEventIds = new Set<string>();
let lastPageViewKey = "";

export type AnalyticsEventName = "woningcheck_started" | "woningcheck_step_completed";
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
      return merged;
    }

    localStorage.setItem(storageKey, JSON.stringify(current));
  } catch {
    return current;
  }

  return current;
}

export function trackAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  if (!hasAnalyticsConsent()) return;
  pushDataLayerEvent(name, payload);
}

export function trackWoningcheckStartedOnce(
  submissionId: string,
  funnel: "woningcheck" | "thuisbatterijcheck"
): void {
  trackFunnelEventOnce(`${submissionId}:started`, "woningcheck_started", { funnel });
}

export function trackWoningcheckStepCompletedOnce(
  submissionId: string,
  funnel: "woningcheck" | "thuisbatterijcheck",
  step: number
): void {
  trackFunnelEventOnce(`${submissionId}:step:${step}`, "woningcheck_step_completed", { funnel, step });
}

export function trackPageView(): void {
  if (!hasAnalyticsConsent()) return;

  const pagePath = window.location.pathname;
  const pageLocation = safePageLocation();
  const key = `${pageLocation}|${document.title}`;
  if (key === lastPageViewKey) return;
  lastPageViewKey = key;

  pushDataLayerEvent("page_view", {
    page_path: pagePath,
    page_location: pageLocation,
    page_title: document.title,
  });
}

export function trackLeadSubmittedOnce(
  submissionId: string,
  leadType: "woningcheck" | "thuisbatterijcheck",
  productInterest: string,
  tracking: TrackingData
): boolean {
  if (!hasAnalyticsConsent() && !hasMarketingConsent()) return false;

  const submittedIds = readSubmittedLeadIds();
  if (submittedIds.includes(submissionId)) return false;

  writeStoredIds(submittedLeadStorageKey, [...submittedIds, submissionId].slice(-100));
  pushDataLayerEvent("generate_lead", {
    lead_type: leadType,
    product_interest: productInterest,
    submission_id: submissionId,
    source: cleanAttribution(tracking.utmSource),
    campaign: cleanAttribution(tracking.utmCampaign),
  });
  return true;
}

export function trackContactFormSubmitted(): void {
  if (!hasAnalyticsConsent()) return;
  pushDataLayerEvent("contact_form_submitted");
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
    landingPage: safePageLocation(),
  };
}

function safePageLocation(): string {
  const url = new URL(window.location.href);
  const safeParams = new URLSearchParams();
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"]) {
    const value = cleanAttribution(url.searchParams.get(key));
    if (value) safeParams.set(key, value);
  }
  const query = safeParams.toString();
  return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`;
}

function cleanAttribution(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || likelyContainsPii(trimmed)) return undefined;
  return trimmed.slice(0, 200);
}

function likelyContainsPii(value: string): boolean {
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();
  return /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i.test(decoded) || /\b[1-9][0-9]{3}\s?[a-z]{2}\b/i.test(decoded);
}

function optional(value: string | null): string | undefined {
  return cleanAttribution(value);
}

function withoutEmpty(tracking: TrackingData): Partial<TrackingData> {
  return Object.fromEntries(Object.entries(tracking).filter(([, value]) => value !== undefined && value !== "")) as Partial<TrackingData>;
}

function readSubmittedLeadIds(): string[] {
  return readStoredIds(submittedLeadStorageKey);
}

function trackFunnelEventOnce(id: string, name: AnalyticsEventName, payload: AnalyticsPayload): void {
  if (!hasAnalyticsConsent()) return;
  const storedIds = readStoredIds(funnelEventStorageKey);
  if (inMemoryEventIds.has(id) || storedIds.includes(id)) return;
  inMemoryEventIds.add(id);
  writeStoredIds(funnelEventStorageKey, [...storedIds, id].slice(-300));
  trackAnalyticsEvent(name, payload);
}

function readStoredIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredIds(key: string, ids: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    ids.forEach((id) => inMemoryEventIds.add(id));
  }
}
