export type RouteName =
  | "home"
  | "woningcheck"
  | "thuisbatterij-check"
  | "maatregelenkompas"
  | "oplossingen"
  | "oplossing-detail"
  | "hoe"
  | "kennisbank"
  | "kennisbank-detail"
  | "over"
  | "contact"
  | "partner-worden"
  | "privacy"
  | "algemene-voorwaarden"
  | "cookiebeleid"
  | "admin-login"
  | "admin-dashboard"
  | "admin-leads"
  | "admin-lead-detail"
  | "admin-calendar"
  | "admin-reporting"
  | "admin-settings"
  | "not-found";

export type SolutionSlug =
  | "thuisbatterij"
  | "warmtepomp"
  | "isolatie"
  | "zonnepanelen"
  | "laadpaal"
  | "airconditioning";

export interface RouteState {
  name: RouteName;
  slug?: SolutionSlug;
  articleSlug?: string;
  leadId?: string;
}

export interface SolutionCategory {
  slug: SolutionSlug;
  title: string;
  eyebrow: string;
  summary: string;
  idealFor: string[];
  nextSteps: string[];
}

export interface KnowledgeArticle {
  slug: string;
  category: string;
  title: string;
  summary: string;
}

export interface ConsentState {
  adviceConsent: boolean;
  matchingConsent: boolean;
}

export type ProductCategory =
  | "General"
  | "Thuisbatterij"
  | "Warmtepomp"
  | "Isolatie"
  | "Zonnepanelen"
  | "Laadpaal"
  | "Airconditioning"
  | "Energieadvies";

export interface WoningcheckAnswers {
  submissionId?: string;
  productInterest?: ProductCategory;
  woningtype?: string;
  bouwjaar?: string;
  zonnepanelen?: string;
  aantalZonnepanelen?: number;
  stroomverbruik?: number;
  terugleveringKwh?: number;
  energiecontract?: string;
  gasverbruik?: number;
  interesses: string[];
  hoofddoel?: string;
  starttermijn?: string;
  postcode?: string;
  huisnummer?: string;
  naam?: string;
  email?: string;
  telefoon?: string;
  consent: ConsentState;
}

export interface AdviceResult {
  score: number;
  title: string;
  summary: string;
  recommendedSolutions: SolutionSlug[];
  assumptions: string[];
}

export type LeadStatus = "New" | "Contacted" | "AppointmentScheduled" | "QuoteCreated" | "Won" | "Lost";

export interface TrackingData {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  referrer?: string | null;
  landingPage: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  privacyConsent: boolean;
  sourceUrl: string;
  honeypot?: string;
}

export interface CreateLeadResponse {
  id: string;
  status: LeadStatus;
  createdAt: string;
}

export interface AdminSession {
  authenticated: boolean;
  username?: string | null;
}

export interface AdminLeadListItem {
  id: string;
  status: LeadStatus;
  productInterest: ProductCategory;
  fullName: string;
  email: string;
  phone?: string | null;
  postcode: string;
  primaryGoal: string;
  desiredStartTerm: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  followUpNote?: string | null;
  createdAt: string;
}

export interface PagedLeadListResponse {
  items: AdminLeadListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminLeadDetail extends AdminLeadListItem {
  phone?: string;
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  followUpNote?: string | null;
  updatedAt: string;
  property: {
    homeType: string;
    buildYearRange: string;
    solarPanels: string;
    postcode: string;
    houseNumber: string;
  };
  energyProfile: {
    electricityUsageKwh: number;
    gasUsageM3: number;
    solarPanelCount?: number | null;
    feedInKwh?: number | null;
    energyContractType?: string | null;
  };
  interests: string[];
  consentRecords: Array<{
    adviceConsent: boolean;
    matchingConsent: boolean;
    consentText: string;
    consentVersion: string;
    sourceUrl: string;
    createdAt: string;
  }>;
  source: TrackingData;
  statusHistory: Array<{
    previousStatus?: LeadStatus;
    newStatus: LeadStatus;
    actor: string;
    note?: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    text: string;
    actor: string;
    createdAt: string;
  }>;
  appointments: AdminAppointment[];
}

export interface AdminLeadFilters {
  query: string;
  status: string;
  product: string;
  source: string;
  campaign: string;
  from: string;
  to: string;
  sort: LeadSortOption;
  page: number;
  pageSize: number;
}

export type LeadSortOption = "Newest" | "Oldest" | "LastContact" | "NextFollowUp";

export interface AdminLeadMetrics {
  newLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  activeLeads: number;
  toCall: number;
  contactRate?: number;
  appointments: number;
  quotes: number;
  won: number;
  lost: number;
  wonConversionRate?: number;
}

export interface DashboardBucket {
  label: string;
  count: number;
}

export interface AdminDashboardResponse {
  metrics: AdminLeadMetrics;
  recentLeads: AdminLeadListItem[];
  leadsPerStatus: DashboardBucket[];
  leadsPerSource: DashboardBucket[];
  openFollowUps: AdminLeadListItem[];
}

export interface AdminAppointment {
  id: string;
  leadId: string;
  leadName: string;
  productInterest: ProductCategory;
  startAt: string;
  endAt?: string | null;
  type: string;
  status: string;
  notes?: string | null;
}

export interface AdminReportResponse {
  leadsPerDay: DashboardBucket[];
  leadsPerWeek: DashboardBucket[];
  leadsPerMonth: DashboardBucket[];
  leadsPerProduct: DashboardBucket[];
  leadsPerSource: DashboardBucket[];
  leadsPerCampaign: DashboardBucket[];
  appointments: number;
  quotes: number;
  won: number;
  lost: number;
  conversionRate?: number | null;
}
