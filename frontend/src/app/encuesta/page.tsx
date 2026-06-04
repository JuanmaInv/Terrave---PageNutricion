"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar, Footer } from "@/components/nutrilen/Navbar";
import { PageLoader, useNavLoader } from "@/components/nutrilen/PageLoader";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Send,
  Palette,
  Wind,
  Hand,
  Droplets,
  Utensils,
  Clock,
  User,
  Salad,
  CalendarDays,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ACCEPTANCE_OPTIONS,
  ATTRIBUTES,
  DIET_OPTIONS,
  SEX_OPTIONS,
  type AttrKey,
  type Diet,
  type Sex,
  type SurveyResponse,
} from "@/lib/nutrilen";
import {
  actualizarSesionEncuesta,
  crearSesionEncuesta,
  enviarEncuesta,
  type SurveySessionDraft,
} from "@/lib/api";
import { useRedirectAdminToDashboard } from "@/hooks/useRedirectAdminToDashboard";
import {
  sanitizeWillingnessToPay,
  validateSurveyStepOne,
  validateSurveySubmission,
} from "@/lib/survey/survey-validation";

const TEST_AUTH_MODE = process.env.NEXT_PUBLIC_E2E_AUTH_MODE === "true";
const ATTR_ICONS: Record<AttrKey, React.ComponentType<{ className?: string }>> = {
  color: Palette,
  aroma: Wind,
  firmeza: Hand,
  untuosidad: Droplets,
  sabor_tostado: Utensils,
  persistencia: Clock,
};

const STEPS = [
  { id: 1, title: "Datos generales", icon: User },
  { id: 2, title: "Evaluacion descriptiva", icon: Salad },
  { id: 3, title: "Evaluacion afectiva", icon: Sparkles },
] as const;

