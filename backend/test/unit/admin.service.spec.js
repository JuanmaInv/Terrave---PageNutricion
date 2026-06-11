const { UnauthorizedException } = require("@nestjs/common");
const { AdminService } = require("../../dist/src/admin/admin.service.js");

describe("AdminService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("debe extraer el token cuando el esquema Authorization es Bearer", () => {
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });
    expect(service.getTokenFromAuthorization("Bearer abc123")).toBe("abc123");
  });

  it("debe rechazar un encabezado Authorization sin Bearer válido", () => {
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });
    expect(() => service.getTokenFromAuthorization("Basic abc123")).toThrow(UnauthorizedException);
    expect(() => service.getTokenFromAuthorization()).toThrow(UnauthorizedException);
  });

  it("debe devolver true cuando existe un admin activo en la base", async () => {
    const service = new AdminService({
      async query(_sql, values) {
        expect(values[0]).toBe("admin@example.com");
        return { rowCount: 1, rows: [{ id: "user-1" }] };
      },
    });

    await expect(service.isAdminInDatabase("admin@example.com")).resolves.toBe(true);
  });

  it("debe devolver false cuando no existe un admin en la base", async () => {
    const service = new AdminService({
      async query() {
        return { rowCount: 0, rows: [] };
      },
    });

    await expect(service.isAdminInDatabase("user@example.com")).resolves.toBe(false);
  });

  it("debe ofuscar la parte local del email", () => {
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });
    expect(service.maskEmail("juanm@example.com")).toBe("ju***@example.com");
    expect(service.maskEmail("sin-formato")).toBe("redacted");
  });

  it("debe rechazar la validación admin cuando falta la secret de Clerk", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    delete process.env.CLERK_SECRET_KEY;
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });

    await expect(service.validateAdminToken("token")).rejects.toBeInstanceOf(UnauthorizedException);
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe rechazar la validación cuando el token no trae sub", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({});

    await expect(service.validateAdminToken("token")).rejects.toThrow(/Invalid Clerk token/);
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe rechazar la validación cuando el usuario de Clerk no tiene email principal", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({ sub: "user_123" });
    service.buildClerkClient = vi.fn(() => ({
      users: {
        getUser: vi.fn().mockResolvedValue({ primaryEmailAddress: null }),
      },
    }));

    await expect(service.validateAdminToken("token")).rejects.toThrow(/no primary email/);
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe rechazar la validación cuando el usuario no es admin", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({
      async query() {
        return { rowCount: 0, rows: [] };
      },
    });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({ sub: "user_123" });
    service.buildClerkClient = vi.fn(() => ({
      users: {
        getUser: vi.fn().mockResolvedValue({
          primaryEmailAddress: { emailAddress: "user@example.com" },
        }),
      },
    }));

    await expect(service.validateAdminToken("token")).rejects.toThrow(/Admin access required/);
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe validar correctamente un token de admin", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({
      async query(_sql, values) {
        expect(values[0]).toBe("admin@example.com");
        return { rowCount: 1, rows: [{ id: "admin-1" }] };
      },
    });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({ sub: "user_123" });
    service.buildClerkClient = vi.fn(() => ({
      users: {
        getUser: vi.fn().mockResolvedValue({
          primaryEmailAddress: { emailAddress: "ADMIN@EXAMPLE.COM" },
        }),
      },
    }));

    await expect(service.validateAdminToken("token")).resolves.toEqual({
      isAdmin: true,
      email: "admin@example.com",
    });
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe rechazar obtener el perfil de acceso cuando falta la secret de Clerk", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    delete process.env.CLERK_SECRET_KEY;
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });

    await expect(service.getAccessProfileFromToken("token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe devolver acceso cliente cuando el usuario autenticado no existe en la base", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({
      async query() {
        return { rowCount: 0, rows: [] };
      },
    });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({ sub: "user_123" });
    service.buildClerkClient = vi.fn(() => ({
      users: {
        getUser: vi.fn().mockResolvedValue({
          primaryEmailAddress: { emailAddress: "nuevo@example.com" },
          firstName: "Nuevo",
          lastName: "Usuario",
        }),
      },
    }));

    await expect(service.getAccessProfileFromToken("token")).resolves.toEqual({
      email: "nuevo@example.com",
      role: "cliente",
      isAdmin: false,
      canAccessDashboard: false,
      canAnswerSurvey: true,
    });
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe devolver acceso admin cuando el usuario existe activo con rol admin", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({
      async query() {
        return {
          rowCount: 1,
          rows: [
            {
              id: "user-1",
              nombre: "Ada Lovelace",
              email: "admin@example.com",
              rol: "admin",
              activo: true,
            },
          ],
        };
      },
    });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({ sub: "user_123" });
    service.buildClerkClient = vi.fn(() => ({
      users: {
        getUser: vi.fn().mockResolvedValue({
          primaryEmailAddress: { emailAddress: "ADMIN@EXAMPLE.COM" },
          firstName: "Ada",
          lastName: "Lovelace",
        }),
      },
    }));

    await expect(service.getAccessProfileFromToken("token")).resolves.toEqual({
      email: "admin@example.com",
      role: "admin",
      isAdmin: true,
      canAccessDashboard: true,
      canAnswerSurvey: false,
    });
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe degradar a cliente cuando el usuario existe pero no tiene acceso admin activo", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({
      async query() {
        return {
          rowCount: 1,
          rows: [
            {
              id: "user-2",
              nombre: "Grace Hopper",
              email: "grace@example.com",
              rol: "admin",
              activo: false,
            },
          ],
        };
      },
    });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({ sub: "user_456" });
    service.buildClerkClient = vi.fn(() => ({
      users: {
        getUser: vi.fn().mockResolvedValue({
          primaryEmailAddress: { emailAddress: "grace@example.com" },
        }),
      },
    }));

    await expect(service.getAccessProfileFromToken("token")).resolves.toEqual({
      email: "grace@example.com",
      role: "cliente",
      isAdmin: false,
      canAccessDashboard: false,
      canAnswerSurvey: true,
    });
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe delegar syncUserFromToken en getAccessProfileFromToken", async () => {
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });
    const expectedProfile = {
      email: "sync@example.com",
      role: "cliente",
      isAdmin: false,
      canAccessDashboard: false,
      canAnswerSurvey: true,
    };
    service.getAccessProfileFromToken = vi.fn().mockResolvedValue(expectedProfile);

    await expect(service.syncUserFromToken("token-sync")).resolves.toEqual(expectedProfile);
    expect(service.getAccessProfileFromToken).toHaveBeenCalledWith("token-sync");
  });

  it("debe exponer un cliente de Clerk al construirlo con la secret configurada", () => {
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });

    const clerkClient = service.buildClerkClient("sk_test_123");

    expect(clerkClient).toBeTruthy();
    expect(clerkClient.users).toBeTruthy();
    expect(typeof clerkClient.users.getUser).toBe("function");
  });

  it("debe propagar el error cuando verifyClerkJwt recibe un token inválido", async () => {
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });

    await expect(service.verifyClerkJwt("token-invalido", "sk_test_123")).rejects.toBeInstanceOf(
      Error,
    );
  });
});
