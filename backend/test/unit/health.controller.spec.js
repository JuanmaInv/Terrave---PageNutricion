import { ServiceUnavailableException } from "@nestjs/common";
import { HealthController } from "../../src/health/health.controller";

describe("Controlador de salud", () => {
  it("debe devolver readiness ok cuando la base y los secretos están configurados", async () => {
    const db = { async query() {} };
    const controller = new HealthController(db);
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalClerkSecret = process.env.CLERK_SECRET_KEY;

    process.env.DATABASE_URL = "postgres://example";
    process.env.CLERK_SECRET_KEY = "sk_test_123";

    const result = await controller.getReadiness();
    expect(result.status).toBe("ok");
    expect(result.checks.database).toBe("ok");
    expect(result.checks.databaseUrlConfigured).toBe(true);
    expect(result.checks.clerkConfigured).toBe(true);

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.CLERK_SECRET_KEY = originalClerkSecret;
  });

  it("debe devolver readiness degradado cuando falla la base de datos", async () => {
    const db = {
      async query() {
        throw new Error("db down");
      },
    };
    const controller = new HealthController(db);
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalClerkSecret = process.env.CLERK_SECRET_KEY;

    process.env.DATABASE_URL = "postgres://example";
    process.env.CLERK_SECRET_KEY = "sk_test_123";

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.CLERK_SECRET_KEY = originalClerkSecret;
  });

  it("debe devolver readiness degradado cuando faltan variables críticas aunque la base responda", async () => {
    const db = { async query() {} };
    const controller = new HealthController(db);
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalClerkSecret = process.env.CLERK_SECRET_KEY;

    process.env.DATABASE_URL = "";
    process.env.CLERK_SECRET_KEY = "";

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.CLERK_SECRET_KEY = originalClerkSecret;
  });

  it("debe devolver readiness degradado cuando falta solo Clerk aunque la base responda", async () => {
    const db = { async query() {} };
    const controller = new HealthController(db);
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalClerkSecret = process.env.CLERK_SECRET_KEY;

    process.env.DATABASE_URL = "postgres://example";
    process.env.CLERK_SECRET_KEY = "";

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.CLERK_SECRET_KEY = originalClerkSecret;
  });

  it("debe devolver metadata operativa en health y liveness", () => {
    const controller = new HealthController({ async query() {} });

    expect(controller.getHealth().status).toBe("ok");
    expect(controller.getLiveness().status).toBe("ok");
  });
});
