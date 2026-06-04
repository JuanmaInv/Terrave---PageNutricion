const { BadRequestException } = require("@nestjs/common");

const { GlobalExceptionFilter } = require("../../dist/src/common/filters/global-exception.filter.js");

function buildResponseRecorder() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function buildHost(request, response) {
  return {
    switchToHttp() {
      return {
        getRequest() {
          return request;
        },
        getResponse() {
          return response;
        },
      };
    },
  };
}

describe("GlobalExceptionFilter", () => {
  it("debe mapear correctamente payloads de HttpException", () => {
    const filter = new GlobalExceptionFilter();
    const response = buildResponseRecorder();

    filter.catch(
      new BadRequestException({ statusCode: 400, message: ["invalid"], error: "Bad Request" }),
      buildHost({ id: "req-1", method: "POST", originalUrl: "/api/v1/encuestas" }, response),
    );

    expect(response.statusCode).toBe(400);
    expect(response.payload.message).toEqual(["invalid"]);
    expect(response.payload.requestId).toBe("req-1");
  });

  it("debe ocultar detalles internos en errores inesperados", () => {
    const filter = new GlobalExceptionFilter();
    const response = buildResponseRecorder();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    filter.catch(
      new Error("database exploded"),
      buildHost({ id: "req-2", method: "GET", originalUrl: "/api/v1/estadisticas" }, response),
    );

    expect(response.statusCode).toBe(500);
    expect(response.payload.message).toBe("Internal server error");
    expect(response.payload.requestId).toBe("req-2");
    errorSpy.mockRestore();
  });

  it("debe mapear HttpException con payload string", () => {
    const { UnauthorizedException } = require("@nestjs/common");
    const filter = new GlobalExceptionFilter();
    const response = buildResponseRecorder();

    filter.catch(
      new UnauthorizedException("Token inválido"),
      buildHost({ id: "req-3", method: "GET", originalUrl: "/api/v1/admin/me" }, response),
    );

    expect(response.statusCode).toBe(401);
    expect(response.payload.message).toBe("Token inválido");
    expect(response.payload.path).toBe("/api/v1/admin/me");
  });

  it("debe manejar excepciones que no son Error", () => {
    const filter = new GlobalExceptionFilter();
    const response = buildResponseRecorder();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    filter.catch(
      "catastrophic failure",
      buildHost({ id: undefined, method: undefined, originalUrl: undefined }, response),
    );

    expect(response.statusCode).toBe(500);
    expect(response.payload.message).toBe("Internal server error");
    expect(response.payload.requestId).toBe("n/a");
    expect(response.payload.path).toBe("unknown");
    errorSpy.mockRestore();
  });
});
