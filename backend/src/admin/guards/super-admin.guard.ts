import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { AdminService } from "../admin.service";

@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly logger = new Logger(SuperAdminGuard.name);

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
      await this.adminService.validateSuperAdminToken(token);
      return true;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: "super_admin_auth_failed",
          method: request.method ?? "UNKNOWN",
          path: request.originalUrl ?? "unknown",
          reason: error instanceof Error ? error.message : "unknown",
        }),
      );
      throw new UnauthorizedException("Super admin access required");
    }
  }
}
