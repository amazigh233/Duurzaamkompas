import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  addAdminLeadNote,
  getAdminLead,
  getAdminLeadMetrics,
  getAdminLeads,
  getAdminSession,
  loginAdmin,
  logoutAdmin,
  updateAdminLeadStatus,
  ApiError,
} from "../../api/client";
import { leadStatusLabels, leadStatuses, productCategories, productCategoryLabels } from "../../data";
import type { AdminLeadDetail, AdminLeadFilters, AdminLeadListItem, AdminLeadMetrics, AdminSession, LeadStatus } from "../../types";

export function AdminDashboard({ leadId }: { leadId?: string }) {
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
  };

  return (
    <section className="section admin-section">
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">Admin</span>
          <h1>Leadbeheer</h1>
          <p>Beheer Woningcheck-aanvragen, statussen en interne notities. Admin-toegang loopt via een server-side sessie.</p>
        </div>
        {sessionLoading ? <p className="state-note">Admin-sessie controleren...</p> : null}
        {!sessionLoading && session?.authenticated ? (
          <>
            <AdminSessionPanel username={session.username ?? "admin"} onLogout={logout} />
            {leadId ? <AdminLeadDetailView leadId={leadId} /> : <AdminLeadList />}
          </>
        ) : null}
        {!sessionLoading && !session?.authenticated ? <AdminLoginPanel onLogin={setSession} /> : null}
      </div>
    </section>
  );
}

function AdminSessionPanel({ username, onLogout }: { username: string; onLogout: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);

  const logout = async () => {
    setSaving(true);
    try {
      await onLogout();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-auth-panel">
      <p>Ingelogd als <strong>{username}</strong>. De sessie wordt server-side gevalideerd via een HttpOnly cookie.</p>
      <button className="button button-secondary" type="button" onClick={logout} disabled={saving}>
        {saving ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Uitloggen...
          </>
        ) : (
          "Uitloggen"
        )}
      </button>
    </div>
  );
}

function AdminLoginPanel({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      onLogin(await loginAdmin(username, password));
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-auth-panel" onSubmit={submit}>
      <label>
        Gebruikersnaam
        <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
      </label>
      <label>
        Wachtwoord
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={saving || !username.trim() || !password}>
        {saving ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Inloggen...
          </>
        ) : (
          "Inloggen"
        )}
      </button>
      <p>Gebruik de ingestelde admingegevens om in te loggen.</p>
    </form>
  );
}

