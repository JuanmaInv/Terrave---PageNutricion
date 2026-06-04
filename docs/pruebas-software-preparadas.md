# Pruebas de software preparadas

## Que queda listo
Se dejo una base minima ejecutable para mostrar evidencias de pruebas no funcionales y de seguridad sin reescribir la arquitectura.

Tipos cubiertos:
- unitarias del desarrollador
- carga
- volumen
- estres
- seguridad smoke
- tiempos de respuesta por ruta critica

## Comandos listos
Frontend:
```bash
cd frontend
pnpm test:unit
pnpm test:watch
pnpm test:coverage
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:report
pnpm perf:load
```

Con backend levantado:
```bash
cd backend
pnpm test:unit
pnpm test:watch
pnpm test:coverage
pnpm test:load
pnpm test:volume
pnpm test:stress
pnpm test:security
pnpm perf:routes
```

## Que valida cada uno
### `pnpm test:unit`

Ejecuta la suite unitaria del desarrollador:

- backend con Vitest sobre DTOs, services, guards, controllers, health y filtro global
- frontend con Vitest + React Testing Library sobre helpers, validaciones, pages y componentes críticos

Cobertura funcional actual:
- DTOs
- controllers
- services
- admin guard
- health controller
- filtro global de errores
- validaciones de formulario
- filtros locales
- mapeo del dashboard
- route gate admin
- componentes de encuesta y gráficos

### `pnpm test:coverage`

Ejecuta la misma suite con coverage automatizado.

Umbrales configurados:
- lineas >= `90`
- funciones >= `90`

Resultado actual de referencia:

Backend:
- lineas `92.23%`
- funciones `97.26%`

Frontend:
- lineas `97.22%`
- funciones `100%`

### `pnpm perf:routes`

Mide tiempos de respuesta de rutas criticas:
- `GET /health`
- `POST /encuestas/sesiones`
- `POST /encuestas`

Sirve como evidencia para RNF-01.

### `pnpm test:load`

Ejecuta una prueba de carga concurrente base.

Default:
- `30` usuarios virtuales
- `1` ola concurrente

Sirve para demostrar concurrencia minima estable.

### `pnpm test:stress`

Ejecuta una prueba de estres mas agresiva.

Default:
- `60` usuarios virtuales
- `3` olas consecutivas

Sirve para observar degradacion, tiempos altos o errores bajo mayor presion.

### `pnpm test:volume`

Ejecuta muchas encuestas de forma controlada por lotes.

Default:
- `100` encuestas
- lotes de `10`

Sirve para mostrar procesamiento acumulado y estabilidad durante una cantidad sostenida de operaciones.

### `pnpm test:security`

Ejecuta chequeos rapidos de seguridad basicos:
- `GET /health` debe responder `200`
- `GET /admin/me` sin autenticacion debe responder `401` o `403`
- `POST /encuestas/sesiones` con payload invalido debe responder `400`
- `POST /encuestas` con payload invalido debe responder `400`

Esto no reemplaza un pentest, pero si demuestra validaciones, rechazo de requests invalidas y proteccion minima de endpoint administrativo.

## Variables utiles
- `BACKEND_URL`
- `ROUTE_MEASURE_ITERATIONS`
- `SURVEY_LOAD_CONCURRENCY`
- `SURVEY_LOAD_WAVES`
- `SURVEY_VOLUME_TOTAL`
- `SURVEY_VOLUME_BATCH_SIZE`
- `SLOW_REQUEST_THRESHOLD_MS`
- `SURVEY_SESSION_CLEANUP_INTERVAL_MS`
- `NEXT_PUBLIC_E2E_AUTH_MODE`

## Playwright

Los E2E ya quedan versionados en:

- `frontend/tests/e2e/client-survey.spec.ts`
- `frontend/tests/e2e/admin-dashboard.spec.ts`
- `frontend/tests/e2e/admin-security.spec.ts`

Casos cubiertos:

- encuestado completa encuesta y ve confirmacion
- admin accede a dashboard y visualiza graficos
- cliente autenticado no accede al dashboard
- usuario sin autenticacion de prueba queda bloqueado
- dashboard sin datos no rompe

## Como defenderlo en clase

Una forma simple de explicarlo:
- unit tests: validan funciones o unidades aisladas
- integration tests: validan modulos integrados
- estas pruebas: validan comportamiento no funcional del sistema corriendo de verdad

Entonces, si te preguntan si "son tests", la respuesta correcta es:
- si, son pruebas de software automatizadas
- algunas si son unit tests del desarrollador
- otras son pruebas no funcionales de performance, carga, estres y seguridad smoke

## Limites
- no reemplaza herramientas dedicadas como k6, Artillery, OWASP ZAP o Burp Suite
- no incluye pruebas de intrusion profundas
- no incluye auditoria automatica completa de dependencias

Pero para una entrega academica dejan evidencia reproducible, clara y ejecutable.
