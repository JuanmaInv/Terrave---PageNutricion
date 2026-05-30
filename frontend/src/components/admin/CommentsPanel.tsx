"use client";

import { Sparkles, TrendingUp, TrendingDown, MessageSquareQuote, MessageCircle } from "lucide-react";
import { DIET_OPTIONS, SEX_OPTIONS, type SurveyResponse } from "@/lib/nutrilen";
import type { AttrSummary } from "./admin-dashboard.types";

interface CommentsPanelProps {
  descriptiveCommentsList: SurveyResponse[];
  affectiveCommentsList: SurveyResponse[];
  bestAttr?: AttrSummary;
  worstAttr?: AttrSummary;
  total: number;
  acceptancePct: number;
  animCount: number;
}

const MOSS = "#898C32";
const PUMPKIN = "#FF6D0E";
const ORANGE = "#F4B223";

export function CommentsPanel({
  descriptiveCommentsList,
  affectiveCommentsList,
  bestAttr,
  worstAttr,
  total,
  acceptancePct,
  animCount,
}: CommentsPanelProps) {
  return (
    <>
      {bestAttr && worstAttr && (
        <section className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] sm:rounded-3xl sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--moss)]/15 text-[color:var(--moss)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mejor valorado</p>
                <h3 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">{bestAttr.metric}</h3>
              </div>
              <p className="ml-auto font-serif text-2xl font-semibold text-[color:var(--moss)] sm:text-3xl">
                {bestAttr.value.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] sm:rounded-3xl sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--pumpkin)]/15 text-[color:var(--pumpkin)]">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Menor valoración</p>
                <h3 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">{worstAttr.metric}</h3>
              </div>
              <p className="ml-auto font-serif text-2xl font-semibold text-[color:var(--pumpkin)] sm:text-3xl">
                {worstAttr.value.toFixed(1)}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--moss)]/15 text-[color:var(--moss)]">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comentarios y observaciones
              </p>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
                Observaciones descriptivas
              </h2>
            </div>
            <span className="ml-auto rounded-full bg-[color:var(--moss)]/10 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--moss)]">
              {descriptiveCommentsList.length}
            </span>
          </div>
          <ul className="mt-5 space-y-3 max-h-80 overflow-y-auto pr-1">
            {descriptiveCommentsList.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No hay comentarios descriptivos para los filtros aplicados.
              </li>
            )}
            {descriptiveCommentsList.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border/60 bg-background/40 p-3.5 text-sm text-[color:var(--vandyke)]/90 transition hover:border-[color:var(--moss)]/50"
              >
                <p className="leading-relaxed">&quot;{c.descriptiveComments}&quot;</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {DIET_OPTIONS.find((d) => d.id === c.diet)?.label} · {SEX_OPTIONS.find((s) => s.id === c.sex)?.label}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--pumpkin)]/15 text-[color:var(--pumpkin)]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comentarios y observaciones
              </p>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--vandyke)]">
                Observaciones afectivas
              </h2>
            </div>
            <span className="ml-auto rounded-full bg-[color:var(--pumpkin)]/10 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--pumpkin)]">
              {affectiveCommentsList.length}
            </span>
          </div>
          <ul className="mt-5 space-y-3 max-h-80 overflow-y-auto pr-1">
            {affectiveCommentsList.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No hay comentarios afectivos para los filtros aplicados.
              </li>
            )}
            {affectiveCommentsList.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border/60 bg-background/40 p-3.5 text-sm text-[color:var(--vandyke)]/90 transition hover:border-[color:var(--pumpkin)]/50"
              >
                <p className="leading-relaxed">&quot;{c.affectiveComments}&quot;</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {DIET_OPTIONS.find((d) => d.id === c.diet)?.label} · {SEX_OPTIONS.find((s) => s.id === c.sex)?.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6">
        <div className="relative min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1"
            style={{ background: `linear-gradient(to right, ${MOSS}, ${ORANGE}, ${PUMPKIN})` }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--vandyke)]/10 text-[color:var(--vandyke)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Conclusión general
              </p>
              <h2 className="font-serif text-2xl font-semibold text-[color:var(--vandyke)]">
                Resumen interpretativo
              </h2>
            </div>
            <span className="ml-auto font-serif text-2xl font-semibold tabular-nums text-[color:var(--moss)] sm:text-3xl">
              {Math.round(animCount)}%
            </span>
          </div>
          {total > 0 && bestAttr && worstAttr ? (
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[color:var(--vandyke)]/85">
              Sobre <strong>{total}</strong> participantes, el producto presenta un{" "}
              <strong>{acceptancePct}%</strong> de aceptación. El atributo mejor valorado es{" "}
              <span className="font-semibold text-[color:var(--moss)]">{bestAttr.metric}</span> ({bestAttr.value.toFixed(1)}/5),
              mientras que <span className="font-semibold text-[color:var(--pumpkin)]">{worstAttr.metric}</span> ({worstAttr.value.toFixed(1)}/5)
              representa el aspecto con mayor margen de mejora.
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay datos para los filtros seleccionados.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

