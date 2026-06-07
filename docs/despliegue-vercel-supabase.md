# Despliegue Vercel y Supabase

## Frontend
Variables requeridas:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Plantilla:
- `frontend/.env.example`

## Backend
Variables requeridas:
- `PORT`
- `DATABASE_URL`
- `CLERK_SECRET_KEY`

Variables recomendadas:
- `DB_SSL_REJECT_UNAUTHORIZED`
- `DB_POOL_MAX`
- `DB_IDLE_TIMEOUT_MS`
- `DB_CONNECTION_TIMEOUT_MS`
- `SLOW_REQUEST_THRESHOLD_MS`
- `SURVEY_IN_PROGRESS_WINDOW_MINUTES`
- `SURVEY_SESSION_CLEANUP_INTERVAL_MS`
- `EXCEL_PYTHON_EXPORT_URL`
- `EXCEL_EXPORT_INTERNAL_TOKEN`
- `VERCEL_PROTECTION_BYPASS`

Plantilla:
- `backend/.env.example`

## Base de datos
Orden sugerido:
1. aplicar esquema vigente de tablas
2. aplicar tabla `encuesta_sesiones` si falta
3. aplicar `database/rls_recommended_policies.sql`

## Readiness posterior al deploy
Validar:
```bash
curl https://TU_BACKEND/api/v1/health
curl https://TU_BACKEND/api/v1/health/live
curl https://TU_BACKEND/api/v1/health/ready
```

Esperado:
- `health`: disponibilidad general
- `live`: proceso levantado
- `ready`: DB y Clerk listos

## Rutas criticas a probar
- `GET /api/v1/health`
- `POST /api/v1/encuestas/sesiones`
- `PATCH /api/v1/encuestas/sesiones/:id`
- `POST /api/v1/encuestas`
- `GET /api/v1/admin/me`
- `GET /api/v1/estadisticas/resumen`
- `GET /api/v1/estadisticas`
- `GET /api/v1/estadisticas/excel`

## Checklist rapido
- frontend compila
- backend compila
- readiness responde `200`
- encuesta anonima inicia y autosincroniza
- encuesta completa persiste y elimina sesion temporal
- admin autentica
- resumen estadistico carga
- exportes responden
