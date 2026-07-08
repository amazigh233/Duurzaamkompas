import { useEffect, useMemo, useState } from "react";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import {
  addAdminLeadAppointment,
  addAdminLeadNote,
  getAdminAppointments,
  getAdminDashboard,
  getAdminLead,
  getAdminLeads,
  getAdminReport,
  getAdminSession,
  loginAdmin,
  logoutAdmin,
  updateAdminLeadFollowUp,
  updateAdminLeadStatus,
  ApiError,
} from "../../api/client";
import { leadStatusLabels, leadStatuses, productCategories, productCategoryLabels } from "../../data";
import type {
  AdminAppointment,
  AdminDashboardResponse,
  AdminLeadDetail,
  AdminLeadFilters,
  AdminLeadListItem,
  AdminReportResponse,
  AdminSession,
  DashboardBucket,
  LeadSortOption,
  LeadStatus,
  PagedLeadListResponse,
} from "../../types";

export type AdminPage = "login" | "dashboard" | "leads" | "lead-detail" | "calendar" | "reporting" | "settings";

interface AdminDashboardProps {
  page: AdminPage;
  leadId?: string;
}

const defaultFilters: AdminLeadFilters = {
  query: "",
  status: "",
  product: "",
  source: "",
  campaign: "",
  from: "",
  to: "",
  sort: "Newest",
  page: 1,
  pageSize: 25,
};

const pageTitles: Record<AdminPage, string> = {
  login: "Admin login",
  dashboard: "Overzicht",
  leads: "Leads",
  "lead-detail": "Leaddetail",
  calendar: "Afspraken",
  reporting: "Rapportage",
  settings: "Instellingen",
};

export function AdminDashboard({ page, leadId }: AdminDashboardProps) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    getAdminSession()
      .then(setSession)
      .catch(() => setSession({ authenticated: false }))
      .finally(() => setSessionLoading(false));
  }, []);

  const logout = async () => {
    await logoutAdmin();
    setSession({ authenticated: false });
    navigateAdmin("/admin/login");
  };

  if (sessionLoading) {
    return <AdminLoading />;
  }

  if (page === "login" || !session?.authenticated) {
    return <AdminLoginPage onLogin={setSession} />;
  }

  return (
    <AdminShell page={page} username={session.username ?? "admin"} onLogout={logout}>
      {page === "dashboard" ? <DashboardPage /> : null}
      {page === "leads" ? <LeadsPage /> : null}
      {page === "lead-detail" && leadId ? <LeadDetailPage leadId={leadId} /> : null}
      {page === "calendar" ? <CalendarPage /> : null}
      {page === "reporting" ? <ReportingPage /> : null}
      {page === "settings" ? <SettingsPage username={session.username ?? "admin"} /> : null}
    </AdminShell>
  );
}

function AdminLoading() {
  return (
    <main className="admin-app admin-center">
      <span className="spinner" aria-hidden="true" />
      <p>Admin-sessie controleren...</p>
    </main>
  );
}

