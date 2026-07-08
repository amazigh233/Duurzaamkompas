import { useMemo, useState } from "react";
import { solutions } from "../data";
import type { SolutionCategory, SolutionSlug } from "../types";
import { Icon, solutionIconName } from "./Icon";

const maxSelectedMeasures = 3;
const isSolution = (solution: SolutionCategory | undefined): solution is SolutionCategory => Boolean(solution);

export function MaatregelenKompas() {
  const [selectedSlugs, setSelectedSlugs] = useState<SolutionSlug[]>([]);
  const selectedSolutions = useMemo(
    () => selectedSlugs.map((slug) => solutions.find((solution) => solution.slug === slug)).filter(isSolution),
    [selectedSlugs]
  );

  const addMeasure = (slug: SolutionSlug) => {
    setSelectedSlugs((current) => {
      if (current.includes(slug) || current.length >= maxSelectedMeasures) return current;
      return [...current, slug];
    });
  };

  const removeMeasure = (slug: SolutionSlug) => {
    setSelectedSlugs((current) => current.filter((currentSlug) => currentSlug !== slug));
  };

  const moveMeasure = (slug: SolutionSlug, direction: -1 | 1) => {
    setSelectedSlugs((current) => {
      const index = current.indexOf(slug);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  return (
    <section className="section maatregelen-page">
      <div className="container maatregelen-layout">
        <div className="maatregelen-main">
          <span className="section-kicker">MaatregelenKompas</span>
          <h1>Speel met uw verduurzamingsroute</h1>
          <p className="lead">
            Kies maximaal drie maatregelen die u interessant vindt en zet ze in een logische volgorde. Dit is een
            rustige eerste orientatie: zonder contactgegevens, zonder opslag en zonder verplichting.
          </p>
          <div className="maatregelen-grid" aria-label="Verduurzamingsmaatregelen kiezen">
            {solutions.map((solution) => {
              const isSelected = selectedSlugs.includes(solution.slug);
              const isDisabled = !isSelected && selectedSlugs.length >= maxSelectedMeasures;

              return (
                <article className={isSelected ? "maatregel-card is-selected" : "maatregel-card"} key={solution.slug}>
                  <span className="solution-card-icon" aria-hidden="true">
                    <Icon name={solutionIconName(solution.slug)} />
                  </span>
                  <span className="section-kicker">{solution.eyebrow}</span>
                  <h2>{solution.title}</h2>
                  <p>{solution.summary}</p>
                  <button
                    className={isSelected ? "button button-secondary" : "button button-primary"}
                    type="button"
                    onClick={() => (isSelected ? removeMeasure(solution.slug) : addMeasure(solution.slug))}
                    disabled={isDisabled}
                    aria-label={isSelected ? `Verwijder ${solution.title}` : `Kies ${solution.title}`}
                  >
                    {isSelected ? "Verwijder" : isDisabled ? "Maximaal 3 gekozen" : "Kies"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="maatregelen-result" aria-live="polite">
          <span className="section-kicker">Uw voorlopige route</span>
          <h2>Uw voorlopige route</h2>
          {selectedSolutions.length > 0 ? (
            <ol className="route-list">
              {selectedSolutions.map((solution, index) =>
                solution ? (
                  <li key={solution.slug}>
                    <div>
                      <strong>{solution.title}</strong>
                      <p>{solution.nextSteps[0]}</p>
                    </div>
                    <div className="route-actions">
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => moveMeasure(solution.slug, -1)}
                        disabled={index === 0}
                        aria-label={`${solution.title} omhoog`}
                      >
                        Omhoog
                      </button>
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => moveMeasure(solution.slug, 1)}
                        disabled={index === selectedSolutions.length - 1}
                        aria-label={`${solution.title} omlaag`}
                      >
                        Omlaag
                      </button>
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => removeMeasure(solution.slug)}
                        aria-label={`Verwijder ${solution.title} uit route`}
                      >
                        Verwijder
                      </button>
                    </div>
                  </li>
                ) : null
              )}
            </ol>
          ) : (
            <p className="empty-route">
              Kies een of meer maatregelen om hier een voorlopige route te zien. De volgorde kunt u daarna aanpassen.
            </p>
          )}
          <div className="trust-note">
            <h3>Wat dit spel wel en niet doet</h3>
            <ul className="plain-list">
              <li>U vult hier geen contactgegevens in.</li>
              <li>Uw keuzes worden niet opgeslagen.</li>
              <li>De route is indicatief en geen definitief energieadvies.</li>
              <li>De Woningcheck kijkt later naar uw woning, verbruik en wensen.</li>
            </ul>
          </div>
          <div className="button-row">
            <a className="button button-primary" href="/woningcheck">
              Start gratis woningcheck
            </a>
            <a className="button button-secondary" href="/oplossingen">
              Bekijk alle oplossingen
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
