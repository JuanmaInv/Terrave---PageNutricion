import { type SurveyResponse } from "../nutrilen";

export interface ReportContext {
  filters?: {
    diet?: string;
    sex?: string;
    from?: string;
    to?: string;
  };
}

/**
 * Contract for all report exporters.
 * Pattern: Strategy/Template - each exporter implements the same interface.
 */
export interface ReportExporter {
  /** Generates the report and returns a downloadable Blob. */
  export(surveys: SurveyResponse[], context?: ReportContext): Promise<Blob>;
  /** Suggested filename for the download. */
  filename(): string;
}
