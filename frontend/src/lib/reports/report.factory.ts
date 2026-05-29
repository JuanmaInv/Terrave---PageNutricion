import { ExcelReportExporter } from "./excel.report.exporter";
import { PdfReportExporter } from "./pdf.report.exporter";
import { type ReportExporter } from "./report.exporter.interface";

export type ReportType = "pdf" | "excel";

/**
 * Creates the appropriate ReportExporter based on the requested type.
 *
 * Pattern: Factory — centralizes object creation logic.
 * SOLID:
 *   - OCP: adding a new format (e.g. "csv") only requires adding a new exporter
 *          and registering it here — no changes to callers.
 *   - DIP: callers depend on ReportExporter interface, not on concrete classes.
 *
 * Usage:
 *   const exporter = ReportFactory.create("pdf");
 *   const blob = await exporter.export(surveys);
 *   descargarBlob(blob, exporter.filename());
 */
export class ReportFactory {
  private static readonly exporters: Record<ReportType, () => ReportExporter> = {
    pdf: () => new PdfReportExporter(),
    excel: () => new ExcelReportExporter(),
  };

  static create(type: ReportType): ReportExporter {
    const factory = ReportFactory.exporters[type];
    if (!factory) {
      throw new Error(`Unknown report type: "${type}". Supported: ${Object.keys(ReportFactory.exporters).join(", ")}`);
    }
    return factory();
  }

  /** Convenience: export and return blob + suggested filename in one call */
  static async exportAs(type: ReportType, surveys: import("../nutrilen").SurveyResponse[]): Promise<{ blob: Blob; filename: string }> {
    const exporter = ReportFactory.create(type);
    const blob = await exporter.export(surveys);
    return { blob, filename: exporter.filename() };
  }
}
