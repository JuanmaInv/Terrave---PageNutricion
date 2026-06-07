import { UnauthorizedException } from "@nestjs/common";
import { AdminService } from "../../src/admin/admin.service";

describe("Servicio de administracion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.ADMIN_EMAILS;
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

  it("debe rechazar la validación cuando el email principal viene vacío", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({ query: async () => ({ rowCount: 0, rows: [] }) });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({ sub: "user_123" });
    service.buildClerkClient = vi.fn(() => ({
      users: {
        getUser: vi.fn().mockResolvedValue({
          primaryEmailAddress: { emailAddress: "" },
        }),
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

  it("debe sincronizar un usuario de Clerk con rol cliente por defecto", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    const service = new AdminService({
      async query(sql, values) {
        expect(sql).toMatch(/INSERT INTO public\.usuarios/i);
        expect(values[0]).toBe("Juan Perez");
        expect(values[1]).toBe("user@example.com");
        return {
          rowCount: 1,
          rows: [
            {
              id: "user-1",
              nombre: "Juan Perez",
              email: "user@example.com",
              rol: "cliente",
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
          firstName: "Juan",
          lastName: "Perez",
          primaryEmailAddress: { emailAddress: "user@example.com" },
        }),
      },
    }));

    await expect(service.syncUserFromToken("token")).resolves.toEqual({
      email: "user@example.com",
      role: "cliente",
      isAdmin: false,
    });
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it("debe permitir acceso admin por ADMIN_EMAILS aunque falle la base", async () => {
    const originalSecret = process.env.CLERK_SECRET_KEY;
    const originalAdmins = process.env.ADMIN_EMAILS;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    process.env.ADMIN_EMAILS = "admin@example.com";
    const service = new AdminService({
      async query() {
        throw new Error("Connection terminated due to connection timeout");
      },
    });
    service.verifyClerkJwt = vi.fn().mockResolvedValue({ sub: "user_123" });
    service.buildClerkClient = vi.fn(() => ({
      users: {
        getUser: vi.fn().mockResolvedValue({
          primaryEmailAddress: { emailAddress: "admin@example.com" },
        }),
      },
    }));

    await expect(service.validateAdminToken("token")).resolves.toEqual({
      isAdmin: true,
      email: "admin@example.com",
    });
    process.env.CLERK_SECRET_KEY = originalSecret;
    process.env.ADMIN_EMAILS = originalAdmins;
  });

  it("debe devolver false cuando rowCount no viene informado", async () => {
    const service = new AdminService({
      async query() {
        return { rows: [{ id: "user-1" }] };
      },
    });

    await expect(service.isAdminInDatabase("admin@example.com")).resolves.toBe(false);
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
