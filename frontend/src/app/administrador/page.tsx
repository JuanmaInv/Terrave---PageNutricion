"use client";

import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CommentsPanel } from "@/components/admin/CommentsPanel";
import { DistributionCharts } from "@/components/admin/DistributionCharts";
import { HourlyChart } from "@/components/admin/HourlyChart";
import { KpiGrid } from "@/components/admin/KpiGrid";
import { SensorialSection } from "@/components/admin/SensorialSection";
import { StatsFilters } from "@/components/admin/StatsFilters";
import { Footer, Navbar } from "@/components/nutrilen/Navbar";
import { PageLoader, useNavLoader } from "@/components/nutrilen/PageLoader";
import { useAdminDashboardViewModel } from "@/hooks/useAdminDashboardViewModel";
import { useCountUp } from "@/hooks/useCountUp";
import { useSurveyFilters } from "@/hooks/useSurveyFilters";
import { useSurveyResumen } from "@/hooks/useSurveyResumen";
import { useSurveyStats } from "@/hooks/useSurveyStats";
import { descargarBlob, exportarExcel, exportarPDF, validarAdmin } from "@/lib/api";

const TEST_AUTH_MODE = process.env.NEXT_PUBLIC_E2E_AUTH_MODE === "true";

export default function AdminRoute() {
  return (
    <ClientOnly fallback={null}>
      <AdminGate />
    </ClientOnly>
  );
}

export function AdminGate() {
  if (TEST_AUTH_MODE) {
    return <AdminTestGate />;
  }

  return <AdminClerkGate />;
}

function AdminClerkGate() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <AdminAuthLoadingState />;
  }

  return (
    <>
      <SignedOut>
        <AdminSignInState />
      </SignedOut>
      <SignedIn>
        <AdminAuthorized />
      </SignedIn>
    </>
  );
}

function AdminAuthLoadingState() {
  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-[color:var(--background)]">
      <Navbar />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6"
      >
        <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/80 p-8 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <PageLoader show />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AdminSignInState() {
  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-[color:var(--background)]">
      <Navbar />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12"
      >
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl font-semibold text-foreground">TERRAVE | Panel admin</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Inicia sesion para acceder a las estadisticas del proyecto.
            </p>
          </div>
          <div className="mx-auto flex w-full justify-center">
            <SignIn
              routing="hash"
              forceRedirectUrl="/administrador"
              fallbackRedirectUrl="/administrador"
              signUpForceRedirectUrl="/administrador"
              signUpFallbackRedirectUrl="/administrador"
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

function AdminTestGate() {
  const role = useSyncExternalStore(
    () => () => {},
    () => {
      const storedRole = window.localStorage.getItem("nutrilen.e2eRole");
      return storedRole === "admin" || storedRole === "client" ? storedRole : null;
    },
    () => null,
  );

  if (!role) {
    return (
      <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-[color:var(--background)]">
        <Navbar />
        <main
          id="main-content"
          className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
            <h1 className="font-serif text-2xl font-semibold text-foreground">TERRAVE | Panel admin</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Inicia sesion para acceder a las estadisticas del proyecto.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (role !== "admin") {
    return <AdminRestrictedState />;
  }

  return <AdminPage />;
}

export function AdminAuthorized() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      if (!isLoaded || !isSignedIn) return;
      try {
        const token = await getToken();
        const result = await validarAdmin(token ?? undefined);
        if (isMounted) setHasAccess(result.isAdmin);
      } catch {
        if (isMounted) setHasAccess(false);
      } finally {
        if (isMounted) setIsAuthorizing(false);
      }
    }

    checkAccess();
    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  if (isAuthorizing) {
    return (
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground font-sans">
        <Navbar />
        <PageLoader show />
      </div>
    );
  }

  if (!hasAccess) {
    return <AdminRestrictedState />;
  }

  return <AdminPage />;
}

function AdminRestrictedState() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-20">
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Esta seccion es solo para el equipo TERRAVE</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Tu cuenta no tiene permisos para visualizar el panel de estadisticas.
            Si sos parte del equipo y necesitas acceso, contacta al administrador del proyecto.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <>{children ?? fallback}</>;
}

export function AdminPage() {
  return TEST_AUTH_MODE ? <AdminPageTestMode /> : <AdminPageWithClerk />;
}

function AdminPageWithClerk() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return <AdminPageContent getToken={getToken} canLoadData={isLoaded && isSignedIn} />;
}

