"use client";

import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ATTRIBUTES, type AttrKey } from "@/lib/nutrilen";
import type { SensorialItem } from "./admin-dashboard.types";

const VANDYKE = "#65382B";
const MOSS = "#898C32";
const PUMPKIN = "#FF6D0E";
const ORANGE = "#F4B223";

interface SensorialSectionProps {
  sensorial: SensorialItem[];
}

export function SensorialSection({ sensorial }: SensorialSectionProps) {
  const [activeAttrs, setActiveAttrs] = useState<AttrKey[]>(ATTRIBUTES.map((a) => a.key));
  const radarData = sensorial.filter((d) => activeAttrs.includes(d.key));
  const barsData = radarData;

  return (
    <>
      <section className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
              Perfil sensorial
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Evaluación promedio por atributo (escala 1-5). Tocá los chips para activar o desactivar atributos.
            </p>
          </div>
          <div className="mt-4 flex min-w-0 flex-wrap gap-1.5">
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
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
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
          <div className="mt-4 h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radarData}
                outerRadius="62%"
                margin={{ top: 24, right: 38, bottom: 24, left: 38 }}
              >
                <PolarGrid stroke="#65382B22" />
                <PolarAngleAxis
                  dataKey="metricShort"
                  tick={{ fill: VANDYKE, fontSize: 11, fontWeight: 700 }}
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
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
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

      <section className="mt-6">
        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
          <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
            Comparativa de atributos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Atributos activos en el perfil sensorial.
          </p>
          <ul className="mt-6 space-y-4">
            {barsData.map((d, i) => {
              const color = i % 2 === 0 ? MOSS : ORANGE;
              return (
                <li key={d.metric}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold text-[color:var(--vandyke)]">
                      {d.metric}
                    </span>
                    <span className="shrink-0 font-serif text-lg font-semibold" style={{ color }}>
                      {d.value.toFixed(1)}
                      <span className="ml-1 text-xs font-sans font-medium text-muted-foreground">/ 5</span>
                    </span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-[color:var(--cream-deep)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(d.value / 5) * 100}%`,
                        background: `linear-gradient(to right, ${color}, ${PUMPKIN})`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}

