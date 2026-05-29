import { type SurveyResponse } from "../nutrilen";

/**
 * Contract for all report exporters.
 * Pattern: Strategy/Template — each exporter implements the same interface.
 */
export interface ReportExporter {
  /** Generates the report and returns a downloadable Blob. */
  export(surveys: SurveyResponse[]): Promise<Blob>;
  /** Suggested filename for the download. */
  filename(): string;
}
