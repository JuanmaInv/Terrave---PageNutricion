# Prompt Tecnico de Onboarding (Primera Ejecucion)

Este documento define el arranque tecnico obligatorio para cualquier integrante nuevo del proyecto.

## Objetivo
- Dejar el entorno local funcional desde cero.
- Evitar pushes con errores de lint/build.
- Estandarizar como se trabaja en ramas `qa`, `beta` y `main`.

## 1) Clonar y abrir el repositorio
1. Clonar el repo.
2. Abrir la carpeta raiz en la IDE.
3. Verificar que la rama activa sea `qa` para desarrollo.

## 2) Requisitos locales
- Node.js 20+
- pnpm 10+
- Git

## 3) Configuracion inicial
1. Ir a `frontend/`.
2. Crear/validar `frontend/.env.local` con variables requeridas (Clerk y otras del proyecto).
3. Instalar dependencias:

```bash
pnpm install --frozen-lockfile
```

## 4) Verificacion tecnica obligatoria (antes de trabajar)
Ejecutar en `frontend/`:

```bash
pnpm lint
pnpm build
```

Si alguno falla, no avanzar con cambios hasta dejarlo en verde.

## 5) Regla obligatoria antes de push
Antes de cada `git push`, correr:

```bash
pnpm lint && pnpm build
```

Si hay errores, se corrigen primero y recien despues se hace push.

## 6) Flujo de ramas del proyecto
1. `qa`: desarrollo diario.
2. `beta`: candidato estable para validacion.
3. `main`: produccion.

Promocion de cambios:
- `qa -> beta`
- `beta -> main`

Nunca desarrollar directo en `main`.

## 7) CI en GitHub Actions
El pipeline de frontend valida:
- instalacion
- lint
- build

Secrets requeridos en GitHub:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Sin esos secrets, el build puede fallar.
