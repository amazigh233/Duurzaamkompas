import type { SolutionCategory, SolutionSlug, WoningcheckAnswers, AdviceResult, KnowledgeArticle } from "./types";

export const STORAGE_KEY = "dwk_woningcheck_draft";

export const woningtypes = ["Tussenwoning", "Hoekwoning", "Twee-onder-een-kap", "Vrijstaande woning", "Appartement"];
export const bouwjaren = ["Voor 1945", "1945 - 1975", "1975 - 1991", "1992 - 2005", "Na 2005"];
export const zonnepanelenOpties = ["Ja", "Nee", "Weet ik niet"];
export const interesses = [
  "Lagere energierekening",
  "Minder gas gebruiken",
  "Zelf opgewekte stroom opslaan",
  "Meer wooncomfort",
  "Koelen in de zomer",
  "Elektrische auto thuis laden",
  "Ik weet het nog niet",
];
export const hoofddoelen = [
  "Lagere maandlasten",
  "Minder gas gebruiken",
  "Meer comfort",
  "Voorbereiden op de toekomst",
  "Eerst onafhankelijk advies",
];
export const starttermijnen = ["Zo snel mogelijk", "Binnen 3 maanden", "Binnen 6-12 maanden", "Ik orienteer me nog"];
export const energiecontractTypes = ["Vast", "Variabel", "Dynamisch", "Weet ik niet"];
export const thuisbatterijDoelen = [
  "Meer eigen zonnestroom gebruiken",
  "Minder afhankelijk zijn van het net",
  "Inspelen op dynamische energieprijzen",
  "Voorbereiden op toekomstige veranderingen",
  "Ik wil vooral persoonlijk advies",
];

export const leadStatuses = ["New", "Contacted", "AppointmentScheduled", "QuoteCreated", "Won", "Lost"] as const;

export const leadStatusLabels: Record<(typeof leadStatuses)[number], string> = {
  New: "Nieuw",
  Contacted: "Contact opgenomen",
  AppointmentScheduled: "Afspraak gepland",
  QuoteCreated: "Offerte gemaakt",
  Won: "Gewonnen",
  Lost: "Verloren",
};

export const productCategories = [
  "General",
  "Thuisbatterij",
  "Warmtepomp",
  "Isolatie",
  "Zonnepanelen",
  "Laadpaal",
  "Airconditioning",
  "Energieadvies",
] as const;

export const productCategoryLabels: Record<(typeof productCategories)[number], string> = {
  General: "Algemeen",
  Thuisbatterij: "Thuisbatterij",
  Warmtepomp: "Warmtepomp",
  Isolatie: "Isolatie",
  Zonnepanelen: "Zonnepanelen",
  Laadpaal: "Laadpaal",
  Airconditioning: "Airconditioning",
  Energieadvies: "Energieadvies",
};

export const consentVersion = "2026-07-05";
export const consentText =
  "Ja, ik wil mijn persoonlijke woningadvies ontvangen en ga akkoord met de privacyverklaring. Optionele matching met een specialist gebeurt alleen wanneer ik daarvoor apart toestemming geef.";

export const emptyAnswers: WoningcheckAnswers = {
  interesses: [],
  consent: {
    adviceConsent: false,
    matchingConsent: false,
  },
};

