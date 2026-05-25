"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar, Footer } from "@/components/nutrilen/Navbar";
import { PageLoader, useNavLoader } from "@/components/nutrilen/PageLoader";
import { toast } from "sonner";
import { SignedIn, SignedOut, SignIn, useUser } from "@clerk/nextjs";
import {
  Users,
  ClipboardCheck,
  Star,
  ThumbsUp,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Filter,
  Heart,
  MessageSquareQuote,
  MessageCircle,
  Clock,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Area,
  ComposedChart,
} from "recharts";
import {
  ATTRIBUTES,
  DIET_OPTIONS,
  SEX_OPTIONS,
  ensureSeed,
  loadSurveys,
  type AttrKey,
  type Diet,
  type Sex,
  type SurveyResponse,
} from "@/lib/nutrilen";
import {
    descargarBlob,
  exportarPDF,
  exportarExcel,
} from "@/lib/api";

export default function AdminRoute() {
  return (
    <ClientOnly fallback={null}>
      <AdminGate />
    </ClientOnly>
  );
}

function AdminGate() {
  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-4">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <h1 className="font-serif text-2xl font-semibold text-foreground">NutriLen · Panel admin</h1>
              <p className="mt-1 text-sm text-muted-foreground">Iniciá sesión para acceder a las estadísticas.</p>
            </div>
            <SignIn
              routing="hash"
              forceRedirectUrl="/administrador"
              fallbackRedirectUrl="/administrador"
              signUpForceRedirectUrl="/administrador"
              signUpFallbackRedirectUrl="/administrador"
            />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <AdminAuthorized />
      </SignedIn>
    </>
  );
}

function AdminAuthorized() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const hasEmailAccess = Boolean(email && adminEmails.includes(email));

  if (role !== "admin" && !hasEmailAccess) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-20">
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Esta sección es solo para el equipo NutriLen</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Tu cuenta no tiene permisos para visualizar el panel de estadísticas.
              Si sos parte del equipo y necesitás acceso, contactá al administrador del proyecto.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  return <AdminPage />;
}

const VANDYKE = "#65382B";
const MOSS = "#898C32";
const PUMPKIN = "#FF6D0E";
const ORANGE = "#F4B223";

function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : <>{fallback}</>;
}

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function AnimatedBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 60 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-[color:var(--cream-deep)]">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{ width: `${w}%`, backgroundColor: color }}
      />
    </div>
  );
}

