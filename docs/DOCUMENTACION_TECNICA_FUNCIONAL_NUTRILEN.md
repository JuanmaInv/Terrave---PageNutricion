# TERRAVE / NutriLen - Documentacion Tecnica y Funcional

## 1. Introduccion

Este documento describe el estado real actual del sistema a partir de:

- codigo fuente en `frontend`, `backend` y `database`
- scripts de pruebas y evidencia tecnica versionada en `docs`
- configuracion de despliegue y operacion del proyecto

Objetivo:

- alinear la documentacion con la implementacion vigente
- dejar trazabilidad clara de requerimientos funcionales y no funcionales
- distinguir pruebas unitarias del desarrollador de las pruebas E2E/Playwright del equipo

## 2. Contexto del sistema

- Producto: TERRAVE / NutriLen
- Dominio: evaluacion sensorial de medallones de lenteja
- Actores:
  - participante anonimo
  - administrador autenticado
  - equipo tecnico / QA
- Stack:
  - frontend: Next.js 16 + React 19 + Tailwind 4
  - backend: NestJS 10 + PostgreSQL `pg`
  - base de datos: Supabase PostgreSQL
  - autenticacion admin: Clerk
  - exportacion Excel: Python serverless / fallback local

## 3. Resumen funcional actual

El sistema permite:

1. visualizar informacion del producto en Home
2. responder una encuesta publica anonima en tres pasos
3. guardar progreso anonimo temporal de encuesta en curso
4. persistir encuestas completas en base de datos
5. autenticar administradores con Clerk + rol en base
6. consultar estadisticas, KPIs y graficos filtrados
7. exportar resultados en PDF y Excel

## 4. Arquitectura

Capas:

- presentacion: `frontend/src/app/**`
- integracion HTTP / facade: `frontend/src/lib/api.ts`
- aplicacion API: `backend/src/**`
- acceso a datos: repositorios NestJS + PostgreSQL
- servicio auxiliar: exportador Excel Python

Patrones realmente visibles en el codigo:

- `Repository`
  - `backend/src/encuestas/repositories/encuestas.repository.ts`
  - `backend/src/estadisticas/repositories/estadisticas.repository.ts`
- `Decorator + Guard`
  - `@UseGuards(AdminGuard)` en rutas administrativas
- `Facade`
  - `frontend/src/lib/api.ts`
- `Observer / reactividad con hooks`
  - hooks de filtros, resumen y estadisticas del dashboard
- `Factory / estrategia de exportacion`
  - exportadores PDF/Excel y resolucion de export Python en backend

## 5. Estructura del repositorio

- `frontend/`
  - app router, componentes, hooks, cliente API y exportadores cliente
- `backend/`
  - API NestJS, healthchecks, auth admin, encuestas, estadisticas, scripts de pruebas
- `database/`
  - esquema base, backup Supabase y endurecimiento recomendado
- `docs/`
  - evidencia RNF, despliegue, pruebas y documentacion funcional/tecnica
- `.github/workflows/`
  - CI frontend y backend

## 6. Modelo de datos actual

### `public.usuarios`

Uso:

- autorizacion administrativa

Campos relevantes:

- `id`
- `email`
- `rol`
- `activo`

### `public.encuestas`

Uso:

- persistencia final de encuestas completas

Campos relevantes:

- `id`
- `fecha`
- `sexo`
- `dieta`
- atributos sensoriales `1..5`
- `acceptance`
- `liked`
- `consume_again`
- `recommend`
- `descriptive_comments`
- `willingness_to_pay`
- `affective_comments`

### `public.encuesta_sesiones`

Uso:

- persistencia temporal de encuestas en curso anonimas

Comportamiento actual:

- se crea al iniciar una encuesta anonima
- se actualiza sobre una sola fila por sesion cliente
- si la encuesta se completa, la respuesta final se guarda en `encuestas` y la fila temporal se elimina
- si queda inactiva, se borra automaticamente segun ventana configurada

Campos relevantes:

- `id`
- `client_session_key`
- `estado`
- `paso_actual`
- `fecha_inicio`
- `fecha_actualizacion`
- `payload`

### Integridad aplicada

- validaciones DTO en backend
- constraints SQL en tablas principales
- queries parametrizadas
- endurecimiento recomendado para Supabase en:
  - `database/rls_recommended_policies.sql`

