# RNF-01, RNF-02 y RNF-03

## Alcance

Se trabajaron tres frentes sin reescribir la arquitectura:

- RNF-01: instrumentacion y medicion reproducible de rutas criticas.
- RNF-02: optimizacion puntual de imagenes del frontend y medicion objetiva.
- RNF-03: validacion de concurrencia para al menos 30 encuestas simultaneas.

## RNF-01 - Tiempo de respuesta

### Instrumentacion agregada

Backend:

- Header `X-Response-Time`
- Header `Server-Timing`
- Log de requests lentos cuando superan `SLOW_REQUEST_THRESHOLD_MS` (default `3000`)

Archivo:

- `backend/src/main.ts`

### Rutas criticas consideradas

- `GET /api/v1/health`
- `POST /api/v1/encuestas/sesiones`
- `POST /api/v1/encuestas`

### Como medir

Con backend levantado:

```bash
cd backend
pnpm perf:routes
```

Variables opcionales:

- `BACKEND_URL`
- `ROUTE_MEASURE_ITERATIONS`
- `SLOW_REQUEST_THRESHOLD_MS`
- `SURVEY_SESSION_CLEANUP_INTERVAL_MS`

### Como leer el resultado

El script imprime por ruta:

- `avg`
- `p95`
- `max`
- ultimo valor de `X-Response-Time`

Objetivo:

- acercarse a `<= 3000ms` por request critica

## RNF-02 - Carga de imagenes

### Optimizaciones aplicadas

- Import estatico de la imagen principal para habilitar metadata y blur placeholder.
- `priority` en la hero image.
- `quality={70}` para reducir transferencia.
- `sizes="100vw"` para que Next optimice mejor por viewport.

Archivo:

- `frontend/src/app/page.tsx`

### Como medir

Con frontend levantado:

```bash
cd frontend
pnpm perf:load
```

Variable opcional:

- `FRONTEND_URL`

### Como leer el resultado

El script mide:

- `GET /`
- `GET optimized hero image`

Y reporta:

- `time`
- `bytes`
- `content-type`

Objetivo:

- imagen principal idealmente por debajo de `2000ms` en entorno local/red razonable

## RNF-03 - Concurrencia

### Cobertura

Se agrego un script que simula el flujo real minimo de 30 usuarios concurrentes:

1. crear sesion anonima
2. enviar encuesta completa

Archivo:

- `backend/scripts/load-test-surveys.mjs`

### Como ejecutar

Con backend levantado y apuntando a una base de prueba:

```bash
cd backend
pnpm perf:concurrency
```

Variables opcionales:

- `BACKEND_URL`
- `SURVEY_LOAD_CONCURRENCY` (default `30`)

### Como leer el resultado

El script reporta:

- `Concurrency`
- `Total wall time`
- `Average virtual user time`
- `p95 virtual user time`
- `Max virtual user time`

Lectura sugerida:

- si no hay errores HTTP, el flujo soporta la concurrencia configurada
- `p95` y `max` ayudan a detectar degradacion bajo carga
- repetir 3 veces y comparar si hay dispersion fuerte

## Evidencia minima reproducible

### Frontend

```bash
cd frontend
pnpm build
pnpm perf:load
```

Resultado de referencia obtenido en local:

- `GET /` -> `164ms`
- `GET optimized hero image` -> `135.9ms`
- `optimized hero image bytes` -> `101906`

### Backend

```bash
cd backend
pnpm build
pnpm perf:routes
pnpm perf:concurrency
```

Resultados de referencia obtenidos en local:

- `GET /health`
  - `avg=1.0ms`
  - `p95=1.6ms`
  - `max=1.6ms`
- `POST /encuestas/sesiones`
  - `avg=559.8ms`
  - `p95=1455.0ms`
  - `max=1455.0ms`
- `POST /encuestas`
  - `avg=668.9ms`
  - `p95=671.6ms`
  - `max=671.6ms`
- Concurrencia `30`
  - `Total wall time=3976.9ms`
  - `Average virtual user time=3217.0ms`
  - `p95 virtual user time=3951.7ms`
  - `Max virtual user time=3951.9ms`

## Notas

- Estos scripts si cuentan como pruebas, pero son pruebas no funcionales: benchmarking/performance y carga, no unit tests ni tests de integracion clasicos.
- Los scripts no reemplazan una prueba de carga dedicada tipo k6 o Artillery, pero dejan evidencia reproducible minima con el menor cambio posible.
- Se redujo el costo por request amortizando la limpieza de sesiones expiradas. La eliminacion sigue ocurriendo automaticamente, pero ya no ejecuta un `DELETE` en cada request caliente. El intervalo se controla con `SURVEY_SESSION_CLEANUP_INTERVAL_MS` y por defecto es `300000` ms (`5` minutos).
- Para mediciones representativas en beta o produccion, ejecutar contra la URL real del entorno y con la base correspondiente.
