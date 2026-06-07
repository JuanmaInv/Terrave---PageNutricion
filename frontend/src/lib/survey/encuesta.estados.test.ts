import { describe, expect, it } from "vitest";
import { canDisplaySurveyToRespondent, canRespondToSurvey } from "./survey-availability";

describe("Estados de encuesta", () => {
  it("debe permitir responder una encuesta activa", () => {
    expect(canRespondToSurvey("activa")).toBe(true);
  });

  it("debe impedir responder una encuesta cerrada o inactiva", () => {
    expect(canRespondToSurvey("cerrada")).toBe(false);
    expect(canRespondToSurvey("inactiva")).toBe(false);
  });

  it("debe ocultar los borradores al cliente", () => {
    expect(canDisplaySurveyToRespondent("borrador")).toBe(false);
  });
});
