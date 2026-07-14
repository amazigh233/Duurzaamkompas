import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, submitWoningcheckLead } from "../api/client";
import {
  bouwjaren,
  calculateAdvice,
  consentText,
  consentVersion,
  emptyAnswers,
  hoofddoelen,
  interesses,
  solutionMap,
  starttermijnen,
  STORAGE_KEY,
  woningtypes,
  zonnepanelenOpties,
} from "../data";
import {
  getTrackingData,
  trackLeadSubmittedOnce,
  trackWoningcheckStartedOnce,
  trackWoningcheckStepCompletedOnce,
} from "../lib/tracking";
import { getSubmissionId, markSubmissionCompleted, readCompletedLead, resetSubmission } from "../lib/submission";
import type { AdviceResult, CreateLeadResponse, WoningcheckAnswers } from "../types";

const lastInputStep = 5;
const submissionStorageKey = `${STORAGE_KEY}_submission`;

function readDraft(): { step: number; answers: WoningcheckAnswers } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { step: 0, answers: emptyAnswers };
    const parsed = JSON.parse(raw) as Partial<{ step: number; answers: WoningcheckAnswers }>;
    const answers = { ...emptyAnswers, ...parsed.answers, consent: { ...emptyAnswers.consent, ...parsed.answers?.consent } };
    const requestedStep = typeof parsed.step === "number" ? Math.min(parsed.step, lastInputStep) : 0;
    return {
      step: Math.min(requestedStep, firstIncompleteStep(answers)),
      answers,
    };
  } catch {
    return { step: 0, answers: emptyAnswers };
  }
}

function firstIncompleteStep(answers: WoningcheckAnswers): number {
  if (!answers.woningtype || !answers.bouwjaar) return 0;
  if (!answers.zonnepanelen) return 1;
  if (answers.interesses.length === 0 || !answers.hoofddoel || !answers.starttermijn) return 2;
  if (!answers.postcode || !answers.huisnummer || !/^[1-9][0-9]{3}\s?[A-Z]{2}$/i.test(answers.postcode)) return 3;
  if (!answers.naam || !answers.email || !/^\S+@\S+\.\S+$/.test(answers.email)) return 4;
  if (!answers.consent.adviceConsent) return 5;
  return lastInputStep;
}

