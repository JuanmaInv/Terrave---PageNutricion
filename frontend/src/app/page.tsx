"use client";

import Link from "next/link";
import {
  ArrowRight,
  Beef,
  Wheat,
  Flame,
  Droplet,
  Leaf,
  Heart,
  Sparkles,
  Sprout,
  CircleDot,
  Flower,
  Carrot,
  Apple,
  Milk,
} from "lucide-react";
import { Navbar, Footer } from "@/components/nutrilen/Navbar";

const nutrients = [
  {
    icon: Beef,
    label: "Proteínas",
    value: "Aporte proteico vegetal",
    color: "var(--moss)",
  },
  {
    icon: Wheat,
    label: "Fibra",
    value: "Fuente de fibra alimentaria",
    color: "var(--orange-yellow)",
  },
  {
    icon: Flame,
    label: "Energía",
    value: "Valor energético equilibrado",
    color: "var(--pumpkin)",
  },
  {
    icon: Droplet,
    label: "Grasas",
    value: "Bajo contenido lipídico",
    color: "var(--vandyke)",
  },
];

const benefits = [
  {
    icon: Beef,
    title: "Proteína completa",
    text: "Complementación proteica entre lentejas y avena.",
    color: "var(--moss)",
  },
  {
    icon: Wheat,
    title: "Fuente de fibra",
    text: "Rico en fibra y carbohidratos complejos.",
    color: "var(--orange-yellow)",
  },
  {
    icon: Leaf,
    title: "Apto ovo-lacto vegetariano",
    text: "Sin carne, con huevo y queso como complemento.",
    color: "var(--pumpkin)",
  },
  {
    icon: Sprout,
    title: "Producción sustentable",
    text: "Desarrollado con baja huella hídrica y de carbono.",
    color: "var(--vandyke)",
  },
];

const ingredients = [
  { label: "Lenteja cocida", icon: CircleDot },
  { label: "Avena integral", icon: Wheat },
  { label: "Cebolla y ajo", icon: Flower },
  { label: "Zanahoria rallada", icon: Carrot },
  { label: "Salsa de tomate natural", icon: Apple },
  { label: "Queso magro", icon: Milk },
  { label: "Especias y hierbas", icon: Leaf },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-reveal-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--cream-deep)] px-3 py-1 text-xs font-medium text-[color:var(--vandyke)]">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--pumpkin)]" />
              NutriLen
            </span>
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-tight text-[color:var(--vandyke)] sm:text-5xl lg:text-6xl">
              Medallón de Lenteja Saludable
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Una propuesta nutritiva y sustentable desarrollada a base de
              lentejas, avena y vegetales.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/encuesta"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--moss)] px-6 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--pumpkin)] hover:shadow-lg hover:-translate-y-0.5"
              >
                Ir a Encuesta <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#nutricion"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-6 py-3 text-sm font-medium text-muted-foreground transition hover:text-[color:var(--vandyke)] hover:border-[color:var(--vandyke)]/40 hover:-translate-y-0.5"
              >
                Ver información
              </a>
            </div>
          </div>
          <div className="relative animate-reveal-up" style={{ animationDelay: "0.2s" }}>
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[color:var(--orange-yellow)]/30 to-[color:var(--pumpkin)]/20 blur-2xl" />
            <img
              src="/images/lentil-medallion.jpg"
              alt="Medallón de lenteja servido en plato de cerámica"
              width={1280}
              height={896}
              className="relative w-full rounded-[2rem] object-cover shadow-[var(--shadow-soft)]"
            />
          </div>
        </div>
      </section>

      {/* Nutrición */}
      <section id="nutricion" className="mx-auto max-w-6xl px-4 sm:px-6 scroll-mt-20">
        <h2 className="font-serif text-2xl font-semibold text-[color:var(--vandyke)] sm:text-3xl animate-reveal-up">
          Información nutricional
        </h2>
        <p className="mt-2 text-sm text-muted-foreground animate-reveal-up" style={{ animationDelay: "0.1s" }}>
          Valores aproximados por porción de 100 g.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {nutrients.map((n) => (
            <div
              key={n.label}
              className="group rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[color:var(--moss)]/30 animate-reveal-up"
            >
              <div
                className="grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `color-mix(in oklab, ${n.color} 18%, transparent)`,
                  color: n.color,
                }}
              >
                <n.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{n.label}</p>
              <p className="mt-1 text-sm font-medium leading-snug text-[color:var(--vandyke)]">
                {n.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <h2 className="font-serif text-2xl font-semibold text-[color:var(--vandyke)] sm:text-3xl animate-reveal-up">
          Beneficios del producto
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group relative rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] border border-border/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[color:var(--moss)]/40 animate-reveal-up"
            >
              {/* soft top accent line */}
              <div
                className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ backgroundColor: b.color }}
              />
              <div
                className="grid h-12 w-12 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 animate-float-soft"
                style={{
                  backgroundColor: `color-mix(in oklab, ${b.color} 14%, transparent)`,
                  color: b.color,
                }}
              >
                <b.icon className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <h3 className="mt-5 font-semibold text-[color:var(--vandyke)] transition-colors duration-300 group-hover:text-[color:var(--moss)]">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Ingredientes */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-[var(--shadow-card)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div className="animate-reveal-up">
              <h2 className="font-serif text-2xl font-semibold text-[color:var(--vandyke)] sm:text-3xl">
                Ingredientes
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Elaborado con lentejas, avena y vegetales seleccionados.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--cream-deep)] px-3 py-1 text-xs font-medium text-[color:var(--vandyke)]">
                <Heart className="h-3.5 w-3.5 text-[color:var(--pumpkin)]" />
                Ingredientes seleccionados
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 stagger-children">
              {ingredients.map((ing) => (
                <li
                  key={ing.label}
                  className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[color:var(--orange-yellow)]/40 hover:bg-card animate-reveal-up"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: "color-mix(in oklab, var(--moss) 14%, transparent)",
                      color: "var(--moss)",
                    }}
                  >
                    <ing.icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="text-sm font-medium text-[color:var(--vandyke)] transition-colors duration-300 group-hover:text-[color:var(--moss)]">
                    {ing.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

