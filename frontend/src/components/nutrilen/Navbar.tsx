"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, useClerk } from "@clerk/nextjs";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { TerraveMark } from "./TerraveMark";

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
    <header className="relative z-20 w-full overflow-visible bg-gradient-to-r from-[color:oklch(0.28_0.032_38)] via-[color:oklch(0.32_0.04_40)] to-[color:oklch(0.27_0.03_37)] text-[color:var(--cream)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 top-0 h-24 w-48 rounded-full bg-[color:var(--orange-yellow)]/12 blur-2xl" />
        <div className="absolute right-12 top-1 h-20 w-36 rounded-full bg-[color:var(--moss)]/16 blur-2xl" />
      </div>
      <div className="relative mx-auto grid min-h-16 w-full max-w-6xl grid-cols-1 gap-3 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:px-6">
        <Link href={isAdmin ? "/administrador" : "/"} className="group flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--moss)] text-[color:var(--primary-foreground)] transition-transform duration-300 group-hover:scale-105">
            <TerraveMark className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-serif text-lg font-semibold tracking-tight">TERRAVÉ</span>
            <span className={`block truncate text-[10px] font-medium uppercase tracking-[0.18em] opacity-70 ${isAdmin ? "" : "hidden"}`}>
              {isAdmin ? "Panel administrativo" : ""}
            </span>
          </span>
        </Link>
        <nav className="grid grid-cols-[1fr_auto_auto] items-center gap-2 sm:flex sm:flex-none sm:flex-wrap sm:justify-end">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`min-w-0 truncate rounded-full px-3 py-1.5 text-center text-xs font-semibold text-[color:var(--primary-foreground)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[color:var(--pumpkin)] active:bg-[color:var(--pumpkin)] sm:px-3.5 sm:text-sm ${
                  active
                    ? "bg-[color:var(--moss)] shadow-[0_6px_18px_-10px_oklch(0.72_0.12_90)]"
                    : "bg-[color:var(--moss)]/90"
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
                className="min-w-0 truncate rounded-full bg-[color:var(--moss)]/90 px-3 py-1.5 text-xs font-semibold text-[color:var(--primary-foreground)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[color:var(--pumpkin)] active:bg-[color:var(--pumpkin)] sm:px-3.5 sm:text-sm"
              >
                Cerrar sesión
              </button>
            </SignedIn>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label="Cambiar tema"
            className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--moss)]/90 text-[color:var(--primary-foreground)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[color:var(--pumpkin)] active:bg-[color:var(--pumpkin)]"
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
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-gradient-to-r from-[color:oklch(0.24_0.028_36)] via-[color:oklch(0.29_0.034_38)] to-[color:oklch(0.24_0.028_36)] text-[color:var(--cream)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-0 h-24 w-64 -translate-x-1/2 rounded-full bg-[color:var(--orange-yellow)]/12 blur-2xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl items-center justify-center gap-3 px-6 py-10">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/5 text-[color:var(--cream)]">
          <TerraveMark className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <p className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">TERRAVÉ</p>
      </div>
    </footer>
  );
}
