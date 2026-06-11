"use client";

import { SignedIn, useAuth, useClerk } from "@clerk/nextjs";
import { Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { obtenerPerfilAcceso, type AccessProfile } from "@/lib/api";
import { AUTH_ENABLED } from "@/lib/auth";
import { TerraveMark } from "./TerraveMark";

const publicLinks = [
  { href: "/", label: "Inicio" },
  { href: "/encuesta", label: "Encuesta" },
] as const;

function useDarkMode() {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  const subscribe = (callback: () => void) => {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  };

  const getSnapshot = () => document.documentElement.classList.contains("dark");
  const getServerSnapshot = () => false;

  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
    window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
  };

  return { dark, toggle };
}

export function Navbar() {
  if (!AUTH_ENABLED) {
    return <NavbarContent />;
  }

  return <NavbarWithClerk />;
}

function NavbarWithClerk() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [accessProfile, setAccessProfile] = useState<AccessProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function resolveAccess() {
      if (!isLoaded || !isSignedIn) {
        if (isMounted) setAccessProfile(null);
        return;
      }

      try {
        const token = await getToken();
        const result = await obtenerPerfilAcceso(token ?? undefined);
        if (isMounted) setAccessProfile(result);
      } catch {
        if (isMounted) setAccessProfile(null);
      }
    }

    resolveAccess();

    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  return (
    <NavbarContent
      hidePublicLinks={Boolean(accessProfile?.isAdmin)}
      adminShortcut={
        <SignedIn>
          {accessProfile?.isAdmin ? (
            <Link
              href="/administrador"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-[color:var(--moss)] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_38px_-24px_rgba(160,163,49,0.9)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[color:var(--pumpkin)]/55"
            >
              Administracion
            </Link>
          ) : null}
        </SignedIn>
      }
      adminActions={
        <SignedIn>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="rounded-full border border-white/16 bg-white/8 px-4 py-2 text-sm font-semibold text-white/96 transition hover:-translate-y-0.5 hover:bg-white/12 hover:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--pumpkin)]/55"
          >
            Cerrar sesion
          </button>
        </SignedIn>
      }
    />
  );
}

function NavbarContent({
  hidePublicLinks = false,
  adminShortcut,
  adminActions,
}: {
  hidePublicLinks?: boolean;
  adminShortcut?: React.ReactNode;
  adminActions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/administrador");
  const links = isAdmin || hidePublicLinks ? [] : publicLinks;
  const { dark, toggle } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mounted = useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      return () => window.removeEventListener("storage", callback);
    },
    () => true,
    () => false,
  );

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/8 shadow-[0_24px_64px_-48px_rgba(39,18,11,0.95)]"
      style={{
        background:
          "linear-gradient(90deg, var(--brand-shell-start) 0%, var(--brand-shell-mid) 52%, var(--brand-shell-end) 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-75">
        <div
          className="absolute -left-16 top-0 h-24 w-40 rounded-full blur-3xl"
          style={{ background: "var(--brand-glow-a)" }}
        />
        <div
          className="absolute right-0 top-2 h-24 w-40 rounded-full blur-3xl"
          style={{ background: "var(--brand-glow-b)" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            href={isAdmin ? "/administrador" : "/"}
            className="group flex min-w-0 items-center gap-3"
            onClick={closeMobileMenu}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--moss)] shadow-[0_16px_28px_-18px_rgba(160,163,49,0.95)] transition group-hover:scale-105">
              <TerraveMark className="h-5 w-5 text-white" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-2xl font-semibold tracking-tight text-[color:var(--cream)] drop-shadow-[0_1px_1px_rgba(39,18,11,0.3)]">
                TERRAVE
              </span>
              {isAdmin ? (
                <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--cream)]/74">
                  Panel administrativo
                </span>
              ) : null}
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <nav aria-label="Principal" className="flex items-center gap-2">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[color:var(--moss)] text-white shadow-[0_18px_36px_-20px_rgba(160,163,49,0.95)]"
                        : "bg-white/6 text-[color:var(--cream)]/92 hover:-translate-y-0.5 hover:bg-white/12 hover:text-[color:var(--cream)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {!isAdmin ? adminShortcut ?? null : null}
              {isAdmin ? adminActions ?? null : null}
            </nav>

            <button
              type="button"
              onClick={toggle}
              aria-label={mounted && dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-[color:var(--moss)] text-white shadow-[0_20px_38px_-24px_rgba(160,163,49,0.9)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[color:var(--pumpkin)]/55"
            >
              {mounted && dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggle}
              aria-label={mounted && dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-[color:var(--moss)] text-white shadow-[0_18px_34px_-22px_rgba(160,163,49,0.92)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[color:var(--pumpkin)]/55"
            >
              {mounted && dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-[color:var(--moss)] text-white shadow-[0_18px_34px_-22px_rgba(160,163,49,0.92)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[color:var(--pumpkin)]/55"
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            mobileMenuOpen ? "max-h-96 pt-3 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav
            aria-label="Menu movil"
            className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/12 p-3 backdrop-blur-sm"
          >
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-[color:var(--moss)] text-white shadow-[0_18px_36px_-22px_rgba(160,163,49,0.95)]"
                      : "bg-white/5 text-[color:var(--cream)]/94 hover:bg-white/10 hover:text-[color:var(--cream)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {!isAdmin ? (
              <div onClick={closeMobileMenu} className="contents">
                {adminShortcut ?? null}
              </div>
            ) : null}

            {isAdmin ? adminActions ?? null : null}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer
      className="mt-10 border-t border-white/8"
      style={{
        background:
          "linear-gradient(90deg, var(--brand-shell-start) 0%, var(--brand-shell-mid) 52%, var(--brand-shell-end) 100%)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-4 py-10 text-[color:var(--cream)] sm:px-6">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-white/18 bg-white/4 shadow-[0_18px_36px_-24px_rgba(247,232,212,0.55)]">
          <TerraveMark className="h-6 w-6" />
        </span>
        <span className="font-serif text-4xl font-semibold tracking-tight">TERRAVE</span>
      </div>
    </footer>
  );
}
