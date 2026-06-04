# Cobertura RF-19 y RF-23

## RF-19

Se unificaron los tooltips estadisticos del panel administrador con dos piezas reutilizables:

- `AdminInfoTooltip`: tooltip accesible por hover y foco para KPIs y titulos de graficos.
- `AdminChartTooltip`: tooltip visual consistente para graficos `recharts`.

Vistas cubiertas:

- `Administrador`
  - `KpiGrid`
  - `DistributionCharts`
  - `HourlyChart`
  - `SensorialSection`

No aplica:

- Exportaciones PDF y Excel: no son tooltips interactivos en runtime.
- `CommentsPanel`: no contiene visualizaciones estadisticas con tooltip interactivo.

## RF-23

Se ajustaron puntos de responsive en las vistas principales:

- `Home`
  - Hero con mejor altura minima en mobile.
  - CTAs apilados en pantallas chicas.
  - Espaciado vertical mas compacto en mobile.
- `Encuesta`
  - Botones principales a ancho completo en mobile.
  - Opciones afectivas reacomodadas para evitar compresion horizontal.
  - Contenedor principal con padding mas contenido en pantallas chicas.
- `Administrador`
  - `KpiGrid` con mejor distribucion en tablet.
  - `AdminHeader` con acciones que no se aplastan en anchos intermedios.
  - `StatsFilters` con texto auxiliar mas legible.
  - Graficos con margenes y alturas mas estables en mobile.
- `Navbar`
  - Reflujo mas seguro para evitar apretado entre links, logout y switch de tema.

Constancia minima:

- Se valido compilacion de frontend con `pnpm build`.
- Se valido compilacion de backend con `pnpm build`.
