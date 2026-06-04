import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const SEX = ["femenino", "masculino", "otro"] as const;
const DIET = ["omnivoro", "ovo_lacto", "vegano", "flexitariano", "otro"] as const;
const LIKED = ["si", "no"] as const;
const CONSUME_AGAIN = ["si", "no", "tal_vez"] as const;

class PartialAttrsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  color?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  aroma?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  firmeza?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  untuosidad?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  sabor_tostado?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  persistencia?: number;
}

export class UpsertEncuestaSessionDto {
  @IsString()
  @IsNotEmpty()
  clientSessionKey!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  currentStep?: number;

  @IsOptional()
  @IsString()
  @IsIn(SEX)
  sex?: (typeof SEX)[number];

  @IsOptional()
  @IsString()
  @IsIn(DIET)
  diet?: (typeof DIET)[number];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PartialAttrsDto)
  attrs?: PartialAttrsDto;

  @IsOptional()
  @IsString()
  descriptiveComments?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  acceptance?: number;

  @IsOptional()
  @IsString()
  @IsIn(LIKED)
  liked?: (typeof LIKED)[number];

  @IsOptional()
  @IsString()
  @IsIn(CONSUME_AGAIN)
  consumeAgain?: (typeof CONSUME_AGAIN)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  recommend?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: "willingnessToPay must contain only digits" })
  willingnessToPay?: string;

  @IsOptional()
  @IsString()
  affectiveComments?: string;
}
