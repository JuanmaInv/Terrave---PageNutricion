import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Controller("health")
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "nutrilen-backend",
      timestamp: new Date().toISOString()
    };
  }

  @Get("live")
  getLiveness() {
    return {
      status: "ok",
      service: "nutrilen-backend",
      check: "liveness",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  async getReadiness() {
    const checks = {
      database: "unknown",
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL?.trim()),
      clerkConfigured: Boolean(process.env.CLERK_SECRET_KEY?.trim()),
    };

    try {
      await this.db.query("SELECT 1");
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }

    if (
      checks.database !== "ok" ||
      !checks.databaseUrlConfigured ||
      !checks.clerkConfigured
    ) {
      throw new ServiceUnavailableException({
        status: "degraded",
        service: "nutrilen-backend",
        check: "readiness",
        timestamp: new Date().toISOString(),
        checks,
      });
    }

    return {
      status: "ok",
      service: "nutrilen-backend",
      check: "readiness",
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
