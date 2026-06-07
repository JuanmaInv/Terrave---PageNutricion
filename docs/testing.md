# Testing en NutriLen

## Objetivo

El proyecto quedó separado en tres bloques fáciles de explicar:

- `unitarios`: lógica del desarrollador
- `componentes`: interfaz React aislada
- `E2E`: flujos completos con Playwright

La idea es que en la exposición puedas abrir la IDE, ir al panel correcto y entender rápidamente qué prueba cada archivo.

## Qué usa el proyecto

- `Vitest` para unitarios y componentes
- `React Testing Library` para componentes React
- `jsdom` para entorno de navegador simulado en frontend
- `Playwright` para E2E
- `Lighthouse CI` para auditorías automáticas de performance y accesibilidad en frontend

No se usa `Python Tests` para este proyecto.

## Cómo se detectan en la IDE

### Panel `Testing`

El panel `Testing` de VS Code debería detectar los tests de `Vitest` porque el repo ya tiene:

- `frontend/vitest.config.ts`
- `frontend/setupTests.ts`
- `backend/vitest.config.ts`
- patrones `.test.ts`, `.test.tsx`, `.spec.js`, `.spec.ts`

Ubicaciones principales:

- `frontend/src/lib/**`
- `frontend/src/app/**`
- `frontend/src/components/**`
- `backend/test/unit/**`

### Apartado `Playwright`

El apartado `Playwright` de VS Code debería detectar:

- `frontend/playwright.config.ts`
- `frontend/tests/e2e/*.spec.ts`

Archivos E2E principales:

- `frontend/tests/e2e/encuestado-flujo.spec.ts`
- `frontend/tests/e2e/admin-dashboard.spec.ts`
- `frontend/tests/e2e/seguridad-roles.spec.ts`

## Estructura sugerida para explicar

### 1. Encuesta

- `frontend/src/lib/survey/encuesta.validacion.test.ts`
- `frontend/src/lib/survey/encuesta.estados.test.ts`
- `frontend/src/app/encuesta/formulario-encuesta.test.tsx`
- `frontend/tests/e2e/encuestado-flujo.spec.ts`

### 2. Dashboard

- `frontend/src/lib/dashboard/dashboard.calculos.test.ts`
- `frontend/src/lib/survey/dashboard.filtros.test.ts`
- `frontend/src/components/admin/dashboard-graficos.test.tsx`
- `frontend/tests/e2e/admin-dashboard.spec.ts`

### 3. Roles y seguridad

- `frontend/src/app/administrador/roles-dashboard-admin.test.tsx`
- `backend/test/unit/admin.guard.spec.js`
- `backend/test/unit/admin.service.spec.js`
- `frontend/tests/e2e/seguridad-roles.spec.ts`

### 4. Backend técnico

- `backend/test/unit/create-encuesta.dto.spec.js`
- `backend/test/unit/upsert-encuesta-session.dto.spec.js`
- `backend/test/unit/encuestas.service.spec.js`
- `backend/test/unit/estadisticas.service.spec.js`
- `backend/test/unit/controllers.spec.js`
- `backend/test/unit/health.controller.spec.js`
- `backend/test/unit/global-exception.filter.spec.js`

## Cómo correr los unitarios y componentes

### Frontend

```bash
cd frontend
pnpm test
pnpm test:unit
pnpm test:watch
pnpm test:coverage
```

Notas:

- `pnpm test` y `pnpm test:unit` ejecutan la misma suite Vitest del frontend
- acá están mezclados los unitarios puros y los tests de componentes

### Backend

```bash
cd backend
pnpm test
pnpm test:unit
pnpm test:watch
pnpm test:coverage
```

Notas:

- en backend los tests son unitarios del desarrollador
- no usan base real ni Clerk real

## Cómo correr Playwright

```bash
cd frontend
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:report
```

### Qué hace cada comando

- `pnpm test:e2e`: corre toda la suite E2E
- `pnpm test:e2e:ui`: abre Playwright UI
- `pnpm test:e2e:headed`: corre viendo el navegador
- `pnpm test:e2e:report`: abre el reporte HTML de la última corrida

## Cómo ejecutarlos desde la IDE

### Desde `Testing`

1. Abrí el panel `Testing`
2. Elegí el archivo o test puntual de `Vitest`
3. Ejecutá:
   - todos los tests
   - un archivo
   - o un caso individual