export const solutions: SolutionCategory[] = [
  {
    slug: "isolatie",
    title: "Isolatie",
    eyebrow: "Comfort en minder warmteverlies",
    summary:
      "Isolatie is vaak de logische eerste stap. Het verlaagt de warmtevraag en maakt andere maatregelen, zoals een warmtepomp, beter passend.",
    idealFor: ["Woningen met tocht of koude vloeren", "Energielabel C of lager", "Voorbereiding op een warmtepomp"],
    nextSteps: ["Onderzoek dak, vloer, glas en gevel", "Begin waar het warmteverlies het grootst is", "Vraag offertes met duidelijke materiaalkeuzes"],
  },
  {
    slug: "warmtepomp",
    title: "Warmtepomp",
    eyebrow: "Minder gas gebruiken",
    summary:
      "Een warmtepomp kan het gasverbruik sterk verlagen. De beste keuze hangt af van isolatie, afgiftesysteem en beschikbare ruimte.",
    idealFor: ["Redelijk tot goed geisoleerde woningen", "Huishoudens met hoge gasvraag", "Woningeigenaren die stapsgewijs van gas af willen"],
    nextSteps: ["Controleer eerst isolatie en radiatoren", "Vergelijk hybride en volledig elektrisch", "Laat geluid en plaatsing vooraf beoordelen"],
  },
  {
    slug: "zonnepanelen",
    title: "Zonnepanelen",
    eyebrow: "Eigen stroom opwekken",
    summary:
      "Zonnepanelen blijven interessant wanneer ze passen bij dak, verbruik en toekomstplannen zoals elektrisch rijden of een warmtepomp.",
    idealFor: ["Voldoende bruikbaar dakoppervlak", "Gemiddeld tot hoog stroomverbruik", "Combinatie met toekomstige elektrische apparaten"],
    nextSteps: ["Check dakrichting, schaduw en meterkast", "Stem aantal panelen af op eigen verbruik", "Denk vooruit over batterij of laadpaal"],
  },
  {
    slug: "thuisbatterij",
    title: "Thuisbatterij",
    eyebrow: "Stroom slimmer benutten",
    summary:
      "Een thuisbatterij kan helpen om meer eigen zonnestroom te gebruiken. De businesscase hangt sterk af van verbruik, contract en regeling.",
    idealFor: ["Woningen met zonnepanelen", "Huishoudens met flexibel stroomverbruik", "Interesse in slim energiebeheer"],
    nextSteps: ["Bekijk eerst uw verbruiksprofiel", "Reken met bandbreedtes, niet met garanties", "Combineer alleen wanneer de situatie klopt"],
  },
  {
    slug: "laadpaal",
    title: "Laadpaal",
    eyebrow: "Thuis laden",
    summary:
      "Een laadpaal maakt elektrisch rijden praktischer. Slim laden kan extra interessant zijn in combinatie met zonnepanelen of dynamische tarieven.",
    idealFor: ["Eigen oprit of vaste parkeerplek", "Elektrische of hybride auto", "Wens om slim en veilig thuis te laden"],
    nextSteps: ["Controleer meterkast en laadvermogen", "Kies load balancing bij beperkte capaciteit", "Stem laden af op zonnepanelen waar mogelijk"],
  },
  {
    slug: "airconditioning",
    title: "Airconditioning",
    eyebrow: "Koelen en soms bijverwarmen",
    summary:
      "Airconditioning kan comfort verhogen en in sommige situaties efficient bijverwarmen. Het blijft belangrijk om comfort en energiegebruik samen te bekijken.",
    idealFor: ["Warme slaap- of werkkamers", "Woningen met zonnepanelen", "Gerichte comfortvraag per ruimte"],
    nextSteps: ["Bepaal welke ruimtes echt koeling nodig hebben", "Let op geluid en buitenunit", "Vergelijk rendement voor koelen en verwarmen"],
  },
];

export const solutionMap = new Map<SolutionSlug, SolutionCategory>(
  solutions.map((solution) => [solution.slug, solution])
);

export const articles: KnowledgeArticle[] = [
  {
    slug: "subsidies-en-regelingen",
    category: "Subsidies",
    title: "Subsidies en regelingen: waar begint u?",
    summary:
      "Regelingen veranderen regelmatig. Gebruik de woningcheck als startpunt en controleer actuele voorwaarden altijd via officiele bronnen of een adviseur.",
  },
  {
    slug: "warmtepomp-technische-voorwaarden",
    category: "Warmtepomp",
    title: "Warmtepomp: let op technische voorwaarden",
    summary:
      "De juiste keuze hangt af van isolatie, afgiftesysteem, geluid, ruimte en actuele voorwaarden. Laat de situatie technisch beoordelen.",
  },
  {
    slug: "isolatie-woning-begrijpen",
    category: "Isolatie",
    title: "Isolatie: eerst de woning goed begrijpen",
    summary:
      "Dak, vloer, gevel en glas hebben elk een ander effect. Een goede volgorde voorkomt onnodige kosten en maakt vervolgstappen duidelijker.",
  },
  {
    slug: "thuisbatterij-kosten",
    category: "Thuisbatterij",
    title: "Thuisbatterij: kijk naar uw verbruiksprofiel",
    summary:
      "Een thuisbatterij past niet automatisch bij elke woning met zonnepanelen. Verbruik, contractvorm en toekomstplannen maken veel verschil.",
  },
  {
    slug: "zonnepanelen-opwek-en-verbruik",
    category: "Zonnepanelen",
    title: "Zonnepanelen: stem opwek af op verbruik",
    summary:
      "Dakligging, schaduw, meterkast en eigen stroomgebruik bepalen samen of zonnepanelen logisch zijn en hoeveel panelen passen.",
  },
  {
    slug: "laadpaal-thuis-veiligheid-vermogen",
    category: "Laadpaal",
    title: "Laadpaal thuis: veiligheid en vermogen eerst",
    summary:
      "Een goede laadoplossing begint bij meterkast, beschikbare capaciteit, parkeerplek en eventueel slim laden met eigen opwek.",
  },
  {
    slug: "welke-isolatiemaatregel-eerst",
    category: "Isolatie",
    title: "Welke isolatiemaatregel pakt u eerst aan?",
    summary: "Dak, vloer, gevel en glas hebben elk een ander effect op comfort en energiegebruik.",
  },
  {
    slug: "hybride-of-volledig-elektrisch",
    category: "Warmtepomp",
    title: "Hybride of volledig elektrisch?",
    summary: "De juiste keuze hangt af van uw woning, isolatie en huidige verwarmingssysteem.",
  },
  {
    slug: "zonnepanelen-slim-verbruik",
    category: "Zonnepanelen",
    title: "Zonnepanelen combineren met slim verbruik",
    summary: "Meer eigen stroom gebruiken wordt belangrijker wanneer regelingen veranderen.",
  },
];

