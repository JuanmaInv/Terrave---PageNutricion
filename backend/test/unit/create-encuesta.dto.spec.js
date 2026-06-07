import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { CreateEncuestaDto } from "../../src/encuestas/dto/create-encuesta.dto";

function buildValidPayload() {
  return {
    id: "survey-1",
    sessionId: "session-1",
    clientSessionKey: "client-1",
    date: "2026-06-03T12:00:00.000Z",
    sex: "femenino",
    diet: "omnivoro",
    attrs: {
      color: 4,
      aroma: 4,
      firmeza: 4,
      untuosidad: 4,
      sabor_tostado: 4,
      persistencia: 4,
    },
    descriptiveComments: "Buena textura",
    acceptance: 4,
    liked: "si",
    consumeAgain: "tal_vez",
    recommend: 5,
    willingnessToPay: "4500",
    affectiveComments: "Me gusto bastante",
  };
}

function validate(payload) {
  return validateSync(plainToInstance(CreateEncuestaDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
}

describe("CreateEncuestaDto", () => {
  it("debe aceptar una encuesta completa válida", () => {
    expect(validate(buildValidPayload())).toHaveLength(0);
  });

  it("debe rechazar valores sensoriales fuera de rango", () => {
    const errors = validate({
      ...buildValidPayload(),
      attrs: { ...buildValidPayload().attrs, color: 7 },
    });

    expect(errors.some((error) => error.property === "attrs")).toBe(true);
  });

  it("debe rechazar un monto estimado con caracteres no numéricos", () => {
    const errors = validate({
      ...buildValidPayload(),
      willingnessToPay: "4500 pesos",
    });

    const target = errors.find((error) => error.property === "willingnessToPay");
    expect(target).toBeDefined();
    expect(JSON.stringify(target?.constraints)).toMatch(/only digits/i);
  });

  it("debe rechazar enums inválidos", () => {
    const errors = validate({
      ...buildValidPayload(),
      liked: "quizas",
      consumeAgain: "siempre",
    });

    expect(errors.some((error) => error.property === "liked")).toBe(true);
    expect(errors.some((error) => error.property === "consumeAgain")).toBe(true);
  });

  it("debe rechazar una fecha no ISO y campos opcionales vacíos", () => {
    const errors = validate({
      ...buildValidPayload(),
      date: "03/06/2026",
      sessionId: "",
      clientSessionKey: "",
    });

    expect(errors.some((error) => error.property === "date")).toBe(true);
    expect(errors.some((error) => error.property === "sessionId")).toBe(true);
    expect(errors.some((error) => error.property === "clientSessionKey")).toBe(true);
  });

  it("debe rechazar recommend fuera de rango", () => {
    const errors = validate({
      ...buildValidPayload(),
      recommend: 0,
    });

    expect(errors.some((error) => error.property === "recommend")).toBe(true);
  });
});
