import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, submitWoningcheckLead } from "../api/client";
import {
  consentText,
  consentVersion,
  energiecontractTypes,
  starttermijnen,
  thuisbatterijDoelen,
  zonnepanelenOpties,
} from "../data";
import {
  getTrackingData,
  trackLeadSubmittedOnce,
  trackWoningcheckStartedOnce,
  trackWoningcheckStepCompletedOnce,
} from "../lib/tracking";
import { getSubmissionId, markSubmissionCompleted, readCompletedLead, resetSubmission } from "../lib/submission";
import type { CreateLeadResponse, WoningcheckAnswers } from "../types";

const STORAGE_KEY = "dwk_thuisbatterij_check_draft";
const submissionStorageKey = `${STORAGE_KEY}_submission`;
const lastInputStep = 9;

const emptyBatteryAnswers: WoningcheckAnswers = {
  productInterest: "Thuisbatterij",
  interesses: ["Zelf opgewekte stroom opslaan"],
  gasverbruik: 0,
  consent: {
    adviceConsent: false,
    matchingConsent: false,
  },
};

function readDraft(): { step: number; answers: WoningcheckAnswers } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { step: 0, answers: emptyBatteryAnswers };
    const parsed = JSON.parse(raw) as Partial<{ step: number; answers: WoningcheckAnswers }>;
    return {
      step: typeof parsed.step === "number" ? Math.min(parsed.step, lastInputStep) : 0,
      answers: {
        ...emptyBatteryAnswers,
        ...parsed.answers,
        productInterest: "Thuisbatterij",
        interesses: ["Zelf opgewekte stroom opslaan"],
        consent: { ...emptyBatteryAnswers.consent, ...parsed.answers?.consent },
      },
    };
  } catch {
    return { step: 0, answers: emptyBatteryAnswers };
  }
}

