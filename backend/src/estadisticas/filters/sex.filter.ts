import { FilterStrategy } from "./filter.strategy.interface";

/** Strategy: filter by sex */
export class SexFilter implements FilterStrategy {
  constructor(private readonly sex: string) {}

  apply(conditions: string[], values: unknown[], paramIndex: number): number {
    conditions.push(`sexo = $${paramIndex}`);
    values.push(this.sex);
    return paramIndex + 1;
  }
}
