"use client";

import { RefreshCw, FileSpreadsheet, FileText } from "lucide-react";

interface AdminHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export function AdminHeader({
  isRefreshing,
  onRefresh,
  onExportPdf,
  onExportExcel,
}: AdminHeaderProps) {
  return (
    <header className="min-w-0 space-y-5 lg:flex lg:items-end lg:justify-between lg:gap-6 lg:space-y-0">
      <div className="min-w-0 max-w-3xl">
        <span className="inline-block rounded-full bg-[color:var(--orange-yellow)]/25 px-3 py-1 text-xs font-medium text-[color:var(--vandyke)]">
          Panel administrativo
        </span>
        <h1 className="mt-4 max-w-full break-words font-serif text-3xl font-semibold leading-[1.02] tracking-tight text-[color:var(--vandyke)] min-[420px]:text-4xl sm:text-5xl">
          Resultados de la evaluación
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Dashboard académico de análisis sensorial del medallón de lenteja.
        </p>
      </div>
      <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[520px]:grid-cols-2 lg:w-auto lg:min-w-[360px] lg:grid-cols-3">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--moss)] px-4 py-2.5 text-xs font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--pumpkin)] disabled:opacity-50"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--vandyke)]/20 bg-card px-4 py-2.5 text-xs font-semibold text-[color:var(--vandyke)] transition hover:border-[color:var(--vandyke)]/40"
        >
          <FileText className="h-3.5 w-3.5" />
          Exportar PDF
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--vandyke)]/20 bg-card px-4 py-2.5 text-xs font-semibold text-[color:var(--vandyke)] transition hover:border-[color:var(--vandyke)]/40"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Exportar Excel
        </button>
      </div>
    </header>
  );
}
