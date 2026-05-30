import { Injectable } from "@nestjs/common";
import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { GetEstadisticasQueryDto } from "./dto/get-estadisticas-query.dto";
import { SurveyResponseDto } from "./dto/survey-response.dto";
import { EstadisticasRepository } from "./repositories/estadisticas.repository";

/**
 * Estadisticas business logic — delegates all data access to EstadisticasRepository.
 * Pattern: Repository (DIP applied)
 * SOLID: SRP — this class orchestrates, the repository queries.
 */
@Injectable()
export class EstadisticasService {
  constructor(private readonly estadisticasRepository: EstadisticasRepository) {}

  async getSurveys(query: GetEstadisticasQueryDto): Promise<SurveyResponseDto[]> {
    return this.estadisticasRepository.findAll(query);
  }

  async getExcelReport(query: GetEstadisticasQueryDto): Promise<Buffer> {
    const surveys = await this.getSurveys(query);
    const payload = {
      generatedAt: new Date().toISOString(),
      filters: {
        diet: query.diet ?? "all",
        sex: query.sex ?? "all",
        from: query.from ?? "",
        to: query.to ?? "",
      },
      surveys,
    };

    const url = this.getPythonExporterUrl();
    if (url) {
      return await this.callPythonFunction(url, payload);
    }

    const pythonExecutable = process.env.PYTHON_EXECUTABLE ?? "python";
    const scriptPath = this.resolvePythonScriptPath();
    return await this.runPythonExporter(pythonExecutable, scriptPath, payload);
  }

  private resolvePythonScriptPath(): string {
    const cwd = process.cwd();
    const candidates = [
      join(cwd, "scripts", "generate_excel_report.py"),
      join(cwd, "backend", "scripts", "generate_excel_report.py"),
    ];

    const found = candidates.find((path) => existsSync(path));
    if (!found) {
      throw new Error(
        `Python exporter script not found. Checked: ${candidates.join(" | ")}`
      );
    }

    return found;
  }

  private getPythonExporterUrl(): string | null {
    const explicitUrl = process.env.EXCEL_PYTHON_EXPORT_URL?.trim();
    if (explicitUrl) return explicitUrl;

    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) return `https://${vercelUrl}/python/excel-report`;
    return null;
  }

  private async callPythonFunction(url: string, payload: unknown): Promise<Buffer> {
    const internalToken = process.env.EXCEL_EXPORT_INTERNAL_TOKEN?.trim();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (internalToken) headers["x-excel-export-token"] = internalToken;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Python exporter failed: ${response.status} ${response.statusText} ${text}`);
    }

    const arr = await response.arrayBuffer();
    return Buffer.from(arr);
  }

  private runPythonExporter(python: string, scriptPath: string, payload: unknown): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const proc = spawn(python, [scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      const chunks: Buffer[] = [];
      const errors: Buffer[] = [];

      proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
      proc.stderr.on("data", (chunk: Buffer) => errors.push(chunk));
      proc.on("error", (error) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          reject(
            new Error(
              `Python executable not found ("${python}"). Configure PYTHON_EXECUTABLE or install Python in PATH.`
            )
          );
          return;
        }
        reject(error);
      });
      proc.on("close", (code) => {
        if (code !== 0) {
          const stderr = Buffer.concat(errors).toString("utf8");
          reject(new Error(stderr || `Excel exporter failed with code ${code}`));
          return;
        }
        resolve(Buffer.concat(chunks));
      });

      proc.stdin.write(JSON.stringify(payload));
      proc.stdin.end();
    });
  }
}