function AdminLoginPage({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const session = await loginAdmin(username, password);
      onLogin(session);
      navigateAdmin("/admin/dashboard");
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div>
          <span className="admin-eyebrow">DuurzaamWoningKompas CRM</span>
          <h1 id="admin-login-title">Inloggen eigenaar</h1>
          <p>
            Beheer leads, opvolging en afspraken in een afgeschermde omgeving. De sessie loopt via een HttpOnly
            cookie en wordt server-side gecontroleerd.
          </p>
        </div>
        <form onSubmit={submit} className="field-stack">
          <label>
            E-mailadres of gebruikersnaam
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              inputMode="email"
            />
          </label>
          <label>
            Wachtwoord
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button-primary" type="submit" disabled={saving || !username.trim() || !password}>
            {saving ? "Inloggen..." : "Inloggen"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminShell({
  page,
  username,
  onLogout,
  children,
}: {
  page: AdminPage;
  username: string;
  onLogout: () => Promise<void>;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const today = new Intl.DateTimeFormat("nl-NL", { dateStyle: "full" }).format(new Date());

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = globalQuery.trim();
    navigateAdmin(query ? `/admin/leads?query=${encodeURIComponent(query)}` : "/admin/leads");
  };

  return (
    <main className="admin-app">
      <aside className={`admin-sidebar ${menuOpen ? "is-open" : ""}`} aria-label="CRM navigatie">
        <div className="admin-sidebar-brand">
          <strong>DuurzaamWoningKompas</strong>
          <span>Mini CRM</span>
        </div>
        <nav>
          <AdminNavLink href="/admin/dashboard" active={page === "dashboard"} onNavigate={() => setMenuOpen(false)}>
            Overzicht
          </AdminNavLink>
          <AdminNavLink href="/admin/leads" active={page === "leads" || page === "lead-detail"} onNavigate={() => setMenuOpen(false)}>
            Leads
          </AdminNavLink>
          <AdminNavLink href="/admin/calendar" active={page === "calendar"} onNavigate={() => setMenuOpen(false)}>
            Afspraken
          </AdminNavLink>
          <AdminNavLink href="/admin/reporting" active={page === "reporting"} onNavigate={() => setMenuOpen(false)}>
            Rapportage
          </AdminNavLink>
          <AdminNavLink href="/admin/settings" active={page === "settings"} onNavigate={() => setMenuOpen(false)}>
            Instellingen
          </AdminNavLink>
        </nav>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Uitloggen
        </button>
      </aside>
      {menuOpen ? <button className="admin-scrim" type="button" aria-label="Menu sluiten" onClick={() => setMenuOpen(false)} /> : null}
      <section className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Menu openen">
            Menu
          </button>
          <div>
            <span>{today}</span>
            <h1>{pageTitles[page]}</h1>
          </div>
          <form className="admin-global-search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="admin-global-search">
              Globaal zoeken
            </label>
            <input
              id="admin-global-search"
              value={globalQuery}
              onChange={(event) => setGlobalQuery(event.target.value)}
              placeholder="Zoek naam, telefoon, e-mail of postcode"
            />
          </form>
          <div className="admin-user-pill">
            <span>{username}</span>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </section>
    </main>
  );
}

function AdminNavLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate: () => void;
  children: ReactNode;
}) {
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onNavigate();
    navigateAdmin(href);
  };

  return (
    <a href={href} className={active ? "is-active" : ""} onClick={click}>
      {children}
    </a>
  );
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboard()
      .then(setDashboard)
      .catch((caught) => setError(readError(caught)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StateNote text="Dashboard laden..." />;
  if (error) return <ErrorNote text={error} />;
  if (!dashboard) return <StateNote text="Geen dashboardgegevens beschikbaar." />;

  return (
    <div className="admin-page-grid">
      <MetricsGrid metrics={dashboard.metrics} />
      <section className="admin-panel span-2">
        <PanelHeader title="Recente leads" actionHref="/admin/leads" actionLabel="Alle leads" />
        <LeadMiniTable leads={dashboard.recentLeads} />
      </section>
      <section className="admin-panel">
        <h2>Leads per status</h2>
        <BarList items={dashboard.leadsPerStatus} labelFormatter={formatStatusLabel} />
      </section>
      <section className="admin-panel">
        <h2>Leads per bron</h2>
        <BarList items={dashboard.leadsPerSource} />
      </section>
      <section className="admin-panel span-2">
        <PanelHeader title="Openstaande opvolging" actionHref="/admin/leads?sort=NextFollowUp" actionLabel="Bekijk opvolging" />
        <LeadMiniTable leads={dashboard.openFollowUps} emptyText="Geen aankomende follow-ups gevonden." />
      </section>
    </div>
  );
}

function LeadsPage() {
  const [filters, setFilters] = useState<AdminLeadFilters>(() => filtersFromSearch());
  const [response, setResponse] = useState<PagedLeadListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      setResponse(await getAdminLeads(nextFilters));
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchFilters = (partial: Partial<AdminLeadFilters>) => {
    setFilters((current) => ({ ...current, ...partial, page: partial.page ?? 1 }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    load(filters);
  };

  const leads = response?.items ?? [];
  const totalPages = response ? Math.max(1, Math.ceil(response.total / response.pageSize)) : 1;

  return (
    <div className="admin-page-stack">
      <section className="admin-panel">
        <form className="admin-filter-grid" onSubmit={submit}>
          <label>
            Zoeken
            <input value={filters.query} onChange={(event) => patchFilters({ query: event.target.value })} placeholder="Naam, telefoon, e-mail of postcode" />
          </label>
          <label>
            Status
            <select value={filters.status} onChange={(event) => patchFilters({ status: event.target.value })}>
              <option value="">Alle statussen</option>
              {leadStatuses.map((item) => (
                <option key={item} value={item}>{leadStatusLabels[item]}</option>
              ))}
            </select>
          </label>
          <label>
            Product
            <select value={filters.product} onChange={(event) => patchFilters({ product: event.target.value })}>
              <option value="">Alle producten</option>
              {productCategories.map((item) => (
                <option key={item} value={item}>{productCategoryLabels[item]}</option>
              ))}
            </select>
          </label>
          <label>
            Bron
            <input value={filters.source} onChange={(event) => patchFilters({ source: event.target.value })} placeholder="Google Ads, organisch..." />
          </label>
          <label>
            Campagne
            <input value={filters.campaign} onChange={(event) => patchFilters({ campaign: event.target.value })} />
          </label>
          <label>
            Vanaf
            <input type="date" value={filters.from} onChange={(event) => patchFilters({ from: event.target.value })} />
          </label>
          <label>
            Tot en met
            <input type="date" value={filters.to} onChange={(event) => patchFilters({ to: event.target.value })} />
          </label>
          <label>
            Sorteren
            <select value={filters.sort} onChange={(event) => patchFilters({ sort: event.target.value as LeadSortOption })}>
              <option value="Newest">Nieuwste</option>
              <option value="Oldest">Oudste</option>
              <option value="LastContact">Laatste contact</option>
              <option value="NextFollowUp">Volgende opvolging</option>
            </select>
          </label>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? "Laden..." : "Filter toepassen"}
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <PanelHeader title="Leadtabel" meta={response ? `${response.total} leads gevonden` : undefined} />
        {error ? <ErrorNote text={error} /> : null}
        {!error && loading ? <StateNote text="Leads laden..." /> : null}
        {!error && !loading && leads.length === 0 ? <StateNote text="Geen leads gevonden." /> : null}
        {leads.length > 0 ? <LeadTable leads={leads} /> : null}
        {response ? (
          <Pagination
            page={response.page}
            totalPages={totalPages}
            onPage={(page) => {
              const next = { ...filters, page };
              setFilters(next);
              load(next);
            }}
          />
        ) : null}
      </section>

      <section className="admin-panel">
        <h2>Pipeline</h2>
        <PipelineView leads={leads} />
      </section>
    </div>
  );
}

function LeadDetailPage({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<AdminLeadDetail | null>(null);
  const [status, setStatus] = useState<LeadStatus>("New");
  const [statusNote, setStatusNote] = useState("");
  const [note, setNote] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [appointmentStart, setAppointmentStart] = useState("");
  const [appointmentEnd, setAppointmentEnd] = useState("");
  const [appointmentType, setAppointmentType] = useState("Telefonisch advies");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminLead(leadId);
      setLead(response);
      setStatus(response.status);
      setFollowUpAt(toDateTimeLocal(response.nextFollowUpAt));
      setFollowUpNote(response.followUpNote ?? "");
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const save = async (action: () => Promise<AdminLeadDetail>) => {
    setSaving(true);
    setError("");
    try {
      const response = await action();
      setLead(response);
      setStatus(response.status);
      setFollowUpAt(toDateTimeLocal(response.nextFollowUpAt));
      setFollowUpNote(response.followUpNote ?? "");
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StateNote text="Lead laden..." />;
  if (error && !lead) return <ErrorNote text={error} />;
  if (!lead) return <StateNote text="Lead niet gevonden." />;

  const activity = buildActivity(lead);

  return (
    <div className="admin-page-stack">
      <a className="back-link" href="/admin/leads" onClick={(event) => adminLinkClick(event, "/admin/leads")}>
        Terug naar leads
      </a>
      {error ? <ErrorNote text={error} /> : null}
      <section className="admin-detail-hero">
        <div>
          <StatusBadge status={lead.status} />
          <h2>{lead.fullName}</h2>
          <p>{productCategoryLabels[lead.productInterest]} · aangemaakt {formatDate(lead.createdAt)}</p>
        </div>
        <div className="admin-quick-actions">
          {lead.phone ? <a className="button button-secondary" href={`tel:${lead.phone}`}>Bel</a> : null}
          <a className="button button-secondary" href={`mailto:${lead.email}`}>Mail</a>
          <button className="button button-primary" type="button" onClick={() => document.getElementById("lead-note")?.focus()}>
            Notitie
          </button>
        </div>
      </section>

      <div className="admin-detail-grid">
        <section className="admin-panel">
          <h2>Contact</h2>
          <dl className="summary-list">
            <SummaryRow label="Naam" value={lead.fullName} />
            <SummaryRow label="Telefoon" value={lead.phone ?? "-"} />
            <SummaryRow label="E-mail" value={lead.email} />
            <SummaryRow label="Postcode" value={lead.property.postcode} />
            <SummaryRow label="Huisnummer" value={lead.property.houseNumber} />
            <SummaryRow label="Laatste contact" value={formatOptionalDate(lead.lastContactAt)} />
            <SummaryRow label="Volgende opvolging" value={formatOptionalDate(lead.nextFollowUpAt)} />
          </dl>
        </section>

        <section className="admin-panel">
          <h2>Woningprofiel</h2>
          <dl className="summary-list">
            <SummaryRow label="Woningtype" value={lead.property.homeType} />
            <SummaryRow label="Bouwjaar" value={lead.property.buildYearRange} />
            <SummaryRow label="Zonnepanelen" value={lead.property.solarPanels} />
            <SummaryRow label="Aantal panelen" value={formatOptionalNumber(lead.energyProfile.solarPanelCount)} />
            <SummaryRow label="Stroomverbruik" value={`${lead.energyProfile.electricityUsageKwh.toLocaleString("nl-NL")} kWh`} />
            <SummaryRow label="Gasverbruik" value={`${lead.energyProfile.gasUsageM3.toLocaleString("nl-NL")} m3`} />
            <SummaryRow label="Teruglevering" value={lead.energyProfile.feedInKwh == null ? "-" : `${lead.energyProfile.feedInKwh.toLocaleString("nl-NL")} kWh`} />
            <SummaryRow label="Contracttype" value={lead.energyProfile.energyContractType ?? "-"} />
          </dl>
        </section>

        <section className="admin-panel">
          <h2>Interesse</h2>
          <dl className="summary-list">
            <SummaryRow label="Product" value={productCategoryLabels[lead.productInterest]} />
            <SummaryRow label="Hoofddoel" value={lead.primaryGoal} />
            <SummaryRow label="Starttermijn" value={lead.desiredStartTerm} />
            <SummaryRow label="Interesses" value={lead.interests.join(", ") || "-"} />
          </dl>
        </section>

        <section className="admin-panel">
          <h2>Acquisitiebron</h2>
          <dl className="summary-list">
            <SummaryRow label="Source" value={lead.source.utmSource ?? "-"} />
            <SummaryRow label="Medium" value={lead.source.utmMedium ?? "-"} />
            <SummaryRow label="Campaign" value={lead.source.utmCampaign ?? "-"} />
            <SummaryRow label="Term" value={lead.source.utmTerm ?? "-"} />
            <SummaryRow label="Content" value={lead.source.utmContent ?? "-"} />
            <SummaryRow label="GCLID" value={lead.source.gclid ?? "-"} />
            <SummaryRow label="Landing page" value={lead.source.landingPage} />
            <SummaryRow label="Referrer" value={lead.source.referrer ?? "-"} />
          </dl>
        </section>

        <section className="admin-panel">
          <h2>Status wijzigen</h2>
          <div className="field-stack">
            <label>
              Nieuwe status
              <select value={status} onChange={(event) => setStatus(event.target.value as LeadStatus)}>
                {leadStatuses.map((item) => (
                  <option key={item} value={item}>{leadStatusLabels[item]}</option>
                ))}
              </select>
            </label>
            <label>
              Interne statusnotitie
              <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} rows={3} />
            </label>
            <button
              className="button button-primary"
              type="button"
              onClick={() => save(() => updateAdminLeadStatus(leadId, status, statusNote)).then(() => setStatusNote(""))}
              disabled={saving || status === lead.status}
            >
              Status opslaan
            </button>
          </div>
        </section>

        <section className="admin-panel">
          <h2>Notitie toevoegen</h2>
          <div className="field-stack">
            <label>
              Notitie
              <textarea id="lead-note" value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
            </label>
            <button
              className="button button-primary"
              type="button"
              onClick={() => save(() => addAdminLeadNote(leadId, note)).then(() => setNote(""))}
              disabled={saving || !note.trim()}
            >
              Notitie opslaan
            </button>
          </div>
        </section>

        <section className="admin-panel">
          <h2>Follow-up plannen</h2>
          <div className="field-stack">
            <label>
              Datum en tijd
              <input type="datetime-local" value={followUpAt} onChange={(event) => setFollowUpAt(event.target.value)} />
            </label>
            <label>
              Reden
              <input value={followUpNote} onChange={(event) => setFollowUpNote(event.target.value)} placeholder="Bijvoorbeeld: offerte nabellen" />
            </label>
            <div className="button-row compact">
              <button
                className="button button-primary"
                type="button"
                onClick={() => save(() => updateAdminLeadFollowUp(leadId, fromDateTimeLocal(followUpAt), followUpNote))}
                disabled={saving || !followUpAt}
              >
                Follow-up opslaan
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => save(() => updateAdminLeadFollowUp(leadId, null, "")).then(() => setFollowUpAt(""))}
                disabled={saving || !lead.nextFollowUpAt}
              >
                Wissen
              </button>
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <h2>Afspraak plannen</h2>
          <div className="field-stack">
            <label>
              Start
              <input type="datetime-local" value={appointmentStart} onChange={(event) => setAppointmentStart(event.target.value)} />
            </label>
            <label>
              Einde optioneel
              <input type="datetime-local" value={appointmentEnd} onChange={(event) => setAppointmentEnd(event.target.value)} />
            </label>
            <label>
              Type
              <input value={appointmentType} onChange={(event) => setAppointmentType(event.target.value)} />
            </label>
            <label>
              Notitie
              <textarea value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} rows={3} />
            </label>
            <button
              className="button button-primary"
              type="button"
              onClick={() =>
                save(() =>
                  addAdminLeadAppointment(
                    leadId,
                    fromDateTimeLocal(appointmentStart) ?? "",
                    fromDateTimeLocal(appointmentEnd) ?? "",
                    appointmentType,
                    appointmentNotes
                  )
                ).then(() => {
                  setAppointmentStart("");
                  setAppointmentEnd("");
                  setAppointmentNotes("");
                })
              }
              disabled={saving || !appointmentStart}
            >
              Afspraak opslaan
            </button>
          </div>
        </section>

        <section className="admin-panel">
          <h2>Consent</h2>
          <dl className="summary-list">
            <SummaryRow label="Advies-consent" value={lead.consentRecords[0]?.adviceConsent ? "Ja" : "Nee"} />
            <SummaryRow label="Matching-consent" value={lead.consentRecords[0]?.matchingConsent ? "Ja" : "Nee"} />
            <SummaryRow label="Consentversie" value={lead.consentRecords[0]?.consentVersion ?? "-"} />
            <SummaryRow label="Bron URL" value={lead.consentRecords[0]?.sourceUrl ?? "-"} />
          </dl>
        </section>

        <section className="admin-panel">
          <h2>Afspraken</h2>
          <AppointmentList appointments={lead.appointments} />
        </section>

        <section className="admin-panel span-2">
          <h2>Activity timeline</h2>
          <Timeline items={activity} />
        </section>
      </div>
    </div>
  );
}

function CalendarPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 90);
    getAdminAppointments(from.toISOString(), to.toISOString())
      .then(setAppointments)
      .catch((caught) => setError(readError(caught)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = groupAppointmentsByDate(appointments);

  return (
    <section className="admin-panel">
      <PanelHeader title="Interne afspraken" meta="Komende 90 dagen" />
      {loading ? <StateNote text="Afspraken laden..." /> : null}
      {error ? <ErrorNote text={error} /> : null}
      {!loading && !error && appointments.length === 0 ? <StateNote text="Geen afspraken gepland." /> : null}
      <div className="appointment-day-list">
        {grouped.map((group) => (
          <article key={group.date}>
            <h2>{formatDateOnly(group.date)}</h2>
            <AppointmentList appointments={group.items} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportingPage() {
  const [report, setReport] = useState<AdminReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminReport()
      .then(setReport)
      .catch((caught) => setError(readError(caught)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StateNote text="Rapportage laden..." />;
  if (error) return <ErrorNote text={error} />;
  if (!report) return <StateNote text="Geen rapportage beschikbaar." />;

  return (
    <div className="admin-page-grid">
      <section className="admin-panel span-2">
        <h2>Leads per dag</h2>
        <BarList items={report.leadsPerDay} />
      </section>
      <section className="admin-panel">
        <h2>Leads per product</h2>
        <BarList items={report.leadsPerProduct} labelFormatter={formatProductLabel} />
      </section>
      <section className="admin-panel">
        <h2>Leads per bron</h2>
        <BarList items={report.leadsPerSource} />
      </section>
      <section className="admin-panel">
        <h2>Campagnes</h2>
        <BarList items={report.leadsPerCampaign} />
      </section>
      <section className="admin-panel">
        <h2>Conversie</h2>
        <div className="report-kpis">
          <MetricInline label="Afspraken" value={report.appointments.toString()} />
          <MetricInline label="Offertes" value={report.quotes.toString()} />
          <MetricInline label="Gewonnen" value={report.won.toString()} />
          <MetricInline label="Verloren" value={report.lost.toString()} />
          <MetricInline label="Conversie" value={formatPercent(report.conversionRate ?? undefined)} />
        </div>
      </section>
    </div>
  );
}

function SettingsPage({ username }: { username: string }) {
  return (
    <section className="admin-panel">
      <h2>Beveiliging en configuratie</h2>
      <dl className="summary-list">
        <SummaryRow label="Ingelogde gebruiker" value={username} />
        <SummaryRow label="Authenticatie" value="Server-side cookie met AdminOnly authorization policy" />
        <SummaryRow label="Admin secret" value="Configureer via environment variables/secrets, niet in de React bundle" />
        <SummaryRow label="Productie wachtwoord" value="Gebruik Admin:PasswordHash met PBKDF2-SHA256" />
        <SummaryRow label="Login rate limiting" value="5 pogingen per 5 minuten per IP-adres" />
      </dl>
      <p className="state-note">
        Privacy- en juridische teksten blijven reviewplichtig voordat dit CRM productiegegevens verwerkt.
      </p>
    </section>
  );
}

function MetricsGrid({ metrics }: { metrics: AdminDashboardResponse["metrics"] }) {
  const items = [
    { label: "Nieuwe leads vandaag", value: metrics.leadsToday.toString() },
    { label: "Nieuwe leads deze week", value: metrics.leadsThisWeek.toString() },
    { label: "Actieve leads", value: metrics.activeLeads.toString() },
    { label: "Nog te bellen", value: metrics.toCall.toString() },
    { label: "Afspraken gepland", value: metrics.appointments.toString() },
    { label: "Offertes open", value: metrics.quotes.toString() },
    { label: "Gewonnen", value: metrics.won.toString() },
    { label: "Verloren", value: metrics.lost.toString() },
  ];

  return (
    <section className="admin-metrics span-2" aria-label="Dashboard kerncijfers">
      {items.map((item) => (
        <article key={item.label} className="metric-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

function LeadMiniTable({ leads, emptyText = "Geen leads gevonden." }: { leads: AdminLeadListItem[]; emptyText?: string }) {
  if (leads.length === 0) return <StateNote text={emptyText} />;

  return (
    <div className="admin-table-wrap compact-table">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Naam</th>
            <th>Product</th>
            <th>Bron</th>
            <th>Status</th>
            <th>Datum</th>
            <th>Actie</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <a href={`/admin/leads/${lead.id}`} onClick={(event) => adminLinkClick(event, `/admin/leads/${lead.id}`)}>{lead.fullName}</a>
                <span>{lead.postcode}</span>
              </td>
              <td>{productCategoryLabels[lead.productInterest]}</td>
              <td>{sourceLabel(lead)}</td>
              <td><StatusBadge status={lead.status} /></td>
              <td>{formatDate(lead.createdAt)}</td>
              <td>
                <a href={`/admin/leads/${lead.id}`} onClick={(event) => adminLinkClick(event, `/admin/leads/${lead.id}`)}>Open</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadTable({ leads }: { leads: AdminLeadListItem[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Naam</th>
            <th>Telefoon</th>
            <th>E-mail</th>
            <th>Postcode</th>
            <th>Product</th>
            <th>Bron</th>
            <th>Campagne</th>
            <th>Status</th>
            <th>Aangemaakt</th>
            <th>Laatste contact</th>
            <th>Volgende opvolging</th>
            <th>Actie</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td><a href={`/admin/leads/${lead.id}`} onClick={(event) => adminLinkClick(event, `/admin/leads/${lead.id}`)}>{lead.fullName}</a></td>
              <td>{lead.phone ?? "-"}</td>
              <td>{lead.email}</td>
              <td>{lead.postcode}</td>
              <td>{productCategoryLabels[lead.productInterest]}</td>
              <td>{[lead.utmSource, lead.utmMedium].filter(Boolean).join(" / ") || "-"}</td>
              <td>{lead.utmCampaign ?? "-"}</td>
              <td><StatusBadge status={lead.status} /></td>
              <td>{formatDate(lead.createdAt)}</td>
              <td>{formatOptionalDate(lead.lastContactAt)}</td>
              <td>{formatOptionalDate(lead.nextFollowUpAt)}</td>
              <td><a href={`/admin/leads/${lead.id}`} onClick={(event) => adminLinkClick(event, `/admin/leads/${lead.id}`)}>Open</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PipelineView({ leads }: { leads: AdminLeadListItem[] }) {
  const columns: Array<{ label: string; statuses: LeadStatus[] }> = [
    { label: "Nieuw / te bellen", statuses: ["New"] },
    { label: "Contact gehad", statuses: ["Contacted"] },
    { label: "Afspraak", statuses: ["AppointmentScheduled"] },
    { label: "Offerte", statuses: ["QuoteCreated"] },
    { label: "Gewonnen", statuses: ["Won"] },
    { label: "Verloren", statuses: ["Lost"] },
  ];

  return (
    <div className="pipeline-board">
      {columns.map((column) => {
        const columnLeads = leads.filter((lead) => column.statuses.includes(lead.status));
        return (
          <article key={column.label}>
            <h3>{column.label}</h3>
            {columnLeads.length === 0 ? <p className="state-note">Geen leads</p> : null}
            {columnLeads.map((lead) => (
              <a key={lead.id} className="pipeline-card" href={`/admin/leads/${lead.id}`} onClick={(event) => adminLinkClick(event, `/admin/leads/${lead.id}`)}>
                <strong>{lead.fullName}</strong>
                <span>{productCategoryLabels[lead.productInterest]} · {lead.postcode}</span>
              </a>
            ))}
          </article>
        );
      })}
    </div>
  );
}

function AppointmentList({ appointments }: { appointments: AdminAppointment[] }) {
  if (appointments.length === 0) return <StateNote text="Geen afspraken." />;

  return (
    <div className="appointment-list">
      {appointments.map((appointment) => (
        <article key={appointment.id}>
          <div>
            <strong>{formatTime(appointment.startAt)} · {appointment.leadName}</strong>
            <span>{productCategoryLabels[appointment.productInterest]} · {appointment.type} · {appointment.status}</span>
            {appointment.notes ? <p>{appointment.notes}</p> : null}
          </div>
          <a href={`/admin/leads/${appointment.leadId}`} onClick={(event) => adminLinkClick(event, `/admin/leads/${appointment.leadId}`)}>Lead openen</a>
        </article>
      ))}
    </div>
  );
}

function BarList({ items, labelFormatter }: { items: DashboardBucket[]; labelFormatter?: (label: string) => string }) {
  if (items.length === 0) return <StateNote text="Geen data beschikbaar." />;
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="bar-list">
      {items.map((item) => (
        <div key={item.label}>
          <span>{labelFormatter ? labelFormatter(item.label) : item.label}</span>
          <div><i style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }} /></div>
          <strong>{item.count}</strong>
        </div>
      ))}
    </div>
  );
}

function Timeline({ items }: { items: Array<{ id: string; title: string; meta: string; text?: string }> }) {
  if (items.length === 0) return <StateNote text="Nog geen activiteit." />;

  return (
    <ol className="timeline-list">
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.title}</strong>
          <span>{item.meta}</span>
          {item.text ? <p>{item.text}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function PanelHeader({ title, actionHref, actionLabel, meta }: { title: string; actionHref?: string; actionLabel?: string; meta?: string }) {
  return (
    <div className="admin-panel-head">
      <div>
        <h2>{title}</h2>
        {meta ? <span>{meta}</span> : null}
      </div>
      {actionHref && actionLabel ? (
        <a href={actionHref} onClick={(event) => adminLinkClick(event, actionHref)}>{actionLabel}</a>
      ) : null}
    </div>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return (
    <div className="admin-pagination">
      <button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Vorige
      </button>
      <span>Pagina {page} van {totalPages}</span>
      <button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Volgende
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{leadStatusLabels[status]}</span>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StateNote({ text }: { text: string }) {
  return <p className="state-note">{text}</p>;
}

function ErrorNote({ text }: { text: string }) {
  return <p className="form-error" role="alert">{text}</p>;
}

function MetricInline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildActivity(lead: AdminLeadDetail) {
  return [
    {
      id: `created-${lead.id}`,
      title: "Lead aangemaakt",
      meta: formatDate(lead.createdAt),
      text: sourceLabel(lead),
      date: lead.createdAt,
    },
    ...lead.statusHistory.map((item) => ({
      id: `status-${item.createdAt}-${item.newStatus}`,
      title: `Status: ${leadStatusLabels[item.newStatus]}`,
      meta: `${item.actor} · ${formatDate(item.createdAt)}`,
      text: item.note,
      date: item.createdAt,
    })),
    ...lead.notes.map((item) => ({
      id: `note-${item.id}`,
      title: "Notitie toegevoegd",
      meta: `${item.actor} · ${formatDate(item.createdAt)}`,
      text: item.text,
      date: item.createdAt,
    })),
    ...lead.appointments.map((item) => ({
      id: `appointment-${item.id}`,
      title: "Afspraak gepland",
      meta: formatDate(item.startAt),
      text: item.notes ?? item.type,
      date: item.startAt,
    })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

function filtersFromSearch(): AdminLeadFilters {
  const params = new URLSearchParams(window.location.search);
  return {
    ...defaultFilters,
    query: params.get("query") ?? "",
    status: params.get("status") ?? "",
    product: params.get("product") ?? "",
    source: params.get("source") ?? "",
    campaign: params.get("campaign") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    sort: parseSort(params.get("sort")),
  };
}

function parseSort(value: string | null): LeadSortOption {
  return value === "Oldest" || value === "LastContact" || value === "NextFollowUp" ? value : "Newest";
}

function groupAppointmentsByDate(appointments: AdminAppointment[]) {
  const groups = new Map<string, AdminAppointment[]>();
  appointments.forEach((appointment) => {
    const key = new Date(appointment.startAt).toISOString().slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), appointment]);
  });

  return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
}

function sourceLabel(lead: Pick<AdminLeadListItem, "utmSource" | "utmMedium" | "utmCampaign">): string {
  return [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ") || "Onbekend";
}

function formatStatusLabel(status: string): string {
  return leadStatuses.includes(status as LeadStatus) ? leadStatusLabels[status as LeadStatus] : status;
}

function formatProductLabel(product: string): string {
  return productCategories.includes(product as typeof productCategories[number])
    ? productCategoryLabels[product as typeof productCategories[number]]
    : product;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "full" }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("nl-NL", { timeStyle: "short" }).format(new Date(value));
}

function formatOptionalDate(value?: string | null): string {
  return value ? formatDate(value) : "-";
}

function formatOptionalNumber(value: number | null | undefined): string {
  return value == null ? "-" : value.toLocaleString("nl-NL");
}

function formatPercent(value: number | undefined): string {
  return value === undefined ? "-" : `${Math.round(value * 100)}%`;
}

function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function readError(caught: unknown): string {
  if (caught instanceof ApiError) {
    return caught.response.message;
  }

  return "De admin-aanvraag kon niet worden verwerkt.";
}

function adminLinkClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  navigateAdmin(href);
}

function navigateAdmin(href: string) {
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