export const articleMap = new Map<string, KnowledgeArticle>(articles.map((article) => [article.slug, article]));

const slugByInterest: Record<string, SolutionSlug[]> = {
  "Lagere energierekening": ["isolatie", "zonnepanelen"],
  "Minder gas gebruiken": ["isolatie", "warmtepomp"],
  "Zelf opgewekte stroom opslaan": ["thuisbatterij", "zonnepanelen"],
  "Meer wooncomfort": ["isolatie", "airconditioning"],
  "Koelen in de zomer": ["airconditioning"],
  "Elektrische auto thuis laden": ["laadpaal", "zonnepanelen"],
  "Ik weet het nog niet": ["isolatie"],
};

const slugByGoal: Record<string, SolutionSlug[]> = {
  "Lagere maandlasten": ["isolatie", "zonnepanelen"],
  "Minder gas gebruiken": ["isolatie", "warmtepomp"],
  "Meer comfort": ["isolatie", "airconditioning"],
  "Voorbereiden op de toekomst": ["zonnepanelen", "laadpaal"],
  "Eerst onafhankelijk advies": ["isolatie"],
};

export function calculateAdvice(answers: WoningcheckAnswers): AdviceResult {
  const recommended = new Set<SolutionSlug>();
  const labelPenalty =
    answers.bouwjaar === "Voor 1945" || answers.bouwjaar === "1945 - 1975"
      ? 20
      : answers.bouwjaar === "1975 - 1991"
      ? 12
      : 6;
  const gas = answers.gasverbruik ?? 1200;
  const stroom = answers.stroomverbruik ?? 3000;

  answers.interesses.forEach((interest) => {
    slugByInterest[interest]?.forEach((slug) => recommended.add(slug));
  });

  if (answers.hoofddoel) {
    slugByGoal[answers.hoofddoel]?.forEach((slug) => recommended.add(slug));
  }

  if (gas > 1400) {
    recommended.add("isolatie");
    recommended.add("warmtepomp");
  }

  if (stroom > 3200 || answers.zonnepanelen === "Nee") {
    recommended.add("zonnepanelen");
  }

  if (answers.zonnepanelen === "Ja" && stroom > 3000) {
    recommended.add("thuisbatterij");
  }

  if (recommended.size === 0) {
    recommended.add("isolatie");
    recommended.add("zonnepanelen");
  }

  const score = Math.max(35, Math.min(90, 82 - labelPenalty + (answers.zonnepanelen === "Ja" ? 4 : 0)));
  const firstThree = Array.from(recommended).slice(0, 3);

  return {
    score,
    title: score >= 70 ? "Uw woning heeft duidelijke kansen voor gerichte verduurzaming" : "Begin met de basis en bouw daarna verder",
    summary:
      "Dit is een indicatie op basis van uw antwoorden. Voor een definitief advies zijn woningopname, offertes en actuele voorwaarden nodig.",
    recommendedSolutions: firstThree,
    assumptions: [
      "We gebruiken gemiddelde energieprijzen en globale woningkenmerken.",
      "Subsidies, netcapaciteit en technische geschiktheid zijn niet definitief vastgesteld.",
      "Een definitieve keuze vraagt altijd technische beoordeling en actuele voorwaarden.",
    ],
  };
}
