"use client";

import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Footer, Navbar } from "@/components/nutrilen/Navbar";
import { PageLoader } from "@/components/nutrilen/PageLoader";
import { AUTH_DISABLED_REASON, AUTH_ENABLED } from "@/lib/auth";
import {
  actualizarRolUsuarioAdmin,
  getUserFacingErrorMessage,
  listarUsuariosAdmin,
  obtenerPerfilAcceso,
  type AccessProfile,
} from "@/lib/api";

type ManagedUser = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro?: string;
  accessRole: AccessProfile["role"];
  isSuperAdmin: boolean;
};

export default function SuperAdminRoute() {
  if (!AUTH_ENABLED) {
    return <SuperAdminTestGate />;
  }

  return <SuperAdminClerkGate />;
}

function SuperAdminClerkGate() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <SuperAdminLoadingState />;
  }

  return (
    <>
      <SignedOut>
        <SuperAdminSignInState />
      </SignedOut>
      <SignedIn>
        <SuperAdminAuthorized />
      </SignedIn>
    </>
  );
}

function SuperAdminLoadingState() {
  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-[color:var(--background)]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/80 p-8 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <PageLoader show />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SuperAdminSignInState() {
  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-[color:var(--background)]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl font-semibold text-foreground">TERRAVE | Super admin</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Inicia sesion para gestionar usuarios y permisos del sistema.
            </p>
            {AUTH_DISABLED_REASON === "missing-clerk-key" ? (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                La autenticacion esta desactivada porque falta una `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
                valida en el entorno local.
              </p>
            ) : null}
          </div>
          <div className="mx-auto flex w-full justify-center">
            <SignIn
              routing="hash"
              forceRedirectUrl="/super-admin"
              fallbackRedirectUrl="/super-admin"
              signUpForceRedirectUrl="/super-admin"
              signUpFallbackRedirectUrl="/super-admin"
              appearance={{
                elements: {
                  rootBox: "mx-auto flex w-full justify-center",
                  cardBox: "w-full max-w-none shadow-none",
                  card: "w-full max-w-none rounded-[1.75rem] border border-[color:var(--surface-border)]/70 bg-background/92 shadow-none",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  footerActionText: "text-sm",
                  footerActionLink: "font-semibold text-[color:var(--pumpkin)]",
                },
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SuperAdminTestGate() {
  const role = useSyncExternalStore(
    () => () => {},
    () => {
      const storedRole = window.localStorage.getItem("nutrilen.e2eRole");
      return storedRole === "super_admin" || storedRole === "admin" || storedRole === "client"
        ? storedRole
        : null;
    },
    () => null,
  );

  if (!role) {
    return <SuperAdminSignInState />;
  }

  if (role !== "super_admin") {
    return <SuperAdminRestrictedState reason={role === "admin" ? "admin" : "client"} />;
  }

  return <SuperAdminPageContent users={[]} canManageUsers />;
}

function SuperAdminAuthorized() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [profile, setProfile] = useState<AccessProfile | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      if (!isLoaded || !isSignedIn) return;

      try {
        const token = await getToken();
        const nextProfile = await obtenerPerfilAcceso(token ?? undefined);
        if (!isMounted) return;
        setProfile(nextProfile);

        if (nextProfile?.canManageUsers) {
          const nextUsers = await listarUsuariosAdmin(token ?? undefined);
          if (!isMounted) return;
          setUsers(nextUsers);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getUserFacingErrorMessage(error, "No se pudo cargar la gestion de usuarios."));
        }
      } finally {
        if (isMounted) {
          setIsAuthorizing(false);
          setIsLoadingUsers(false);
        }
      }
    }

    hydrate();
    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  async function handleRoleChange(userId: string, nextRole: "admin" | "cliente") {
    try {
      setUpdatingUserId(userId);
      const token = await getToken();
      const updatedUser = await actualizarRolUsuarioAdmin(userId, nextRole, token ?? undefined);
      setUsers((current) =>
        current.map((user) => (user.id === userId ? { ...user, ...updatedUser } : user)),
      );
      toast.success(`Rol actualizado a ${nextRole}.`);
    } catch (error) {
      toast.error(getUserFacingErrorMessage(error, "No se pudo actualizar el rol del usuario."));
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (isAuthorizing) {
    return (
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground font-sans">
        <Navbar />
        <PageLoader show />
      </div>
    );
  }

  if (!profile?.canManageUsers) {
    return <SuperAdminRestrictedState reason={profile?.isAdmin ? "admin" : "client"} />;
  }

  return (
    <SuperAdminPageContent
      users={users}
      canManageUsers
      isLoadingUsers={isLoadingUsers}
      updatingUserId={updatingUserId}
      onChangeRole={handleRoleChange}
    />
  );
}

function SuperAdminRestrictedState({ reason }: { reason: "admin" | "client" }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-20">
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {reason === "admin" ? "Tu cuenta admin no gestiona usuarios" : "Tu cuenta no tiene acceso a esta seccion"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {reason === "admin"
              ? "Los administradores solo usan el dashboard y las exportaciones. La gestion de usuarios queda reservada para el super admin."
              : "Solo el super admin puede cambiar permisos y revisar las cuentas registradas."}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SuperAdminPageContent({
  users,
  canManageUsers,
  isLoadingUsers = false,
  updatingUserId = null,
  onChangeRole,
}: {
  users: ManagedUser[];
  canManageUsers: boolean;
  isLoadingUsers?: boolean;
  updatingUserId?: string | null;
  onChangeRole?: (userId: string, nextRole: "admin" | "cliente") => Promise<void> | void;
}) {
  const totals = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.accessRole === "admin").length,
      clients: users.filter((user) => user.accessRole === "cliente").length,
    }),
    [users],
  );

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-[color:var(--background)]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-card)] sm:p-8">
          <span className="inline-flex rounded-full bg-[color:var(--moss)]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--moss)]">
            Super admin
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl">Gestion de usuarios</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Aqui controlas que cuentas creadas desde Clerk quedan como clientes y cuales pasan a admin.
            Esta vista no muestra encuestas ni dashboard.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Usuarios registrados" value={totals.total} />
            <StatCard label="Admins activos" value={totals.admins} />
            <StatCard label="Clientes" value={totals.clients} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground">Cuentas registradas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada usuario creado en Clerk aparece aqui como cliente hasta que lo promociones.
              </p>
            </div>
          </div>

          {isLoadingUsers ? (
            <div className="py-10">
              <PageLoader show />
            </div>
          ) : users.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
              Todavia no hay cuentas sincronizadas para gestionar.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {users.map((user) => {
                const isBusy = updatingUserId === user.id;
                const currentRole = user.accessRole;
                return (
                  <article
                    key={user.id}
                    className="rounded-[1.75rem] border border-border/70 bg-background/75 p-5 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{user.nombre}</h3>
                          <RoleBadge role={currentRole} />
                          {!user.activo ? <RoleBadge role="inactivo" /> : null}
                        </div>
                        <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                          {user.fecha_registro
                            ? `Registrado ${new Date(user.fecha_registro).toLocaleDateString("es-AR")}`
                            : "Sin fecha de registro"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={!canManageUsers || user.isSuperAdmin || currentRole === "cliente" || isBusy}
                          onClick={() => onChangeRole?.(user.id, "cliente")}
                          className="rounded-full border border-border/70 px-4 py-2 text-sm font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Pasar a cliente
                        </button>
                        <button
                          type="button"
                          disabled={!canManageUsers || user.isSuperAdmin || currentRole === "admin" || isBusy}
                          onClick={() => onChangeRole?.(user.id, "admin")}
                          className="rounded-full bg-[color:var(--moss)] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(160,163,49,0.9)] transition disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {isBusy ? "Guardando..." : "Pasar a admin"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-4xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: "super_admin" | "admin" | "cliente" | "inactivo" }) {
  const copy =
    role === "super_admin"
      ? "Super admin"
      : role === "admin"
        ? "Admin"
        : role === "cliente"
          ? "Cliente"
          : "Inactivo";

  return (
    <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
      {copy}
    </span>
  );
}
