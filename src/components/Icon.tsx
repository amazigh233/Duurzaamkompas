import type { SolutionSlug } from "../types";

export type IconName =
  | "isolatie"
  | "warmtepomp"
  | "zonnepanelen"
  | "thuisbatterij"
  | "laadpaal"
  | "airconditioning"
  | "energieadvies"
  | "shield"
  | "eye"
  | "handshake";

const paths: Record<IconName, JSX.Element> = {
  isolatie: (
    <>
      <path d="M3 20.5 12 4l9 16.5" />
      <path d="M6.5 14h11" />
      <path d="M4.6 17.4h14.8" />
    </>
  ),
  warmtepomp: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 9.5c1.3.4 1.6 2 .6 3M12 14.5c-1.3-.4-1.6-2-.6-3" />
    </>
  ),
  zonnepanelen: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M12 2.5v1.4M17 8h1.4M5.6 8H7M15.4 4.6l1-1M8.6 4.6l-1-1" />
      <path d="M5 21h14l-1.5-6.5h-11L5 21Z" />
      <path d="M8.4 14.5 7.6 21M15.6 14.5l.8 6.5M6 17.7h12" />
    </>
  ),
  thuisbatterij: (
    <>
      <rect x="3" y="7" width="16" height="11" rx="2.2" />
      <path d="M21 11v3" />
      <path d="M11 9.5 8.8 13h2.6L9.2 16" />
    </>
  ),
  laadpaal: (
    <>
      <path d="M6 21V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v15" />
      <path d="M4.5 21h11" />
      <path d="M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V15a1.6 1.6 0 0 0 3.2 0V10" />
      <path d="M10.4 9.5 8.8 12h2.4l-1.6 2.6" />
    </>
  ),
  airconditioning: (
    <>
      <rect x="3" y="5" width="18" height="8" rx="2" />
      <path d="M6.5 9.5h11" />
      <path d="M7 16.5c0 1.4 1.2 1.6 1.8.8M11 17c0 1.6 1.4 1.8 2 .9M15.4 16.5c0 1.4 1.2 1.6 1.8.8" />
    </>
  ),
  energieadvies: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2h5c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  handshake: (
    <>
      <path d="m11 17-2.2 2.2a1.6 1.6 0 0 1-2.3-2.3l4.8-4.8" />
      <path d="M3 8.5 7 5l3.5 3 3-2 4 3.5" />
      <path d="M21 8.5 17 5" />
      <path d="m13 12 2.5 2.5a1.6 1.6 0 0 1-2.3 2.3L11 15" />
    </>
  ),
};

const solutionIconBySlug: Record<SolutionSlug, IconName> = {
  isolatie: "isolatie",
  warmtepomp: "warmtepomp",
  zonnepanelen: "zonnepanelen",
  thuisbatterij: "thuisbatterij",
  laadpaal: "laadpaal",
  airconditioning: "airconditioning",
};

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

export function solutionIconName(slug: SolutionSlug): IconName {
  return solutionIconBySlug[slug] ?? "energieadvies";
}
