require("reflect-metadata");
const { plainToInstance } = require("class-transformer");
const { validateSync } = require("class-validator");

const { UpsertEncuestaSessionDto } = require("../../dist/src/encuestas/dto/upsert-encuesta-session.dto.js");

function buildValidPayload() {
  return {
    clientSessionKey: "client-1",
    currentStep: 2,
    sex: "femenino",
    diet: "vegano",
    attrs: {
      color: 4,
      aroma: 4,
      firmeza: 3,
      untuosidad: 4,
      sabor_tostado: 5,
      persistencia: 4,
    },
    descriptiveComments: "Todo bien",
    acceptance: 4,
    liked: "si",
    consumeAgain: "si",
    recommend: 5,
    willingnessToPay: "5200",
    affectiveComments: "Muy rico",
  };
}

function validate(payload) {
  return validateSync(plainToInstance(UpsertEncuestaSessionDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
}

describe("UpsertEncuestaSessionDto", () => {
  it("debe aceptar una sesión parcial válida", () => {
    expect(validate(buildValidPayload())).toHaveLength(0);
  });

  it("debe exigir clientSessionKey", () => {
    const errors = validate({ ...buildValidPayload(), clientSessionKey: "" });
    expect(errors.some((error) => error.property === "clientSessionKey")).toBe(true);
  });

  it("debe rechazar currentStep fuera del rango 1..3", () => {
    const errors = validate({ ...buildValidPayload(), currentStep: 4 });
    expect(errors.some((error) => error.property === "currentStep")).toBe(true);
  });

  it("debe rechazar un monto estimado con caracteres no numéricos", () => {
    const errors = validate({ ...buildValidPayload(), willingnessToPay: "5000 pesos" });
    expect(errors.some((error) => error.property === "willingnessToPay")).toBe(true);
  });
});
