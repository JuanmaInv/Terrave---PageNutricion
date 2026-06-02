import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: "TERRAVE API Backend is running.",
      version: "1.0",
      apiPath: "/api/v1"
    };
  }
}
