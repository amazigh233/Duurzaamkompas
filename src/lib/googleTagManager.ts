import { getDataLayer, pushDataLayerItem } from "./dataLayer";

const scriptId = "dwk-google-tag-manager";
const gtmIdPattern = /^GTM-[A-Z0-9]+$/i;

export function isValidGtmId(value: string | undefined): value is string {
  return typeof value === "string" && gtmIdPattern.test(value.trim());
}
export function initializeGoogleTagManager(configuredId = import.meta.env.VITE_GTM_ID as string | undefined): boolean {
  const gtmId = configuredId?.trim();
  if (!isValidGtmId(gtmId)) {
    return false;
  }

  getDataLayer();
  if (document.getElementById(scriptId)) {
    return true;
  }

  pushDataLayerItem({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.appendChild(script);
  return true;
}
