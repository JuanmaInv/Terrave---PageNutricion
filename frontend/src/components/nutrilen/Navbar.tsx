"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, useClerk } from "@clerk/nextjs";
import { Leaf, Moon, Sun } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const publicLinks = [
  { href: "/", label: "Inicio" },
  { href: "/encuesta", label: "Encuesta" },
] as const;

const adminLinks = [{ href: "/administrador", label: "Estadísticas" }] as const;

function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("nutrilen.theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("nutrilen.theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => {
    setDark((current) => !current);
  };

  return { dark, toggle };
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const isAdmin = pathname.startsWith("/administrador");
  const links = isAdmin ? adminLinks : publicLinks;
  const { dark, toggle } = useDarkMode();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  return (
    <header className="sticky top-0 z-50 w-full max-w-[100svw] overflow-x-hidden bg-[color:var(--vandyke)] text-[color:var(--cream)] shadow-[var(--shadow-soft)]">
      <div className="mx-auto grid min-h-16 w-full max-w-6xl grid-cols-1 gap-3 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:px-6">
        <Link href={isAdmin ? "/administrador" : "/"} className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--moss)] text-[color:var(--primary-foreground)]">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-serif text-lg font-semibold tracking-tight">NutriLen</span>
            <span className="block truncate text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">
              {isAdmin ? "Panel administrativo" : "ISI x Nutrición"}
            </span>
          </span>
        </Link>
        <nav className="grid grid-cols-[1fr_auto_auto] items-center gap-1 sm:flex sm:flex-none sm:flex-wrap sm:justify-end">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`min-w-0 truncate rounded-full px-3 py-1.5 text-center text-xs font-medium opacity-80 transition hover:opacity-100 sm:px-3.5 sm:text-sm ${
                  active ? "bg-[color:var(--moss)] text-[color:var(--primary-foreground)] opacity-100" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <SignedIn>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signOut({ redirectUrl: "/" });
                  } catch {
                    router.push("/");
                    router.refresh();
                  }
                }}
                className="min-w-0 truncate rounded-full px-3 py-1.5 text-xs font-medium opacity-80 transition hover:bg-white/10 hover:opacity-100 sm:px-3.5 sm:text-sm"
              >
                Cerrar sesión
              </button>
            </SignedIn>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label="Cambiar tema"
            className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full opacity-80 transition hover:bg-white/10 hover:opacity-100"
          >
            {!mounted ? <Moon className="h-4 w-4" /> : dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-[color:var(--vandyke)] text-[color:var(--cream)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 sm:flex-row">
        <p className="font-serif text-lg">NutriLen</p>
        <p className="text-xs opacity-75">
          Proyecto Integrador - Ingeniería en Sistemas y Nutrición - {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
