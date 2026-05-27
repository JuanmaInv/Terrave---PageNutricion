import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { EncuestasModule } from "./encuestas/encuestas.module";
import { DatabaseModule } from "./database/database.module";
import { AdminModule } from "./admin/admin.module";
import { EstadisticasModule } from "./estadisticas/estadisticas.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"]
    }),
    DatabaseModule,
    EncuestasModule,
    AdminModule,
    EstadisticasModule
  ],
  controllers: [HealthController]
})
export class AppModule { }
