"use client";

import { Filter } from "lucide-react";
import { DIET_OPTIONS, SEX_OPTIONS } from "@/lib/nutrilen";
import type { SurveyFilters } from "@/hooks/useSurveyFilters";

interface StatsFiltersProps {
  filters: SurveyFilters;
  total: number;
  lastUpdate: string;
  hasActiveFilters: boolean;
  onUpdate: <K extends keyof SurveyFilters>(key: K, value: SurveyFilters[K]) => void;
  onClear: () => void;
}

export function StatsFilters({
  filters,
  total,
  lastUpdate,
  hasActiveFilters,
  onUpdate,
  onClear,
}: StatsFiltersProps) {
  return (
    <section className="mt-8 min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[auto_repeat(4,minmax(0,1fr))_auto] lg:items-end">
        <div className="flex items-center gap-2 text-[color:var(--vandyke)] sm:col-span-2 lg:col-span-1">
          <Filter className="h-4 w-4 text-[color:var(--pumpkin)]" />
          <span className="text-sm font-semibold">Filtros</span>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Dieta</label>
          <select
            value={filters.diet}
            onChange={(e) => onUpdate("diet", e.target.value as SurveyFilters["diet"])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-[color:var(--vandyke)] focus:border-[color:var(--pumpkin)] focus:outline-none"
          >
            <option value="all">Todas</option>
            {DIET_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sexo</label>
          <select
            value={filters.sex}
            onChange={(e) => onUpdate("sex", e.target.value as SurveyFilters["sex"])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-[color:var(--vandyke)] focus:border-[color:var(--pumpkin)] focus:outline-none"
          >
            <option value="all">Todos</option>
            {SEX_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Desde</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => onUpdate("from", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-[color:var(--vandyke)] focus:border-[color:var(--pumpkin)] focus:outline-none"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => onUpdate("to", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-[color:var(--vandyke)] focus:border-[color:var(--pumpkin)] focus:outline-none"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="w-full rounded-full px-3 py-2 text-center text-xs font-semibold text-[color:var(--pumpkin)] hover:bg-[color:var(--pumpkin)]/10 sm:w-auto lg:justify-self-end"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Mostrando <strong className="text-[color:var(--vandyke)]">{total}</strong> participantes · Última actualización: {lastUpdate}
      </p>
    </section>
  );
}
