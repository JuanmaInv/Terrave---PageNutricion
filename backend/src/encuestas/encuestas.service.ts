import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CreateEncuestaDto } from "./dto/create-encuesta.dto";
import { UpsertEncuestaSessionDto } from "./dto/upsert-encuesta-session.dto";
import {
  EncuestaSessionRecord,
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
  private readonly logger = new Logger(EncuestasService.name);

  // Injecting the concrete class but typed as the interface for clarity.
  // For full DIP with mocking support, use a custom injection token.
  constructor(private readonly encuestasRepository: EncuestasRepository) {}

  async create(dto: CreateEncuestaDto): Promise<InsertedEncuesta> {
    const normalizedDto = this.normalizeSurveyTextFields(dto);
    const id = randomUUID();
    const fecha = normalizedDto.date ?? new Date().toISOString();
    const created = await this.encuestasRepository.create(normalizedDto, id, fecha);
    this.logger.log(
      JSON.stringify({
        event: "survey_created",
        surveyId: created.id,
        hasSession: Boolean(normalizedDto.sessionId),
        hasDescriptiveComments: Boolean(normalizedDto.descriptiveComments),
        hasAffectiveComments: Boolean(normalizedDto.affectiveComments),
      })
    );
    return created;
  }

  async createSession(dto: UpsertEncuestaSessionDto): Promise<EncuestaSessionRecord> {
    const normalizedDto = this.normalizeSurveyTextFields(dto);
    const id = randomUUID();
    const session = await this.encuestasRepository.createSession(id, normalizedDto);
    this.logger.log(
      JSON.stringify({
        event: "survey_session_created",
        sessionId: session.id,
        currentStep: normalizedDto.currentStep ?? 1,
      })
    );
    return session;
  }

  async updateSession(id: string, dto: UpsertEncuestaSessionDto): Promise<EncuestaSessionRecord> {
    const normalizedDto = this.normalizeSurveyTextFields(dto);
    const session = await this.encuestasRepository.updateSession(id, normalizedDto);
    this.logger.log(
      JSON.stringify({
        event: "survey_session_updated",
        sessionId: session.id,
        currentStep: normalizedDto.currentStep ?? null,
      })
    );
    return session;
  }

  private normalizeSurveyTextFields<T extends CreateEncuestaDto | UpsertEncuestaSessionDto>(dto: T): T {
    const normalizeText = (value: string | undefined): string | undefined => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    return {
      ...dto,
      descriptiveComments: normalizeText(dto.descriptiveComments),
      affectiveComments: normalizeText(dto.affectiveComments),
      willingnessToPay: normalizeText(dto.willingnessToPay),
    };
  }
}