export function ThuisbatterijCheck() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WoningcheckAnswers>(emptyBatteryAnswers);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdLead, setCreatedLead] = useState<CreateLeadResponse | null>(null);
  const submittingRef = useRef(false);

  const preparedAnswers = useMemo(() => prepareBatteryAnswers(answers), [answers]);
  const progress = Math.min(100, Math.round(((Math.min(step, lastInputStep) + 1) / (lastInputStep + 1)) * 100));

  useEffect(() => {
    getTrackingData();
    const completedLead = readCompletedLead(submissionStorageKey);
    if (completedLead) {
      setCreatedLead(completedLead);
      return;
    }

    const draft = readDraft();
    setStep(draft.step);
    setAnswers(draft.answers);
  }, []);

  useEffect(() => {
    if (!createdLead) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers }));
    }
  }, [answers, createdLead, step]);

  const patch = (partial: Partial<WoningcheckAnswers>) => {
    setAnswers((current) => ({ ...current, ...partial }));
    setError("");
    setFieldErrors({});
  };

  const setConsent = (key: keyof WoningcheckAnswers["consent"], value: boolean) => {
    setAnswers((current) => ({
      ...current,
      consent: { ...current.consent, [key]: value },
    }));
    setError("");
    setFieldErrors({});
  };

  const validationMessage = () => {
    if (step === 0 && !answers.zonnepanelen) return "Geef aan of u zonnepanelen heeft.";
    if (step === 1 && answers.zonnepanelen === "Ja" && preparedAnswers.aantalZonnepanelen === undefined) {
      return "Vul het aantal zonnepanelen in.";
    }
    if (step === 2 && preparedAnswers.stroomverbruik === undefined) return "Vul een indicatie van het stroomverbruik in.";
    if (step === 4 && !answers.energiecontract) return "Kies uw type energiecontract.";
    if (step === 5 && !answers.hoofddoel) return "Kies uw belangrijkste doel.";
    if (step === 6 && !answers.starttermijn) return "Kies wanneer u mogelijk wilt starten.";
    if (step === 7 && (!answers.postcode || !answers.huisnummer)) return "Vul postcode en huisnummer in.";
    if (step === 7 && !/^[1-9][0-9]{3}\s?[A-Z]{2}$/i.test(answers.postcode ?? "")) {
      return "Vul een geldige Nederlandse postcode in.";
    }
    if (step === 8 && !answers.naam) return "Vul uw naam in.";
    if (step === 8 && !answers.telefoon) return "Vul uw telefoonnummer in.";
    if (step === 8 && (answers.telefoon?.trim().length ?? 0) < 8) return "Vul een geldig telefoonnummer in.";
    if (step === 8 && !answers.email) return "Vul uw e-mailadres in.";
    if (step === 8 && !/^\S+@\S+\.\S+$/.test(answers.email ?? "")) return "Vul een geldig e-mailadres in.";
    if (step === 9 && !answers.consent.adviceConsent) return "Geef toestemming om uw thuisbatterijadvies te ontvangen.";
    return "";
  };

  const next = async () => {
    const message = validationMessage();
    if (message) {
      setError(message);
      return;
    }

    if (step === lastInputStep) {
      await submitLead();
      return;
    }

    const submissionId = getSubmissionId(submissionStorageKey);
    if (step === 0) trackWoningcheckStartedOnce(submissionId, "thuisbatterijcheck");
    trackWoningcheckStepCompletedOnce(submissionId, "thuisbatterijcheck", step + 1);
    setStep((current) => Math.min(current + 1, lastInputStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitLead = async () => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const submissionId = getSubmissionId(submissionStorageKey);
      const tracking = getTrackingData();
      const response = await submitWoningcheckLead(
        submissionId,
        preparedAnswers,
        tracking,
        consentText,
        consentVersion
      );
      setCreatedLead(response);
      markSubmissionCompleted(submissionStorageKey, response);
      trackLeadSubmittedOnce(submissionId, "thuisbatterijcheck", "Thuisbatterij", tracking);
      localStorage.removeItem(STORAGE_KEY);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.response.message);
        setFieldErrors(caught.response.errors ?? {});
      } else {
        setError("De aanvraag kon niet worden verzonden. Probeer het later opnieuw.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const restart = () => {
    setAnswers(emptyBatteryAnswers);
    setStep(0);
    setError("");
    setFieldErrors({});
    setCreatedLead(null);
    localStorage.removeItem(STORAGE_KEY);
    resetSubmission(submissionStorageKey);
  };

  return (
    <section className="check-page">
      <div className="check-wrap">
        {!createdLead ? (
          <>
            <div className="check-progress">
              <div>
                <span>Thuisbatterijcheck</span>
                <strong>Stap {step + 1} van {lastInputStep + 1}</strong>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="check-card">
              {step === 0 && (
                <ChoiceStep
                  title="Heeft u zonnepanelen?"
                  description="Een thuisbatterij wordt meestal beoordeeld in combinatie met eigen zonnestroom."
                  options={zonnepanelenOpties}
                  value={answers.zonnepanelen}
                  onPick={(value) => patch({ zonnepanelen: value, aantalZonnepanelen: value === "Ja" ? answers.aantalZonnepanelen : 0 })}
                />
              )}
              {step === 1 && (
                <NumberStep
                  title="Hoeveel zonnepanelen heeft u?"
                  description={answers.zonnepanelen === "Ja" ? "Een schatting is voldoende." : "Geen zonnepanelen of weet u het niet? Dan nemen we dit mee in de beoordeling."}
                  value={answers.zonnepanelen === "Ja" ? answers.aantalZonnepanelen : 0}
                  min={0}
                  max={80}
                  disabled={answers.zonnepanelen !== "Ja"}
                  onChange={(value) => patch({ aantalZonnepanelen: value })}
                />
              )}
              {step === 2 && (
                <RangeStep
                  title="Wat is ongeveer uw jaarlijkse stroomverbruik?"
                  description="Dit helpt om te beoordelen of opslag of slim verbruik logisch kan zijn."
                  value={preparedAnswers.stroomverbruik ?? 3000}
                  min={1000}
                  max={9000}
                  step={100}
                  unit="kWh"
                  onChange={(value) => patch({ stroomverbruik: value })}
                />
              )}
              {step === 3 && (
                <NumberStep
                  title="Hoeveel stroom levert u ongeveer terug?"
                  description="Als u dit niet weet, mag u dit veld leeg laten."
                  value={answers.terugleveringKwh}
                  min={0}
                  max={50000}
                  suffix="kWh per jaar"
                  onChange={(value) => patch({ terugleveringKwh: value })}
                />
              )}
              {step === 4 && (
                <ChoiceStep
                  title="Welk type energiecontract heeft u?"
                  description="Contractvorm kan invloed hebben op de manier waarop een batterij wordt beoordeeld."
                  options={energiecontractTypes}
                  value={answers.energiecontract}
                  onPick={(value) => patch({ energiecontract: value })}
                />
              )}
              {step === 5 && (
                <ChoiceStep
                  title="Wat is uw belangrijkste doel?"
                  description="Zo kunnen we de aanvraag beter kwalificeren zonder garanties te suggereren."
                  options={thuisbatterijDoelen}
                  value={answers.hoofddoel}
                  onPick={(value) => patch({ hoofddoel: value })}
                />
              )}
              {step === 6 && (
                <ChoiceStep
                  title="Wanneer wilt u mogelijk starten?"
                  description="U zit nergens aan vast; dit helpt alleen bij de opvolging."
                  options={starttermijnen}
                  value={answers.starttermijn}
                  onPick={(value) => patch({ starttermijn: value })}
                />
              )}
              {step === 7 && <AddressStep answers={answers} onChange={patch} />}
              {step === 8 && <ContactStep answers={answers} onChange={patch} />}
              {step === 9 && <ConsentStep answers={answers} onConsent={setConsent} />}
              {error ? (
                <div className="form-error" role="alert">
                  <p>{error}</p>
                  <FieldErrors errors={fieldErrors} />
                </div>
              ) : null}
              <div className="check-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0 || submitting}
                >
                  Terug
                </button>
                <button className="button button-primary" type="button" onClick={next} disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Aanvraag verzenden...
                    </>
                  ) : step === lastInputStep ? (
                    "Verstuur mijn aanvraag"
                  ) : (
                    "Volgende"
                  )}
                </button>
              </div>
            </div>
            <p className="privacy-note">
              We geven geen gegarandeerde besparing of terugverdientijd. De check is bedoeld voor een zorgvuldige eerste beoordeling.
            </p>
          </>
        ) : (
          <Result answers={preparedAnswers} createdLead={createdLead} onRestart={restart} />
        )}
      </div>
    </section>
  );
}

