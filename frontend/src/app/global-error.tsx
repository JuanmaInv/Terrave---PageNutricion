"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled global error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-serif text-4xl font-semibold text-[color:var(--vandyke)]">
            Ocurrio un error critico
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            La aplicacion no pudo renderizar esta pantalla correctamente. Intenta recargar la
            pagina o volver mas tarde.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[color:var(--moss)] px-6 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--pumpkin)]"
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
