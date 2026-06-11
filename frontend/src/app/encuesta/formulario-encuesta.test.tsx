import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EncuestaPage from "./page";

const { toast, enviarEncuesta, crearSesionEncuesta, actualizarSesionEncuesta } = vi.hoisted(() => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  enviarEncuesta: vi.fn(),
  crearSesionEncuesta: vi.fn(),
  actualizarSesionEncuesta: vi.fn(),
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("@/hooks/useRedirectAdminToDashboard", () => ({
  useRedirectAdminToDashboard: () => ({ isCheckingRedirect: false }),
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
  }),
}));
vi.mock("@/lib/api", () => ({
  enviarEncuesta,
  crearSesionEncuesta,
  actualizarSesionEncuesta,
}));

describe("Formulario de encuesta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = "";
  });

  it("debe renderizar correctamente el formulario de encuesta", () => {
    render(<EncuestaPage />);

    expect(screen.getAllByText(/Datos generales/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Continuar/i })).toBeInTheDocument();
  });

  it("debe mostrar un error cuando faltan campos obligatorios", async () => {
    render(<EncuestaPage />);

    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(toast.error).toHaveBeenCalled();
    expect(String(toast.error.mock.calls[0]?.[0] ?? "")).toMatch(/sexo/i);
    expect(String(toast.error.mock.calls[0]?.[0] ?? "")).toMatch(/dieta/i);
  });

  it("debe permitir enviar la encuesta cuando los datos son validos", async () => {
    enviarEncuesta.mockResolvedValue(undefined);
    render(<EncuestaPage />);

    fireEvent.click(screen.getByRole("button", { name: /Femenino/i }));
    fireEvent.click(screen.getByRole("button", { name: /Omnivoro|Omnívoro/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    fireEvent.change(screen.getByLabelText(/Monto estimado/i), { target: { value: "4500" } });
    fireEvent.change(screen.getByLabelText(/Comentarios descriptivos|Comentarios \/ Observaciones/i), {
      target: { value: "Perfil sensorial parejo y sin defectos." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    fireEvent.click(screen.getByRole("button", { name: /^Me gusta4$/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Si$|^Sí$/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /^Si$|^Sí$/i })[1]);
    fireEvent.change(screen.getByLabelText(/Comentarios afectivos|Comentarios finales/i), {
      target: { value: "Me gustó el sabor y la textura general." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar evaluacion|Enviar evaluación/i }));

    await waitFor(() => {
      expect(enviarEncuesta).toHaveBeenCalledTimes(1);
    });

    expect(toast.success).toHaveBeenCalled();
    expect(screen.getByText(/Gracias por participar/i)).toBeInTheDocument();
  });
});
