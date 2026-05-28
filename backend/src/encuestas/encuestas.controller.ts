import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CreateEncuestaDto } from "./dto/create-encuesta.dto";
import { EncuestasService } from "./encuestas.service";

@Controller("encuestas")
export class EncuestasController {
  constructor(private readonly encuestasService: EncuestasService) {}

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
