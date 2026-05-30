"use client";

import { useEffect, useState } from "react";
import { Navbar, Footer } from "@/components/nutrilen/Navbar";
import { PageLoader, useNavLoader } from "@/components/nutrilen/PageLoader";
import { toast } from "sonner";
import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs";
import { descargarBlob, exportarPDF, exportarExcel, validarAdmin } from "@/lib/api";
import { useSurveyFilters } from "@/hooks/useSurveyFilters";
import { useSurveyStats } from "@/hooks/useSurveyStats";
import { useAdminDashboardViewModel } from "@/hooks/useAdminDashboardViewModel";
import { useCountUp } from "@/hooks/useCountUp";
import { StatsFilters } from "@/components/admin/StatsFilters";
import { KpiGrid } from "@/components/admin/KpiGrid";
import { SensorialSection } from "@/components/admin/SensorialSection";
import { HourlyChart } from "@/components/admin/HourlyChart";
import { DistributionCharts } from "@/components/admin/DistributionCharts";
import { CommentsPanel } from "@/components/admin/CommentsPanel";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminRoute() {
  return (
    <ClientOnly fallback={null}>
      <AdminGate />
    </ClientOnly>
  );
}

function AdminGate() {
  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-4">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <h1 className="font-serif text-2xl font-semibold text-foreground">NutriLen · Panel admin</h1>
              <p className="mt-1 text-sm text-muted-foreground">Iniciá sesión para acceder a las estadísticas.</p>
            </div>
            <SignIn
              routing="hash"
              forceRedirectUrl="/administrador"
              fallbackRedirectUrl="/administrador"
              signUpForceRedirectUrl="/administrador"
              signUpFallbackRedirectUrl="/administrador"
            />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <AdminAuthorized />
      </SignedIn>
    </>
  );
}

function AdminAuthorized() {
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
      <div className="min-h-screen w-full bg-background text-foreground font-sans">
        <Navbar />
        <PageLoader show />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-20">
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Esta sección es solo para el equipo NutriLen</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Tu cuenta no tiene permisos para visualizar el panel de estadísticas.
              Si sos parte del equipo y necesitás acceso, contactá al administrador del proyecto.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <AdminPage />;
}

function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <>{children ?? fallback}</>;
}

function AdminPage() {
  const { getToken } = useAuth();
  const { show: showLoader, run: runWithLoader, setShow: setLoader } = useNavLoader(1200);
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useSurveyFilters();
  const { data, refresh: refreshStats } = useSurveyStats(filters);

  const {
    total,
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
  } = useAdminDashboardViewModel(data);

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
      await refreshStats();
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
      descargarBlob(blob, `nutrilen-dashboard-${Date.now()}.pdf`);
      toast.success("PDF descargado");
    } catch {
      toast.error("No se pudo exportar el PDF.");
    }
  }

  async function handleExportExcel() {
    try {
      const token = await getToken();
      const blob = await exportarExcel(data, {
        filters: {
          diet: filters.diet,
          sex: filters.sex,
          from: filters.from || "",
          to: filters.to || "",
        },
      }, token ?? undefined);
      descargarBlob(blob, `nutrilen-encuestas-${Date.now()}.xlsx`);
      toast.success("Excel descargado");
    } catch {
      toast.error("No se pudo exportar el archivo.");
    }
  }

  return (
    <div className="min-h-screen w-full max-w-[100svw] overflow-x-hidden bg-background text-foreground font-sans">
      <Navbar />
      <PageLoader show={showLoader} />
      <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-7 sm:px-6 sm:py-10 lg:py-14">
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

        <KpiGrid total={total} globalScore={globalScore} acceptancePct={acceptancePct} />
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

        <p className="mt-8 text-center text-xs text-muted-foreground sm:text-right">
          NutriLen · Proyecto integrador ISI x Nutrición
        </p>
      </main>
      <Footer />
    </div>
  );
}

