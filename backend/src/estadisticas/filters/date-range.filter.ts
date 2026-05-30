import { FilterStrategy } from "./filter.strategy.interface";

/** Strategy: filter by date range (from/to) */
export class DateRangeFilter implements FilterStrategy {
  constructor(
    private readonly from?: string,
    private readonly to?: string
  ) {}

  apply(conditions: string[], values: unknown[], paramIndex: number): number {
    let index = paramIndex;

    if (this.from) {
      conditions.push(`fecha >= $${index}`);
      values.push(new Date(this.from).toISOString());
      index++;
    }

    if (this.to) {
      conditions.push(`fecha <= $${index}`);
      const end = new Date(this.to);
      end.setHours(23, 59, 59, 999);
      values.push(end.toISOString());
      index++;
    }

    return index;
  }
}
