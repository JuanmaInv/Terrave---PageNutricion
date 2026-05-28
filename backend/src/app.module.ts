import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { existsSync } from "fs";
import { join } from "path";
import { HealthController } from "./health/health.controller";
import { EncuestasModule } from "./encuestas/encuestas.module";
import { DatabaseModule } from "./database/database.module";
import { AdminModule } from "./admin/admin.module";
import { EstadisticasModule } from "./estadisticas/estadisticas.module";

const envFilePath = [
  join(process.cwd(), ".env.local"),
  join(process.cwd(), ".env"),
  join(process.cwd(), "backend", ".env.local"),
  join(process.cwd(), "backend", ".env")
].filter((path) => existsSync(path));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath
    }),
    DatabaseModule,
    EncuestasModule,
    AdminModule,
    EstadisticasModule
  ],
  controllers: [HealthController]
})
export class AppModule { }