function AdminPage() {
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<SurveyResponse[]>([]);
  const { show: showLoader, run: runWithLoader, setShow: setLoader } = useNavLoader(1200);

  const [fDiet, setFDiet] = useState<Diet | "all">("all");
  const [fSex, setFSex] = useState<Sex | "all">("all");
  const [fFrom, setFFrom] = useState<string>("");
  const [fTo, setFTo] = useState<string>("");

  const [activeAttrs, setActiveAttrs] = useState<AttrKey[]>(ATTRIBUTES.map((a) => a.key));

  useEffect(() => {
    ensureSeed();
    setData(loadSurveys());
  }, [tick]);

  // Initial mount loader (navigation feel)
  useEffect(() => {
    setLoader(true);
    const t = window.setTimeout(() => setLoader(false), 1200);
    return () => window.clearTimeout(t);
  }, [setLoader]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (fDiet !== "all" && d.diet !== fDiet) return false;
      if (fSex !== "all" && d.sex !== fSex) return false;
      const t = new Date(d.date).getTime();
      if (fFrom && t < new Date(fFrom).getTime()) return false;
      if (fTo && t > new Date(fTo).getTime() + 86400000) return false;
      return true;
    });
  }, [data, fDiet, fSex, fFrom, fTo]);

  const total = filtered.length;

  function avg(attr: AttrKey) {
    if (!filtered.length) return 0;
    const v = filtered.reduce((s, d) => s + (d.attrs[attr] ?? 0), 0) / filtered.length;
    return Math.round(v * 10) / 10;
  }

  const sensorial = ATTRIBUTES.map((a) => ({ key: a.key, metric: a.label, value: avg(a.key) }));
  // Radar: only include selected attributes (so deselected ones disappear entirely)
  const radarData = sensorial.filter((d) => activeAttrs.includes(d.key));
  const barsData = radarData;

  const globalScore =
    sensorial.length === 0
      ? 0
      : Math.round(
          (sensorial.reduce((s, d) => s + d.value, 0) / sensorial.length) * 10,
        ) / 10;

  const likedYes = filtered.filter((d) => d.liked === "si").length;
  const acceptancePct =
    total === 0 ? 0 : Math.round((likedYes / total) * 100);

  const dietDist = DIET_OPTIONS.map((d) => {
    const count = filtered.filter((x) => x.diet === d.id).length;
    return {
      id: d.id,
      name: d.label,
      value: count,
      pct: total ? Math.round((count / total) * 100) : 0,
      color: d.color,
    };
  });

  const sexDist = SEX_OPTIONS.map((s) => {
    const count = filtered.filter((x) => x.sex === s.id).length;
    return {
      id: s.id,
      name: s.label,
      value: count,
      pct: total ? Math.round((count / total) * 100) : 0,
      color: s.color,
    };
  });

  // Frecuencia de respuestas por hora del día (0–23)
  const hourlyDist = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, "0")}h`,
      count: 0,
    }));
    filtered.forEach((r) => {
      const h = new Date(r.date).getHours();
      if (!Number.isNaN(h)) buckets[h].count += 1;
    });
    return buckets;
  }, [filtered]);
  const peakHour = hourlyDist.reduce(
    (best, cur) => (cur.count > best.count ? cur : best),
    hourlyDist[0],
  );
  const hasHourly = hourlyDist.some((h) => h.count > 0);

  const dietAcceptance = DIET_OPTIONS.map((d) => {
    const group = filtered.filter((x) => x.diet === d.id);
    const yes = group.filter((x) => x.liked === "si").length;
    return {
      name: d.label,
      value: group.length ? Math.round((yes / group.length) * 100) : 0,
      color: d.color,
      count: group.length,
    };
  }).filter((x) => x.count > 0);

  const sorted = [...sensorial].sort((a, b) => b.value - a.value);
  const bestAttr = sorted[0];
  const worstAttr = sorted[sorted.length - 1];

  const descriptiveCommentsList = filtered
    .filter((d) => d.descriptiveComments && d.descriptiveComments.trim().length > 0)
    .slice(-12)
    .reverse();
  const affectiveCommentsList = filtered
    .filter((d) => d.affectiveComments && d.affectiveComments.trim().length > 0)
    .slice(-12)
    .reverse();

  const animCount = useCountUp(acceptancePct);

  function refresh() {
    runWithLoader(() => {
      setTick((t) => t + 1);
      toast.success("Estadísticas actualizadas");
    });
  }

  function clearFilters() {
    setFDiet("all");
    setFSex("all");
    setFFrom("");
    setFTo("");
  }

  const hasFilters = fDiet !== "all" || fSex !== "all" || fFrom || fTo;

  const lastUpdate = new Date().toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <PageLoader show={showLoader} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-[color:var(--orange-yellow)]/25 px-3 py-1 text-xs font-medium text-[color:var(--vandyke)]">
              Panel administrativo
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[color:var(--vandyke)] sm:text-5xl">
              Resultados de la evaluación
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Dashboard académico de análisis sensorial del medallón de lenteja.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--moss)] px-4 py-2 text-xs font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--pumpkin)] disabled:opacity-50"
              disabled={showLoader}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${showLoader ? "animate-spin" : ""}`} />
              {showLoader ? "Actualizando..." : "Actualizar"}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const blob = await exportarPDF(filtered);
                  descargarBlob(blob, `nutrilen-dashboard-${Date.now()}.pdf`);
                  toast.success("PDF descargado");
                } catch {
                  toast.error("No se pudo exportar el PDF.");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--vandyke)]/20 bg-card px-4 py-2 text-xs font-semibold text-[color:var(--vandyke)] transition hover:border-[color:var(--vandyke)]/40"
            >
              <FileText className="h-3.5 w-3.5" />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const blob = await exportarExcel(filtered);
                  descargarBlob(blob, `nutrilen-encuestas-${Date.now()}.xlsx`);
                  toast.success("Excel descargado");
                } catch {
                  toast.error("No se pudo exportar el archivo.");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--vandyke)]/20 bg-card px-4 py-2 text-xs font-semibold text-[color:var(--vandyke)] transition hover:border-[color:var(--vandyke)]/40"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar Excel
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="mt-8 rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 pr-2 text-[color:var(--vandyke)]">
              <Filter className="h-4 w-4 text-[color:var(--pumpkin)]" />
              <span className="text-sm font-semibold">Filtros</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Dieta</label>
              <select
                value={fDiet}
                onChange={(e) => setFDiet(e.target.value as Diet | "all")}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[color:var(--vandyke)] focus:border-[color:var(--pumpkin)] focus:outline-none"
              >
                <option value="all">Todas</option>
                {DIET_OPTIONS.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sexo</label>
              <select
                value={fSex}
                onChange={(e) => setFSex(e.target.value as Sex | "all")}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[color:var(--vandyke)] focus:border-[color:var(--pumpkin)] focus:outline-none"
              >
                <option value="all">Todos</option>
                {SEX_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Desde</label>
              <input
                type="date"
                value={fFrom}
                onChange={(e) => setFFrom(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[color:var(--vandyke)] focus:border-[color:var(--pumpkin)] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Hasta</label>
              <input
                type="date"
                value={fTo}
                onChange={(e) => setFTo(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[color:var(--vandyke)] focus:border-[color:var(--pumpkin)] focus:outline-none"
              />
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs font-semibold text-[color:var(--pumpkin)] hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando <strong className="text-[color:var(--vandyke)]">{total}</strong> participantes · Última actualización: {lastUpdate}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Participantes", value: total, color: MOSS },
            { icon: ClipboardCheck, label: "Encuestas completas", value: total, color: ORANGE },
            { icon: Star, label: "Puntaje global", value: globalScore.toFixed(1), color: VANDYKE },
            { icon: ThumbsUp, label: "Aceptación", value: `${acceptancePct}%`, color: PUMPKIN },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in oklab, ${s.color} 16%, transparent)`,
                  color: s.color,
                }}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-serif text-3xl font-semibold text-[color:var(--vandyke)]">
                {s.value}
              </p>
            </div>
          ))}
        </section>

        {/* Radar + Promedios */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
                Perfil sensorial
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Evaluación promedio por atributo (escala 1–5). Tocá los chips para activar o desactivar atributos.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ATTRIBUTES.map((a) => {
                const on = activeAttrs.includes(a.key);
                return (
                  <button
                    key={a.key}
                    onClick={() =>
                      setActiveAttrs((s) =>
                        s.includes(a.key) ? s.filter((x) => x !== a.key) : [...s, a.key],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      on
                        ? "border-[color:var(--moss)] bg-[color:var(--moss)] text-[color:var(--primary-foreground)]"
                        : "border-border bg-card text-muted-foreground hover:border-[color:var(--moss)]/40"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 h-80">
              <ClientOnly fallback={<div className="h-full" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="78%">
                    <PolarGrid stroke="#65382B22" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: VANDYKE, fontSize: 11, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 5]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      dataKey="value"
                      stroke={MOSS}
                      fill={MOSS}
                      fillOpacity={0.35}
                      strokeWidth={2}
                      isAnimationActive
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #65382B22",
                        background: "var(--card)",
                        color: "var(--vandyke)",
                      }}
                      formatter={(v: number) => [`${v.toFixed(1)} / 5`, "Promedio"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ClientOnly>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
              Promedios por atributo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Puntaje sobre 5 por atributo descriptivo.</p>
            <ul className="mt-6 space-y-4">
              {sensorial.map((d) => (
                <li key={d.metric}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-[color:var(--vandyke)]">{d.metric}</span>
                    <span className="font-serif text-lg font-semibold text-[color:var(--moss)]">
                      {d.value.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[color:var(--cream-deep)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(d.value / 5) * 100}%`,
                        background: `linear-gradient(to right, ${MOSS}, ${ORANGE})`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Bar chart */}
        <section className="mt-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
              Comparativa de atributos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Atributos activos en el perfil sensorial.
            </p>
            <div className="mt-6 h-72">
              <ClientOnly fallback={<div className="h-full" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="#65382B14" vertical={false} />
                    <XAxis
                      dataKey="metric"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: VANDYKE, fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      domain={[0, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#65382B88", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#65382B0A" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #65382B22",
                        background: "var(--card)",
                      }}
                      formatter={(v: number) => [`${Number(v).toFixed(1)} / 5`, "Promedio"]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={56}>
                      {barsData.map((d, i) => (
                        <Cell key={d.metric} fill={i % 2 === 0 ? MOSS : ORANGE} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnly>
            </div>
          </div>
        </section>

        {/* Frecuencia horaria */}
        <section className="mt-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
                  Frecuencia de consumo por hora
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cantidad de encuestas completadas según la hora del día (0–23 h). Permite identificar
                  en qué franja horaria se prefiere consumir el medallón de lenteja.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-[color:var(--orange-yellow)]/20 px-3 py-1 text-xs font-semibold text-[color:var(--vandyke)] sm:inline-flex">
                <Clock className="h-3.5 w-3.5 text-[color:var(--pumpkin)]" />
                {hasHourly ? `Pico: ${peakHour.label} (${peakHour.count})` : "Sin datos"}
              </div>
            </div>
            <div className="mt-6 h-72">
              <ClientOnly fallback={<div className="h-full" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={hourlyDist}
                    margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PUMPKIN} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={PUMPKIN} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#65382B14" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                      tick={{ fill: VANDYKE, fontSize: 10, fontWeight: 500 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#65382B88", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ stroke: PUMPKIN, strokeOpacity: 0.25, strokeWidth: 2 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #65382B22",
                        background: "var(--card)",
                        color: "var(--vandyke)",
                      }}
                      labelFormatter={(l) => `Hora ${l}`}
                      formatter={(v: number) => [`${v} encuesta${v === 1 ? "" : "s"}`, "Frecuencia"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="none"
                      fill="url(#hourlyFill)"
                      isAnimationActive
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={PUMPKIN}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: VANDYKE, stroke: PUMPKIN, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: PUMPKIN, stroke: "#fff", strokeWidth: 2 }}
                      isAnimationActive
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ClientOnly>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Eje X: hora del día · Eje Y: número de encuestas registradas en esa franja.
            </p>
          </div>
        </section>

        {/* Dietas + Sexo */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
              Distribución de dietas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Composición de la muestra evaluada ({total} participantes).
            </p>
            <div className="mt-4 h-64">
              <ClientOnly fallback={<div className="h-full" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dietDist.filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {dietDist.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #65382B22",
                        background: "var(--card)",
                      }}
                      formatter={(v: number, n) => [`${v} participantes`, n]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(v) => (
                        <span style={{ color: VANDYKE, fontSize: 12 }}>{v}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ClientOnly>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {dietDist.map((d) => (
                <li key={d.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-[color:var(--vandyke)]">
                    {d.pct}% ({d.value})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
              Distribución por sexo biológico
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Composición demográfica de la muestra.
            </p>
            <div className="mt-6 h-56">
              <ClientOnly fallback={<div className="h-full" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sexDist}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#65382B14" horizontal={false} />
                    <XAxis type="number" domain={[0, total || 1]} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={140}
                      tick={{ fill: VANDYKE, fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#65382B0A" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #65382B22",
                        background: "var(--card)",
                      }}
                      formatter={(v: number) => [`${v} participantes`, "Cantidad"]}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={36}>
                      {sexDist.map((s) => (
                        <Cell key={s.id} fill={s.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnly>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {sexDist.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-semibold text-[color:var(--vandyke)]">
                    {s.pct}% ({s.value})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Aceptación por dieta */}
        {dietAcceptance.length > 0 && (
          <section className="mt-6">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
                    Aceptación según tipo de dieta
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Porcentaje de aprobación del producto según el perfil alimentario.
                  </p>
                </div>
                <Heart className="h-5 w-5 text-[color:var(--pumpkin)]" />
              </div>
              <ul className="mt-6 space-y-5">
                {dietAcceptance.map((d, i) => (
                  <li key={d.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-[color:var(--vandyke)]">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                        <span className="text-xs text-muted-foreground">({d.count})</span>
                      </span>
                      <span className="font-serif text-lg font-semibold" style={{ color: d.color }}>
                        {d.value}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <AnimatedBar value={d.value} color={d.color} delay={i * 120} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Mejor / Peor */}
        {bestAttr && worstAttr && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--moss)]/15 text-[color:var(--moss)]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mejor valorado</p>
                  <h3 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">{bestAttr.metric}</h3>
                </div>
                <p className="ml-auto font-serif text-3xl font-semibold text-[color:var(--moss)]">
                  {bestAttr.value.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--pumpkin)]/15 text-[color:var(--pumpkin)]">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Menor valoración</p>
                  <h3 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">{worstAttr.metric}</h3>
                </div>
                <p className="ml-auto font-serif text-3xl font-semibold text-[color:var(--pumpkin)]">
                  {worstAttr.value.toFixed(1)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Comentarios agregados */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--moss)]/15 text-[color:var(--moss)]">
                <MessageSquareQuote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Comentarios y observaciones
                </p>
                <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
                  Observaciones descriptivas
                </h2>
              </div>
              <span className="ml-auto rounded-full bg-[color:var(--moss)]/10 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--moss)]">
                {descriptiveCommentsList.length}
              </span>
            </div>
            <ul className="mt-5 space-y-3 max-h-80 overflow-y-auto pr-1">
              {descriptiveCommentsList.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No hay comentarios descriptivos para los filtros aplicados.
                </li>
              )}
              {descriptiveCommentsList.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-border/60 bg-background/40 p-3.5 text-sm text-[color:var(--vandyke)]/90 transition hover:border-[color:var(--moss)]/50"
                >
                  <p className="leading-relaxed">“{c.descriptiveComments}”</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {DIET_OPTIONS.find((d) => d.id === c.diet)?.label} · {SEX_OPTIONS.find((s) => s.id === c.sex)?.label}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--pumpkin)]/15 text-[color:var(--pumpkin)]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Comentarios y observaciones
                </p>
                <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
                  Observaciones afectivas
                </h2>
              </div>
              <span className="ml-auto rounded-full bg-[color:var(--pumpkin)]/10 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--pumpkin)]">
                {affectiveCommentsList.length}
              </span>
            </div>
            <ul className="mt-5 space-y-3 max-h-80 overflow-y-auto pr-1">
              {affectiveCommentsList.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No hay comentarios afectivos para los filtros aplicados.
                </li>
              )}
              {affectiveCommentsList.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-border/60 bg-background/40 p-3.5 text-sm text-[color:var(--vandyke)]/90 transition hover:border-[color:var(--pumpkin)]/50"
                >
                  <p className="leading-relaxed">“{c.affectiveComments}”</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {DIET_OPTIONS.find((d) => d.id === c.diet)?.label} · {SEX_OPTIONS.find((s) => s.id === c.sex)?.label}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-6">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-1"
              style={{ background: `linear-gradient(to right, ${MOSS}, ${ORANGE}, ${PUMPKIN})` }}
            />
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--vandyke)]/10 text-[color:var(--vandyke)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conclusión general
                </p>
                <h2 className="font-serif text-2xl font-semibold text-[color:var(--vandyke)]">
                  Resumen interpretativo
                </h2>
              </div>
              <span className="ml-auto font-serif text-3xl font-semibold tabular-nums text-[color:var(--moss)]">
                {Math.round(animCount)}%
              </span>
            </div>
            {total > 0 ? (
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[color:var(--vandyke)]/85">
                Sobre <strong>{total}</strong> participantes, el producto presenta un{" "}
                <strong>{acceptancePct}%</strong> de aceptación. El atributo mejor valorado es{" "}
                <span className="font-semibold text-[color:var(--moss)]">{bestAttr.metric}</span> ({bestAttr.value.toFixed(1)}/5),
                mientras que <span className="font-semibold text-[color:var(--pumpkin)]">{worstAttr.metric}</span> ({worstAttr.value.toFixed(1)}/5)
                representa el aspecto con mayor margen de mejora.
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No hay datos para los filtros seleccionados.
              </p>
            )}
          </div>
        </section>

        <p className="mt-8 text-right text-xs text-muted-foreground">
          NutriLen · Proyecto integrador ISI × Nutrición
        </p>
      </main>
      <Footer />
    </div>
  );
}



