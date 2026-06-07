# RNF-05, RNF-12, RNF-14, RNF-15, RNF-17, RNF-20 y RNF-21

## Resumen

Se aplicaron mejoras practicas y compatibles con el stack actual en:

- disponibilidad y readiness
- proteccion de datos y configuracion sensible
- accesibilidad visual
- responsive
- compatibilidad entre navegadores modernos
- despliegue y operacion
- logging de eventos relevantes y fallos

## RNF-05 - Disponibilidad operativa

### Cambios aplicados

Backend:

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `X-Request-Id` por request
- `X-Response-Time` y `Server-Timing`
- filtro global de errores con respuesta consistente

Archivos:

- `backend/src/health/health.controller.ts`
- `backend/src/main.ts`
- `backend/src/common/filters/global-exception.filter.ts`

### Evidencia reproducible

```bash
Invoke-WebRequest http://127.0.0.1:3000/api/v1/health -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:3000/api/v1/health/live -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:3000/api/v1/health/ready -UseBasicParsing
```

Resultado esperado:

- `health`: `200`
- `live`: `200`
- `ready`: `200` si DB y Clerk estan configurados, `503` si no

## RNF-12 - Proteccion de datos almacenados

### Cambios aplicados

- backend sin exposicion de secretos en logs
- email admin enmascarado en logs
- headers de seguridad basicos:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Cross-Origin-Opener-Policy: same-origin`
- `x-powered-by` deshabilitado
- pool y SSL de DB controlados por entorno
- script recomendado de endurecimiento para Supabase:
  - `database/rls_recommended_policies.sql`

Archivos:

- `backend/src/main.ts`
- `backend/src/database/database.service.ts`
- `backend/src/admin/admin.service.ts`
- `database/rls_recommended_policies.sql`

### Enfoque practico

El acceso a datos sensibles sigue un flujo servidor a servidor:

- browser -> API Nest -> PostgreSQL

No se agrego acceso directo desde frontend a tablas sensibles.
Por eso se recomienda:

- revocar `anon` y `authenticated` sobre tablas
- habilitar RLS aunque no se expongan politicas de lectura/escritura al navegador

## RNF-14 - Accesibilidad visual

### Mejoras aplicadas

- skip link global a `#main-content`
- `main` identificable en Home, Encuesta y Administrador
- foco visible reforzado
- soporte `prefers-reduced-motion`
- `aria-live` para guardado de encuesta
- `aria-current="step"` en progreso de encuesta
- `aria-pressed` en tarjetas de seleccion
- `aria-label` en campos libres relevantes
- `nav` con `aria-label`

Archivos:

- `frontend/src/app/layout.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/app/page.tsx`
- `frontend/src/app/encuesta/page.tsx`
- `frontend/src/app/administrador/page.tsx`
- `frontend/src/components/nutrilen/Navbar.tsx`

### Criterio equivalente medible

Checklist aplicado:

- skip link presente: si
- landmarks principales presentes: si
- foco visible reforzado: si
- reduced motion: si
- anuncios de estado en encuesta: si
- controles seleccionables con estado accesible: si

## RNF-15 - Responsive

### Verificacion reproducible

Anchos objetivo:

- mobile: `390x844`
- tablet: `768x1024`
- desktop: `1366x768`

Pantallas cubiertas:

- `/`
- `/encuesta`
- `/administrador`

Resultado esperado de la verificacion visual:

- sin desborde horizontal
- CTAs y filtros envueltos correctamente
- textos legibles
- charts y KPIs contenidos dentro del viewport

## RNF-17 - Compatibilidad Chrome, Edge y Firefox

### Alcance practico

Se revisaron las APIs y estilos usados en frontend para compatibilidad con navegadores modernos:

- `crypto.randomUUID`
- `color-mix`
- `oklch`
- `prefers-reduced-motion`
- `:focus-visible`
- `Server-Timing` y `X-Response-Time` en backend

### Matriz breve

| Navegador | Alcance | Resultado |
| --- | --- | --- |
| Chrome estable | rutas principales + encuesta + admin | compatible por implementacion actual |
| Edge estable | rutas principales + encuesta + admin | compatible por implementacion actual |
| Firefox estable | rutas principales + encuesta + admin | compatible por implementacion actual |

Nota:

- la matriz anterior se basa en el uso de APIs estables soportadas por versiones actuales de los tres navegadores; si se requiere defensa academica mas fuerte, complementar con smoke manual en cada navegador y capturas.

## RNF-20 - Despliegue y operacion Vercel/Supabase

### Cambios aplicados

- plantillas de entorno:
  - `backend/.env.example`
  - `frontend/.env.example`
- documentacion de endurecimiento de DB:
  - `database/rls_recommended_policies.sql`
- readiness para validar despliegue despues de publicar

### Flujo de puesta en marcha

1. configurar variables de entorno de frontend y backend
2. aplicar estructura de DB vigente
3. aplicar `database/rls_recommended_policies.sql`
4. desplegar backend
5. verificar `GET /api/v1/health/ready`
6. desplegar frontend
7. validar Home, Encuesta y Administrador

## RNF-21 - Registro de eventos y fallos

### Eventos cubiertos

- acceso admin concedido
- acceso admin denegado
- fallos de autenticacion admin
- resumen de estadisticas consultado
- encuestas consultadas
- exportacion Excel generada
- exportacion Excel fallida
- sesion de encuesta creada/actualizada
- encuesta final creada
- errores globales con `requestId`

Archivos:

- `backend/src/admin/admin.service.ts`
- `backend/src/admin/guards/admin.guard.ts`
- `backend/src/estadisticas/estadisticas.service.ts`
- `backend/src/estadisticas/estadisticas.controller.ts`
- `backend/src/encuestas/encuestas.service.ts`
- `backend/src/common/filters/global-exception.filter.ts`
- `backend/src/main.ts`

### Criterio aplicado

- logs utiles para diagnostico
- sin token completo en logs
- sin payload completo de encuestas en logs
- con identificadores tecnicos y contadores suficientes

## Verificacion minima sugerida

Backend:

```bash
cd backend
pnpm build
node scripts/security-smoke.mjs
```

Frontend:

```bash
cd frontend
pnpm build
```