## 7. Reglas de negocio implementadas

1. La encuesta publica no requiere login.
2. El acceso admin requiere token Clerk valido y usuario `admin` activo en BD.
3. La encuesta se divide en 3 pasos.
4. Los atributos sensoriales solo aceptan enteros `1..5`.
5. `willingnessToPay` acepta solo digitos.
6. El filtro `to` en estadisticas se normaliza a fin del dia.
7. La metrica `encuestas en curso` surge de sesiones reales persistidas temporalmente.
8. Las sesiones en curso se limpian automaticamente y la limpieza se amortiza para no penalizar concurrencia.

## 8. API implementada

### Publicas

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/encuestas/sesiones`
- `PATCH /api/v1/encuestas/sesiones/:id`
- `POST /api/v1/encuestas`

### Administrativas

- `GET /api/v1/admin/me`
- `GET /api/v1/estadisticas/resumen`
- `GET /api/v1/estadisticas`
- `GET /api/v1/estadisticas/excel`

## 9. Seguridad y proteccion de datos

Implementado hoy:

- autenticacion administrativa con Clerk
- autorizacion por rol y estado activo
- SQL parametrizado
- `X-Request-Id` por request
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `x-powered-by` deshabilitado
- masking de email admin en logs
- guia de endurecimiento de tablas Supabase

Documentos relacionados:

- `docs/rnf-05-rnf-12-rnf-14-rnf-15-rnf-17-rnf-20-rnf-21.md`
- `database/rls_recommended_policies.sql`

Brechas pendientes:

- rate limiting
- CORS estricto por entorno
- retencion centralizada de logs fuera del proceso local

## 10. Testing y estrategia de pruebas

### 10.1 Pruebas del desarrollador

Estas son las pruebas que debe mantener el desarrollador en el repo.

#### Unit tests del desarrollador

Ubicacion:

- `backend/test/unit/create-encuesta.dto.spec.js`
- `backend/test/unit/upsert-encuesta-session.dto.spec.js`
- `backend/test/unit/encuestas.service.spec.js`
- `backend/test/unit/admin.guard.spec.js`
- `backend/test/unit/health.controller.spec.js`
- `backend/test/unit/admin.service.spec.js`
- `backend/test/unit/estadisticas.service.spec.js`
- `backend/test/unit/controllers.spec.js`
- `backend/test/unit/global-exception.filter.spec.js`
- `frontend/src/**/*.test.ts(x)`
- `frontend/src/**/*.spec.ts(x)`

Comando:

```bash
cd frontend
pnpm test:unit
pnpm test:coverage

