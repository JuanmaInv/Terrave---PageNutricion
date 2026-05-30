from __future__ import annotations

import io
from datetime import datetime
from typing import Any

import xlsxwriter


def safe_num(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def parse_hour(value: Any) -> int | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).hour
    except Exception:
        return None


def map_diet_label(key: str) -> str:
    mapping = {
        "omnivoro": "Omnivoro",
        "ovo_lacto": "Ovo-lacto-vegetariano",
        "vegano": "Vegano",
        "flexitariano": "Flexitariano",
        "otro": "Otro",
    }
    return mapping.get(str(key or ""), str(key or "-").strip() or "-")


def map_sex_label(key: str) -> str:
    mapping = {
        "femenino": "Femenino",
        "masculino": "Masculino",
        "otro": "Otro / Prefiere no responder",
    }
    return mapping.get(str(key or ""), str(key or "-").strip() or "-")


def fmt_percent(value: float) -> str:
    return f"{(value * 100):.1f}%"


def build_workbook(payload: dict[str, Any]) -> bytes:
    surveys = payload.get("surveys", [])
    filters = payload.get("filters", {})

    output = io.BytesIO()
    wb = xlsxwriter.Workbook(output, {"in_memory": True})

    # Palette (neutral + blue accents for readability)
    C_PRIMARY = "#1F3A5F"
    C_SECONDARY = "#2E5B97"
    C_HEADER_BG = "#EAF0F8"
    C_TABLE_HEAD = "#2E5B97"
    C_BORDER = "#D0D7E2"
    C_TEXT = "#1A1A1A"
    C_SUBTLE = "#5B6470"
    C_WHITE = "#FFFFFF"

    title_fmt = wb.add_format({"bold": True, "font_size": 20, "font_color": C_PRIMARY})
    subtitle_fmt = wb.add_format({"font_size": 10, "font_color": C_SUBTLE})
    section_fmt = wb.add_format(
        {
            "bold": True,
            "font_size": 12,
            "font_color": C_PRIMARY,
            "bg_color": C_HEADER_BG,
            "border": 1,
            "border_color": C_BORDER,
            "left": 1,
            "right": 1,
            "top": 1,
            "bottom": 1,
        }
    )
    table_head_fmt = wb.add_format(
        {
            "bold": True,
            "font_color": C_WHITE,
            "bg_color": C_TABLE_HEAD,
            "border": 1,
            "border_color": C_BORDER,
            "valign": "vcenter",
        }
    )
    text_fmt = wb.add_format({"border": 1, "border_color": C_BORDER, "font_color": C_TEXT})
    text_wrap_fmt = wb.add_format(
        {"border": 1, "border_color": C_BORDER, "font_color": C_TEXT, "text_wrap": True, "valign": "top"}
    )
    num_fmt = wb.add_format({"border": 1, "border_color": C_BORDER, "num_format": "0.00", "font_color": C_TEXT})
    pct_fmt = wb.add_format({"border": 1, "border_color": C_BORDER, "num_format": "0.0%", "font_color": C_TEXT})
    kpi_label_fmt = wb.add_format(
        {
            "bold": True,
            "font_color": C_SUBTLE,
            "bg_color": "#F7F9FC",
            "border": 1,
            "border_color": C_BORDER,
            "align": "center",
        }
    )
    kpi_value_fmt = wb.add_format(
        {
            "bold": True,
            "font_size": 14,
            "font_color": C_PRIMARY,
            "bg_color": C_WHITE,
            "border": 1,
            "border_color": C_BORDER,
            "align": "center",
            "valign": "vcenter",
        }
    )
    kpi_pct_value_fmt = wb.add_format(
        {
            "bold": True,
            "font_size": 14,
            "font_color": C_PRIMARY,
            "bg_color": C_WHITE,
            "border": 1,
            "border_color": C_BORDER,
            "align": "center",
            "valign": "vcenter",
            "num_format": "0.0%",
        }
    )

    attr_keys = ["color", "aroma", "firmeza", "untuosidad", "sabor_tostado", "persistencia"]
    attr_labels = [
        "Color",
        "Aroma",
        "Firmeza / Cohesividad",
        "Untuosidad",
        "Sabor tostado/cocido",
        "Persistencia (Regusto)",
    ]
    diet_keys = ["omnivoro", "ovo_lacto", "vegano", "flexitariano", "otro"]
    sex_keys = ["femenino", "masculino", "otro"]

    total = len(surveys)
    completed = total
    liked_yes = sum(1 for s in surveys if s.get("liked") == "si")
    accept_pct = (liked_yes / total) if total else 0.0

    attr_avg: list[float] = []
    for key in attr_keys:
        values = [safe_num((s.get("attrs") or {}).get(key, 0.0)) for s in surveys]
        attr_avg.append((sum(values) / len(values)) if values else 0.0)

    global_score = (sum(attr_avg) / len(attr_avg)) if attr_avg else 0.0

    best_idx = max(range(len(attr_avg)), key=lambda i: attr_avg[i]) if attr_avg else 0
    worst_idx = min(range(len(attr_avg)), key=lambda i: attr_avg[i]) if attr_avg else 0
    best_label = attr_labels[best_idx]
    best_score = attr_avg[best_idx] if attr_avg else 0.0
    worst_label = attr_labels[worst_idx]
    worst_score = attr_avg[worst_idx] if attr_avg else 0.0

    diet_counts: dict[str, int] = {}
    for k in diet_keys:
        diet_counts[k] = sum(1 for s in surveys if s.get("diet") == k)

    sex_counts: dict[str, int] = {}
    for k in sex_keys:
        sex_counts[k] = sum(1 for s in surveys if s.get("sex") == k)

    hourly = [0] * 24
    for s in surveys:
        h = parse_hour(s.get("date"))
        if h is not None and 0 <= h <= 23:
            hourly[h] += 1

    peak_hour = max(range(24), key=lambda h: hourly[h]) if hourly else 0
    peak_count = hourly[peak_hour] if hourly else 0

    descriptive_rows: list[str] = []
    affective_rows: list[str] = []
    for idx, s in enumerate(surveys, start=1):
        prefix = f"Participante {idx}: "
        d = str(s.get("descriptiveComments") or "").strip()
        a = str(s.get("affectiveComments") or "").strip()
        if d:
            descriptive_rows.append(prefix + d)
        if a:
            affective_rows.append(prefix + a)

    # Sheet 1: Resumen ejecutivo
    sh = wb.add_worksheet("Resumen")
    sh.set_column("A:A", 30)
    sh.set_column("B:B", 22)
    sh.set_column("C:C", 22)
    sh.set_column("D:D", 22)
    sh.set_column("E:E", 22)
    sh.set_column("F:F", 2)
    sh.set_column("G:N", 16)

    sh.write("A1", "Informe de Resultados - NutriLen", title_fmt)
    generated = payload.get("generatedAt") or datetime.now().isoformat()
    sh.write("A2", f"Fecha de emision: {str(generated).replace('T', ' ')[:19]}", subtitle_fmt)

    sh.merge_range("A4:E4", "FILTROS UTILIZADOS", section_fmt)
    sh.write_row("A5", ["Dieta", "Sexo", "Desde", "Hasta", "Total filtrado"], table_head_fmt)
    sh.write_row(
        "A6",
        [
            map_diet_label(filters.get("diet", "all")) if filters.get("diet", "all") != "all" else "Todas",
            map_sex_label(filters.get("sex", "all")) if filters.get("sex", "all") != "all" else "Todos",
            filters.get("from", "") or "-",
            filters.get("to", "") or "-",
            total,
        ],
        text_fmt,
    )

    sh.merge_range("A8:E8", "INDICADORES PRINCIPALES", section_fmt)
    sh.write_row("A9", ["Participantes", "Encuestas completas", "Puntaje global", "Aceptacion", "Hora pico"], kpi_label_fmt)
    sh.write("A10", total, kpi_value_fmt)
    sh.write("B10", completed, kpi_value_fmt)
    sh.write("C10", global_score, kpi_value_fmt)
    sh.write("D10", accept_pct, kpi_pct_value_fmt)
    sh.write("E10", f"{peak_hour:02d}h ({peak_count})", kpi_value_fmt)

    sh.merge_range("A12:E12", "PROMEDIO POR ATRIBUTOS", section_fmt)
    sh.write_row("A13", ["Atributo", "Promedio (1-5)", "", "", ""], table_head_fmt)
    row = 14
    for label, value in zip(attr_labels, attr_avg):
        sh.write(row - 1, 0, label, text_fmt)
        sh.write(row - 1, 1, value, num_fmt)
        row += 1

    sh.merge_range("A22:E22", "RESUMEN INTERPRETATIVO", section_fmt)
    sh.write_row("A23", ["Indicador", "Resultado", "", "", ""], table_head_fmt)
    sh.write("A24", "Mejor valorado", text_fmt)
    sh.write("B24", f"{best_label} ({best_score:.2f}/5)", text_fmt)
    sh.write("A25", "Menor valorado", text_fmt)
    sh.write("B25", f"{worst_label} ({worst_score:.2f}/5)", text_fmt)
    sh.write("A26", "Conclusiones", text_wrap_fmt)
    sh.merge_range(
        "B26:E26",
        (
            f"Sobre {total} participantes, la aceptacion fue de {fmt_percent(accept_pct)}. "
            f"Fortaleza principal: {best_label} ({best_score:.2f}/5). "
            f"Aspecto a mejorar: {worst_label} ({worst_score:.2f}/5)."
        ),
        text_wrap_fmt,
    )

    # Charts in summary
    pie_diet = wb.add_chart({"type": "doughnut"})
    pie_diet.add_series(
        {
            "name": "Distribucion de dietas",
            "categories": "=Distribuciones!$A$4:$A$8",
            "values": "=Distribuciones!$B$4:$B$8",
            "data_labels": {"percentage": True, "category": True},
        }
    )
    pie_diet.set_title({"name": "Distribucion de dietas"})
    pie_diet.set_legend({"position": "bottom"})
    pie_diet.set_style(10)
    sh.insert_chart("G4", pie_diet, {"x_scale": 1.25, "y_scale": 1.15})

    col_sex = wb.add_chart({"type": "column"})
    col_sex.add_series(
        {
            "name": "Distribucion por sexo",
            "categories": "=Distribuciones!$D$4:$D$6",
            "values": "=Distribuciones!$E$4:$E$6",
            "data_labels": {"value": True},
        }
    )
    col_sex.set_title({"name": "Distribucion por sexo"})
    col_sex.set_y_axis({"major_gridlines": {"visible": False}})
    col_sex.set_style(11)
    sh.insert_chart("G15", col_sex, {"x_scale": 1.25, "y_scale": 1.15})

    # Sheet 2: Distribuciones + aceptacion por dieta
    sh_dist = wb.add_worksheet("Distribuciones")
    sh_dist.set_column("A:A", 28)
    sh_dist.set_column("B:C", 14)
    sh_dist.set_column("D:D", 32)
    sh_dist.set_column("E:F", 14)

    sh_dist.merge_range("A1:C1", "DISTRIBUCION DE DIETAS", section_fmt)
    sh_dist.write_row("A3", ["Dieta", "Participantes", "%"], table_head_fmt)
    r = 4
    for key in diet_keys:
        count = diet_counts[key]
        pct = (count / total) if total else 0.0
        sh_dist.write(r - 1, 0, map_diet_label(key), text_fmt)
        sh_dist.write(r - 1, 1, count, text_fmt)
        sh_dist.write(r - 1, 2, pct, pct_fmt)
        r += 1

    sh_dist.merge_range("D1:F1", "DISTRIBUCION POR SEXO", section_fmt)
    sh_dist.write_row("D3", ["Sexo", "Participantes", "%"], table_head_fmt)
    r = 4
    for key in sex_keys:
        count = sex_counts[key]
        pct = (count / total) if total else 0.0
        sh_dist.write(r - 1, 3, map_sex_label(key), text_fmt)
        sh_dist.write(r - 1, 4, count, text_fmt)
        sh_dist.write(r - 1, 5, pct, pct_fmt)
        r += 1

    sh_dist.merge_range("A10:F10", "ACEPTACION SEGUN DIETA", section_fmt)
    sh_dist.write_row("A12", ["Dieta", "Participantes", "Aceptacion", "", "", ""], table_head_fmt)
    r = 13
    for key in diet_keys:
        group = [s for s in surveys if s.get("diet") == key]
        if not group:
            continue
        yes = sum(1 for s in group if s.get("liked") == "si")
        pct = yes / len(group)
        sh_dist.write(r - 1, 0, map_diet_label(key), text_fmt)
        sh_dist.write(r - 1, 1, len(group), text_fmt)
        sh_dist.write(r - 1, 2, pct, pct_fmt)
        r += 1

    # Sheet 3: Frecuencia por hora
    sh_hour = wb.add_worksheet("Frecuencia Hora")
    sh_hour.set_column("A:A", 10)
    sh_hour.set_column("B:B", 14)
    sh_hour.set_column("D:L", 14)

    sh_hour.write("A1", "FRECUENCIA DE CONSUMO POR HORA", section_fmt)
    sh_hour.write("A3", f"Hora pico detectada: {peak_hour:02d}h ({peak_count} respuesta/s)", subtitle_fmt)

    sh_hour.write_row("A5", ["Hora", "Cantidad"], table_head_fmt)
    for h in range(24):
        sh_hour.write(h + 5, 0, f"{h:02d}h", text_fmt)
        sh_hour.write(h + 5, 1, hourly[h], text_fmt)

    line = wb.add_chart({"type": "line"})
    line.add_series(
        {
            "name": "Frecuencia por hora",
            "categories": "='Frecuencia Hora'!$A$6:$A$29",
            "values": "='Frecuencia Hora'!$B$6:$B$29",
            "marker": {"type": "circle", "size": 5, "border": {"color": "#E66A00"}, "fill": {"color": "#FF8A2A"}},
            "line": {"color": "#E66A00", "width": 1.75},
        }
    )
    line.set_title({"name": "Frecuencia de consumo por hora"})
    line.set_x_axis({"name": "Hora del dia"})
    line.set_y_axis({"name": "Respuestas", "major_gridlines": {"visible": True}})
    line.set_legend({"none": True})
    line.set_style(2)
    sh_hour.insert_chart("D5", line, {"x_scale": 1.8, "y_scale": 1.5})

    # Sheet 4: Perfil sensorial
    sh_attr = wb.add_worksheet("Perfil Sensorial")
    sh_attr.set_column("A:A", 32)
    sh_attr.set_column("B:B", 14)
    sh_attr.set_column("D:K", 14)

    sh_attr.write("A1", "PERFIL SENSORIAL", section_fmt)
    sh_attr.write("A3", "Atributo", table_head_fmt)
    sh_attr.write("B3", "Promedio", table_head_fmt)

    r = 4
    for label, value in zip(attr_labels, attr_avg):
        sh_attr.write(r - 1, 0, label, text_fmt)
        sh_attr.write(r - 1, 1, value, num_fmt)
        r += 1

    radar = wb.add_chart({"type": "radar"})
    radar.add_series(
        {
            "name": "Perfil sensorial",
            "categories": "='Perfil Sensorial'!$A$4:$A$9",
            "values": "='Perfil Sensorial'!$B$4:$B$9",
            "line": {"color": "#2E5B97", "width": 2},
            "fill": {"color": "#BFD0EA", "transparency": 40},
        }
    )
    radar.set_title({"name": "Grafico de arana - Perfil sensorial"})
    radar.set_style(10)
    sh_attr.insert_chart("D3", radar, {"x_scale": 1.4, "y_scale": 1.25})

    # Sheet 5: Comentarios
    sh_comments = wb.add_worksheet("Comentarios")
    sh_comments.set_column("A:A", 4)
    sh_comments.set_column("B:B", 120)

    sh_comments.merge_range("A1:B1", "OBSERVACIONES DESCRIPTIVAS", section_fmt)
    row = 3
    if descriptive_rows:
        for line_text in descriptive_rows:
            sh_comments.merge_range(row - 1, 0, row - 1, 1, line_text, text_wrap_fmt)
            row += 1
    else:
        sh_comments.merge_range("A3:B3", "Sin observaciones descriptivas para los filtros seleccionados.", text_fmt)
        row = 4

    row += 1
    sh_comments.merge_range(row - 1, 0, row - 1, 1, "OBSERVACIONES AFECTIVAS", section_fmt)
    row += 2
    if affective_rows:
        for line_text in affective_rows:
            sh_comments.merge_range(row - 1, 0, row - 1, 1, line_text, text_wrap_fmt)
            row += 1
    else:
        sh_comments.merge_range(row - 1, 0, row - 1, 1, "Sin observaciones afectivas para los filtros seleccionados.", text_fmt)

    # Sheet 6: Detalle de encuestas
    sh_detail = wb.add_worksheet("Detalle Encuestas")
    sh_detail.freeze_panes(1, 0)
    sh_detail.set_column("A:A", 5)
    sh_detail.set_column("B:B", 20)
    sh_detail.set_column("C:D", 14)
    sh_detail.set_column("E:J", 10)
    sh_detail.set_column("K:L", 18)
    sh_detail.set_column("M:N", 38)

    headers = [
        "#",
        "Fecha",
        "Sexo",
        "Dieta",
        "Acept.",
        "Liked",
        "Recompra",
        "Recom.",
        "Color",
        "Aroma",
        "Firmeza",
        "Untuosidad",
        "Sabor",
        "Persist.",
        "Obs. descriptiva",
        "Obs. afectiva",
    ]
    for c, h in enumerate(headers):
        sh_detail.write(0, c, h, table_head_fmt)

    for i, s in enumerate(surveys, start=1):
        attrs = s.get("attrs") or {}
        sh_detail.write(i, 0, i, text_fmt)
        sh_detail.write(i, 1, str(s.get("date") or ""), text_fmt)
        sh_detail.write(i, 2, map_sex_label(s.get("sex")), text_fmt)
        sh_detail.write(i, 3, map_diet_label(s.get("diet")), text_fmt)
        sh_detail.write(i, 4, safe_num(s.get("acceptance", 0)), num_fmt)
        sh_detail.write(i, 5, str(s.get("liked") or ""), text_fmt)
        sh_detail.write(i, 6, str(s.get("consumeAgain") or ""), text_fmt)
        sh_detail.write(i, 7, safe_num(s.get("recommend", 0)), num_fmt)
        sh_detail.write(i, 8, safe_num(attrs.get("color", 0)), num_fmt)
        sh_detail.write(i, 9, safe_num(attrs.get("aroma", 0)), num_fmt)
        sh_detail.write(i, 10, safe_num(attrs.get("firmeza", 0)), num_fmt)
        sh_detail.write(i, 11, safe_num(attrs.get("untuosidad", 0)), num_fmt)
        sh_detail.write(i, 12, safe_num(attrs.get("sabor_tostado", 0)), num_fmt)
        sh_detail.write(i, 13, safe_num(attrs.get("persistencia", 0)), num_fmt)
        sh_detail.write(i, 14, str(s.get("descriptiveComments") or ""), text_wrap_fmt)
        sh_detail.write(i, 15, str(s.get("affectiveComments") or ""), text_wrap_fmt)

    sh_detail.autofilter(0, 0, max(1, total), len(headers) - 1)

    # Sheet 7: Guia
    sh_guide = wb.add_worksheet("Guia")
    sh_guide.set_column("A:A", 28)
    sh_guide.set_column("B:B", 90)
    sh_guide.merge_range("A1:B1", "GUIA DE LECTURA DEL INFORME", section_fmt)
    sh_guide.write_row("A3", ["Indicador", "Interpretacion"], table_head_fmt)
    guide_rows = [
        ("Puntaje global", "Promedio de atributos sensoriales en escala de 1 a 5."),
        ("Aceptacion (%)", "Porcentaje de personas que indicaron que el producto les gusto."),
        ("Distribucion", "Composicion de la muestra por dieta y sexo biologico."),
        ("Hora pico", "Franja horaria con mayor cantidad de respuestas."),
        ("Comentarios", "Aportes cualitativos descriptivos y afectivos de participantes."),
    ]
    r = 4
    for left, right in guide_rows:
        sh_guide.write(r - 1, 0, left, text_fmt)
        sh_guide.write(r - 1, 1, right, text_fmt)
        r += 1

    wb.close()
    output.seek(0)
    return output.read()