function ChoiceStep({
  title,
  description,
  options,
  value,
  onPick,
}: {
  title: string;
  description: string;
  options: string[];
  value?: string;
  onPick: (value: string) => void;
}) {
  return (
    <>
      <span className="section-kicker">Thuisbatterij</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="choice-grid">
        {options.map((option) => (
          <button key={option} className={option === value ? "choice-card is-selected" : "choice-card"} type="button" onClick={() => onPick(option)}>
            {option}
          </button>
        ))}
      </div>
    </>
  );
}

function RangeStep({
  title,
  description,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  title: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <span className="section-kicker">Thuisbatterij</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="range-box">
        <strong>
          {value.toLocaleString("nl-NL")} <span>{unit}</span>
        </strong>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <div className="range-labels">
          <span>{min.toLocaleString("nl-NL")}</span>
          <span>{max.toLocaleString("nl-NL")}+</span>
        </div>
      </div>
    </>
  );
}

function NumberStep({
  title,
  description,
  value,
  min,
  max,
  suffix,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  value?: number;
  min: number;
  max: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <>
      <span className="section-kicker">Thuisbatterij</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="field-stack">
        <label>
          Aantal
          <input
            type="number"
            min={min}
            max={max}
            value={value ?? ""}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
            placeholder={suffix ?? "Aantal"}
          />
        </label>
        {suffix ? <p className="cta-note">{suffix}</p> : null}
      </div>
    </>
  );
}

function AddressStep({ answers, onChange }: { answers: WoningcheckAnswers; onChange: (partial: Partial<WoningcheckAnswers>) => void }) {
  return (
    <>
      <span className="section-kicker">Adres</span>
      <h1>Waar staat de woning?</h1>
      <p>Met postcode en huisnummer kunnen we de aanvraag praktisch opvolgen.</p>
      <div className="field-grid">
        <label>
          Postcode
          <input value={answers.postcode ?? ""} onChange={(event) => onChange({ postcode: event.target.value.toUpperCase() })} placeholder="1234 AB" />
        </label>
        <label>
          Huisnummer
          <input value={answers.huisnummer ?? ""} onChange={(event) => onChange({ huisnummer: event.target.value })} placeholder="12" />
        </label>
      </div>
    </>
  );
}

function ContactStep({
  answers,
  onChange,
}: {
  answers: WoningcheckAnswers;
  onChange: (partial: Partial<WoningcheckAnswers>) => void;
}) {
  return (
    <>
      <span className="section-kicker">Contact</span>
      <h1>Wie kunnen we benaderen over deze aanvraag?</h1>
      <p>We gebruiken deze gegevens alleen om uw thuisbatterijcheck zorgvuldig op te volgen.</p>
      <div className="field-stack">
        <label>
          Naam
          <input value={answers.naam ?? ""} onChange={(event) => onChange({ naam: event.target.value })} placeholder="Voor- en achternaam" />
        </label>
        <label>
          Telefoon
          <input value={answers.telefoon ?? ""} onChange={(event) => onChange({ telefoon: event.target.value })} placeholder="06 12345678" />
        </label>
        <label>
          E-mailadres
          <input type="email" value={answers.email ?? ""} onChange={(event) => onChange({ email: event.target.value })} placeholder="naam@email.nl" />
        </label>
      </div>
    </>
  );
}

