import type {
  AdminLeadDetail,
  AdminLeadFilters,
  AdminLeadListItem,
  AdminLeadMetrics,
  AdminDashboardResponse,
  AdminAppointment,
  AdminReportResponse,
  AdminSession,
  ApiErrorResponse,
  ContactMessageRequest,
  CreateLeadResponse,
  LeadStatus,
  PagedLeadListResponse,
  TrackingData,
  WoningcheckAnswers,
} from "../types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  readonly response: ApiErrorResponse;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.response = response;
  }
}

export async function submitWoningcheckLead(
  submissionId: string,
  answers: WoningcheckAnswers,
  tracking: TrackingData,
  consentText: string,
  consentVersion: string
): Promise<CreateLeadResponse> {
  return request<CreateLeadResponse>("/api/woningcheck/leads", {
    method: "POST",
    body: JSON.stringify({
      submissionId,
      ...answers,
      consent: {
        ...answers.consent,
        consentText,
        consentVersion,
        sourceUrl: window.location.href,
      },
      tracking,
    }),
  });
}

export async function submitContactMessage(requestBody: ContactMessageRequest): Promise<void> {
  await requestWithoutBody("/api/contact/messages", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

function adminLeadParams(filters: AdminLeadFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.product) params.set("product", filters.product);
  if (filters.source.trim()) params.set("source", filters.source.trim());
  if (filters.campaign.trim()) params.set("campaign", filters.campaign.trim());
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("sort", filters.sort);
  params.set("page", filters.page.toString());
  params.set("pageSize", filters.pageSize.toString());

  return params;
}

export async function loginAdmin(username: string, password: string): Promise<AdminSession> {
  return request<AdminSession>("/api/admin/session", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
}

export async function logoutAdmin(): Promise<void> {
  await requestWithoutBody("/api/admin/session", {
    method: "DELETE",
    credentials: "include",
  });
}

export async function getAdminSession(): Promise<AdminSession> {
  return request<AdminSession>("/api/admin/session", {
    credentials: "include",
  });
}

export async function getAdminLeads(filters: AdminLeadFilters): Promise<PagedLeadListResponse> {
  const params = adminLeadParams(filters);
  return request<PagedLeadListResponse>(`/api/admin/leads?${params.toString()}`, {
    credentials: "include",
  });
}

export async function getAdminLeadMetrics(): Promise<AdminLeadMetrics> {
  return request<AdminLeadMetrics>("/api/admin/leads/metrics", {
    credentials: "include",
  });
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  return request<AdminDashboardResponse>("/api/admin/leads/dashboard", {
    credentials: "include",
  });
}

export async function getAdminReport(): Promise<AdminReportResponse> {
  return request<AdminReportResponse>("/api/admin/leads/report", {
    credentials: "include",
  });
}

export async function getAdminLead(id: string): Promise<AdminLeadDetail> {
  return request<AdminLeadDetail>(`/api/admin/leads/${id}`, {
    credentials: "include",
  });
}

export async function updateAdminLeadStatus(
  id: string,
  status: LeadStatus,
  note: string
): Promise<AdminLeadDetail> {
  return request<AdminLeadDetail>(`/api/admin/leads/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({ status, note: note.trim() || undefined }),
  });
}

export async function addAdminLeadNote(id: string, text: string): Promise<AdminLeadDetail> {
  return request<AdminLeadDetail>(`/api/admin/leads/${id}/notes`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ text }),
  });
}

export async function updateAdminLeadFollowUp(
  id: string,
  nextFollowUpAt: string | null,
  note: string
): Promise<AdminLeadDetail> {
  return request<AdminLeadDetail>(`/api/admin/leads/${id}/follow-up`, {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({ nextFollowUpAt, note: note.trim() || undefined }),
  });
}

export async function addAdminLeadAppointment(
  id: string,
  startAt: string,
  endAt: string,
  type: string,
  notes: string
): Promise<AdminLeadDetail> {
  return request<AdminLeadDetail>(`/api/admin/leads/${id}/appointments`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      startAt,
      endAt: endAt || undefined,
      type: type.trim() || undefined,
      status: "Scheduled",
      notes: notes.trim() || undefined,
    }),
  });
}

export async function getAdminAppointments(from?: string, to?: string): Promise<AdminAppointment[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return request<AdminAppointment[]>(`/api/admin/appointments?${params.toString()}`, {
    credentials: "include",
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetchJson(path, init, headers);

  if (!response.ok) {
    throw new ApiError(await readError(response, path));
  }

  return response.json() as Promise<T>;
}

async function requestWithoutBody(path: string, init: RequestInit = {}): Promise<void> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetchJson(path, init, headers);

  if (!response.ok) {
    throw new ApiError(await readError(response, path));
  }
}

async function fetchJson(path: string, init: RequestInit, headers: Headers): Promise<Response> {
  try {
    return await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError({
      code: "API_UNREACHABLE",
      message: fallbackMessage(0, path),
    });
  }
}

async function readError(response: Response, path: string): Promise<ApiErrorResponse> {
  try {
    const payload = (await response.json()) as Partial<ApiErrorResponse> & {
      title?: string;
      detail?: string;
    };
    const code = cleanString(payload.code);
    const message = cleanString(payload.message) ?? cleanString(payload.detail) ?? cleanString(payload.title);

    return {
      code: code || `HTTP_${response.status}`,
      message: message || fallbackMessage(response.status, path),
      errors: payload.errors,
    };
  } catch {
    return {
      code: `HTTP_${response.status || "REQUEST_FAILED"}`,
      message: fallbackMessage(response.status, path),
    };
  }
}

function fallbackMessage(status: number, path: string): string {
  const isContactRequest = path.startsWith("/api/contact");
  const action = isContactRequest ? "Uw bericht" : "De aanvraag";

  if (status === 0 || status === 404) {
    return `${action} kon niet worden verzonden omdat de aanvraagservice niet bereikbaar is. Probeer het later opnieuw.`;
  }

  if (status === 429) {
    return "Er zijn te veel pogingen gedaan. Probeer het later opnieuw.";
  }

  if (status >= 500) {
    return `${action} kon niet worden verzonden door een tijdelijke serverfout. Probeer het later opnieuw.`;
  }

  return `${action} kon niet worden verwerkt. Controleer de ingevulde gegevens en probeer het opnieuw.`;
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
