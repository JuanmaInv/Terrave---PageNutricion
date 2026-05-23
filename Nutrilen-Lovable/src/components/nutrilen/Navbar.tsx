import { Link, useLocation } from "@tanstack/react-router";
import { Leaf, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/clerk-react";

const publicLinks = [
  { to: "/", label: "Inicio" },
  { to: "/encuesta", label: "Encuesta" },
] as const;

const adminLinks = [
  { to: "/administrador", label: "Estadísticas" },
] as const;

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("nutrilen.theme");
    const prefers = saved === "dark";
    setDark(prefers);
    document.documentElement.classList.toggle("dark", prefers);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("nutrilen.theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

export function Navbar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/administrador");
  const links = isAdmin ? adminLinks : publicLinks;
  const { dark, toggle } = useDarkMode();
  return (
    <header className="sticky top-0 z-50 w-full bg-[color:var(--vandyke)] text-[color:var(--cream)] shadow-[var(--shadow-soft)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to={isAdmin ? "/administrador" : "/"} className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--moss)] text-[color:var(--primary-foreground)]">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg font-semibold tracking-tight">NutriLen</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">
              {isAdmin ? "Panel administrativo" : "ISI × Nutrición"}
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium opacity-80 transition hover:opacity-100 data-[status=active]:bg-[color:var(--moss)] data-[status=active]:text-[color:var(--primary-foreground)] data-[status=active]:opacity-100"
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <SignedIn>
              <SignOutButton>
                <button
                  type="button"
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium opacity-80 transition hover:bg-white/10 hover:opacity-100"
                >
                  Cerrar sesión
                </button>
              </SignOutButton>
            </SignedIn>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label="Cambiar tema"
            className="ml-1 grid h-9 w-9 place-items-center rounded-full opacity-80 transition hover:bg-white/10 hover:opacity-100"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
          Proyecto Integrador · Ingeniería en Sistemas & Nutrición · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