function AdminLeadList() {
  const [filters, setFilters] = useState<AdminLeadFilters>({
    query: "",
    status: "",
    product: "",
    source: "",
    from: "",
    to: "",
  });
  const [leads, setLeads] = useState<AdminLeadListItem[]>([]);
  const [metrics, setMetrics] = useState<AdminLeadMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const patchFilters = (partial: Partial<AdminLeadFilters>) => {
    setFilters((current) => ({ ...current, ...partial }));
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [leadResponse, metricResponse] = await Promise.all([
        getAdminLeads(filters),
        getAdminLeadMetrics(filters),
      ]);
      setLeads(leadResponse);
      setMetrics(metricResponse);
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-card">
      <div className="admin-toolbar">
        <label>
          Zoeken
          <input value={filters.query} onChange={(event) => patchFilters({ query: event.target.value })} placeholder="Naam, telefoon, e-mail of postcode" />
        </label>
        <label>
          Status
          <select value={filters.status} onChange={(event) => patchFilters({ status: event.target.value })}>
            <option value="">Alle statussen</option>
            {leadStatuses.map((item) => (
              <option key={item} value={item}>
                {leadStatusLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Product
          <select value={filters.product} onChange={(event) => patchFilters({ product: event.target.value })}>
            <option value="">Alle producten</option>
            {productCategories.map((item) => (
              <option key={item} value={item}>
                {productCategoryLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Campagnebron
          <input value={filters.source} onChange={(event) => patchFilters({ source: event.target.value })} placeholder="utm source/campaign" />
        </label>
        <label>
          Vanaf
          <input type="date" value={filters.from} onChange={(event) => patchFilters({ from: event.target.value })} />
        </label>
        <label>
          Tot en met
          <input type="date" value={filters.to} onChange={(event) => patchFilters({ to: event.target.value })} />
        </label>
        <button className="button button-primary" type="button" onClick={load} disabled={loading}>
          {loading ? "Laden..." : "Filter toepassen"}
        </button>
      </div>
      {metrics ? <MetricsGrid metrics={metrics} /> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {!error && loading ? <p className="state-note">Leads laden...</p> : null}
      {!error && !loading && leads.length === 0 ? <p className="state-note">Geen leads gevonden.</p> : null}
      {leads.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Status</th>
                <th>Product</th>
                <th>Postcode</th>
                <th>Bron</th>
                <th>Doel</th>
                <th>Termijn</th>
                <th>Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <a href={`#/admin/leads/${lead.id}`}>{lead.fullName}</a>
                    <span>{lead.email}</span>
                    {lead.phone ? <span>{lead.phone}</span> : null}
                  </td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td>{productCategoryLabels[lead.productInterest]}</td>
                  <td>{lead.postcode}</td>
                  <td>{[lead.utmSource, lead.utmCampaign].filter(Boolean).join(" / ") || "-"}</td>
                  <td>{lead.primaryGoal}</td>
                  <td>{lead.desiredStartTerm}</td>
                  <td>{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function AdminLeadDetailView({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<AdminLeadDetail | null>(null);
  const [status, setStatus] = useState<LeadStatus>("New");
  const [statusNote, setStatusNote] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminLead(leadId);
      setLead(response);
      setStatus(response.status);
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

  const saveStatus = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await updateAdminLeadStatus(leadId, status, statusNote);
      setLead(response);
      setStatusNote("");
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await addAdminLeadNote(leadId, note);
      setLead(response);
      setNote("");
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="state-note">Lead laden...</p>;
  }

  return (
    <div className="admin-detail">
      <a className="back-link" href="#/admin">Terug naar leadlijst</a>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {lead ? (
        <>
          <div className="admin-detail-head">
            <div>
              <StatusBadge status={lead.status} />
              <h2>{lead.fullName}</h2>
              <p>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p>
            </div>
            <span>{formatDate(lead.createdAt)}</span>
          </div>

          <div className="admin-detail-grid">
            <section className="admin-card">
              <h3>Woningprofiel</h3>
              <dl className="summary-list">
                <SummaryRow label="Woning" value={`${lead.property.homeType} - ${lead.property.buildYearRange}`} />
                <SummaryRow label="Productinteresse" value={productCategoryLabels[lead.productInterest]} />
                <SummaryRow label="Zonnepanelen" value={lead.property.solarPanels} />
                <SummaryRow label="Aantal panelen" value={formatOptionalNumber(lead.energyProfile.solarPanelCount)} />
                <SummaryRow label="Adres" value={`${lead.property.postcode} ${lead.property.houseNumber}`} />
                <SummaryRow label="Stroom" value={`${lead.energyProfile.electricityUsageKwh.toLocaleString("nl-NL")} kWh`} />
                <SummaryRow label="Teruglevering" value={lead.energyProfile.feedInKwh == null ? "-" : `${lead.energyProfile.feedInKwh.toLocaleString("nl-NL")} kWh`} />
                <SummaryRow label="Contract" value={lead.energyProfile.energyContractType ?? "-"} />
                <SummaryRow label="Gas" value={`${lead.energyProfile.gasUsageM3.toLocaleString("nl-NL")} m3`} />
                <SummaryRow label="Doel" value={lead.primaryGoal} />
                <SummaryRow label="Termijn" value={lead.desiredStartTerm} />
                <SummaryRow label="Interesses" value={lead.interests.join(", ")} />
              </dl>
            </section>

            <section className="admin-card">
              <h3>Status aanpassen</h3>
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
                  Interne statusnotitie optioneel
                  <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} rows={3} />
                </label>
                <button className="button button-primary" type="button" onClick={saveStatus} disabled={saving || status === lead.status}>
                  Status opslaan
                </button>
              </div>
            </section>

            <section className="admin-card">
              <h3>Consent en bron</h3>
              <dl className="summary-list">
                <SummaryRow label="Advies-consent" value={lead.consentRecords[0]?.adviceConsent ? "Ja" : "Nee"} />
                <SummaryRow label="Matching-consent" value={lead.consentRecords[0]?.matchingConsent ? "Ja" : "Nee"} />
                <SummaryRow label="Consentversie" value={lead.consentRecords[0]?.consentVersion ?? "-"} />
                <SummaryRow label="Bron URL" value={lead.consentRecords[0]?.sourceUrl ?? "-"} />
                <SummaryRow label="UTM source" value={lead.source.utmSource ?? "-"} />
                <SummaryRow label="UTM medium" value={lead.source.utmMedium ?? "-"} />
                <SummaryRow label="UTM campaign" value={lead.source.utmCampaign ?? "-"} />
                <SummaryRow label="UTM term" value={lead.source.utmTerm ?? "-"} />
                <SummaryRow label="UTM content" value={lead.source.utmContent ?? "-"} />
                <SummaryRow label="GCLID" value={lead.source.gclid ?? "-"} />
                <SummaryRow label="Referrer" value={lead.source.referrer ?? "-"} />
                <SummaryRow label="Landing page" value={lead.source.landingPage} />
              </dl>
            </section>

            <section className="admin-card">
              <h3>Notitie toevoegen</h3>
              <div className="field-stack">
                <label>
                  Notitie
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
                </label>
                <button className="button button-primary" type="button" onClick={saveNote} disabled={saving || !note.trim()}>
                  Notitie opslaan
                </button>
              </div>
            </section>

            <section className="admin-card">
              <h3>Statusgeschiedenis</h3>
              <Timeline items={lead.statusHistory.map((item) => ({
                id: `${item.createdAt}-${item.newStatus}`,
                title: leadStatusLabels[item.newStatus],
                meta: `${item.actor} · ${formatDate(item.createdAt)}`,
                text: item.note,
              }))} />
            </section>

            <section className="admin-card">
              <h3>Notities</h3>
              <Timeline items={lead.notes.map((item) => ({
                id: item.id,
                title: item.actor,
                meta: formatDate(item.createdAt),
                text: item.text,
              }))} emptyText="Nog geen notities." />
            </section>
          </div>
        </>
      ) : null}
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

function MetricsGrid({ metrics }: { metrics: AdminLeadMetrics }) {
  const items = [
    { label: "Nieuwe leads", value: metrics.newLeads.toString() },
    { label: "Leads vandaag", value: metrics.leadsToday.toString() },
    { label: "Contact rate", value: formatPercent(metrics.contactRate) },
    { label: "Afspraken", value: metrics.appointments.toString() },
    { label: "Offertes", value: metrics.quotes.toString() },
    { label: "Gewonnen", value: metrics.won.toString() },
    { label: "Conversie naar gewonnen", value: formatPercent(metrics.wonConversionRate) },
  ];

  return (
    <div className="metrics-grid" aria-label="Dashboard kerncijfers">
      {items.map((item) => (
        <article key={item.label} className="metric-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}

function Timeline({
  items,
  emptyText = "Geen items.",
}: {
  items: Array<{ id: string; title: string; meta: string; text?: string }>;
  emptyText?: string;
}) {
  if (items.length === 0) return <p className="state-note">{emptyText}</p>;

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

function readError(caught: unknown): string {
  if (caught instanceof ApiError) {
    return caught.response.message;
  }

  return "De admin-aanvraag kon niet worden verwerkt.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOptionalNumber(value: number | null | undefined): string {
  return value == null ? "-" : value.toLocaleString("nl-NL");
}

function formatPercent(value: number | undefined): string {
  return value === undefined ? "-" : `${Math.round(value * 100)}%`;
}
