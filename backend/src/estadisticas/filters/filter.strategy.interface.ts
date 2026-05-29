/**
 * Contract for a query filter strategy.
 * Pattern: Strategy — each filter is an interchangeable algorithm.
 */
export interface FilterStrategy {
  /**
   * Appends a SQL condition and its value to the running query state.
   * @returns the next available parameter index ($i)
   */
  apply(conditions: string[], values: unknown[], paramIndex: number): number;
}
