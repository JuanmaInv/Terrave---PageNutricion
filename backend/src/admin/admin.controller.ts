import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./guards/admin.guard";

/**
 * Admin controller — exposes the /admin/me health-check endpoint.
 * Protected by AdminGuard (Decorator pattern).
 */
@Controller("admin")
export class AdminController {
  @UseGuards(AdminGuard)
  @Get("me")
  async getMe() {
    // Guard already validated the token; return a simple success response.
    return { isAdmin: true };
  }
}