export function Woningcheck() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WoningcheckAnswers>(emptyAnswers);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdLead, setCreatedLead] = useState<CreateLeadResponse | null>(null);
  const submittingRef = useRef(false);

  const preparedAnswers = useMemo(() => prepareAnswers(answers), [answers]);
  const result: AdviceResult | null = useMemo(
    () => (createdLead ? calculateAdvice(preparedAnswers) : null),
    [createdLead, preparedAnswers]
  );

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

  const toggleInterest = (interest: string) => {
    setAnswers((current) => {
      const exists = current.interesses.includes(interest);
      return {
        ...current,
        interesses: exists
          ? current.interesses.filter((item) => item !== interest)
          : [...current.interesses, interest],
      };
    });
    setError("");
    setFieldErrors({});
  };

  const validationMessage = () => {
    if (step === 0 && !answers.woningtype) return "Kies uw woningtype.";
    if (step === 0 && !answers.bouwjaar) return "Kies een bouwjaarperiode.";
    if (step === 1 && !answers.zonnepanelen) return "Geef aan of de woning zonnepanelen heeft.";
    if (step === 2 && answers.interesses.length === 0) return "Kies minimaal een interessegebied.";
    if (step === 2 && !answers.hoofddoel) return "Kies uw belangrijkste doel.";
    if (step === 2 && !answers.starttermijn) return "Kies wanneer u mogelijk wilt starten.";
    if (step === 3 && (!answers.postcode || !answers.huisnummer)) return "Vul postcode en huisnummer in.";
    if (step === 3 && !/^[1-9][0-9]{3}\s?[A-Z]{2}$/i.test(answers.postcode ?? "")) {
      return "Vul een geldige Nederlandse postcode in.";
    }
    if (step === 4 && !answers.naam) return "Vul uw naam in.";
    if (step === 4 && !answers.email) return "Vul uw e-mailadres in.";
    if (step === 4 && !/^\S+@\S+\.\S+$/.test(answers.email ?? "")) return "Vul een geldig e-mailadres in.";
    if (step === 5 && !answers.consent.adviceConsent) return "Geef toestemming om uw woningadvies te ontvangen.";
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
    if (step === 0) trackWoningcheckStartedOnce(submissionId, "woningcheck");
    trackWoningcheckStepCompletedOnce(submissionId, "woningcheck", step + 1);
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
      trackLeadSubmittedOnce(submissionId, "woningcheck", preparedAnswers.productInterest ?? "General", tracking);
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
    setAnswers(emptyAnswers);
    setStep(0);
    setError("");
    setFieldErrors({});
    setCreatedLead(null);
    localStorage.removeItem(STORAGE_KEY);
    resetSubmission(submissionStorageKey);
  };

  const progress = Math.min(100, Math.round(((Math.min(step, lastInputStep) + 1) / (lastInputStep + 1)) * 100));

  return (
    <section className="check-page">
      <div className="check-wrap">
        {!createdLead ? (
          <>
            <div className="check-progress">
              <div>
                <span>Woningcheck</span>
                <strong>Stap {step + 1} van {lastInputStep + 1}</strong>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="check-card">
              {step === 0 ? (
                <figure className="photo-card check-media">
                  <img
                    src="/images/woningcheck-detail.jpg"
                    alt="Handen bij een notitieboek en tablet tijdens woningadvies"
                  />
                  <figcaption className="photo-caption">
                    Illustratief beeld. De Woningcheck geeft een eerste indicatie, geen definitief energieadvies.
                  </figcaption>
                </figure>
              ) : null}
              {step === 0 && <HomeStep answers={answers} onChange={(partial) => patch(partial)} />}
              {step === 1 && <EnergyStep answers={preparedAnswers} onChange={(partial) => patch(partial)} />}
              {step === 2 && (
                <GoalStep
                  answers={answers}
                  onChange={(partial) => patch(partial)}
                  onToggleInterest={toggleInterest}
                />
              )}
              {step === 3 && <AddressStep answers={answers} onChange={(partial) => patch(partial)} />}
              {step === 4 && <ContactStep answers={answers} onChange={(partial) => patch(partial)} />}
              {step === 5 && <ConsentStep answers={answers} onConsent={setConsent} />}
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
              Uw tussentijdse antwoorden worden tijdelijk in deze browser bewaard. Verzenden gebeurt pas na uw actieve toestemming.
            </p>
          </>
        ) : (
          <Result result={result} answers={preparedAnswers} createdLead={createdLead} onRestart={restart} />
        )}
      </div>
    </section>
  );
}

function HomeStep({
  answers,
  onChange,
}: {
  answers: WoningcheckAnswers;
  onChange: (partial: Partial<WoningcheckAnswers>) => void;
}) {
  return (
    <>
      <h1>Over uw woning</h1>
      <p>Kies het woningtype en bouwjaar dat het dichtst bij uw situatie ligt.</p>
      <div className="combined-step">
        <section className="step-group">
          <h2>Wat voor woning heeft u?</h2>
          <ChoiceGroup
            options={woningtypes}
            value={answers.woningtype}
            onPick={(value) => onChange({ woningtype: value })}
          />
        </section>
        <section className="step-group">
          <h2>Wat is ongeveer het bouwjaar?</h2>
          <p>Het bouwjaar zegt veel over isolatie en installaties.</p>
          <ChoiceGroup
            options={bouwjaren}
            value={answers.bouwjaar}
            onPick={(value) => onChange({ bouwjaar: value })}
          />
        </section>
      </div>
    </>
  );
}

