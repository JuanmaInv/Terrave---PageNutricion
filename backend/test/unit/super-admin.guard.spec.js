import { UnauthorizedException } from "@nestjs/common";
import { SuperAdminGuard } from "../../src/admin/guards/super-admin.guard";

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

describe("Guard de super admin", () => {
  it("debe permitir acceso cuando el correo corresponde al super admin", async () => {
    const adminService = {
      getTokenFromAuthorization(authorization) {
        expect(authorization).toBe("Bearer super-token");
        return "super-token";
      },
      async validateSuperAdminToken(token) {
        expect(token).toBe("super-token");
        return { isSuperAdmin: true, email: "juanma.capito@gmail.com" };
      },
    };

    const guard = new SuperAdminGuard(adminService);
    await expect(
      guard.canActivate(
        buildExecutionContext({
          headers: { authorization: "Bearer super-token" },
          method: "GET",
          originalUrl: "/api/v1/admin/users",
        }),
      ),
    ).resolves.toBe(true);
  });

  it("debe rechazar acceso cuando el usuario no es super admin", async () => {
    const adminService = {
      getTokenFromAuthorization() {
        return "admin-token";
      },
      async validateSuperAdminToken() {
        throw new Error("not super admin");
      },
    };

    const guard = new SuperAdminGuard(adminService);

    await expect(
      guard.canActivate(
        buildExecutionContext({
          headers: { authorization: "Bearer admin-token" },
          method: "PATCH",
          originalUrl: "/api/v1/admin/users/user-1/role",
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