const SURVEY_SESSION_STORAGE_KEY = "nutrilen.activeSurveySessionId";
const SURVEY_CLIENT_SESSION_KEY = "nutrilen.clientSurveySessionKey";
const AUTOSAVE_DELAY_MS = 800;
const CAN_TRACK_PROGRESS = Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8" aria-label="Progreso de la encuesta" role="list">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div
              key={s.id}
              className="flex flex-1 items-center gap-2"
              role="listitem"
              aria-current={active ? "step" : undefined}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold transition-all ${
                    done
                      ? "border-[color:var(--moss)] bg-[color:var(--moss)] text-[color:var(--primary-foreground)]"
                      : active
                        ? "border-[color:var(--pumpkin)] bg-[color:var(--pumpkin)] text-white shadow-[var(--shadow-soft)]"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span
                  className={`hidden text-[11px] font-medium uppercase tracking-wide sm:block ${
                    active ? "text-[color:var(--vandyke)]" : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-[color:var(--moss)] transition-all duration-500"
                    style={{ width: step > s.id ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function ChoiceCard<T extends string>({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { id: T; label: string; color: string; hint?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  cols?: 2 | 3;
}) {
  return (
    <div className={`grid gap-3 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {options.map((o) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={selected}
            className="flex items-start gap-3 rounded-2xl border bg-background/60 p-4 text-left transition hover:-translate-y-0.5"
            style={{
              borderColor: selected
                ? `color-mix(in oklab, ${o.color} 90%, transparent)`
                : undefined,
              backgroundColor: selected
                ? `color-mix(in oklab, ${o.color} 10%, transparent)`
                : undefined,
              boxShadow: selected ? "var(--shadow-card)" : undefined,
            }}
          >
            <span
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition"
              style={{
                borderColor: selected
                  ? o.color
                  : "color-mix(in oklab, var(--vandyke) 30%, transparent)",
              }}
            >
              {selected && (
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: o.color }} />
              )}
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--vandyke)]">
                {o.label}
              </span>
              {o.hint && <span className="block text-xs text-muted-foreground">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SliderCard({
  attrKey,
  label,
  hint,
  family,
  value,
  onChange,
}: {
  attrKey: AttrKey;
  label: string;
  hint: string;
  family: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const Icon = ATTR_ICONS[attrKey];
  const pct = ((value - 1) / 4) * 100;
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color:var(--pumpkin)]/12 text-[color:var(--pumpkin)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--moss)]">
                {family}
              </p>
              <h3 className="font-semibold text-[color:var(--vandyke)]">{label}</h3>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <p className="font-serif text-2xl font-semibold leading-none text-[color:var(--pumpkin)]">
              {value}
              <span className="text-sm font-medium text-muted-foreground">/5</span>
            </p>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="nutri-slider mt-4 w-full"
            style={{
              background: `linear-gradient(to right, var(--pumpkin) 0%, var(--pumpkin) ${pct}%, color-mix(in oklab, var(--pumpkin) 18%, transparent) ${pct}%, color-mix(in oklab, var(--pumpkin) 18%, transparent) 100%)`,
            }}
          />
          <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function EncuestaPage() {
  if (TEST_AUTH_MODE) {
    return <EncuestaPageContent />;
  }

  return <EncuestaPageWithRedirect />;
}

function EncuestaPageWithRedirect() {
  const { isCheckingRedirect } = useRedirectAdminToDashboard();

  if (isCheckingRedirect) {
    return (
      <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-background text-foreground font-sans">
        <Navbar />
        <PageLoader show />
      </div>
    );
  }

  return <EncuestaPageContent />;
}

function EncuestaPageContent() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingSession, setIsSyncingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (!CAN_TRACK_PROGRESS || typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(SURVEY_SESSION_STORAGE_KEY);
  });
  const [clientSessionKey, setClientSessionKey] = useState(() => {
    if (!CAN_TRACK_PROGRESS || typeof window === "undefined") {
      return "";
    }

    let localKey = window.localStorage.getItem(SURVEY_CLIENT_SESSION_KEY);
    if (!localKey) {
      localKey = crypto.randomUUID();
      window.localStorage.setItem(SURVEY_CLIENT_SESSION_KEY, localKey);
    }

    return localKey;
  });
  const sessionIdRef = useRef<string | null>(null);
  const sessionCreateInFlightRef = useRef(false);
  const { show: showLoader, run: runWithLoader } = useNavLoader(1200);

  // Step 1
  const [sex, setSex] = useState<Sex | null>(null);
  const [diet, setDiet] = useState<Diet | null>(null);
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  // Step 2
  const [attrs, setAttrs] = useState<Record<AttrKey, number>>({
    color: 3,
    aroma: 3,
    firmeza: 3,
    untuosidad: 3,
    sabor_tostado: 3,
    persistencia: 3,
  });
  const [descriptiveComments, setDescriptiveComments] = useState("");

  // Step 3
  const [acceptance, setAcceptance] = useState<number | null>(null);
  const [liked, setLiked] = useState<"si" | "no" | null>(null);
  const [consumeAgain, setConsumeAgain] = useState<"si" | "no" | "tal_vez" | null>(null);
  const [recommend, setRecommend] = useState(3);
  const [willingnessToPay, setWillingnessToPay] = useState("");
  const [affectiveComments, setAffectiveComments] = useState("");

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const hasStartedSurvey =
    step > 1 ||
    sex !== null ||
    diet !== null ||
    descriptiveComments.trim().length > 0 ||
    acceptance !== null ||
    liked !== null ||
    consumeAgain !== null ||
    willingnessToPay.trim().length > 0 ||
    affectiveComments.trim().length > 0;

  const sessionDraft = useMemo<SurveySessionDraft>(
    () => ({
      clientSessionKey,
      currentStep: step,
      sex: sex ?? undefined,
      diet: diet ?? undefined,
      attrs: step > 1 ? attrs : undefined,
      descriptiveComments: descriptiveComments || undefined,
      acceptance: acceptance ?? undefined,
      liked: liked ?? undefined,
      consumeAgain: consumeAgain ?? undefined,
      recommend: step === 3 ? recommend : undefined,
      willingnessToPay: willingnessToPay || undefined,
      affectiveComments: affectiveComments || undefined,
    }),
    [
      acceptance,
      affectiveComments,
      clientSessionKey,
      attrs,
      descriptiveComments,
      diet,
      liked,
      recommend,
      sex,
      step,
      consumeAgain,
      willingnessToPay,
    ],
  );

  useEffect(() => {
    if (!CAN_TRACK_PROGRESS || !clientSessionKey || !hasStartedSurvey || submitted) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      if (sessionCreateInFlightRef.current) return;

      setIsSyncingSession(true);
      try {
        const currentSessionId = sessionIdRef.current;

        if (!currentSessionId) {
          sessionCreateInFlightRef.current = true;
          const created = await crearSesionEncuesta(sessionDraft);
          if (cancelled) return;
          sessionIdRef.current = created.id;
          setSessionId(created.id);
          window.localStorage.setItem(SURVEY_SESSION_STORAGE_KEY, created.id);
          return;
        }

        await actualizarSesionEncuesta(currentSessionId, sessionDraft);
      } catch (error) {
        console.error("Survey session autosave failed:", error);
      } finally {
        sessionCreateInFlightRef.current = false;
        setIsSyncingSession(false);
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [clientSessionKey, hasStartedSurvey, sessionDraft, submitted]);

  function next() {
    if (step === 1) {
      const error = validateSurveyStepOne({ sex, diet });
      if (error) {
        toast.error(error);
        return;
      }
    }
    runWithLoader(() => {
      setStep((s) => Math.min(3, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  function prev() {
    runWithLoader(() => {
      setStep((s) => Math.max(1, s - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    const error = validateSurveySubmission({
      sex,
      diet,
      attrs,
      acceptance,
      liked,
      consumeAgain,
      recommend,
      willingnessToPay,
    });

    if (error) {
      toast.error(error);
      if (error === "Faltan datos generales.") {
        setStep(1);
      }
      return;
    }
    const selectedSex = sex as Sex;
    const selectedDiet = diet as Diet;
    const selectedAcceptance = acceptance as number;
    const selectedLiked = liked as "si" | "no";
    const selectedConsumeAgain = consumeAgain as "si" | "no" | "tal_vez";

    const survey: SurveyResponse = {
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionId: sessionId ?? undefined,
      date: new Date().toISOString(),
      sex: selectedSex,
      diet: selectedDiet,
      attrs,
      descriptiveComments,
      acceptance: selectedAcceptance,
      liked: selectedLiked,
      consumeAgain: selectedConsumeAgain,
      recommend,
      willingnessToPay,
      affectiveComments,
    };
    setIsSubmitting(true);
    runWithLoader(async () => {
      try {
        await enviarEncuesta(survey);
        if (CAN_TRACK_PROGRESS) {
          window.localStorage.removeItem(SURVEY_SESSION_STORAGE_KEY);
          const nextClientSessionKey = crypto.randomUUID();
          window.localStorage.setItem(SURVEY_CLIENT_SESSION_KEY, nextClientSessionKey);
          setClientSessionKey(nextClientSessionKey);
        }
        sessionIdRef.current = null;
        sessionCreateInFlightRef.current = false;
        setSessionId(null);
        toast.success("Evaluación enviada correctamente");
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "Error desconocido al enviar la encuesta.";
        toast.error(`No se pudo enviar la encuesta. ${detail}`);
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
        <Navbar />
        <PageLoader show={showLoader} />
        <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-20 text-center sm:px-6">
          <div className="nutri-success-motion relative">
            <div
              className="nutri-success-pulse absolute inset-0 rounded-full bg-[color:var(--moss)]/28"
              style={{ animation: "success-pulse 1.8s ease-in-out infinite" }}
            />
            <div
              className="nutri-success-orbit absolute inset-0 -m-3 rounded-full opacity-55"
              style={{
                background:
                  "conic-gradient(from 0deg, var(--moss), var(--orange-yellow), var(--pumpkin), var(--moss))",
                filter: "blur(10px)",
                animation: "success-orbit 2.8s linear infinite",
              }}
            />
            <div
              className="nutri-success-breathe relative grid h-24 w-24 place-items-center rounded-full bg-[color:var(--moss)] text-white shadow-[var(--shadow-soft)]"
              style={{ animation: "success-breathe 1.8s ease-in-out infinite" }}
            >
              <CheckCircle2 className="h-12 w-12" strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="mt-8 font-serif text-4xl font-semibold text-[color:var(--vandyke)] sm:text-5xl">
            ¡Gracias por participar!
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Tu evaluación sensorial fue registrada correctamente. Es un aporte clave para mejorar
            el medallón de lenteja.
          </p>
          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-[color:var(--moss)] px-7 py-3.5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--pumpkin)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </main>
        <style>{`
          @keyframes success-pulse {
            0%, 100% { transform: scale(0.9); opacity: 0.2; }
            50% { transform: scale(1.16); opacity: 0.38; }
          }
          @keyframes success-breathe {
            0%, 100% { transform: scale(1); box-shadow: var(--shadow-soft); }
            50% { transform: scale(1.06); box-shadow: 0 18px 36px -18px color-mix(in oklab, var(--moss) 58%, transparent); }
          }
          @keyframes success-orbit {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.04); }
            100% { transform: rotate(360deg) scale(1); }
          }
        `}</style>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Navbar />
      <PageLoader show={showLoader} />
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-3 py-8 sm:px-6 lg:py-14">
        <div className="sr-only" aria-live="polite">
          {isSyncingSession ? "Guardando avance de la encuesta." : "Avance de encuesta sincronizado."}
        </div>
        <header className="text-center">
          <span className="inline-block rounded-full bg-[color:var(--orange-yellow)]/25 px-3 py-1 text-xs font-medium text-[color:var(--vandyke)]">
            Evaluacion sensorial - Paso {step} de 3
          </span>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[color:var(--vandyke)] sm:text-4xl">
            {STEPS[step - 1].title}
          </h1>
        </header>

        <div className="mt-10">
          <StepIndicator step={step} />

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <Card>
                  <h3 className="font-semibold text-[color:var(--vandyke)]">Sexo biológico</h3>
                  <p className="text-xs text-muted-foreground">
                    Información demográfica básica para el análisis.
                  </p>
                  <div className="mt-4">
                    <ChoiceCard
                      options={SEX_OPTIONS.map((o) => ({ ...o }))}
                      value={sex}
                      onChange={setSex}
                      cols={3}
                    />
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-[color:var(--vandyke)]">Tipo de dieta</h3>
                  <p className="text-xs text-muted-foreground">
                    ¿Qué tipo de alimentación seguís habitualmente?
                  </p>
                  <div className="mt-4">
                    <ChoiceCard
                      options={DIET_OPTIONS.map((o) => ({ ...o }))}
                      value={diet}
                      onChange={setDiet}
                    />
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--orange-yellow)]/20 text-[color:var(--orange-yellow)]">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Fecha actual
                      </p>
                      <p className="font-serif text-lg font-semibold text-[color:var(--vandyke)]">
                        {today}
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {step === 2 && (
              <>
                <Card className="!p-5">
                  <p className="text-sm text-muted-foreground">
                    Evalúe la intensidad de los siguientes atributos utilizando una escala del{" "}
                    <strong className="text-[color:var(--vandyke)]">1 al 5</strong>.
                  </p>
                </Card>
                {ATTRIBUTES.map((a) => (
                  <SliderCard
                    key={a.key}
                    attrKey={a.key}
                    label={a.label}
                    hint={a.hint}
                    family={a.family}
                    value={attrs[a.key]}
                    onChange={(v) => setAttrs((s) => ({ ...s, [a.key]: v }))}
                  />
                ))}
                <Card>
                  <h3 className="font-semibold text-[color:var(--vandyke)]">
                    Cuanto estas dispuesto a pagar por el producto? (en pesos)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Escribi solo un valor numerico estimado en pesos.
                  </p>
                  <input
                    aria-label="Monto estimado a pagar por el producto en pesos"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={willingnessToPay}
                    onChange={(e) => setWillingnessToPay(sanitizeWillingnessToPay(e.target.value))}
                    placeholder="Ej.: 4500"
                    className="mt-3 w-full rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-[color:var(--vandyke)] placeholder:text-muted-foreground/70 focus:border-[color:var(--pumpkin)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pumpkin)]/30"
                  />
                </Card>

                <Card>
                  <h3 className="font-semibold text-[color:var(--vandyke)]">
                    Comentarios / Observaciones
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Detalle cualquier otra nota sensorial detectada, interferencias o anomalías en
                    el perfil del producto.
                  </p>
                  <textarea
                    aria-label="Comentarios descriptivos sobre el producto"
                    value={descriptiveComments}
                    onChange={(e) => setDescriptiveComments(e.target.value)}
                    rows={4}
                    placeholder="Notas adicionales sobre el perfil sensorial…"
                    className="mt-3 w-full resize-none rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-[color:var(--vandyke)] placeholder:text-muted-foreground/70 focus:border-[color:var(--pumpkin)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pumpkin)]/30"
                  />
                </Card>
              </>
            )}

            {step === 3 && (
              <>
                <Card>
                  <h3 className="font-semibold text-[color:var(--vandyke)]">Aceptación global</h3>
                  <p className="text-xs text-muted-foreground">
                    Indique su nivel de aceptación general del producto.
                  </p>
                  <div className="mt-4 grid gap-2">
                    {ACCEPTANCE_OPTIONS.map((o) => {
                      const selected = acceptance === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setAcceptance(o.value)}
                          className="flex items-center justify-between gap-3 rounded-2xl border bg-background/60 px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5"
                          style={{
                            borderColor: selected
                              ? "color-mix(in oklab, var(--moss) 90%, transparent)"
                              : undefined,
                            backgroundColor: selected
                              ? "color-mix(in oklab, var(--moss) 12%, transparent)"
                              : undefined,
                            color: "var(--vandyke)",
                          }}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className="grid h-5 w-5 place-items-center rounded-full border-2 transition"
                              style={{
                                borderColor: selected
                                  ? "var(--moss)"
                                  : "color-mix(in oklab, var(--vandyke) 30%, transparent)",
                              }}
                            >
                              {selected && (
                                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--moss)]" />
                              )}
                            </span>
                            {o.label}
                          </span>
                          <span className="font-serif text-base font-semibold text-[color:var(--moss)]">
                            {o.value}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-[color:var(--vandyke)]">
                    ¿Te gustó el producto?
                  </h3>
                  <p className="text-xs text-muted-foreground">Tu impresión general inmediata.</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    {(
                      [
                        { id: "si", label: "Sí", color: "#3FAA5A", Icon: ThumbsUp },
                        { id: "no", label: "No", color: "#D94B4B", Icon: ThumbsDown },
                      ] as const
                    ).map((o) => {
                      const selected = liked === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setLiked(o.id)}
                          aria-pressed={selected}
                          className={`group inline-flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                            selected
                              ? "scale-[1.02] text-white shadow-[var(--shadow-soft)]"
                              : "bg-card hover:-translate-y-0.5"
                          }`}
                          style={{
                            borderColor: o.color,
                            backgroundColor: selected
                              ? o.color
                              : `color-mix(in oklab, ${o.color} 8%, transparent)`,
                            color: selected ? "#fff" : o.color,
                          }}
                        >
                          <o.Icon className={`h-4 w-4 transition-transform ${selected ? "scale-110" : "group-hover:scale-110"}`} />
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-[color:var(--vandyke)]">
                    ¿Consumirías nuevamente este producto?
                  </h3>
                  <p className="text-xs text-muted-foreground">Intención de recompra del producto.</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 min-[520px]:grid-cols-3">
                    {(
                      [
                        { id: "si", label: "Sí", color: "#3FAA5A", Icon: ThumbsUp },
                        { id: "tal_vez", label: "Tal vez", color: "#F4B223", Icon: HelpCircle },
                        { id: "no", label: "No", color: "#D94B4B", Icon: ThumbsDown },
                      ] as const
                    ).map((o) => {
                      const selected = consumeAgain === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setConsumeAgain(o.id)}
                          aria-pressed={selected}
                          className={`group inline-flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3.5 text-sm font-semibold transition-all duration-200 ${
                            selected
                              ? "scale-[1.02] text-white shadow-[var(--shadow-soft)]"
                              : "bg-card hover:-translate-y-0.5"
                          }`}
                          style={{
                            borderColor: o.color,
                            backgroundColor: selected
                              ? o.color
                              : `color-mix(in oklab, ${o.color} 8%, transparent)`,
                            color: selected ? "#fff" : o.color,
                          }}
                        >
                          <o.Icon className={`h-4 w-4 transition-transform ${selected ? "scale-110" : "group-hover:scale-110"}`} />
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[color:var(--vandyke)]">
                        ¿Recomendarías este producto?
                      </h3>
                      <p className="text-xs text-muted-foreground">Muy poco (1) → Mucho (5)</p>
                    </div>
                    <p className="font-serif text-2xl font-semibold text-[color:var(--pumpkin)]">
                      {recommend}
                      <span className="text-sm font-medium text-muted-foreground">/5</span>
                    </p>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={recommend}
                    onChange={(e) => setRecommend(Number(e.target.value))}
                    className="nutri-slider mt-4 w-full"
                    style={{
                      background: `linear-gradient(to right, var(--pumpkin) 0%, var(--pumpkin) ${((recommend - 1) / 4) * 100}%, color-mix(in oklab, var(--pumpkin) 18%, transparent) ${((recommend - 1) / 4) * 100}%, color-mix(in oklab, var(--pumpkin) 18%, transparent) 100%)`,
                    }}
                  />
                  <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span>Muy poco</span>
                    <span>Mucho</span>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-[color:var(--vandyke)]">
                    Comentarios / Observaciones
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Agregue cualquier comentario sobre qué le gustó o disgustó del producto.
                  </p>
                  <textarea
                    aria-label="Comentarios afectivos sobre el producto"
                    value={affectiveComments}
                    onChange={(e) => setAffectiveComments(e.target.value)}
                    rows={4}
                    placeholder="Tu experiencia general con el producto…"
                    className="mt-3 w-full resize-none rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-[color:var(--vandyke)] placeholder:text-muted-foreground/70 focus:border-[color:var(--pumpkin)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pumpkin)]/30"
                  />
                </Card>
              </>
            )}

            <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={prev}
                disabled={step === 1 || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--vandyke)]/20 bg-card px-5 py-3 text-sm font-semibold text-[color:var(--vandyke)] transition hover:border-[color:var(--vandyke)]/40 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--moss)] px-7 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--pumpkin)] sm:w-auto"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--moss)] px-7 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--pumpkin)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar evaluación
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
