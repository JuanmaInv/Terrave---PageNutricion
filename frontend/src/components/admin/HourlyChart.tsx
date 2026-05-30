"use client";

import { Clock } from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Area,
  ComposedChart,
  Tooltip,
} from "recharts";
import type { HourlyPoint } from "./admin-dashboard.types";

const VANDYKE = "#65382B";
const PUMPKIN = "#FF6D0E";
interface HourlyChartProps {
  hourlyDist: HourlyPoint[];
  hasHourly: boolean;
  peakHour: HourlyPoint;
}

export function HourlyChart({ hourlyDist, hasHourly, peakHour }: HourlyChartProps) {
  return (
    <section className="mt-6">
      <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
              Frecuencia de consumo por hora
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cantidad de encuestas completadas según la hora del día (0-23 h). Permite identificar
              en qué franja horaria se prefiere consumir el medallón de lenteja.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[color:var(--orange-yellow)]/20 px-3 py-1 text-xs font-semibold text-[color:var(--vandyke)] sm:inline-flex">
            <Clock className="h-3.5 w-3.5 text-[color:var(--pumpkin)]" />
            {hasHourly ? `Pico: ${peakHour.label} (${peakHour.count})` : "Sin datos"}
          </div>
        </div>
        <div className="mt-6 max-w-full overflow-hidden pb-2">
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={hourlyDist}
                margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
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
                  interval={3}
                  tick={{ fill: VANDYKE, fontSize: 9, fontWeight: 500 }}
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
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Las marcas inferiores indican la hora del día; cuanto más alta aparece la línea, mayor fue la cantidad de encuestas registradas en esa franja.
        </p>
      </div>
    </section>
  );
}

