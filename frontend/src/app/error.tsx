"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[color:var(--pumpkin)]/14 text-[color:var(--pumpkin)]">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-serif text-4xl font-semibold text-[color:var(--vandyke)]">
        Ocurrio un problema inesperado
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        La aplicacion encontro un error del lado del frontend. Puedes intentar nuevamente o volver
        al inicio sin perder el resto del sistema.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--moss)] px-6 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--pumpkin)]"
        >
          <RotateCcw className="h-4 w-4" />
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-[color:var(--vandyke)]/20 bg-card px-6 py-3 text-sm font-semibold text-[color:var(--vandyke)] transition hover:border-[color:var(--vandyke)]/40"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
