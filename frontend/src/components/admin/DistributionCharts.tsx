"use client";

import React from "react";
import { Heart } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { DietAcceptanceItem, DistributionItem } from "./admin-dashboard.types";

function AnimatedBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
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

interface DistributionChartsProps {
  total: number;
  dietDist: DistributionItem[];
  sexDist: DistributionItem[];
  dietAcceptance: DietAcceptanceItem[];
}

const VANDYKE = "#65382B";

export function DistributionCharts({ total, dietDist, sexDist, dietAcceptance }: DistributionChartsProps) {
  return (
    <>
      <section className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
          <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
            Distribución de dietas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Composición de la muestra evaluada ({total} participantes).
          </p>
          <div className="mt-4 h-72 sm:h-64">
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

        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
          <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
            Distribución por sexo biológico
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Composición demográfica de la muestra.
          </p>
          <ul className="mt-6 space-y-4">
            {sexDist.map((s) => (
              <li key={s.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-[color:var(--vandyke)]">
                    {s.name}
                  </span>
                  <span className="shrink-0 font-serif text-lg font-semibold" style={{ color: s.color }}>
                    {s.pct}% <span className="text-xs font-sans font-medium text-muted-foreground">({s.value})</span>
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-[color:var(--cream-deep)]">
                  <div
                    className="h-full min-w-1 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(s.pct, s.value > 0 ? 4 : 0)}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {dietAcceptance.length > 0 && (
        <section className="mt-6">
          <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
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
    </>
  );
}


