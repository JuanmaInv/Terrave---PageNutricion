# Cierre del proyecto y plan de versionado

## 1. Estado general del proyecto

Tomando en cuenta las consignas del integrador, el proyecto está **muy cerca del cierre técnico**. La base funcional, no funcional, de testing y CI ya quedó bastante cubierta.

### Lo que ya está cubierto

- encuesta funcional de cliente/encuestado;
- dashboard administrativo funcional;
- guardado de encuestas completas;
- manejo de sesiones en curso;
- persistencia local del borrador de encuesta;
- exportación PDF y Excel;
- análisis de disposición a pagar en dashboard y exportes;
- tests unitarios y de componentes;
- tests E2E con Playwright;
- cobertura de backend y frontend;
- CI para frontend y backend;
- integración de Lighthouse CI;
- integración preparada de Microsoft Clarity;
- matriz de errores documentada;
- mejoras de responsive, accesibilidad y resiliencia.

## 2. ¿Estamos listos para pasar a documentación?

### Respuesta corta

**Sí, casi.**

Lo razonable ahora es:

1. terminar de ordenar y publicar los commits en la secuencia correcta;
2. desplegar lo que corresponda a `beta` y `main`;
3. hacer validación manual final del sistema “en primera persona”;
4. cerrar la documentación definitiva del proyecto.

### Qué falta antes del cierre total

No faltan grandes desarrollos nuevos. Lo que falta es principalmente **validación final y orden de publicación**:

- confirmar que GitHub Actions corre bien en remoto para:
  - `qa`
  - `beta`
  - `main`
- verificar que Lighthouse CI genera reporte correctamente en Actions;
- verificar que Clarity esté efectivamente activo en los deploys;
- hacer una pasada manual final del flujo completo:
  - home
  - encuesta
  - admin
  - exportaciones
  - recuperación de borrador
  - acceso por roles
- después de eso, sí conviene concentrarse en la documentación final.

## 3. Validación manual final recomendada

Antes de cerrar y documentar como definitivo, conviene ejecutar esta lista:

### Encuesta

- ingresar a `/encuesta`;
- avanzar paso por paso;
- validar mensajes de error por campos faltantes;
- cortar backend o internet mientras se completa;
- comprobar toast de error claro;
- recargar la página;
- verificar recuperación del borrador local;
- volver a entrar y enviar correctamente la encuesta.

### Dashboard admin

- iniciar sesión admin;
- verificar KPIs y gráficos;
- revisar la nueva sección de disposición a pagar;
- probar filtros;
- exportar PDF;
- exportar Excel;
- confirmar mensajes de error claros si falla la exportación.

### Roles

- cliente no debe ver ni acceder a admin;
- admin no debe quedar navegando por encuesta/inicio si la regla actual lo redirige;
- no autenticado debe ver acceso restringido o login.

### Observabilidad

- verificar que `NEXT_PUBLIC_CLARITY_PROJECT_ID` cargue el script en beta y producción;
- verificar que el workflow de Lighthouse deje reporte en Actions.

## 4. Lectura de la consigna y criterio de cierre

Según la consigna:

- se exige versionado por publicación;
- cada versión debe indicar qué funcionalidad incorpora;
- se exige análisis estático;
- se exige estadística de uso;
- se exigen pruebas end-to-end;
- se exige informe técnico final.

Con el estado actual:

- **versionado**: encaminado, falta ordenar publicación final;
- **análisis estático**: cubierto con ESLint y evidencia;
- **estadísticas de uso**: cubierto/preparado con Clarity;
- **E2E**: cubierto con Playwright;
- **documentación técnica**: ya muy avanzada, faltaría consolidarla.

## 5. Estrategia recomendada de publicación

La lógica más prolija sería:

### Etapa 1: cerrar `qa`

En `qa` deberían quedar integrados y verificados todos los cambios técnicos finales:

- disposición a pagar en dashboard/exportes;
- persistencia local del borrador;
- matriz de errores;
- pantallas de error;
- Lighthouse CI;
- Clarity preparado;
- ajustes finales de tests y CI.

