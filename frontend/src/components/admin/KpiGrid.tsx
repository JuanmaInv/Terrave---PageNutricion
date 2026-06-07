"use client";

import { ClipboardCheck, Clock3, Star, ThumbsUp, Users } from "lucide-react";
import { AdminInfoTooltip } from "./AdminInfoTooltip";

const VANDYKE = "#65382B";
const MOSS = "#898C32";
const PUMPKIN = "#FF6D0E";
const ORANGE = "#F4B223";
const AMBER = "#D67C2C";

interface KpiGridProps {
  total: number;
  completedCount: number;
  inProgressCount: number;
  globalScore: number;
  acceptancePct: number;
}

export function KpiGrid({
  total,
  completedCount,
  inProgressCount,
  globalScore,
  acceptancePct,
}: KpiGridProps) {
  const cards = [
    {
      icon: Users,
      label: "Participantes",
      value: total,
      color: MOSS,
      tooltip:
        "Cantidad total de personas incluidas en la vista actual, respetando los filtros activos.",
    },
    {
      icon: ClipboardCheck,
      label: "Encuestas completas",
      value: completedCount,
      color: ORANGE,
      tooltip:
        "Encuestas finalizadas y registradas en la tabla principal de resultados para el rango filtrado.",
    },
    {
      icon: Clock3,
      label: "Encuestas en curso",
      value: inProgressCount,
      color: AMBER,
      tooltip:
        "Sesiones anonimas iniciadas pero no enviadas todavia. Si quedan inactivas por 30 minutos, se eliminan automaticamente.",
    },
    {
      icon: Star,
      label: "Puntaje global",
      value: globalScore.toFixed(1),
      color: VANDYKE,
      tooltip:
        "Promedio general de los atributos sensoriales visibles en el dashboard, expresado sobre 5 puntos.",
    },
    {
      icon: ThumbsUp,
      label: "Aceptacion",
      value: `${acceptancePct}%`,
      color: PUMPKIN,
      tooltip:
        "Porcentaje de respuestas con gusto positivo sobre el total de encuestas completas del filtro actual.",
    },
  ];

  return (
    <section className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((s) => (
        <div
          key={s.label}
          className="rounded-[1.7rem] border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] sm:min-h-[10.25rem] sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl sm:h-10 sm:w-10 sm:rounded-xl"
              style={{
                backgroundColor: `color-mix(in oklab, ${s.color} 16%, transparent)`,
                color: s.color,
              }}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <AdminInfoTooltip content={s.tooltip} label={`Mas informacion sobre ${s.label}`} />
          </div>
          <p className="mt-4 pr-7 text-[0.95rem] leading-snug text-[color:var(--surface-title)] sm:pr-0 sm:text-sm sm:text-muted-foreground">
            {s.label}
          </p>
          <p className="mt-2 font-serif text-[2rem] font-semibold leading-none text-[color:var(--vandyke)] sm:mt-1 sm:text-3xl">
            {s.value}
          </p>
        </div>
      ))}
    </section>
  );
}
