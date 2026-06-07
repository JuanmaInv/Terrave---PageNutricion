import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { UpsertEncuestaSessionDto } from "../../src/encuestas/dto/upsert-encuesta-session.dto";

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

  it("debe rechazar enums y atributos parciales inválidos", () => {
    const errors = validate({
      ...buildValidPayload(),
      sex: "x",
      diet: "carnivoro",
      liked: "quizas",
      consumeAgain: "siempre",
      recommend: 6,
      attrs: {
        color: 0,
      },
    });

    expect(errors.some((error) => error.property === "sex")).toBe(true);
    expect(errors.some((error) => error.property === "diet")).toBe(true);
    expect(errors.some((error) => error.property === "liked")).toBe(true);
    expect(errors.some((error) => error.property === "consumeAgain")).toBe(true);
    expect(errors.some((error) => error.property === "recommend")).toBe(true);
    expect(errors.some((error) => error.property === "attrs")).toBe(true);
  });
});