function ConsentStep({
  answers,
  onConsent,
}: {
  answers: WoningcheckAnswers;
  onConsent: (key: keyof WoningcheckAnswers["consent"], value: boolean) => void;
}) {
  return (
    <>
      <span className="section-kicker">Toestemming</span>
      <h1>Uw toestemming</h1>
      <p>We verwerken uw gegevens voor deze aanvraag. Matching met een specialist gebeurt alleen als u dat apart toestaat.</p>
      <div className="field-stack">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.consent.adviceConsent}
            onChange={(event) => onConsent("adviceConsent", event.target.checked)}
          />
          <span>Ja, ik wil mijn thuisbatterijadvies ontvangen en ga akkoord met de privacyverklaring.</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.consent.matchingConsent}
            onChange={(event) => onConsent("matchingConsent", event.target.checked)}
          />
          <span>Optioneel: ik geef toestemming om mij vrijblijvend in contact te brengen met een passende specialist.</span>
        </label>
      </div>
    </>
  );
}

function Result({
  answers,
  createdLead,
  onRestart,
}: {
  answers: WoningcheckAnswers;
  createdLead: CreateLeadResponse;
  onRestart: () => void;
}) {
  return (
    <div className="result-card">
      <span className="section-kicker">Aanvraag ontvangen</span>
      <h1>Uw thuisbatterijcheck is ontvangen</h1>
      <p>
        Uw aanvraag is opgeslagen met referentie <strong>{createdLead.id.slice(0, 8)}</strong>. We beoordelen uw antwoorden
        zonder gegarandeerde besparingen of terugverdientijden te beloven.
      </p>
      <h2>Samenvatting</h2>
      <dl className="summary-list">
        <div>
          <dt>Zonnepanelen</dt>
          <dd>{answers.zonnepanelen ?? "-"}</dd>
        </div>
        <div>
          <dt>Aantal panelen</dt>
          <dd>{answers.aantalZonnepanelen ?? "-"}</dd>
        </div>
        <div>
          <dt>Stroomverbruik</dt>
          <dd>{answers.stroomverbruik?.toLocaleString("nl-NL") ?? "-"} kWh</dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd>{answers.energiecontract ?? "-"}</dd>
        </div>
        <div>
          <dt>Doel</dt>
          <dd>{answers.hoofddoel ?? "-"}</dd>
        </div>
      </dl>
      <h2>Wat gebeurt er nu?</h2>
      <ul className="plain-list">
        <li>Uw aanvraag staat klaar voor interne beoordeling.</li>
        <li>We nemen uw verbruik, zonnepanelen, contractvorm en doel mee in de opvolging.</li>
        <li>Alleen met optionele matching-toestemming kan later een passende specialist worden benaderd.</li>
      </ul>
      <div className="check-actions">
        <a className="button button-primary" href="/oplossingen/thuisbatterij">
          Meer over thuisbatterijen
        </a>
        <button className="button button-secondary" type="button" onClick={onRestart}>
          Opnieuw invullen
        </button>
      </div>
    </div>
  );
}

function FieldErrors({ errors }: { errors: Record<string, string[]> }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;

  return (
    <ul>
      {entries.flatMap(([field, messages]) =>
        messages.map((message) => (
          <li key={`${field}-${message}`}>
            {field}: {message}
          </li>
        ))
      )}
    </ul>
  );
}

function prepareBatteryAnswers(answers: WoningcheckAnswers): WoningcheckAnswers {
  return {
    ...answers,
    productInterest: "Thuisbatterij",
    interesses: ["Zelf opgewekte stroom opslaan"],
    aantalZonnepanelen: answers.zonnepanelen === "Ja" ? answers.aantalZonnepanelen : 0,
    stroomverbruik: answers.stroomverbruik ?? 3000,
    gasverbruik: 0,
    postcode: answers.postcode?.trim().toUpperCase(),
    huisnummer: answers.huisnummer?.trim(),
    naam: answers.naam?.trim(),
    email: answers.email?.trim(),
    telefoon: answers.telefoon?.trim(),
  };
}
