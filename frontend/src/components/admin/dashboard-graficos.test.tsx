import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DistributionCharts } from "./DistributionCharts";

describe("Gráficos del dashboard", () => {
  it("debe mostrar gráficos con datos", () => {
    render(
      <DistributionCharts
        total={3}
        dietDist={[
          { id: "vegano", name: "Vegano", value: 2, pct: 67, color: "#FF6D0E" },
          { id: "omnivoro", name: "OmnÃ­voro", value: 1, pct: 33, color: "#898C32" },
        ]}
        sexDist={[
          { id: "femenino", name: "Femenino", value: 1, pct: 33, color: "#FF6D0E" },
          { id: "masculino", name: "Masculino", value: 1, pct: 33, color: "#898C32" },
          { id: "otro", name: "Otro / Prefiere no responder", value: 1, pct: 33, color: "#F4B223" },
        ]}
        dietAcceptance={[
          { name: "Vegano", value: 100, color: "#FF6D0E", count: 2 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /Distribución de dietas/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Vegano/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/67% \(2\)/i)).toBeInTheDocument();
  });

  it("debe mostrar un mensaje válido cuando no hay datos", () => {
    render(
      <DistributionCharts total={0} dietDist={[]} sexDist={[]} dietAcceptance={[]} />,
    );

    expect(screen.getByText(/Composición de la muestra evaluada/i)).toBeInTheDocument();
  });
});
