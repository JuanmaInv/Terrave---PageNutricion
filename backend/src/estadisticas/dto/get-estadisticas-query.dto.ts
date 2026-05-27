import { IsIn, IsOptional, IsString } from "class-validator";

const SEX = ["femenino", "masculino", "otro"] as const;
const DIET = ["omnivoro", "ovo_lacto", "vegano", "flexitariano", "otro"] as const;

export class GetEstadisticasQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(DIET)
  diet?: (typeof DIET)[number];

  @IsOptional()
  @IsString()
  @IsIn(SEX)
  sex?: (typeof SEX)[number];

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
