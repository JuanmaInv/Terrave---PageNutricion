# Plan Backend V1 (TERRAVE)

## 1. Estado actual validado
- Frontend funcional: encuesta, panel admin, filtros y exportes.
- Persistencia actual en frontend: `localStorage` (fallback y lectura principal del admin).
- Backend: estructura creada pero sin implementacion (`backend/src` vacio).
- BD Supabase: tablas principales ya depuradas (`encuestas`, `usuarios`) y `requerimientos` removida.
- Autenticacion actual: Clerk en frontend.

## 2. Brecha principal a cerrar
- El sistema no usa todavia un backend real para persistir/consultar datos productivos.
- La logica de estadisticas/exportes esta en cliente, cuando debe vivir en servidor para seguridad, trazabilidad y escalabilidad.

## 3. Alcance backend recomendado (alineado al frontend existente)

### 3.1 Modulo Encuestas (publico)
- `POST /encuestas`
  - Recibe payload de encuesta.
  - Valida DTO (rangos 1..5, enums de sexo/dieta, longitudes de comentarios).
  - Inserta en `encuestas`.
  - Devuelve `201` con `id`.

### 3.2 Modulo Admin (protegido)
- `GET /admin/me`
  - Valida JWT de Clerk.
  - Determina si el usuario es admin por email whitelist y/o tabla `usuarios`.
- `GET /estadisticas`
  - Filtros: `diet`, `sex`, `from`, `to`.
  - Retorna datos de encuestas filtradas (o agregado, segun estrategia).
- `GET /exports/pdf`
  - Exporta reporte PDF desde datos de BD.
- `GET /exports/excel`
  - Exporta Excel desde datos de BD.

### 3.3 Modulo Usuarios (interno admin)
- `GET /usuarios/me` (opcional)
- `POST /usuarios/sync-clerk` (opcional)
  - Sincroniza nombre/email/rol desde Clerk cuando inicia sesion admin.

## 4. Contrato de datos (backend <-> frontend)

### 4.1 DTO entrada encuesta
- `sex`: `femenino|masculino|otro`
- `diet`: `omnivoro|ovo_lacto|vegano|flexitariano|otro`
- `attrs.color|aroma|firmeza|untuosidad|sabor_tostado|persistencia`: `1..5`
- `acceptance`: `1..5`
- `liked`: `si|no`
- `consumeAgain`: `si|no|tal_vez`
- `recommend`: `1..5`
- `descriptiveComments`: opcional
- `affectiveComments`: opcional
- `date`: ISO opcional (si no, servidor usa `now()`)

### 4.2 Mapeo sugerido a tabla `encuestas`
- `date` -> `fecha`
- `acceptance` -> `aceptacion`
- `consumeAgain` -> `consume_again`
- `recommend` -> `recommend`
- `descriptiveComments` -> `descriptive_comments` (o nombre real actual de columna)
- `affectiveComments` -> `affective_comments` (o nombre real actual de columna)
- `attrs.*` -> columnas numericas del mismo nombre

## 5. Requerimientos funcionales (RF) cubiertos por backend
- RF-01 Registrar encuesta sensorial.
- RF-02 Consultar encuestas por filtros.
- RF-03 Visualizar metricas agregadas para panel admin.
- RF-04 Exportar resultados en PDF/Excel.
- RF-05 Controlar acceso admin a endpoints protegidos.

## 6. Requerimientos no funcionales (RNF) objetivo (ISO 25010)
- Seguridad: auth JWT, autorizacion por rol/email, RLS y service role solo en backend.
- Fiabilidad: validacion estricta de payload, manejo de errores consistente.
- Mantenibilidad: arquitectura modular NestJS + DTOs + servicios + repositorios.
- Eficiencia: indices por `fecha`, `sexo`, `dieta`; filtros en SQL.
- Compatibilidad: contrato API estable para frontend actual.
- Auditabilidad: logs estructurados con request id y timestamp.

## 7. Arquitectura tecnica propuesta
- Framework: NestJS.
- Persistencia: Supabase PostgreSQL (via driver `pg` o cliente server-side).
- Auth: verificacion JWT de Clerk en guard global para rutas admin.
- Validacion: `class-validator` + `class-transformer`.
- Observabilidad: `pino` o logger Nest con formato JSON.
- Versionado API: prefijo `/api/v1`.

## 8. Plan de implementacion por fases

### Fase 1 (base operativa)
- Crear app NestJS en `backend/`.
- Config global (`ConfigModule`, `ValidationPipe`, CORS).
- `HealthController` (`GET /health`).
- Modulo `encuestas` con `POST /encuestas`.
- Integracion DB y test basico.

### Fase 2 (admin y consulta)
- Guard de auth con Clerk.
- `GET /admin/me`.
- `GET /estadisticas` con filtros.

### Fase 3 (exportes server-side)
- `GET /exports/pdf`.
- `GET /exports/excel`.
- Mover logica de export del frontend al backend.

### Fase 4 (endurecimiento)
- Rate limit en `POST /encuestas`.
- Tests e2e de auth y flujos principales.
- Swagger/OpenAPI y checklist de release.

## 9. Cambios necesarios en frontend
- Quitar dependencia de `loadSurveys()/saveSurvey()` como fuente principal.
- `enviarEncuesta` sin fallback silencioso a localStorage en produccion.
- Admin debe consumir `GET /estadisticas` y exportes desde backend.
- Mantener fallback local solo bajo flag `NEXT_PUBLIC_DEV_LOCAL_FALLBACK=true`.

## 10. Criterios de aceptacion de esta iteracion
- Una encuesta enviada desde `/encuesta` queda guardada en Supabase.
- `/administrador` obtiene datos reales por API.
- Usuario no admin no puede acceder a endpoints admin.
- Exportes PDF/Excel se generan con datos de BD.

## 11. Nota sobre documentacion PDF del TP
- En este entorno no hay lector PDF CLI instalado; se validaron archivos del proyecto, nombres/metadatos y trazabilidad tecnica contra frontend+BD.
- Antes de cierre final academico, contrastar esta matriz RF/RNF con el detalle textual de los PDFs del TP para ajustar nomenclatura exacta de consignas.
