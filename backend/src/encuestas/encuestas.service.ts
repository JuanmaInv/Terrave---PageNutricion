import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CreateEncuestaDto } from "./dto/create-encuesta.dto";
import {
  IEncuestasRepository,
  InsertedEncuesta,
} from "./interfaces/encuestas.repository.interface";
import { EncuestasRepository } from "./repositories/encuestas.repository";

/**
 * Encuestas business logic — delegates all data access to IEncuestasRepository.
 * Pattern: Repository (DIP applied: depends on interface, not on DatabaseService)
 * SOLID: SRP — this class only handles business logic, not SQL.
 */
@Injectable()
export class EncuestasService {
  // Injecting the concrete class but typed as the interface for clarity.
  // For full DIP with mocking support, use a custom injection token.
  constructor(private readonly encuestasRepository: EncuestasRepository) {}

  async create(dto: CreateEncuestaDto): Promise<InsertedEncuesta> {
    const id = randomUUID();
    const fecha = dto.date ?? new Date().toISOString();
    return this.encuestasRepository.create(dto, id, fecha);
  }
}
