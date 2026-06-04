import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAuthorized } from "./page";

const { useAuth, validarAdmin, useSurveyStats, useSurveyResumen } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  validarAdmin: vi.fn(),
  useSurveyStats: vi.fn(),
  useSurveyResumen: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth,
  SignedIn: ({ children }: { children: ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: ReactNode }) => <>{children}</>,
  SignIn: () => <div>Clerk SignIn</div>,
}));
vi.mock("@/lib/api", () => ({
  validarAdmin,
  exportarPDF: vi.fn(),
  exportarExcel: vi.fn(),
  descargarBlob: vi.fn(),
}));
vi.mock("@/hooks/useSurveyStats", () => ({
  useSurveyStats,
}));
vi.mock("@/hooks/useSurveyResumen", () => ({
  useSurveyResumen,
}));
vi.mock("@/hooks/useSurveyFilters", () => ({
  useSurveyFilters: () => ({
    filters: { diet: "all", sex: "all", from: "", to: "" },
    updateFilter: vi.fn(),
    clearFilters: vi.fn(),
    hasActiveFilters: false,
  }),
}));
vi.mock("@/hooks/useCountUp", () => ({
  useCountUp: () => 0,
}));
vi.mock("@/components/nutrilen/Navbar", () => ({
  Navbar: () => <div>Navbar</div>,
  Footer: () => <div>Footer</div>,
}));
vi.mock("@/components/nutrilen/PageLoader", () => ({
  PageLoader: () => null,
  useNavLoader: () => ({
    show: false,
    run: async (callback: () => unknown) => callback(),
    setShow: vi.fn(),
  }),
}));
vi.mock("@/components/admin/StatsFilters", () => ({
  StatsFilters: () => <div>StatsFilters</div>,
}));
vi.mock("@/components/admin/AdminHeader", () => ({
  AdminHeader: () => <div>AdminHeader</div>,
}));
vi.mock("@/components/admin/SensorialSection", () => ({
  SensorialSection: () => <div>SensorialSection</div>,
}));
vi.mock("@/components/admin/HourlyChart", () => ({
  HourlyChart: () => <div>HourlyChart</div>,
}));
vi.mock("@/components/admin/CommentsPanel", () => ({
  CommentsPanel: () => <div>CommentsPanel</div>,
}));

describe("Roles y permisos del dashboard admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      getToken: vi.fn().mockResolvedValue("token"),
      isLoaded: true,
      isSignedIn: true,
    });
    useSurveyResumen.mockReturnValue({
      summary: { completedCount: 0, inProgressCount: 0 },
      refresh: vi.fn(),
    });
    useSurveyStats.mockReturnValue({
      data: [],
      refresh: vi.fn(),
    });
  });

  it("debe permitir que el admin vea el dashboard aunque no haya datos", async () => {
    validarAdmin.mockResolvedValue({ isAdmin: true });

    render(<AdminAuthorized />);

    await waitFor(() => {
      expect(screen.getAllByText(/Encuestas completas/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    });
  });

  it("debe impedir que un cliente o rol invalido acceda al dashboard admin", async () => {
    validarAdmin.mockResolvedValue({ isAdmin: false });

    render(<AdminAuthorized />);

    await waitFor(() => {
      expect(screen.getByText(/Esta seccion es solo para el equipo TERRAVE/i)).toBeInTheDocument();
    });
  });

  it("debe bloquear a un usuario sin token valido", async () => {
    useAuth.mockReturnValue({
      getToken: vi.fn().mockResolvedValue(null),
      isLoaded: true,
      isSignedIn: true,
    });
    validarAdmin.mockResolvedValue({ isAdmin: false });

    render(<AdminAuthorized />);

    await waitFor(() => {
      expect(screen.getByText(/Tu cuenta no tiene permisos/i)).toBeInTheDocument();
    });
  });
});