Conviene usar esto para explicar:

- validaciones de encuesta
- estados de encuesta
- cálculo del dashboard
- permisos admin
- componentes React

### Desde `Playwright`

1. Abrí el apartado `Playwright`
2. Elegí el navegador
3. Corré:
   - el flujo del encuestado
   - el dashboard admin
   - o seguridad de roles

Conviene usar esto para explicar:

- flujo completo de encuesta
- acceso de admin
- bloqueo de cliente en dashboard

## Qué cubre cada grupo de pruebas

### Unitarios

Cubren reglas internas como:

- encuesta completa válida
- encuesta incompleta inválida
- campos obligatorios vacíos
- respuestas fuera de rango
- estados de encuesta
- cálculo de totales, porcentajes y agrupaciones
- filtros del dashboard
- errores de servicios

### Componentes

Cubren comportamiento visual controlado:

- formulario de encuesta renderiza
- se muestran errores
- se permite enviar datos válidos
- dashboard sin datos
- dashboard con gráficos
- protección del dashboard según rol

### E2E

Cubren flujos reales:

- encuestado responde encuesta y ve confirmación
- admin entra al dashboard y ve métricas
- cliente no entra al dashboard admin
- estado restringido sin rol de prueba

## Mocks y entorno de prueba

### Supabase

- no se usa Supabase real en unitarios
- se mockea la capa de acceso a datos o fallback local
- mock reutilizable: `frontend/src/test/mocks/supabase.ts`

### Clerk

- no se usa Clerk real en unitarios
- se mockean `useAuth`, `SignedIn`, `SignedOut`, `SignIn`, `useClerk`

### Playwright seguro para local

En E2E no se depende de Clerk real. Se usa:

- `NEXT_PUBLIC_E2E_AUTH_MODE=true`

Y el rol de prueba se toma desde:

- `localStorage["nutrilen.e2eRole"]`

Valores:

- `admin`
- `client`
- vacío: acceso restringido

## Comandos recomendados para la exposición

### Frontend rápido

```bash
cd frontend
pnpm test
pnpm test:coverage
pnpm test:e2e
```

### Backend rápido

```bash
cd backend
pnpm test
pnpm test:coverage
```

## Resultado esperado actual

Última verificación hecha:

- `frontend pnpm test`: OK
- `frontend pnpm test:coverage`: OK
- `frontend pnpm test:e2e`: OK
- `backend pnpm test`: OK
- `backend pnpm test:coverage`: OK

## CI del repositorio

El repositorio quedó con CI en GitHub Actions para `main` y `beta`.

### Frontend

Workflow:

- `.github/workflows/ci-frontend.yml`

Qué valida:

- `pnpm lint`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm build`
- `pnpm test:e2e`
- `Lighthouse CI` sobre `/`, `/encuesta` y `/administrador`

Además publica artefactos de:

- `frontend/coverage`
- `frontend/playwright-report`
- reportes de `Lighthouse CI`

### Backend

Workflow:

- `.github/workflows/ci-backend.yml`

Qué valida:

- `pnpm lint`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm build`

Además publica artefactos de:

- `backend/coverage`

## Nota para la cátedra

El botón `Configure Python Tests` no corresponde a este proyecto.

Si aparece, ignorarlo: la configuración válida para este repo es:

- `Vitest` en `Testing`
- `Playwright` en su apartado propio

## Observabilidad del frontend

### Microsoft Clarity

El frontend quedó preparado para usar `Microsoft Clarity` desde:

- `frontend/src/app/layout.tsx`

Se activa solo si existe:

```bash
NEXT_PUBLIC_CLARITY_PROJECT_ID=tu_project_id
```

Archivo de referencia:

- `frontend/.env.example`

Si la variable está vacía:

- no se carga el script
- no afecta el diseño
- no afecta Playwright E2E

### Lighthouse CI

La configuración quedó en:

- `frontend/lighthouserc.json`

Qué audita:

- `http://127.0.0.1:3001/`
- `http://127.0.0.1:3001/encuesta`
- `http://127.0.0.1:3001/administrador`

Umbrales actuales:

- `performance`: warning si baja de `0.75`
- `accessibility`: error si baja de `0.90`
- `best-practices`: warning si baja de `0.85`
- `seo`: warning si baja de `0.80`

Se ejecuta desde GitHub Actions dentro de:

- `.github/workflows/ci-frontend.yml`
