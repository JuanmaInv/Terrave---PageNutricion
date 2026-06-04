require("reflect-metadata");
const { plainToInstance } = require("class-transformer");
const { validateSync } = require("class-validator");

const { GetEstadisticasQueryDto } = require("../../dist/src/estadisticas/dto/get-estadisticas-query.dto.js");

function validate(payload) {
  return validateSync(plainToInstance(GetEstadisticasQueryDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
}

describe("GetEstadisticasQueryDto", () => {
  it("debe aceptar filtros válidos de estadísticas", () => {
    expect(
      validate({
        diet: "vegano",
        sex: "femenino",
        from: "2026-06-01",
        to: "2026-06-30",
      }),
    ).toHaveLength(0);
  });

  it("debe rechazar dietas inválidas", () => {
    const errors = validate({ diet: "carnivoro" });
    expect(errors.some((error) => error.property === "diet")).toBe(true);
  });

  it("debe rechazar sexos inválidos", () => {
    const errors = validate({ sex: "x" });
    expect(errors.some((error) => error.property === "sex")).toBe(true);
  });
});
