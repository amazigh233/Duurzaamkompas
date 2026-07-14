export type ConsentValue = "granted" | "denied";

export interface GoogleConsentSettings {
  analytics_storage: ConsentValue;
  ad_storage: ConsentValue;
  ad_user_data: ConsentValue;
  ad_personalization: ConsentValue;
  wait_for_update?: number;
}

export type DataLayerEventName =
  | "page_view"
  | "woningcheck_started"
  | "woningcheck_step_completed"
  | "generate_lead"
  | "contact_form_submitted"
  | "cookie_consent_updated";

export type DataLayerValue = string | number | boolean;
export type DataLayerEvent = { event: DataLayerEventName } & Record<string, DataLayerValue>;
export type DataLayerItem = DataLayerEvent | IArguments | { "gtm.start": number; event: "gtm.js" };

declare global {
  interface Window {
    dataLayer: DataLayerItem[];
  }
}

export function getDataLayer(): DataLayerItem[] {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

export function pushDataLayerItem(item: DataLayerItem): void {
  getDataLayer().push(item);
}

export function pushGoogleConsentCommand(mode: "default" | "update", settings: GoogleConsentSettings): void {
  pushGoogleCommand("consent", mode, settings);
}

function pushGoogleCommand(command: "consent", mode: "default" | "update", settings: GoogleConsentSettings): void {
  getDataLayer().push(arguments);
}

export function pushDataLayerEvent(
  event: DataLayerEventName,
  parameters: Record<string, DataLayerValue | undefined> = {}
): void {
  const safeParameters = Object.fromEntries(Object.entries(parameters).filter(([, value]) => value !== undefined)) as Record<
    string,
    DataLayerValue
  >;
  pushDataLayerItem({ event, ...safeParameters });
}
