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
