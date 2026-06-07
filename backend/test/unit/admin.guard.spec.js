import { UnauthorizedException } from "@nestjs/common";
import { AdminGuard } from "../../src/admin/guards/admin.guard";

function buildExecutionContext(request) {
  return {
    switchToHttp() {
      return {
        getRequest() {
          return request;
        },
      };
    },
  };
}

describe("Guard de administracion", () => {
  it("debe permitir acceso cuando el token es válido y el usuario es admin", async () => {
    const adminService = {
      getTokenFromAuthorization(authorization) {
        expect(authorization).toBe("Bearer valid-token");
        return "valid-token";
      },
      async validateAdminToken(token) {
        expect(token).toBe("valid-token");
        return { isAdmin: true, email: "admin@example.com" };
      },
    };

    const guard = new AdminGuard(adminService);
    await expect(
      guard.canActivate(
        buildExecutionContext({
          headers: { authorization: "Bearer valid-token" },
          method: "GET",
          originalUrl: "/api/v1/admin/me",
        }),
      ),
    ).resolves.toBe(true);
  });

  it("debe rechazar acceso cuando falla la validación admin", async () => {
    const adminService = {
      getTokenFromAuthorization() {
        return "invalid-token";
      },
      async validateAdminToken() {
        throw new Error("not admin");
      },
    };

    const guard = new AdminGuard(adminService);

    await expect(
      guard.canActivate(
        buildExecutionContext({
          headers: { authorization: "Bearer invalid-token" },
          method: "GET",
          originalUrl: "/api/v1/estadisticas",
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("debe usar el primer valor cuando Authorization llega como array", async () => {
    const adminService = {
      getTokenFromAuthorization(authorization) {
        expect(authorization).toBe("Bearer array-token");
        return "array-token";
      },
      async validateAdminToken(token) {
        expect(token).toBe("array-token");
        return { isAdmin: true, email: "admin@example.com" };
      },
    };

    const guard = new AdminGuard(adminService);
    await expect(
      guard.canActivate(
        buildExecutionContext({
          headers: { authorization: ["Bearer array-token", "Bearer ignored"] },
          method: "GET",
          originalUrl: "/api/v1/admin/me",
        }),
      ),
    ).resolves.toBe(true);
  });

  it("debe rechazar acceso cuando no hay encabezado Authorization", async () => {
    const adminService = {
      getTokenFromAuthorization() {
        throw new UnauthorizedException("Missing bearer token");
      },
      async validateAdminToken() {
        return { isAdmin: true, email: "admin@example.com" };
      },
    };

    const guard = new AdminGuard(adminService);

    await expect(
      guard.canActivate(
        buildExecutionContext({
          headers: {},
          method: "GET",
          originalUrl: "/api/v1/admin/me",
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("debe usar valores fallback cuando falla con un error no tipado", async () => {
    const adminService = {
      getTokenFromAuthorization() {
        throw "fallo-desconocido";
      },
      async validateAdminToken() {
        return { isAdmin: true, email: "admin@example.com" };
      },
    };

    const guard = new AdminGuard(adminService);

    await expect(
      guard.canActivate(
        buildExecutionContext({
          headers: undefined,
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
