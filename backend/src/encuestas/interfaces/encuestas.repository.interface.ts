import { CreateEncuestaDto } from "../dto/create-encuesta.dto";
import { UpsertEncuestaSessionDto } from "../dto/upsert-encuesta-session.dto";

export interface InsertedEncuesta {
  id: string;
  fecha: string;
}

export interface EncuestaSessionRecord {
  id: string;
  fecha_inicio: string;
  fecha_actualizacion: string;
}

export interface IEncuestasRepository {
  create(dto: CreateEncuestaDto, id: string, fecha: string): Promise<InsertedEncuesta>;
  createSession(id: string, dto: UpsertEncuestaSessionDto): Promise<EncuestaSessionRecord>;
  updateSession(id: string, dto: UpsertEncuestaSessionDto): Promise<EncuestaSessionRecord>;
}

export const ENCUESTAS_REPOSITORY = Symbol("IEncuestasRepository");
