"use client";

import { BadgeDollarSign } from "lucide-react";
import { DIET_OPTIONS, SEX_OPTIONS } from "@/lib/nutrilen";
import type { PriceSummary } from "./admin-dashboard.types";
import { AdminInfoTooltip } from "./AdminInfoTooltip";

interface PriceInsightsProps {
  priceSummary?: PriceSummary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PriceInsights({ priceSummary }: PriceInsightsProps) {
  return (
    <section className="mt-6">
      <div className="rounded-[1.8rem] border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:var(--orange-yellow)]/16 text-[color:var(--pumpkin)]">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl font-semibold text-[color:var(--surface-title)]">
                Disposición a pagar
              </h2>
              <AdminInfoTooltip
                label="Más información sobre la disposición a pagar"
                content="Resume cuánto estaría dispuesto a pagar el participante por el producto, en pesos argentinos, según los filtros aplicados."
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Respuestas capturadas en la pregunta de precio estimado del producto.
            </p>
          </div>
        </div>

        {priceSummary ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Promedio", value: formatCurrency(priceSummary.average) },
                { label: "Mediana", value: formatCurrency(priceSummary.median) },
                { label: "Mínimo", value: formatCurrency(priceSummary.min) },
                { label: "Máximo", value: formatCurrency(priceSummary.max) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/60 bg-background/40 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 font-serif text-2xl font-semibold text-[color:var(--surface-title)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-border/60 bg-background/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[color:var(--surface-title)]">
                  Últimas respuestas de precio
                </p>
                <span className="rounded-full bg-[color:var(--pumpkin)]/10 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--pumpkin)]">
                  {priceSummary.responseCount} respuesta(s)
                </span>
              </div>
              <ul className="mt-4 grid gap-3 lg:grid-cols-2">
                {priceSummary.latestValues.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-border/60 bg-card p-3.5 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[color:var(--surface-title)]">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {DIET_OPTIONS.find((diet) => diet.id === item.diet)?.label} ·{" "}
                      {SEX_OPTIONS.find((sex) => sex.id === item.sex)?.label}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            No hay respuestas de precio para los filtros seleccionados.
          </p>
        )}
      </div>
    </section>
  );
}
