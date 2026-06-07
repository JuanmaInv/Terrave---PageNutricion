import { Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./guards/admin.guard";
import { AdminService } from "./admin.service";

/**
 * Admin controller — exposes the /admin/me health-check endpoint.
 * Protected by AdminGuard (Decorator pattern).
 */
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AdminGuard)
  @Get("me")
  async getMe() {
    // Guard already validated the token; return a simple success response.
    return { isAdmin: true };
  }

  @Post("sync-user")
  async syncUser(@Headers("authorization") authorization?: string) {
    const token = this.adminService.getTokenFromAuthorization(authorization);
    return await this.adminService.syncUserFromToken(token);
  }
}
