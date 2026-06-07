import { AppController } from "../../src/app.controller";
import { AdminController } from "../../src/admin/admin.controller";
import { EncuestasController } from "../../src/encuestas/encuestas.controller";
import { EstadisticasController } from "../../src/estadisticas/estadisticas.controller";

describe("Controladores HTTP", () => {
  it("debe devolver metadata del servicio desde AppController.getHello", () => {
    const controller = new AppController();
    const result = controller.getHello();

    expect(result.version).toBe("1.0");
    expect(result.apiPath).toBe("/api/v1");
  });

  it("debe devolver isAdmin true desde AdminController.getMe", async () => {
    const controller = new AdminController({
      getTokenFromAuthorization() {
        return "token";
      },
      async syncUserFromToken() {
        return { email: "user@example.com", role: "cliente", isAdmin: false };
      },
    });
    await expect(controller.getMe()).resolves.toEqual({ isAdmin: true });
  });

  it("debe sincronizar el usuario autenticado en AdminController", async () => {
    const controller = new AdminController({
      getTokenFromAuthorization(authorization) {
        expect(authorization).toBe("Bearer token-1");
        return "token-1";
      },
      async syncUserFromToken(token) {
        expect(token).toBe("token-1");
        return {
          email: "user@example.com",
          role: "cliente",
          isAdmin: false,
          isSuperAdmin: false,
          canAccessDashboard: false,
          canAnswerSurvey: true,
        };
      },
    });

    await expect(controller.syncUser("Bearer token-1")).resolves.toEqual({
      email: "user@example.com",
      role: "cliente",
      isAdmin: false,
      isSuperAdmin: false,
      canAccessDashboard: false,
      canAnswerSurvey: true,
    });
  });

  it("debe devolver el perfil de acceso del usuario autenticado", async () => {
    const controller = new AdminController({
      getTokenFromAuthorization(authorization) {
        expect(authorization).toBe("Bearer token-2");
        return "token-2";
      },
      async getAccessProfileFromToken(token) {
        expect(token).toBe("token-2");
        return {
          email: "juanma.capito@gmail.com",
          role: "super_admin",
          isAdmin: false,
          isSuperAdmin: true,
          canAccessDashboard: false,
          canAnswerSurvey: false,
        };
      },
    });

    await expect(controller.getAccess("Bearer token-2")).resolves.toEqual({
      email: "juanma.capito@gmail.com",
      role: "super_admin",
      isAdmin: false,
      isSuperAdmin: true,
      canAccessDashboard: false,
      canAnswerSurvey: false,
    });
  });



  it("debe mapear la respuesta de sesión creada en EncuestasController", async () => {
    const controller = new EncuestasController({
      async createSession() {
        return {
          id: "session-1",
          fecha_inicio: "2026-06-03T10:00:00.000Z",
          fecha_actualizacion: "2026-06-03T10:05:00.000Z",
        };
      },
    });

    await expect(controller.createSession({ clientSessionKey: "client-1" })).resolves.toEqual({
      id: "session-1",
      startedAt: "2026-06-03T10:00:00.000Z",
      updatedAt: "2026-06-03T10:05:00.000Z",
    });
  });

  it("debe mapear la respuesta de sesión actualizada en EncuestasController", async () => {
    const controller = new EncuestasController({
      async updateSession(id) {
        return {
          id,
          fecha_inicio: "2026-06-03T10:00:00.000Z",
          fecha_actualizacion: "2026-06-03T10:06:00.000Z",
        };
      },
    });

    await expect(controller.updateSession("session-2", { clientSessionKey: "client-2" })).resolves.toEqual({
      id: "session-2",
      startedAt: "2026-06-03T10:00:00.000Z",
      updatedAt: "2026-06-03T10:06:00.000Z",
    });
  });

  it("debe mapear la respuesta de encuesta creada en EncuestasController", async () => {
    const controller = new EncuestasController({
      async create() {
        return {
          id: "survey-1",
          fecha: "2026-06-03T11:00:00.000Z",
        };
      },
    });

    await expect(controller.create({ sex: "femenino" })).resolves.toEqual({
      id: "survey-1",
      createdAt: "2026-06-03T11:00:00.000Z",
    });
  });

  it("debe delegar consultas de resumen y estadísticas en EstadisticasController", async () => {
    const service = {
      async getDashboardSummary(query) {
        return { ...query, completedCount: 5, inProgressCount: 2 };
      },
      async getSurveys(query) {
        return [{ id: "survey-1", filters: query }];
      },
    };
    const controller = new EstadisticasController(service);

    const summary = await controller.getSummary({ diet: "vegano" });
    const stats = await controller.getStats({ sex: "femenino" });

    expect(summary.completedCount).toBe(5);
    expect(summary.inProgressCount).toBe(2);
    expect(stats).toHaveLength(1);
  });

  it("debe configurar headers y enviar el buffer de Excel", async () => {
    const service = {
      async getExcelReport() {
        return Buffer.from("excel-data");
      },
    };
    const calls = [];
    const response = {
      set(name, value) {
        calls.push(["set", name, value]);
      },
      send(payload) {
        calls.push(["send", payload.toString("utf8")]);
      },
    };
    const controller = new EstadisticasController(service);

    await controller.exportExcel({}, response);

    expect(calls.some((call) => call[1] === "Content-Type")).toBe(true);
    expect(calls.some((call) => call[1] === "Content-Disposition")).toBe(true);
    expect(calls.some((call) => call[0] === "send" && call[1] === "excel-data")).toBe(true);
  });

  it("debe envolver los errores del exportador de Excel", async () => {
    const controller = new EstadisticasController({
      async getExcelReport() {
        throw new Error("python exporter failed");
      },
    });

    await expect(controller.exportExcel({}, { set() {}, send() {} })).rejects.toThrow(/Excel export failed/);
  });

  it("debe envolver tambien fallos no tipados del exportador de Excel", async () => {
    const controller = new EstadisticasController({
      async getExcelReport() {
        throw "fallo-desconocido";
      },
    });

    await expect(controller.exportExcel({}, { set() {}, send() {} })).rejects.toThrow(
      /Excel export failed/,
    );
  });
});
