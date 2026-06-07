import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { CreateEncuestaDto } from "./dto/create-encuesta.dto";
import { UpsertEncuestaSessionDto } from "./dto/upsert-encuesta-session.dto";
import { EncuestasService } from "./encuestas.service";

@Controller("encuestas")
export class EncuestasController {
  constructor(private readonly encuestasService: EncuestasService) {}

  @Post("sesiones")
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() body: UpsertEncuestaSessionDto) {
    const created = await this.encuestasService.createSession(body);
    return {
      id: created.id,
      startedAt: created.fecha_inicio,
      updatedAt: created.fecha_actualizacion,
    };
  }

  @Patch("sesiones/:id")
  @HttpCode(HttpStatus.OK)
  async updateSession(@Param("id") id: string, @Body() body: UpsertEncuestaSessionDto) {
    const updated = await this.encuestasService.updateSession(id, body);
    return {
      id: updated.id,
      startedAt: updated.fecha_inicio,
      updatedAt: updated.fecha_actualizacion,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateEncuestaDto) {
    const created = await this.encuestasService.create(body);
    return {
      id: created.id,
      createdAt: created.fecha
    };
  }
}
