# Registro de Commits por Archivo (QA -> Beta)

## Objetivo
Dejar trazabilidad exacta de cada commit atomico (un archivo por commit), incluyendo motivo tecnico, patron aplicado y validacion.

## Regla operativa
- Un commit modifica solo un archivo.
- Al commitear, completar una fila en esta tabla.
- Antes de push: validar build/lint/tsc segun modulo afectado.

## Tabla de registro
| Fecha | Branch | Commit Hash | Archivo | Tipo | Mensaje Commit | Cambio Tecnico | Patron/SOLID | Validacion |
|---|---|---|---|---|---|---|---|---|
| YYYY-MM-DD | qa | `<hash>` | `ruta/archivo` | feat/refactor/fix/docs/chore | `tipo(scope): mensaje` | Resumen concreto del cambio | Ej: SRP, DIP, Strategy | Ej: `frontend tsc --noEmit` |
| 2026-05-29 | qa | `f0d4d00` | `.gitignore` | chore | `chore(repo): update gitignore` | Ajustes de ignores para flujo actual | N/A | `git status` limpio por archivo |
| 2026-05-29 | qa | `13a28d1` | `backend/.python-version` | feat | `feat(backend-excel): update .python-version` | Version de Python declarada para consistencia local/deploy | SRP | `python --version` |
| 2026-05-29 | qa | `bf9a8eb` | `backend/README_PYTHON_EXPORT.md` | docs | `docs(backend): update README_PYTHON_EXPORT.md` | Documentacion de setup Python/XlsxWriter y variables | N/A | Revision manual |
| 2026-05-29 | qa | `a4ce507` | `backend/api/excel_report.py` | feat | `feat(backend-excel): update excel_report.py` | Funcion serverless Python para generar .xlsx | Facade/SRP | Smoke test endpoint |
| 2026-05-29 | qa | `81a5d01` | `backend/python/excel_builder.py` | feat | `feat(backend-excel): update excel_builder.py` | Builder de informe Excel completo con tablas y graficos | SRP/OCP | `python backend/scripts/generate_excel_report.py` |
| 2026-05-29 | qa | `f8662b9` | `backend/requirements.txt` | feat | `feat(backend-excel): update requirements.txt` | Dependencia `XlsxWriter` para exportador Python | N/A | `python -m pip install -r requirements.txt` |
| 2026-05-29 | qa | `5878ca4` | `backend/scripts/generate_excel_report.py` | feat | `feat(backend-excel): update generate_excel_report.py` | Script CLI para generar Excel desde stdin/json | SRP | Ejecucion local OK |
| 2026-05-29 | qa | `10f2660` | `backend/src/estadisticas/estadisticas.controller.ts` | refactor | `refactor(backend): update estadisticas.controller.ts` | Endpoint de export Excel protegido por guard | Decorator/SRP | `pnpm lint && pnpm build` backend |
| 2026-05-29 | qa | `ea1c9b2` | `backend/src/estadisticas/estadisticas.service.ts` | refactor | `refactor(backend): update estadisticas.service.ts` | Orquestacion Python exporter + fallback robusto | SRP/DIP | `pnpm lint && pnpm build` backend |
| 2026-05-29 | qa | `d6455c6` | `backend/vercel.json` | refactor | `refactor(backend): update vercel.json` | Ruteo para funcion Python en deploy | N/A | Revision config |
| 2026-05-29 | qa | `b736816` | `frontend/pnpm-workspace.yaml` | refactor | `refactor(frontend): update pnpm-workspace.yaml` | Ajuste workspace para tooling | N/A | `pnpm lint/build` frontend |
| 2026-05-29 | qa | `e870b5f` | `frontend/src/app/administrador/page.tsx` | refactor | `refactor(frontend): update page.tsx` | Integracion de mejoras de export y UI admin | SRP | `pnpm lint/build` frontend |
| 2026-05-29 | qa | `1c4616b` | `frontend/src/app/page.tsx` | refactor | `refactor(frontend): update page.tsx` | Cambio a `next/image` para eliminar warning | Best practice Next.js | `pnpm lint` frontend |
| 2026-05-29 | qa | `b6d2d3e` | `frontend/src/components/admin/SensorialSection.tsx` | refactor | `refactor(frontend): update SensorialSection.tsx` | Limpieza de codigo y acople visual | SRP | `pnpm lint` frontend |
| 2026-05-29 | qa | `7dadda5` | `frontend/src/hooks/useSurveyStats.ts` | refactor | `refactor(frontend): update useSurveyStats.ts` | Correccion sintactica y estabilidad de fetch hook | Observer/SRP | `pnpm lint/build` frontend |
| 2026-05-29 | qa | `4ae0252` | `frontend/src/lib/api.ts` | refactor | `refactor(frontend-reports): update api.ts` | Flujo de export Excel via backend y fallback controlado | Facade/Template Method | `pnpm build` frontend |
| 2026-05-29 | qa | `7e2b57a` | `frontend/src/lib/nutrilen/nutrilen.seed.ts` | refactor | `refactor(frontend): update nutrilen.seed.ts` | Limpieza de imports/uso y coherencia seed | SRP | `pnpm lint` frontend |
| 2026-05-29 | qa | `2a9d7bd` | `frontend/src/lib/reports/excel.report.exporter.ts` | refactor | `refactor(frontend-reports): update excel.report.exporter.ts` | Mejora de layout/sections del export local Excel | Factory/OCP | Prueba descarga local |
| 2026-05-29 | qa | `e324775` | `frontend/src/lib/reports/pdf.report.exporter.ts` | refactor | `refactor(frontend-reports): update pdf.report.exporter.ts` | Reordenamiento visual/logico del informe PDF | Factory/OCP | Prueba descarga PDF |
| 2026-05-29 | qa | `e2d5e6e` | `frontend/src/lib/reports/report.exporter.interface.ts` | refactor | `refactor(frontend-reports): update report.exporter.interface.ts` | Contrato de export con contexto tipado | DIP/ISP | Typecheck frontend |
| 2026-05-29 | qa | `af69648` | `frontend/src/lib/reports/report.factory.ts` | refactor | `refactor(frontend-reports): update report.factory.ts` | Factory consolidada para PDF/Excel | Factory/OCP | Prueba exportes |

## Guia de llenado por campo
- `Archivo`: ruta absoluta dentro del repo.
- `Tipo`: usar convencion corta (`feat`, `refactor`, `fix`, `docs`, `chore`).
- `Cambio Tecnico`: que se creo/modifico/elimino y por que.
- `Patron/SOLID`: explicitar patron aplicado (si corresponde).
- `Validacion`: comando ejecutado y resultado.

## Plantilla de bloque por commit (opcional)

### Commit `<hash>`
- Branch: `qa`
- Archivo: `ruta/archivo`
- Mensaje: `tipo(scope): mensaje`
- Objetivo:
- Cambio aplicado:
- Patron/SOLID aplicado:
- Riesgo:
- Validacion ejecutada:
- Resultado:

## Checklist previo a promover `qa -> beta`
- [ ] Todos los commits de la fase estan registrados.
- [ ] No hay cambios sin documentar.
- [ ] Validaciones tecnicas pasaron.
- [ ] Se adjunto resumen de impacto funcional.
- [ ] Se actualizo `HISTORIAL_TECNICO_V1.md`.
