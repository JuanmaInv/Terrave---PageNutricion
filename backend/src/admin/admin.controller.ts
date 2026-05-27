import { Controller, Get, Headers } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("me")
  async getMe(@Headers("authorization") authorization?: string) {
    const token = this.adminService.getTokenFromAuthorization(authorization);
    return this.adminService.validateAdminToken(token);
  }
}