cd backend
pnpm test:unit
pnpm test:coverage
```

Cobertura funcional actual de la suite:

- validaciones DTO de encuesta completa
- validaciones DTO de sesion en curso
- delegacion y reglas basicas de `EncuestasService`
- reglas de auth y acceso de `AdminService`
- control de acceso de `AdminGuard`
- readiness/liveness de `HealthController`
- calculos y mapeo del dashboard
- filtros locales y reglas de disponibilidad de encuesta
- pages/componentes criticos de `Encuesta` y `Administrador`

Resultado de cobertura vigente del desarrollador:

Backend, perimetro unitario:

- lineas: `92.23%`
- funciones: `97.26%`

Frontend, perimetro unitario puro:

- lineas: `97.22%`
- funciones: `100%`

Perimetro cubierto por `pnpm test:coverage`:

- backend: controladores, servicios, guards, DTOs, filtro global de errores y health controller
- frontend: validaciones, filtros, reglas de disponibilidad y mapeo de dashboard

Perimetro excluido a proposito de esta metrica unitaria:

- modulos Nest sin logica
- `main.ts`
- repositorios SQL
- acceso real a PostgreSQL
- interfaces
- markup completo de paginas grandes del frontend
- Clerk real
- Supabase real

Justificacion:

- esos componentes se validan mejor con pruebas de integracion, smoke y E2E que con unit tests puros

#### Pruebas no funcionales automatizadas

Comandos:

```bash
cd backend
pnpm perf:routes
pnpm perf:concurrency
pnpm test:load
pnpm test:volume
pnpm test:stress
pnpm test:security
```

Y para frontend:

```bash
cd frontend
pnpm perf:load
```

Documentacion:

- `docs/rnf-01-rnf-02-rnf-03-validacion.md`
- `docs/pruebas-software-preparadas.md`

### 10.2 Pruebas del equipo QA / Playwright

Las pruebas E2E, regresion funcional, flujos por navegador y validacion integral de interfaz quedan alineadas con el plan del equipo:

- `docs/Plan_Pruebas_Sistema_Encuestas_IDE.pdf`
- `frontend/tests/e2e/*.spec.ts`

Responsabilidad esperada de esa capa:

- Playwright E2E
- roles y seguridad desde navegador
- smoke cross-browser
- regresion UI
- validacion de flujos completos de encuestado y admin

Casos ya versionados como base:

- cliente completa encuesta y recibe confirmacion
- admin accede al dashboard y visualiza KPIs/graficos
- cliente autenticado no accede al dashboard
- usuario sin autenticacion de prueba queda bloqueado
- dashboard sin datos no rompe

### 10.3 Interpretacion correcta

- unit tests: responsabilidad principal del desarrollador
- perf/load/security smoke: responsabilidad tecnica compartida, pero automatizable por desarrollo
- Playwright/E2E/UAT: responsabilidad principal de QA y del equipo segun plan de pruebas

## 11. Requerimientos funcionales

Estados usados:

- `Cumple`
- `Parcial`
- `No cumple`

### Matriz RF actual

1. `RF-01` Visualizacion de informacion del producto: **Cumple**
2. `RF-02` Navegacion entre Inicio, Encuesta y Administrador: **Cumple**
3. `RF-03` Registro de sexo biologico y tipo de dieta: **Cumple**
4. `RF-04` Generacion automatica de fecha: **Cumple**
5. `RF-05` Evaluacion descriptiva de 6 atributos `1..5`: **Cumple**
6. `RF-06` Observaciones descriptivas: **Cumple**
7. `RF-07` Evaluacion afectiva por escala: **Cumple**
8. `RF-08` Registro de gusto `si/no`: **Cumple**
9. `RF-09` Observaciones afectivas: **Cumple**
10. `RF-10` Encuesta multi-step de 3 pasos: **Cumple**
11. `RF-11` Persistencia entre pasos: **Cumple**
12. `RF-12` Navegacion Continuar / Volver: **Cumple**
13. `RF-13` Confirmacion de envio: **Cumple**
14. `RF-14` Almacenamiento en base de datos: **Cumple**
15. `RF-15` Generacion de estadisticas: **Cumple**
16. `RF-16` Dashboard con total, completas, en curso, puntaje, aceptacion y distribuciones: **Cumple**
17. `RF-17` Grafico radar sensorial: **Cumple**
18. `RF-18` Seleccion / deseleccion de atributos del radar: **Cumple**
19. `RF-19` Tooltips estadisticos en graficos y KPIs: **Cumple**
20. `RF-20` Exportacion PDF y Excel: **Cumple**
21. `RF-21` Refresco explicito de estadisticas: **Cumple**
22. `RF-22` Cambio de tema claro/oscuro: **Cumple**
23. `RF-23` Responsive en home, encuesta y admin: **Cumple**
24. `RF-24` Validacion de formularios obligatorios: **Cumple**
25. `RF-25` Feedback visual de carga, error y exito: **Cumple**

Resumen RF:

- Cumple: 25
- Parcial: 0
- No cumple: 0

## 12. Requerimientos no funcionales

### Matriz RNF actual

1. `RNF-01` Tiempo de respuesta <= 3s con instrumentacion y evidencia: **Cumple**
2. `RNF-02` Carga eficiente de imagenes con evidencia objetiva: **Cumple**
3. `RNF-03` Validacion de concurrencia >=30 encuestas: **Cumple**
4. `RNF-04` Escalabilidad funcional: **Cumple**
5. `RNF-05` Disponibilidad operativa con health/live/ready: **Cumple**
6. `RNF-06` Persistencia de respuestas: **Cumple**
7. `RNF-07` Recuperacion ante fallos de envio: **Cumple**
8. `RNF-08` Integridad de datos: **Cumple**
9. `RNF-09` Autenticacion administrativa: **Cumple**
10. `RNF-10` Autorizacion por rol: **Cumple**
11. `RNF-11` Encuesta anonima: **Cumple**
12. `RNF-12` Proteccion de datos almacenados con controles practicos y endurecimiento recomendado: **Cumple**
13. `RNF-13` Usabilidad multi-step: **Cumple**
14. `RNF-14` Accesibilidad visual con mejoras concretas y criterio equivalente versionado: **Cumple**
15. `RNF-15` Responsive con verificacion reproducible documentada: **Cumple**
16. `RNF-16` Consistencia visual/paleta: **Cumple**
17. `RNF-17` Compatibilidad Chrome/Edge/Firefox con matriz breve documentada: **Cumple**
18. `RNF-18` Integracion frontend-backend-BD: **Cumple**
19. `RNF-19` Mantenibilidad modular: **Cumple**
20. `RNF-20` Despliegue y operacion Vercel/Supabase documentados: **Cumple**
21. `RNF-21` Registro de eventos relevantes y fallos: **Cumple**

Resumen RNF:

- Cumple: 21
- Parcial: 0
- No cumple: 0

## 13. Evidencia tecnica disponible

### Calidad tecnica

- `pnpm test:unit` frontend
- `pnpm test:coverage` frontend
- `pnpm build` frontend
- `pnpm build` backend
- `pnpm test:unit` backend
- `pnpm test:coverage` backend

### Seguridad y readiness

- `node scripts/security-smoke.mjs`
- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

### Rendimiento y concurrencia

- `pnpm perf:routes`
- `pnpm perf:concurrency`
- `pnpm perf:load`

### Documentos de soporte

- `docs/rnf-01-rnf-02-rnf-03-validacion.md`
- `docs/pruebas-software-preparadas.md`
- `docs/rnf-05-rnf-12-rnf-14-rnf-15-rnf-17-rnf-20-rnf-21.md`
- `docs/despliegue-vercel-supabase.md`

## 14. Accesibilidad y UX

Implementado:

- skip link
- foco visible reforzado
- `prefers-reduced-motion`
- `aria-live` en estados clave
- `aria-current` en pasos
- `aria-pressed` en controles seleccionables
- labels y landmarks principales

Pantallas cubiertas:

- `/`
- `/encuesta`
- `/administrador`

## 15. Responsive y compatibilidad

Responsive documentado para:

- mobile `390x844`
- tablet `768x1024`
- desktop `1366x768`

Compatibilidad documentada para:

- Chrome estable
- Edge estable
- Firefox estable

Soporte formal E2E/cross-browser:

- Playwright versionado en `frontend/tests/e2e`
- alineado con el plan del equipo en `Plan_Pruebas_Sistema_Encuestas_IDE.pdf`

## 16. Despliegue y operacion

Archivos relevantes:

- `backend/.env.example`
- `frontend/.env.example`
- `backend/vercel.json`
- `frontend/src/proxy.ts`
- `docs/despliegue-vercel-supabase.md`

Flujo operativo resumido:

1. configurar variables de entorno
2. aplicar esquema y endurecimiento DB
3. desplegar backend
4. validar `/health`, `/live`, `/ready`
5. desplegar frontend
6. probar rutas criticas y exportes

## 17. Brechas reales restantes

Aunque la matriz RF/RNF queda cubierta desde la implementacion y la evidencia disponible, siguen siendo mejoras deseables a futuro:

- incorporar rate limiting
- endurecer CORS por entorno
- agregar reporte Lighthouse versionado si la catedra lo exige expresamente
- medir cobertura porcentual con herramienta dedicada si se quiere un KPI formal

## 18. Conclusion

El proyecto actual ya no se corresponde con la documentacion tecnica vieja.

Estado actual alineado:

- la encuesta anonima multi-step funciona end-to-end
- la metrica `encuestas en curso` existe de forma real y trazable
- el dashboard admin tiene KPIs, radar, tooltips y exportes
- el backend tiene healthchecks, readiness, logging y headers utiles
- existen unit tests del desarrollador en backend y frontend con Vitest
- existen pruebas automatizadas no funcionales versionadas
- existe una base Playwright versionada y el plan ampliado del equipo queda documentado en el PDF de pruebas

En consecuencia, este archivo pasa a ser la referencia tecnica-funcional vigente del repositorio.
