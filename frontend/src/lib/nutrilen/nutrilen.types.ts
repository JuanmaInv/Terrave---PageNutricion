/**
 * Domain types and configuration constants for TERRAVÉ surveys.
 * Pattern: SRP — only types and read-only config live here.
 */

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
