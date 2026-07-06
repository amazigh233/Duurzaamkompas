export interface PublicSiteConfig {
  siteName: string;
  legalEntityName: string;
  kvkNumber: string;
  vatNumber: string;
  contactEmail: string;
  contactPhone: string;
  correspondenceAddress: string;
  siteUrl: string;
  privacyEmail: string;
}

function env(name: string, fallback: string): string {
  const value = import.meta.env[name] as string | undefined;
  return value?.trim() || fallback;
}

export const siteConfig: PublicSiteConfig = {
  siteName: "DuurzaamWoningKompas",
  legalEntityName: env("VITE_PUBLIC_LEGAL_ENTITY_NAME", ""),
  kvkNumber: env("VITE_PUBLIC_KVK_NUMBER", ""),
  vatNumber: env("VITE_PUBLIC_VAT_NUMBER", ""),
  contactEmail: env("VITE_PUBLIC_CONTACT_EMAIL", "info@duurzaamwoningkompas.nl"),
  contactPhone: env("VITE_PUBLIC_CONTACT_PHONE", ""),
  correspondenceAddress: env("VITE_PUBLIC_CORRESPONDENCE_ADDRESS", ""),
  siteUrl: env("VITE_PUBLIC_SITE_URL", "https://www.duurzaamwoningkompas.nl"),
  privacyEmail: env("VITE_PUBLIC_PRIVACY_EMAIL", "privacy@duurzaamwoningkompas.nl"),
};