function EnergyStep({
  answers,
  onChange,
}: {
  answers: WoningcheckAnswers;
  onChange: (partial: Partial<WoningcheckAnswers>) => void;
}) {
  return (
    <>
      <h1>Uw energieprofiel</h1>
      <p>Weet u het niet precies? Een schatting is voldoende voor deze eerste indicatie.</p>
      <div className="combined-step">
        <section className="step-group">
          <h2>Heeft de woning zonnepanelen?</h2>
          <ChoiceGroup
            options={zonnepanelenOpties}
            value={answers.zonnepanelen}
            onPick={(value) => onChange({ zonnepanelen: value })}
          />
        </section>
        <section className="step-group">
          <RangeControl
            title="Jaarlijks stroomverbruik"
            description="Gebruik gerust een gemiddelde als u het exacte verbruik niet weet."
            value={answers.stroomverbruik ?? 3000}
            min={1000}
            max={7000}
            step={100}
            unit="kWh"
            onChange={(value) => onChange({ stroomverbruik: value })}
          />
        </section>
        <section className="step-group">
          <RangeControl
            title="Jaarlijks gasverbruik"
            description="Volledig elektrisch? Zet de schuif op 0."
            value={answers.gasverbruik ?? 1200}
            min={0}
            max={3500}
            step={50}
            unit="m3"
            onChange={(value) => onChange({ gasverbruik: value })}
          />
        </section>
      </div>
    </>
  );
}

function GoalStep({
  answers,
  onChange,
  onToggleInterest,
}: {
  answers: WoningcheckAnswers;
  onChange: (partial: Partial<WoningcheckAnswers>) => void;
  onToggleInterest: (value: string) => void;
}) {
  return (
    <>
      <h1>Wat wilt u bereiken?</h1>
      <p>Deze keuzes helpen om de vervolgstap rustig en logisch te maken. U zit nergens aan vast.</p>
      <div className="combined-step">
        <section className="step-group">
          <h2>Welke oplossingen interesseren u?</h2>
          <p>Meerdere antwoorden mogelijk. Nog geen idee? Dat mag ook.</p>
          <MultiChoiceGroup options={interesses} values={answers.interesses} onToggle={onToggleInterest} />
        </section>
        <section className="step-group">
          <h2>Wat is uw belangrijkste doel?</h2>
          <ChoiceGroup
            options={hoofddoelen}
            value={answers.hoofddoel}
            onPick={(value) => onChange({ hoofddoel: value })}
          />
        </section>
        <section className="step-group">
          <h2>Wanneer wilt u mogelijk starten?</h2>
          <ChoiceGroup
            options={starttermijnen}
            value={answers.starttermijn}
            onPick={(value) => onChange({ starttermijn: value })}
          />
        </section>
      </div>
    </>
  );
}

