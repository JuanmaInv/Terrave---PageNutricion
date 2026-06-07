import { EventEmitter } from "node:events";

const { existsSyncMock, spawnMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn(),
  spawnMock: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: existsSyncMock,
}));

vi.mock("child_process", () => ({
  spawn: spawnMock,
}));

import { EstadisticasService } from "../../src/estadisticas/estadisticas.service";

describe("EstadisticasService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    existsSyncMock.mockImplementation((path) =>
      String(path).includes("generate_excel_report.py"),
    );
  });

  it("debe delegar la consulta de encuestas al repository", async () => {
    const repository = {
      async findAll(query) {
        return [{ id: "survey-1", query }];
      },
    };
    const service = new EstadisticasService(repository);

    const result = await service.getSurveys({ diet: "vegano" });

    expect(result).toHaveLength(1);
    expect(result[0].query.diet).toBe("vegano");
  });

  it("debe delegar el resumen del dashboard al repository", async () => {
    const repository = {
      async getDashboardSummary() {
        return { completedCount: 10, inProgressCount: 3 };
      },
    };
    const service = new EstadisticasService(repository);

    await expect(service.getDashboardSummary({})).resolves.toEqual({
      completedCount: 10,
      inProgressCount: 3,
    });
  });

  it("debe usar el exportador remoto de Python cuando la URL estÃ¡ disponible", async () => {
    const service = new EstadisticasService({
      async findAll() {
        return [{ id: "survey-1" }];
      },
    });

    service.getPythonExporterUrl = () => "https://example.com/python/excel-report";
    service.callPythonFunction = async (url, payload) => {
      expect(url).toBe("https://example.com/python/excel-report");
      expect(payload.filters.diet).toBe("all");
      return Buffer.from("remote-excel");
    };

    const buffer = await service.getExcelReport({});
    expect(buffer.toString("utf8")).toBe("remote-excel");
  });

  it("debe usar el exportador local de Python como fallback", async () => {
    const originalPythonExecutable = process.env.PYTHON_EXECUTABLE;
    process.env.PYTHON_EXECUTABLE = "python3";

    const service = new EstadisticasService({
      async findAll() {
        return [{ id: "survey-1" }];
      },
    });

    service.getPythonExporterUrl = () => null;
    service.resolvePythonScriptPath = () => "scripts/generate_excel_report.py";
    service.runPythonExporter = async (python, scriptPath, payload) => {
      expect(python).toBe("python3");
      expect(scriptPath).toBe("scripts/generate_excel_report.py");
      expect(payload.surveys).toHaveLength(1);
      return Buffer.from("local-excel");
    };

    const buffer = await service.getExcelReport({ sex: "femenino" });
    expect(buffer.toString("utf8")).toBe("local-excel");
    process.env.PYTHON_EXECUTABLE = originalPythonExecutable;
  });

  it("debe priorizar la URL explÃ­cita del exportador y luego usar Vercel como fallback", () => {
    const service = new EstadisticasService({});
    const originalExplicit = process.env.EXCEL_PYTHON_EXPORT_URL;
    const originalVercel = process.env.VERCEL_URL;

    process.env.EXCEL_PYTHON_EXPORT_URL = "https://custom.example.com/excel";
    process.env.VERCEL_URL = "terrave.vercel.app";
    expect(service.getPythonExporterUrl()).toBe("https://custom.example.com/excel");

    process.env.EXCEL_PYTHON_EXPORT_URL = "";
    expect(service.getPythonExporterUrl()).toBe("https://terrave.vercel.app/python/excel-report");

    process.env.EXCEL_PYTHON_EXPORT_URL = originalExplicit;
    process.env.VERCEL_URL = originalVercel;
  });

  it("debe devolver null cuando no hay URL explÃ­cita ni URL de Vercel", () => {
    const service = new EstadisticasService({});
    const originalExplicit = process.env.EXCEL_PYTHON_EXPORT_URL;
    const originalVercel = process.env.VERCEL_URL;

    delete process.env.EXCEL_PYTHON_EXPORT_URL;
    delete process.env.VERCEL_URL;

    expect(service.getPythonExporterUrl()).toBeNull();

    process.env.EXCEL_PYTHON_EXPORT_URL = originalExplicit;
    process.env.VERCEL_URL = originalVercel;
  });

  it("debe resolver la ruta del script exportador", () => {
    const service = new EstadisticasService({});
    expect(service.resolvePythonScriptPath()).toMatch(/generate_excel_report\.py$/);
  });

  it("debe fallar cuando no encuentra el script del exportador de Python", () => {
    const service = new EstadisticasService({});
    existsSyncMock.mockReturnValue(false);

    expect(() => service.resolvePythonScriptPath()).toThrow(/Python exporter script not found/);
  });

  it("debe construir la request al exportador y devolver un buffer", async () => {
    const service = new EstadisticasService({});
    const originalFetch = global.fetch;
    const originalToken = process.env.EXCEL_EXPORT_INTERNAL_TOKEN;
    const originalBypass = process.env.VERCEL_PROTECTION_BYPASS;
    process.env.EXCEL_EXPORT_INTERNAL_TOKEN = "internal-token";
    process.env.VERCEL_PROTECTION_BYPASS = "bypass-token";

    global.fetch = async (url, init) => {
      expect(String(url)).toMatch(/x-vercel-protection-bypass=bypass-token/);
      expect(init.headers["x-excel-export-token"]).toBe("internal-token");
      expect(init.method).toBe("POST");
      return {
        ok: true,
        async arrayBuffer() {
          return Buffer.from("excel-buffer");
        },
      };
    };

    const buffer = await service.callPythonFunction("https://example.com/excel", { hello: "world" });
    expect(buffer.toString("utf8")).toBe("excel-buffer");

    global.fetch = originalFetch;
    process.env.EXCEL_EXPORT_INTERNAL_TOKEN = originalToken;
    process.env.VERCEL_PROTECTION_BYPASS = originalBypass;
  });

  it("debe llamar al exportador sin headers opcionales cuando no hay tokens configurados", async () => {
    const service = new EstadisticasService({});
    const originalFetch = global.fetch;
    const originalToken = process.env.EXCEL_EXPORT_INTERNAL_TOKEN;
    const originalBypass = process.env.VERCEL_PROTECTION_BYPASS;
    delete process.env.EXCEL_EXPORT_INTERNAL_TOKEN;
    delete process.env.VERCEL_PROTECTION_BYPASS;

    global.fetch = async (url, init) => {
      expect(String(url)).toBe("https://example.com/excel");
      expect(init.headers["Content-Type"]).toBe("application/json");
      expect(init.headers["x-excel-export-token"]).toBeUndefined();
      expect(init.headers["x-vercel-protection-bypass"]).toBeUndefined();
      return {
        ok: true,
        async arrayBuffer() {
          return Buffer.from("excel-buffer-simple");
        },
      };
    };

    const buffer = await service.callPythonFunction("https://example.com/excel", { hello: "world" });
    expect(buffer.toString("utf8")).toBe("excel-buffer-simple");

    global.fetch = originalFetch;
    process.env.EXCEL_EXPORT_INTERNAL_TOKEN = originalToken;
    process.env.VERCEL_PROTECTION_BYPASS = originalBypass;
  });

  it("debe fallar cuando el exportador responde con error", async () => {
    const service = new EstadisticasService({});
    const originalFetch = global.fetch;

    global.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      async text() {
        return "python failed";
      },
    });

    await expect(service.callPythonFunction("https://example.com/excel", {})).rejects.toThrow(/Python exporter failed/);

    global.fetch = originalFetch;
  });

  it("debe incluir un cuerpo vacÃ­o si la lectura del error HTTP falla", async () => {
    const service = new EstadisticasService({});
    const originalFetch = global.fetch;

    global.fetch = async () => ({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      async text() {
        throw new Error("no se pudo leer el body");
      },
    });

    await expect(service.callPythonFunction("https://example.com/excel", {})).rejects.toThrow(
      /Python exporter failed: 502 Bad Gateway/,
    );

    global.fetch = originalFetch;
  });

  it("debe resolver el exportador local cuando el proceso hijo finaliza bien", async () => {
    const service = new EstadisticasService({});
    spawnMock.mockImplementation(() => {
      const proc = new EventEmitter();
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.stdin = {
        write() {},
        end() {
          proc.stdout.emit("data", Buffer.from("excel-ok"));
          proc.emit("close", 0);
        },
      };
      return proc;
    });

    const buffer = await service.runPythonExporter("python", "script.py", { a: 1 });
    expect(buffer.toString("utf8")).toBe("excel-ok");
  });

  it("debe rechazar con un mensaje claro cuando no existe el ejecutable de Python", async () => {
    const service = new EstadisticasService({});
    spawnMock.mockImplementation(() => {
      const proc = new EventEmitter();
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.stdin = { write() {}, end() {} };
      process.nextTick(() => proc.emit("error", Object.assign(new Error("missing"), { code: "ENOENT" })));
      return proc;
    });

    await expect(service.runPythonExporter("python", "script.py", { a: 1 })).rejects.toThrow(
      /Python executable not found/,
    );
  });

  it("debe propagar errores inesperados del proceso Python local", async () => {
    const service = new EstadisticasService({});
    spawnMock.mockImplementation(() => {
      const proc = new EventEmitter();
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.stdin = { write() {}, end() {} };
      process.nextTick(() => proc.emit("error", new Error("unexpected python error")));
      return proc;
    });

    await expect(service.runPythonExporter("python", "script.py", { a: 1 })).rejects.toThrow(
      /unexpected python error/,
    );
  });

  it("debe rechazar el exportador local cuando termina con cÃ³digo distinto de cero", async () => {
    const service = new EstadisticasService({});
    spawnMock.mockImplementation(() => {
      const proc = new EventEmitter();
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.stdin = {
        write() {},
        end() {
          proc.stderr.emit("data", Buffer.from("python script crashed"));
          proc.emit("close", 2);
        },
      };
      return proc;
    });

    await expect(service.runPythonExporter("python", "script.py", { a: 1 })).rejects.toThrow(
      /python script crashed/,
    );
  });
});
