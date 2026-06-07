import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminGuard } from "./guards/admin.guard";
import { SuperAdminGuard } from "./guards/super-admin.guard";

/**
 * AdminModule exports both AdminService and AdminGuard so other modules
 * (e.g. EstadisticasModule) can use them without re-declaring.
 * Pattern: Decorator (guard) — Singleton (NestJS DI scope)
 */
@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, SuperAdminGuard],
  exports: [AdminService, AdminGuard, SuperAdminGuard],
})
export class AdminModule {}