function AdminPageTestMode() {
  return <AdminPageContent getToken={async () => "e2e-admin-token"} canLoadData />;
}

function AdminPageContent({
  getToken,
  canLoadData,
}: {
  getToken: () => Promise<string | null>;
  canLoadData: boolean;
}) {
  const { show: showLoader, run: runWithLoader, setShow: setLoader } = useNavLoader(1200);
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useSurveyFilters();
  const { summary, refresh: refreshSummary } = useSurveyResumen(filters, { getToken, isEnabled: canLoadData });
  const { data, refresh: refreshStats } = useSurveyStats(filters, { getToken, isEnabled: canLoadData });

  const {
    total,
    completedCount,
    inProgressCount,
    sensorial,
    globalScore,
    acceptancePct,
    dietDist,
    sexDist,
    hourlyDist,
    peakHour,
    hasHourly,
    dietAcceptance,
    bestAttr,
    worstAttr,
    descriptiveCommentsList,
    affectiveCommentsList,
  } = useAdminDashboardViewModel(data, summary.inProgressCount);

  const animCount = useCountUp(acceptancePct);

  useEffect(() => {
    setLoader(true);
    const t = window.setTimeout(() => setLoader(false), 1200);
    return () => window.clearTimeout(t);
  }, [setLoader]);

  const lastUpdate = new Date().toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function refresh() {
    runWithLoader(async () => {
      await Promise.all([refreshStats(), refreshSummary()]);
    });
  }

  async function handleExportPdf() {
    try {
      const blob = await exportarPDF(data, {
        filters: {
          diet: filters.diet,
          sex: filters.sex,
          from: filters.from || "",
          to: filters.to || "",
        },
      });
      descargarBlob(blob, `terrave-dashboard-${Date.now()}.pdf`);
      toast.success("PDF descargado");
    } catch {
      toast.error("No se pudo exportar el PDF.");
    }
  }

  async function handleExportExcel() {
    try {
      const token = await getToken();
      const blob = await exportarExcel(
        data,
        {
          filters: {
            diet: filters.diet,
            sex: filters.sex,
            from: filters.from || "",
            to: filters.to || "",
          },
        },
        token ?? undefined,
      );
      descargarBlob(blob, `terrave-encuestas-${Date.now()}.xlsx`);
      toast.success("Excel descargado");
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "No se pudo exportar el archivo.";
      console.error("Excel export error:", error);
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground font-sans">
      <Navbar />
      <PageLoader show={showLoader} />
      <main id="main-content" className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-7 sm:px-6 sm:py-10 lg:py-14">
        <AdminHeader
          isRefreshing={showLoader}
          onRefresh={refresh}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />

        <StatsFilters
          filters={filters}
          total={total}
          lastUpdate={lastUpdate}
          hasActiveFilters={hasActiveFilters}
          onUpdate={updateFilter}
          onClear={clearFilters}
        />

        <KpiGrid
          total={total}
          completedCount={completedCount}
          inProgressCount={inProgressCount}
          globalScore={globalScore}
          acceptancePct={acceptancePct}
        />
        <DistributionCharts
          total={total}
          dietDist={dietDist}
          sexDist={sexDist}
          dietAcceptance={dietAcceptance}
        />
        <HourlyChart hourlyDist={hourlyDist} hasHourly={hasHourly} peakHour={peakHour} />
        <SensorialSection sensorial={sensorial} />
        <CommentsPanel
          descriptiveCommentsList={descriptiveCommentsList}
          affectiveCommentsList={affectiveCommentsList}
          bestAttr={bestAttr}
          worstAttr={worstAttr}
          total={total}
          acceptancePct={acceptancePct}
          animCount={animCount}
        />
      </main>
      <Footer />
    </div>
  );
}
