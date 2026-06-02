import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: "TERRAVÉ API Backend is running.",
      version: "1.0",
      apiPath: "/api/v1"
    };
  }
}
