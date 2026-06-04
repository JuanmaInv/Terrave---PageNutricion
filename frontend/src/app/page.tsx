"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import lentilMedallion from "../../public/images/lentil-medallion.jpg";
import {
  ArrowRight,
  Beef,
  Wheat,
  Flame,
  Droplet,
  Leaf,
  Sprout,
  CircleDot,
  Flower,
  Carrot,
  Apple,
  Milk,
} from "lucide-react";
import { Navbar, Footer } from "@/components/nutrilen/Navbar";
import { PageLoader } from "@/components/nutrilen/PageLoader";
import { useRedirectAdminToDashboard } from "@/hooks/useRedirectAdminToDashboard";

const TEST_AUTH_MODE = process.env.NEXT_PUBLIC_E2E_AUTH_MODE === "true";

const nutrients = [
  {
    icon: Flame,
    label: "Calorías",
    value: "160 - 180 kcal",
    color: "var(--moss)",
  },
  {
    icon: Wheat,
    label: "Carbohidratos",
    value: "20g - 24g",
    color: "var(--orange-yellow)",
  },
  {
    icon: Beef,
    label: "Proteínas",
    value: "8g - 11g",
    color: "var(--pumpkin)",
  },
  {
    icon: Droplet,
    label: "Grasas totales",
    value: "5g - 7g",
    color: "var(--vandyke)",
  },
  {
    icon: Leaf,
    label: "Fibra alimentaria",
    value: "6g - 8g",
    color: "var(--moss)",
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
  { title: "Lenteja cocida", text: "Base proteica vegetal de la receta.", icon: CircleDot, color: "var(--moss)" },
  { title: "Avena integral", text: "Aporta fibra y mejora la textura.", icon: Wheat, color: "var(--orange-yellow)" },
  { title: "Cebolla y ajo", text: "Perfil aromático y sabor de fondo.", icon: Flower, color: "var(--moss)" },
  { title: "Zanahoria rallada", text: "Dulzor natural y color equilibrado.", icon: Carrot, color: "var(--pumpkin)" },
  { title: "Salsa de tomate natural", text: "Jugosidad y acidez suave.", icon: Apple, color: "var(--pumpkin)" },
  { title: "Queso magro", text: "Complemento cremoso y proteico.", icon: Milk, color: "var(--orange-yellow)" },
  { title: "Especias y hierbas", text: "Toque final de aroma y frescura.", icon: Leaf, color: "var(--moss)" },
];

export default function Index() {
  if (TEST_AUTH_MODE) {
    return <IndexContent />;
  }

  return <IndexWithRedirect />;
}

function IndexWithRedirect() {
  const { isCheckingRedirect } = useRedirectAdminToDashboard();

  return (
    isCheckingRedirect ? (
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground font-sans">
        <Navbar />
        <PageLoader show />
      </div>
    ) : (
      <IndexContent />
    )
  );
}

function IndexContent() {
  const [heroMouse, setHeroMouse] = useState({ x: 50, y: 50 });

  return (
    <div className="nutri-flow min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <main id="main-content">

      {/* Hero */}
      <section className="relative w-full overflow-hidden">
        <div
          className="relative"
          style={{ ["--mx" as string]: `${heroMouse.x}%`, ["--my" as string]: `${heroMouse.y}%` }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setHeroMouse({ x, y });
          }}
        >
          <Image
            src={lentilMedallion}
            alt="Medallon de lenteja servido en plato de ceramica"
            placeholder="blur"
            priority
            quality={70}
            sizes="100vw"
            className="hero-image-pan h-[72vh] min-h-[420px] w-full object-cover object-center sm:h-[78vh] sm:min-h-[560px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.367_0.062_39)]/88 via-[oklch(0.367_0.062_39)]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.367_0.062_39)]/35 via-[oklch(0.367_0.062_39)]/15 to-transparent" />
          <div className="hero-shimmer absolute inset-0" />
          <div className="hero-cinematic-light absolute inset-0" aria-hidden="true" />

          <div className="absolute inset-0 flex items-end lg:items-center">
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-8 lg:p-10">
              <div className="lg:w-3/5">
                <h1 className="hero-title font-serif text-3xl font-semibold leading-tight tracking-tight text-[oklch(0.955_0.022_84)] min-[420px]:text-4xl sm:text-5xl lg:text-6xl">
                  Medallon de Lenteja Saludable
                </h1>
                <p className="hero-copy mt-4 max-w-xl text-sm leading-relaxed text-[oklch(0.955_0.022_84)]/90 sm:text-lg">
                  El placer de comer con conciencia.
                </p>
                <div className="hero-cta mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/encuesta"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#898C32] px-7 py-3.5 text-sm font-semibold text-[oklch(0.99_0.005_85)] shadow-[0_12px_30px_-12px_oklch(0.12_0.06_38_/_0.7)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#FF6D0E] active:bg-[#FF6D0E] hover:shadow-lg sm:w-auto"
                  >
                    Ir a Encuesta <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#nutricion"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/45 bg-white/12 px-7 py-3.5 text-sm font-semibold text-[oklch(0.955_0.022_84)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:bg-[#FF6D0E] hover:border-[#FF6D0E] sm:w-auto"
                  >
                    Ver informacion
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ingredientes */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:mt-20 sm:px-6 dark:mt-14">
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl animate-reveal-up">
          Ingredientes
        </h2>
        <p className="mt-2 text-sm text-muted-foreground animate-reveal-up dark:text-base" style={{ animationDelay: "0.1s" }}>
          Elaborado con lentejas, avena y vegetales seleccionados.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {ingredients.map((ing) => (
            <div
              key={ing.title}
              className="group feature-card relative py-3 pr-3 pl-4 transition-all duration-400 animate-reveal-up"
              style={{ borderLeft: "3px solid color-mix(in oklab, var(--moss) 35%, transparent)" }}
            >
              <div
                className="feature-card__icon grid h-10 w-10 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 animate-float-soft"
                style={{
                  backgroundColor: `color-mix(in oklab, ${ing.color} 14%, transparent)`,
                  color: ing.color,
                }}
              >
                <ing.icon className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <h3 className="feature-card__title mt-5 font-semibold transition-colors duration-300 group-hover:text-[color:var(--moss)]" style={{ color: "var(--surface-title)" }}>
                {ing.title}
              </h3>
              <p className="feature-card__text mt-2 text-sm leading-relaxed dark:text-base" style={{ color: "var(--surface-text)" }}>
                {ing.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Nutrición */}
      <section id="nutricion" className="mx-auto mt-14 max-w-6xl px-4 sm:mt-20 sm:px-6 scroll-mt-20 dark:mt-14">
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl animate-reveal-up">
          Información nutricional
        </h2>
        <p className="mt-2 text-sm text-muted-foreground animate-reveal-up dark:text-base" style={{ animationDelay: "0.1s" }}>
          Valores aproximados por 100 gramos.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 stagger-children">
          {nutrients.map((n) => (
            <div
              key={n.label}
              className="group feature-card py-3 pr-3 pl-4 transition-all duration-400 animate-reveal-up"
              style={{ borderLeft: "3px solid color-mix(in oklab, var(--orange-yellow) 45%, transparent)" }}
            >
              <div
                className="feature-card__icon grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `color-mix(in oklab, ${n.color} 18%, transparent)`,
                  color: n.color,
                }}
              >
                <n.icon className="h-5 w-5" />
              </div>
              <p className="feature-card__text mt-4 text-sm dark:text-[0.98rem]" style={{ color: "var(--surface-text)" }}>{n.label}</p>
              <p className="feature-card__title mt-1 text-sm font-medium leading-snug dark:text-[1.02rem]" style={{ color: "var(--surface-title)" }}>
                {n.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:mt-20 sm:px-6 dark:mt-14">
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl animate-reveal-up">
          Beneficios del producto
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group feature-card relative py-3 pr-3 pl-4 transition-all duration-400 animate-reveal-up"
              style={{ borderLeft: "3px solid color-mix(in oklab, var(--pumpkin) 45%, transparent)" }}
            >
              <div
                className="feature-card__icon grid h-10 w-10 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 animate-float-soft"
                style={{
                  backgroundColor: `color-mix(in oklab, ${b.color} 14%, transparent)`,
                  color: b.color,
                }}
              >
                <b.icon className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <h3 className="feature-card__title mt-5 font-semibold transition-colors duration-300 group-hover:text-[color:var(--moss)]" style={{ color: "var(--surface-title)" }}>
                {b.title}
              </h3>
              <p className="feature-card__text mt-2 text-sm leading-relaxed dark:text-base" style={{ color: "var(--surface-text)" }}>
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
