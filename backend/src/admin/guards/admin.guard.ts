import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { AdminService } from "../admin.service";

/**
 * Guard that protects routes requiring admin authentication.
 * Validates the Clerk Bearer token and checks admin role.
 *
 * Pattern: Decorator (NestJS @UseGuards)
 * SOLID:
 *   - SRP: authentication logic extracted from controllers
 *   - OCP: new auth strategies can be added by creating new guards
 *   - DIP: controllers depend on this guard abstraction, not on AdminService directly
 *
 * Usage:
 *   @UseGuards(AdminGuard)
 *   @Get()
 *   async myEndpoint() { ... }
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
      method?: string;
      originalUrl?: string;
    }>();
    const rawAuthorization = request.headers?.authorization;
    const authorization = Array.isArray(rawAuthorization)
      ? rawAuthorization[0]
      : rawAuthorization;

    try {
      const token = this.adminService.getTokenFromAuthorization(authorization);
      await this.adminService.validateAdminToken(token);
      return true;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: "admin_auth_failed",
          method: request.method ?? "UNKNOWN",
          path: request.originalUrl ?? "unknown",
          reason: error instanceof Error ? error.message : "unknown",
        })
      );
      throw new UnauthorizedException("Admin access required");
    }
  }
}
