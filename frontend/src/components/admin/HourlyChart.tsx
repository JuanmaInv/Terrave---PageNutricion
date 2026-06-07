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
import { AdminChartTooltip } from "./AdminChartTooltip";
import { AdminInfoTooltip } from "./AdminInfoTooltip";
import { useAdminChartPalette } from "./useAdminChartPalette";

const PUMPKIN = "#FF6D0E";
interface HourlyChartProps {
  hourlyDist: HourlyPoint[];
  hasHourly: boolean;
  peakHour: HourlyPoint;
}

export function HourlyChart({ hourlyDist, hasHourly, peakHour }: HourlyChartProps) {
  const palette = useAdminChartPalette();

  return (
    <section className="mt-6">
      <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <div className="flex items-start gap-3">
              <h2 className="font-serif text-xl font-semibold text-[color:var(--surface-title)]">
                Frecuencia de consumo por hora
              </h2>
              <AdminInfoTooltip
                label="Mas informacion sobre frecuencia por hora"
                content="Cuenta cuantas encuestas completas se registraron en cada franja horaria para detectar momentos de mayor actividad."
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Cantidad de encuestas completadas según la hora del día (0-23 h). Permite identificar
              en qué franja horaria se prefiere consumir el medallón de lenteja.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[color:var(--orange-yellow)]/24 px-3 py-1 text-xs font-semibold text-[color:var(--surface-title)] sm:inline-flex">
            <Clock className="h-3.5 w-3.5 text-[color:var(--pumpkin)]" />
            {hasHourly ? `Pico: ${peakHour.label} (${peakHour.count})` : "Sin datos"}
          </div>
        </div>
        <div className="mt-6 max-w-full overflow-hidden pb-2">
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={hourlyDist}
                margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PUMPKIN} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PUMPKIN} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={palette.chartGrid} vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: palette.chartText, fontSize: 10, fontWeight: 600 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: palette.chartMuted, fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip
                  cursor={{ stroke: PUMPKIN, strokeOpacity: 0.25, strokeWidth: 2 }}
                  content={<AdminChartTooltip labelPrefix="Hora" />}
                  formatter={(v: number) => [v, "Encuestas completas"]}
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
                  dot={{ r: 3.5, fill: palette.card, stroke: PUMPKIN, strokeWidth: 2 }}
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

