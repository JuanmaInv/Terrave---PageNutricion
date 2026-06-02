import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
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
  constructor(private readonly adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers["authorization"];

    try {
      const token = this.adminService.getTokenFromAuthorization(authorization);
      await this.adminService.validateAdminToken(token);
      return true;
    } catch {
      throw new UnauthorizedException("Admin access required");
    }
  }
}
