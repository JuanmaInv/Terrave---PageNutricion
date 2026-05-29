import { type AttrKey, type Diet, type Sex, type SurveyResponse } from "./nutrilen.types";
import { loadSurveys, saveSurvey, SEED_KEY, STORAGE_KEY } from "./nutrilen.storage";

/**
 * Seed data generation for development and local fallback mode.
 * Pattern: SRP — only demo data generation logic lives here.
 *          Builder (implicit) — constructs SurveyResponse objects step by step.
 */

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const DESC_SAMPLES = [
  "Color dorado muy atractivo, aroma suave.",
  "Buena firmeza al corte, se mantiene cohesivo.",
  "Aroma a especias agradable, sin notas extrañas.",
  "Textura un poco seca en el centro.",
  "Sabor tostado bien logrado, persistente.",
  "Untuosidad media, equilibrada.",
  "Color homogéneo y apetitoso.",
];

const AFF_SAMPLES = [
  "Me gustó mucho la textura y el sabor.",
  "Producto interesante, lo consumiría nuevamente.",
  "Sabor agradable, mejoraría la jugosidad.",
  "Muy bueno como opción saludable.",
  "Recomendable para quienes buscan alternativas vegetales.",
  "Le falta un poco de condimento.",
];

const DIET_WEIGHTS: Diet[] = [
  ...Array(14).fill("omnivoro"),
  ...Array(7).fill("ovo_lacto"),
  ...Array(3).fill("vegano"),
  ...Array(6).fill("flexitariano"),
  ...Array(2).fill("otro"),
] as Diet[];

const SEX_WEIGHTS: Sex[] = [
  ...Array(15).fill("femenino"),
  ...Array(14).fill("masculino"),
  ...Array(3).fill("otro"),
] as Sex[];

// Skew hours toward lunch/snack times to simulate realistic consumption windows
const HOUR_POOL = [
  8, 9, 10,
  11, 11, 12, 12, 12, 13, 13, 13, 14, 14,
  15, 16, 16,
  17, 18, 18, 19, 19, 20, 20, 21,
];

function buildSeedEntry(index: number, now: number): SurveyResponse {
  const acceptance = Math.random() < 0.78 ? randInt(4, 5) : randInt(1, 3);
  const liked: "si" | "no" = acceptance >= 4 ? "si" : Math.random() < 0.3 ? "si" : "no";
  const consumeAgain: "si" | "no" | "tal_vez" =
    liked === "si"
      ? Math.random() < 0.7 ? "si" : "tal_vez"
      : Math.random() < 0.4 ? "tal_vez" : "no";

  const hour = rand(HOUR_POOL);
  const minute = randInt(0, 59);
  const dayOffset = randInt(0, 25);
  const d = new Date(now - dayOffset * 86_400_000);
  d.setHours(hour, minute, 0, 0);

  const attrs: Record<AttrKey, number> = {
    color: randInt(3, 5),
    aroma: randInt(2, 5),
    firmeza: randInt(3, 5),
    untuosidad: randInt(2, 5),
    sabor_tostado: randInt(3, 5),
    persistencia: randInt(2, 5),
  };

  return {
    id: `seed_${index}_${Math.random().toString(36).slice(2, 8)}`,
    date: d.toISOString(),
    sex: rand(SEX_WEIGHTS),
    diet: rand(DIET_WEIGHTS),
    attrs,
    descriptiveComments: Math.random() < 0.55 ? rand(DESC_SAMPLES) : undefined,
    acceptance,
    liked,
    consumeAgain,
    recommend: Math.max(1, Math.min(5, acceptance + randInt(-1, 1))),
    affectiveComments: Math.random() < 0.55 ? rand(AFF_SAMPLES) : undefined,
  };
}

export function ensureSeed(count = 32): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_KEY)) return;

  const existing = loadSurveys();
  if (existing.length > 0) {
    window.localStorage.setItem(SEED_KEY, "1");
    return;
  }

  const now = Date.now();
  const seeded = Array.from({ length: count }, (_, i) => buildSeedEntry(i, now));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  window.localStorage.setItem(SEED_KEY, "1");
}
