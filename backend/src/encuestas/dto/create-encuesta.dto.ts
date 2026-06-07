import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

const SEX = ["femenino", "masculino", "otro"] as const;
const DIET = ["omnivoro", "ovo_lacto", "vegano", "flexitariano", "otro"] as const;
const LIKED = ["si", "no"] as const;
const CONSUME_AGAIN = ["si", "no", "tal_vez"] as const;

class AttrsDto {
  @IsInt()
  @Min(1)
  @Max(5)
  color!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  aroma!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  firmeza!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  untuosidad!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  sabor_tostado!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  persistencia!: number;
}

export class CreateEncuestaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sessionId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clientSessionKey?: string;

  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsString()
  @IsIn(SEX)
  sex!: (typeof SEX)[number];

  @IsString()
  @IsIn(DIET)
  diet!: (typeof DIET)[number];

  @IsObject()
  @ValidateNested()
  @Type(() => AttrsDto)
  attrs!: AttrsDto;

  @IsOptional()
  @IsString()
  descriptiveComments?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  acceptance!: number;

  @IsString()
  @IsIn(LIKED)
  liked!: (typeof LIKED)[number];

  @IsString()
  @IsIn(CONSUME_AGAIN)
  consumeAgain!: (typeof CONSUME_AGAIN)[number];

  @IsInt()
  @Min(1)
  @Max(5)
  recommend!: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: "willingnessToPay must contain only digits" })
  willingnessToPay?: string;

  @IsOptional()
  @IsString()
  affectiveComments?: string;
}
