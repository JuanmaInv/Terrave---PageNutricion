export type Sex = "femenino" | "masculino" | "otro";
export type Diet = "omnivoro" | "ovo_lacto" | "vegano" | "flexitariano" | "otro";
export type AttrKey =
  | "color"
  | "aroma"
  | "firmeza"
  | "untuosidad"
  | "sabor_tostado"
  | "persistencia";

export const ATTRIBUTES: { key: AttrKey; label: string; family: string; hint: string }[] = [
  { key: "color", label: "Color", family: "Color", hint: "Intensidad del color pardo-dorado" },
  { key: "aroma", label: "Aroma", family: "Olor y aroma", hint: "Intensidad de notas aliáceas/azufradas" },
  { key: "firmeza", label: "Firmeza / Cohesividad", family: "Textura", hint: "Resistencia y cohesión al morder" },
  { key: "untuosidad", label: "Untuosidad", family: "Textura", hint: "Sensación grasa o jugosa en boca" },
  { key: "sabor_tostado", label: "Sabor tostado/cocido", family: "Sabor", hint: "Intensidad del sabor tostado o cocido" },
  { key: "persistencia", label: "Persistencia (Regusto)", family: "Sabor", hint: "Duración del sabor luego de tragar" },
];

export const DIET_OPTIONS: { id: Diet; label: string; color: string; hint: string }[] = [
  { id: "omnivoro", label: "Omnívoro", color: "#898C32", hint: "Consume alimentos de origen animal y vegetal." },
  { id: "ovo_lacto", label: "Ovo-lacto-vegetariano", color: "#F4B223", hint: "No consume carne, pero sí huevo y lácteos." },
  { id: "vegano", label: "Vegano", color: "#FF6D0E", hint: "No consume productos de origen animal." },
  { id: "flexitariano", label: "Flexitariano", color: "#65382B", hint: "Principalmente vegetariano, pero flexible." },
  { id: "otro", label: "Otro", color: "#B89A7A", hint: "Otro tipo de alimentación." },
];

export const SEX_OPTIONS: { id: Sex; label: string; color: string }[] = [
  { id: "femenino", label: "Femenino", color: "#FF6D0E" },
  { id: "masculino", label: "Masculino", color: "#898C32" },
  { id: "otro", label: "Otro / Prefiere no responder", color: "#F4B223" },
];

export const ACCEPTANCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Me disgusta mucho" },
  { value: 2, label: "Me disgusta" },
  { value: 3, label: "Ni me gusta ni me disgusta" },
  { value: 4, label: "Me gusta" },
  { value: 5, label: "Me gusta mucho" },
];

export interface SurveyResponse {
  id: string;
  date: string; // ISO
  sex: Sex;
  diet: Diet;
  attrs: Record<AttrKey, number>; // 1..5
  descriptiveComments?: string;
  acceptance: number; // 1..5
  liked: "si" | "no";
  consumeAgain: "si" | "no" | "tal_vez";
  recommend: number; // 1..5
  affectiveComments?: string;
}

const KEY = "nutrilen.surveys.v2";
const SEED_KEY = "nutrilen.seeded.v2";

export function loadSurveys(): SurveyResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SurveyResponse[];
  } catch {
    return [];
  }
}

export function saveSurvey(s: SurveyResponse) {
  if (typeof window === "undefined") return;
  const all = loadSurveys();
  all.push(s);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function ensureSeed(count = 32) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_KEY)) return;
  const existing = loadSurveys();
  if (existing.length > 0) {
    window.localStorage.setItem(SEED_KEY, "1");
    return;
  }
  const dietWeights: Diet[] = [
    ...Array(14).fill("omnivoro"),
    ...Array(7).fill("ovo_lacto"),
    ...Array(3).fill("vegano"),
    ...Array(6).fill("flexitariano"),
    ...Array(2).fill("otro"),
  ] as Diet[];
  const sexWeights: Sex[] = [
    ...Array(15).fill("femenino"),
    ...Array(14).fill("masculino"),
    ...Array(3).fill("otro"),
  ] as Sex[];
  const now = Date.now();
  const descSamples = [
    "Color dorado muy atractivo, aroma suave.",
    "Buena firmeza al corte, se mantiene cohesivo.",
    "Aroma a especias agradable, sin notas extrañas.",
    "Textura un poco seca en el centro.",
    "Sabor tostado bien logrado, persistente.",
    "Untuosidad media, equilibrada.",
    "Color homogéneo y apetitoso.",
  ];
  const affSamples = [
    "Me gustó mucho la textura y el sabor.",
    "Producto interesante, lo consumiría nuevamente.",
    "Sabor agradable, mejoraría la jugosidad.",
    "Muy bueno como opción saludable.",
    "Recomendable para quienes buscan alternativas vegetales.",
    "Le falta un poco de condimento.",
  ];
  const seeded: SurveyResponse[] = Array.from({ length: count }, (_, i) => {
    const acceptance = Math.random() < 0.78 ? randInt(4, 5) : randInt(1, 3);
    const liked: "si" | "no" = acceptance >= 4 ? "si" : Math.random() < 0.3 ? "si" : "no";
    const consumeAgain: "si" | "no" | "tal_vez" =
      liked === "si" ? (Math.random() < 0.7 ? "si" : "tal_vez") : Math.random() < 0.4 ? "tal_vez" : "no";
    // Skew hours toward lunch/snack times to simulate realistic consumption windows
    const hourPool = [
      8, 9, 10,
      11, 11, 12, 12, 12, 13, 13, 13, 14, 14,
      15, 16, 16,
      17, 18, 18, 19, 19, 20, 20, 21,
    ];
    const hour = rand(hourPool);
    const minute = randInt(0, 59);
    const dayOffset = randInt(0, 25);
    const d = new Date(now - dayOffset * 86400000);
    d.setHours(hour, minute, 0, 0);
    return {
      id: `seed_${i}_${Math.random().toString(36).slice(2, 8)}`,
      date: d.toISOString(),
      sex: rand(sexWeights),
      diet: rand(dietWeights),
      attrs: {
        color: randInt(3, 5),
        aroma: randInt(2, 5),
        firmeza: randInt(3, 5),
        untuosidad: randInt(2, 5),
        sabor_tostado: randInt(3, 5),
        persistencia: randInt(2, 5),
      },
      descriptiveComments: Math.random() < 0.55 ? rand(descSamples) : undefined,
      acceptance,
      liked,
      consumeAgain,
      recommend: Math.max(1, Math.min(5, acceptance + randInt(-1, 1))),
      affectiveComments: Math.random() < 0.55 ? rand(affSamples) : undefined,
    };
  });
  window.localStorage.setItem(KEY, JSON.stringify(seeded));
  window.localStorage.setItem(SEED_KEY, "1");
}

export function clearAllSurveys() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(SEED_KEY);
}