function ChoiceGroup({
  options,
  value,
  onPick,
}: {
  options: string[];
  value?: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <button
          key={option}
          className={option === value ? "choice-card is-selected" : "choice-card"}
          type="button"
          onClick={() => onPick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function MultiChoiceGroup({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="choice-grid two-col">
      {options.map((option) => (
        <button
          key={option}
          className={values.includes(option) ? "choice-card is-selected" : "choice-card"}
          type="button"
          onClick={() => onToggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function RangeControl({
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
      <h2>{title}</h2>
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

function AddressStep({ answers, onChange }: { answers: WoningcheckAnswers; onChange: (partial: Partial<WoningcheckAnswers>) => void }) {
  return (
    <>
      <h1>Waar staat de woning?</h1>
      <p>Met postcode en huisnummer kan de indicatie later beter op regio en woningtype worden afgestemd.</p>
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
      <h1>Waar mogen we uw advies naartoe sturen?</h1>
      <p>Deze gegevens gebruiken we om uw Woningcheck-aanvraag zorgvuldig op te volgen.</p>
      <div className="field-stack">
        <label>
          Naam
          <input value={answers.naam ?? ""} onChange={(event) => onChange({ naam: event.target.value })} placeholder="Voor- en achternaam" />
        </label>
        <label>
          E-mailadres
          <input type="email" value={answers.email ?? ""} onChange={(event) => onChange({ email: event.target.value })} placeholder="naam@email.nl" />
        </label>
        <label>
          Telefoon optioneel
          <input value={answers.telefoon ?? ""} onChange={(event) => onChange({ telefoon: event.target.value })} placeholder="06 12345678" />
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
      <h1>Uw toestemming</h1>
      <p>
        We verwerken uw gegevens voor uw Woningcheck-aanvraag. Matching met een specialist gebeurt alleen als u dat apart
        toestaat.
      </p>
      <div className="field-stack">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.consent.adviceConsent}
            onChange={(event) => onConsent("adviceConsent", event.target.checked)}
          />
          <span>Ja, ik wil mijn persoonlijke woningadvies ontvangen en ga akkoord met de privacyverklaring.</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={answers.consent.matchingConsent}
            onChange={(event) => onConsent("matchingConsent", event.target.checked)}
          />
          <span>Optioneel: ik geef toestemming om mij later vrijblijvend in contact te brengen met een passende specialist.</span>
        </label>
      </div>
    </>
  );
}

function Result({
  result,
  answers,
  createdLead,
  onRestart,
}: {
  result: AdviceResult | null;
  answers: WoningcheckAnswers;
  createdLead: CreateLeadResponse;
  onRestart: () => void;
}) {
  if (!result) return null;
  const recommended = result.recommendedSolutions.map((slug) => solutionMap.get(slug)).filter(Boolean);

  return (
    <div className="result-card">
      <span className="section-kicker">Aanvraag ontvangen</span>
      <h1>{result.title}</h1>
      <p>
        Uw Woningcheck is opgeslagen met referentie <strong>{createdLead.id.slice(0, 8)}</strong>. U ziet hieronder een
        eerste indicatie; een definitief advies vraagt altijd verdere beoordeling.
      </p>
      <div className="score-box">
        <strong>{result.score}/100</strong>
        <span>Uitlegbare indicatiescore, geen definitief energieadvies.</span>
      </div>
      <h2>Aanbevolen richting</h2>
      <div className="result-solutions">
        {recommended.map((solution) =>
          solution ? (
            <article key={solution.slug}>
              <h3>{solution.title}</h3>
              <p>{solution.summary}</p>
            </article>
          ) : null
        )}
      </div>
      <h2>Samenvatting</h2>
      <dl className="summary-list">
        <div>
          <dt>Woning</dt>
          <dd>{answers.woningtype ?? "-"} - {answers.bouwjaar ?? "-"}</dd>
        </div>
        <div>
          <dt>Hoofddoel</dt>
          <dd>{answers.hoofddoel ?? "-"}</dd>
        </div>
        <div>
          <dt>Interesses</dt>
          <dd>{answers.interesses.join(", ") || "-"}</dd>
        </div>
        <div>
          <dt>Matching-consent</dt>
          <dd>{answers.consent.matchingConsent ? "Ja, optioneel toegestaan" : "Nee, niet toegestaan"}</dd>
        </div>
      </dl>
      <h2>Wat gebeurt er nu?</h2>
      <ul className="plain-list">
        <li>Uw aanvraag staat klaar voor interne beoordeling.</li>
        <li>Alleen bij optionele matching-toestemming kan later een passende specialist worden benaderd.</li>
      </ul>
      <h2>Aannames</h2>
      <ul className="plain-list">
        {result.assumptions.map((assumption) => (
          <li key={assumption}>{assumption}</li>
        ))}
      </ul>
      <div className="check-actions">
        <a className="button button-primary" href="/oplossingen">
          Bekijk oplossingen
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

function prepareAnswers(answers: WoningcheckAnswers): WoningcheckAnswers {
  return {
    ...answers,
    stroomverbruik: answers.stroomverbruik ?? 3000,
    gasverbruik: answers.gasverbruik ?? 1200,
    postcode: answers.postcode?.trim().toUpperCase(),
    huisnummer: answers.huisnummer?.trim(),
    naam: answers.naam?.trim(),
    email: answers.email?.trim(),
    telefoon: answers.telefoon?.trim(),
  };
}
