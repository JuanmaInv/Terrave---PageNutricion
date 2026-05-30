"use client";

import { Users, ClipboardCheck, Star, ThumbsUp } from "lucide-react";

const VANDYKE = "#65382B";
const MOSS = "#898C32";
const PUMPKIN = "#FF6D0E";
const ORANGE = "#F4B223";

interface KpiGridProps {
  total: number;
  globalScore: number;
  acceptancePct: number;
}

export function KpiGrid({ total, globalScore, acceptancePct }: KpiGridProps) {
  return (
    <section className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { icon: Users, label: "Participantes", value: total, color: MOSS },
        { icon: ClipboardCheck, label: "Encuestas completas", value: total, color: ORANGE },
        { icon: Star, label: "Puntaje global", value: globalScore.toFixed(1), color: VANDYKE },
        { icon: ThumbsUp, label: "Aceptación", value: `${acceptancePct}%`, color: PUMPKIN },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] sm:p-5"
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
  );
}
