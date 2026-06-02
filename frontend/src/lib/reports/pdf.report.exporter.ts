import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ATTRIBUTES, DIET_OPTIONS, SEX_OPTIONS, type SurveyResponse } from "../nutrilen";
import { type ReportContext, type ReportExporter } from "./report.exporter.interface";

const INK: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [100, 116, 139];
const SURFACE: [number, number, number] = [248, 250, 252];
const BORDER: [number, number, number] = [226, 232, 240];
const HEAD_PRIMARY: [number, number, number] = [30, 64, 175];
const HEAD_SECONDARY: [number, number, number] = [51, 65, 85];

export class PdfReportExporter implements ReportExporter {
  filename(): string {
    return `terrave-dashboard-${Date.now()}.pdf`;
  }

  async export(surveys: SurveyResponse[], context?: ReportContext): Promise<Blob> {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const MARGIN = 40;
    const PAGE_W = 595;
    const PAGE_H = doc.internal.pageSize.getHeight();

    const total = surveys.length;
    const avgAttr = (key: keyof SurveyResponse["attrs"]) =>
      total ? Number((surveys.reduce((acc, s) => acc + (s.attrs[key] ?? 0), 0) / total).toFixed(2)) : 0;

    const attrRows = ATTRIBUTES.map((a) => ({
      atributo: a.label,
      promedio: avgAttr(a.key),
    }));

    const globalScore =
      ATTRIBUTES.length === 0
        ? 0
        : Number((attrRows.reduce((acc, x) => acc + x.promedio, 0) / ATTRIBUTES.length).toFixed(2));

    const likedYes = surveys.filter((s) => s.liked === "si").length;
    const acceptancePct = total ? Number(((likedYes / total) * 100).toFixed(2)) : 0;

    const dietDist = DIET_OPTIONS.map((d) => {
      const count = surveys.filter((s) => s.diet === d.id).length;
      return { dieta: d.label, participantes: count, porcentaje: total ? Number(((count / total) * 100).toFixed(1)) : 0 };
    });

    const sexDist = SEX_OPTIONS.map((s) => {
      const count = surveys.filter((x) => x.sex === s.id).length;
      return { sexo: s.label, participantes: count, porcentaje: total ? Number(((count / total) * 100).toFixed(1)) : 0 };
    });

    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hora: `${String(hour).padStart(2, "0")}h`,
      cantidad: 0,
    }));
    for (const s of surveys) {
      const h = new Date(s.date).getHours();
      if (!Number.isNaN(h)) hourly[h].cantidad += 1;
    }
    const peak = [...hourly].sort((a, b) => b.cantidad - a.cantidad)[0];

    const dietAcceptance = DIET_OPTIONS.map((d) => {
      const group = surveys.filter((x) => x.diet === d.id);
      const yes = group.filter((x) => x.liked === "si").length;
      return {
        dieta: d.label,
        participantes: group.length,
        aceptacion: group.length ? Number(((yes / group.length) * 100).toFixed(1)) : 0,
      };
    }).filter((x) => x.participantes > 0);

    const sorted = [...attrRows].sort((a, b) => b.promedio - a.promedio);
    const bestAttr = sorted[0];
    const worstAttr = sorted[sorted.length - 1];

    const descriptive = surveys
      .map((s, i) => ({ idx: i + 1, text: s.descriptiveComments?.trim() ?? "" }))
      .filter((x) => x.text.length > 0);

    const affective = surveys
      .map((s, i) => ({ idx: i + 1, text: s.affectiveComments?.trim() ?? "" }))
      .filter((x) => x.text.length > 0);

    const pricing = surveys
      .map((s, i) => ({ idx: i + 1, text: s.willingnessToPay?.trim() ?? "" }))
      .filter((x) => x.text.length > 0);

    const addSectionTitle = (text: string, y: number) => {
      doc.setFillColor(...SURFACE);
      doc.setDrawColor(...BORDER);
      doc.roundedRect(MARGIN - 2, y - 18, PAGE_W - MARGIN * 2 + 4, 30, 6, 6, "FD");
      doc.setTextColor(...INK);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(text, MARGIN + 8, y);
      doc.setFont("helvetica", "normal");
    };

    const ensureSpace = (currentY: number, estimatedHeight: number): number => {
      if (currentY + estimatedHeight > PAGE_H - 40) {
        doc.addPage();
        return 58;
      }
      return currentY;
    };

    const renderTable = (config: Parameters<typeof autoTable>[1]) => {
      autoTable(doc, {
        styles: {
          fontSize: 9,
          cellPadding: 6,
          textColor: INK,
          lineColor: BORDER,
          lineWidth: 0.5,
        },
        pageBreak: "avoid",
        rowPageBreak: "avoid",
        alternateRowStyles: { fillColor: [250, 252, 255] },
        ...config,
      });
    };

    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Informe de Resultados - TERRAVÉ", MARGIN, 52);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`Fecha de emision: ${new Date().toLocaleString("es-AR")}`, MARGIN, 72);

    addSectionTitle("FILTROS UTILIZADOS", 104);
    renderTable({
      startY: 116,
      head: [["Dieta", "Sexo", "Desde", "Hasta"]],
      body: [[
        context?.filters?.diet ?? "Todas",
        context?.filters?.sex ?? "Todos",
        context?.filters?.from ?? "-",
        context?.filters?.to ?? "-",
      ]],
      headStyles: { fillColor: HEAD_PRIMARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;

    y = ensureSpace(y, 110);
    addSectionTitle("INDICADORES PRINCIPALES", y);
    renderTable({
      startY: y + 12,
      head: [["Participantes", "Encuestas completas", "Puntaje global", "Aceptacion"]],
      body: [[String(total), String(total), globalScore.toFixed(2), `${acceptancePct.toFixed(1)}%`]],
      headStyles: { fillColor: HEAD_SECONDARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
      styles: { halign: "center", fontStyle: "bold" },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

    y = ensureSpace(y, 220);
    addSectionTitle("PROMEDIO POR ATRIBUTOS", y);
    renderTable({
      startY: y + 12,
      head: [["Atributo", "Promedio (1-5)"]],
      body: attrRows.map((a) => [a.atributo, a.promedio.toFixed(2)]),
      headStyles: { fillColor: HEAD_PRIMARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;

    y = ensureSpace(y, 180);
    addSectionTitle("DISTRIBUCION DE DIETAS", y);
    renderTable({
      startY: y + 12,
      head: [["Dieta", "Participantes", "%"]],
      body: dietDist.map((d) => [d.dieta, String(d.participantes), `${d.porcentaje.toFixed(1)}%`]),
      headStyles: { fillColor: HEAD_SECONDARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;

    y = ensureSpace(y, 160);
    addSectionTitle("DISTRIBUCION POR SEXO", y);
    renderTable({
      startY: y + 12,
      head: [["Sexo", "Participantes", "%"]],
      body: sexDist.map((s) => [s.sexo, String(s.participantes), `${s.porcentaje.toFixed(1)}%`]),
      headStyles: { fillColor: HEAD_SECONDARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;

    y = ensureSpace(y, 150);
    addSectionTitle("ACEPTACION SEGUN DIETA", y);
    renderTable({
      startY: y + 12,
      head: [["Dieta", "Participantes", "Aceptacion"]],
      body: dietAcceptance.map((d) => [d.dieta, String(d.participantes), `${d.aceptacion.toFixed(1)}%`]),
      headStyles: { fillColor: HEAD_PRIMARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    doc.addPage();

    addSectionTitle("FRECUENCIA DE CONSUMO POR HORA", 58);
    renderTable({
      startY: 70,
      head: [["Hora", "Cantidad"]],
      body: hourly.map((h) => [h.hora, String(h.cantidad)]),
      headStyles: { fillColor: HEAD_SECONDARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: PAGE_W - MARGIN - 220 },
      tableWidth: 220,
    });

    let y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`Hora pico detectada: ${peak?.hora ?? "-"} (${peak?.cantidad ?? 0} respuesta/s).`, MARGIN, y2);

    y2 += 24;
    y2 = ensureSpace(y2, 170);
    addSectionTitle("PERFIL SENSORIAL", y2);
    renderTable({
      startY: y2 + 12,
      head: [["Atributo", "Promedio"]],
      body: attrRows.map((a) => [a.atributo, a.promedio.toFixed(2)]),
      headStyles: { fillColor: HEAD_PRIMARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

    y2 = ensureSpace(y2, 120);
    addSectionTitle("RESUMEN", y2);
    renderTable({
      startY: y2 + 12,
      head: [["Indicador", "Resultado"]],
      body: [
        ["Mejor valorado", `${bestAttr?.atributo ?? "-"} (${bestAttr?.promedio.toFixed(2) ?? "0.00"}/5)`],
        ["Menor valorado", `${worstAttr?.atributo ?? "-"} (${worstAttr?.promedio.toFixed(2) ?? "0.00"}/5)`],
      ],
      headStyles: { fillColor: HEAD_SECONDARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
      columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: 340 } },
    });

    y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

    y2 = ensureSpace(y2, 220);
    addSectionTitle("COMENTARIOS", y2);
    renderTable({
      startY: y2 + 12,
      head: [["Observaciones descriptivas"]],
      body: descriptive.length
        ? descriptive.map((d) => [`Participante ${d.idx}: ${d.text}`])
        : [["Sin observaciones descriptivas para el filtro aplicado."]],
      headStyles: { fillColor: HEAD_PRIMARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    renderTable({
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14,
      head: [["Observaciones afectivas"]],
      body: affective.length
        ? affective.map((d) => [`Participante ${d.idx}: ${d.text}`])
        : [["Sin observaciones afectivas para el filtro aplicado."]],
      headStyles: { fillColor: HEAD_SECONDARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    renderTable({
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14,
      head: [["Disposicion a pagar (en pesos)"]],
      body: pricing.length
        ? pricing.map((d) => [`Participante ${d.idx}: ${d.text}`])
        : [["Sin respuestas de precio para el filtro aplicado."]],
      headStyles: { fillColor: HEAD_PRIMARY, textColor: [255, 255, 255] },
      margin: { left: MARGIN, right: MARGIN },
    });

    const commentsEnd = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    addSectionTitle("TEXTO RESUMEN", commentsEnd + 30);
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    const summaryText =
      `Con ${total} participante(s), se observa una aceptacion de ${acceptancePct.toFixed(1)}%. ` +
      `El atributo mejor valorado fue ${bestAttr?.atributo ?? "-"} y el menor valorado fue ${worstAttr?.atributo ?? "-"}. ` +
      `Se recomienda mantener las fortalezas actuales y enfocar mejoras en el atributo de menor desempeno, ` +
      `apoyando decisiones con comentarios cualitativos y la franja horaria pico (${peak?.hora ?? "-"}).`;
    doc.text(summaryText, MARGIN, commentsEnd + 66, { maxWidth: PAGE_W - MARGIN * 2, lineHeightFactor: 1.5 });

    // Encabezado y pie fijo en todas las paginas (toque editorial final).
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);

      // Header
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.6);
      doc.line(MARGIN, 24, PAGE_W - MARGIN, 24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text("TERRAVÉ - Informe de Resultados", MARGIN, 19);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(`Emitido: ${new Date().toLocaleDateString("es-AR")}`, PAGE_W - MARGIN - 100, 19);

      // Footer
      const footerY = PAGE_H - 18;
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.6);
      doc.line(MARGIN, footerY - 8, PAGE_W - MARGIN, footerY - 8);
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("Proyecto integrador ISI x Nutricion", MARGIN, footerY);
      doc.text(`Pagina ${page} de ${totalPages}`, PAGE_W - MARGIN - 58, footerY);
    }

    return doc.output("blob");
  }
}
