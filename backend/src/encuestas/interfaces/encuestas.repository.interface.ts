import { CreateEncuestaDto } from "../dto/create-encuesta.dto";

export interface InsertedEncuesta {
  id: string;
  fecha: string;
}

export interface IEncuestasRepository {
  create(dto: CreateEncuestaDto, id: string, fecha: string): Promise<InsertedEncuesta>;
}

export const ENCUESTAS_REPOSITORY = Symbol("IEncuestasRepository");
