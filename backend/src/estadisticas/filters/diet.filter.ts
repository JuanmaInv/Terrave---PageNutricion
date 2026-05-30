import { FilterStrategy } from "./filter.strategy.interface";

/** Strategy: filter by diet type */
export class DietFilter implements FilterStrategy {
  constructor(private readonly diet: string) {}

  apply(conditions: string[], values: unknown[], paramIndex: number): number {
    conditions.push(`dieta = $${paramIndex}`);
    values.push(this.diet);
    return paramIndex + 1;
  }
}
