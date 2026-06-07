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
import type { TooltipProps } from "recharts";
import { ATTRIBUTES, type AttrKey } from "@/lib/nutrilen";
import type { SensorialItem } from "./admin-dashboard.types";
import { AdminInfoTooltip } from "./AdminInfoTooltip";
import { useAdminChartPalette } from "./useAdminChartPalette";

const MOSS = "#898C32";
const ORANGE = "#F4B223";

interface SensorialSectionProps {
  sensorial: SensorialItem[];
}

type RadarTooltipPayload = {
  color?: string;
  payload?: SensorialItem;
  value?: number;
};

function SensorialRadarTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0] as RadarTooltipPayload;
  const data = item.payload;

  if (!data) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[color:var(--surface-border)]/55 bg-card px-3 py-2.5 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-[color:var(--surface-title)]">{data.metric}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color ?? MOSS }}
          />
          Valor
        </span>
        <span className="font-semibold text-[color:var(--surface-title)]">
          {data.value.toFixed(1)} / 5
        </span>
      </div>
    </div>
  );
}

export function SensorialSection({ sensorial }: SensorialSectionProps) {
  const [activeAttrs, setActiveAttrs] = useState<AttrKey[]>(ATTRIBUTES.map((a) => a.key));
  const palette = useAdminChartPalette();
  const radarData = sensorial.filter((d) => activeAttrs.includes(d.key));

  return (
    <>
      <section className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
          <div>
            <div className="flex items-start gap-3">
              <h2 className="font-serif text-xl font-semibold text-[color:var(--surface-title)]">
                Perfil sensorial
              </h2>
              <AdminInfoTooltip
                label="Mas informacion sobre perfil sensorial"
                content="Resume los promedios de color, aroma, textura y sabor. Los chips permiten focalizar el radar en atributos puntuales."
              />
            </div>
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
                outerRadius="60%"
                margin={{ top: 16, right: 18, bottom: 16, left: 18 }}
              >
                <PolarGrid stroke={palette.chartGrid} />
                <PolarAngleAxis
                  dataKey="metricShort"
                  tick={{ fill: palette.chartText, fontSize: 12, fontWeight: 700 }}
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
                  isAnimationActive={false}
                />
                <Tooltip content={<SensorialRadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
          <div className="flex items-start gap-3">
            <h2 className="font-serif text-xl font-semibold text-[color:var(--surface-title)]">
              Promedios por atributo
            </h2>
            <AdminInfoTooltip
              label="Mas informacion sobre promedios por atributo"
              content="Lista lineal de los puntajes descriptivos sobre 5 para facilitar comparacion rapida entre atributos."
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Puntaje sobre 5 por atributo descriptivo.</p>
          <ul className="mt-6 space-y-4">
            {sensorial.map((d) => (
              <li key={d.metric}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-[color:var(--surface-title)]">{d.metric}</span>
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

    </>
  );
}


