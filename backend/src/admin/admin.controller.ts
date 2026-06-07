import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./guards/admin.guard";
import { AdminService } from "./admin.service";
import { SuperAdminGuard } from "./guards/super-admin.guard";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";

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

  @Get("access")
  async getAccess(@Headers("authorization") authorization?: string) {
    const token = this.adminService.getTokenFromAuthorization(authorization);
    return await this.adminService.getAccessProfileFromToken(token);
  }

  @UseGuards(SuperAdminGuard)
  @Get("users")
  async listUsers() {
    return await this.adminService.listUsers();
  }

  @UseGuards(SuperAdminGuard)
  @Patch("users/:userId/role")
  async updateUserRole(@Param("userId") userId: string, @Body() body: UpdateUserRoleDto) {
    return await this.adminService.updateUserRole(userId, body.role);
  }
}