### Etapa 2: pasar una versión intermedia a `beta`

`beta` debería recibir una versión **funcionalmente sólida pero previa** a la publicación final.

Conviene que en `beta` quede una publicación con mejoras visibles, por ejemplo:

- dashboard con mejoras principales;
- exportaciones enriquecidas;
- mejores mensajes de error;
- tests y CI consolidados.

### Etapa 3: dejar `main` como versión final más completa

`main` debería quedar como la versión más actualizada, incorporando claramente respecto de `beta`:

- persistencia local del borrador en encuesta;
- integración final de observabilidad con Clarity;
- auditoría de Lighthouse CI;
- consolidación final de la matriz de errores y robustez de frontend.

## 6. Diferencia funcional sugerida entre Beta y Producción

Para que la diferencia entre versiones sea **clara y defendible**:

### Beta

Versión de validación funcional intermedia, con:

- encuesta completa operativa;
- dashboard admin operativo;
- exportaciones funcionales;
- mejoras base de responsive y testing.

### Producción (main)

Versión más completa y actualizada, con:

- análisis de disposición a pagar;
- exportaciones enriquecidas con precio;
- persistencia local del borrador de encuesta;
- matriz de errores mejor resuelta;
- integración de Clarity;
- Lighthouse CI incorporado en pipeline;
- robustez final de experiencia de usuario.

## 7. Plan propuesto de commits

### Commit 1: funcionalidad de precio y exportes

Mensaje sugerido:

```text
feat: agregar analisis de disposicion a pagar en dashboard y exportes
```

Incluye:

- `frontend/src/components/admin/PriceInsights.tsx`
- `frontend/src/components/admin/admin-dashboard.types.ts`
- `frontend/src/lib/dashboard/build-admin-dashboard-view-model.ts`
- `frontend/src/lib/reports/excel.report.exporter.ts`
- `frontend/src/lib/reports/pdf.report.exporter.ts`
- `backend/python/excel_builder.py`
- tests de dashboard relacionados

### Commit 2: errores, resiliencia y borrador local

Mensaje sugerido:

```text
feat: mejorar manejo de errores y persistencia local del borrador
```

Incluye:

- `frontend/src/lib/api.ts`
- `frontend/src/hooks/useSurveyStats.ts`
- `frontend/src/hooks/useSurveyResumen.ts`
- `frontend/src/app/encuesta/page.tsx`
- `frontend/src/app/error.tsx`
- `frontend/src/app/global-error.tsx`
- `docs/matriz-errores-nutrilen.md`

### Commit 3: observabilidad, lighthouse y CI frontend

Mensaje sugerido:

```text
ci: integrar lighthouse y preparar claridad en frontend
```

Incluye:

- `.github/workflows/ci-frontend.yml`
- `frontend/lighthouserc.json`
- `frontend/src/app/layout.tsx`
- `frontend/.env.example`
- `docs/testing.md`

### Commit 4: cobertura backend y ajuste de tests/documentación

Mensaje sugerido:

```text
test: reforzar cobertura backend y actualizar documentacion tecnica
```

Incluye:

- `backend/vitest.config.ts`
- `backend/test/setup.ts`
- `backend/test/unit/*.spec.js`
- documentación de cierre y resumen

## 8. Plan de ramas sugerido

### Paso 1

Cerrar y commitear todo en `qa`.

### Paso 2

Pasar a `beta` los commits que representen la versión intermedia:

- Commit 1
- Commit 2
- opcionalmente parte del Commit 3 si ya querés CI/observabilidad ahí

### Paso 3

Pasar a `main` la versión final más completa:

- todo lo de `beta`
- más los últimos cambios finales de observabilidad / cierre / robustez

## 9. Recomendación final

Sí: después de publicar correctamente en `beta` y `main`, lo más lógico es pasar a una fase de:

- testeo manual final completo;
- recolección de evidencias;
- documentación técnica y funcional final;
- armado del informe PDF.

En otras palabras:

- **ya no parece faltar un bloque grande de desarrollo**
- lo que sigue es **ordenar publicación, validar en despliegue y documentar**
