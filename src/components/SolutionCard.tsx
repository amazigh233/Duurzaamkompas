import type { SolutionCategory } from "../types";
import { Icon, solutionIconName } from "./Icon";

export function SolutionCard({ solution }: { solution: SolutionCategory }) {
  return (
    <a className="solution-card" href={`/oplossingen/${solution.slug}`}>
      <span className="solution-card-icon" aria-hidden="true">
        <Icon name={solutionIconName(solution.slug)} />
      </span>
      <span className="solution-card-kicker">{solution.eyebrow}</span>
      <h3>{solution.title}</h3>
      <p>{solution.summary}</p>
      <span className="text-link">Meer over {solution.title.toLowerCase()}</span>
    </a>
  );
}
