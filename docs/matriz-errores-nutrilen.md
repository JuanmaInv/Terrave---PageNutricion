# Matriz de Errores NutriLen

## Objetivo

Dejar definido qué mensaje debe ver el usuario según el tipo de error, sin exponer detalles técnicos ni romper la experiencia.

## Principios

- El usuario debe recibir un mensaje claro y accionable.
- El frontend no debe romper la pantalla por errores recuperables.
- El backend debe responder con errores controlados y mantener logs útiles para el equipo.
- Los errores técnicos detallados quedan en logs, no en la UI.

## Errores de encuesta

### Conexión perdida durante autosave

- Origen: frontend / red / backend no alcanzable
- Mensaje:
  - `No se pudo guardar tu progreso. Se perdio la conexion con el servidor. Verifica tu internet e intenta nuevamente.`
- Comportamiento esperado:
  - la encuesta sigue visible
  - el usuario puede continuar completando
  - el borrador queda en `localStorage`
  - al volver a entrar a `/encuesta`, se restaura el borrador

### Conexión perdida al enviar encuesta

- Origen: frontend / red / backend no alcanzable
- Mensaje:
  - `No se pudo enviar la encuesta. Se perdio la conexion con el servidor. Verifica tu internet e intenta nuevamente.`
- Comportamiento esperado:
  - no se marca como enviada
  - el formulario no se borra
  - el usuario puede reintentar
  - el borrador local permanece

### Datos incompletos o inválidos

- Origen: validación frontend o backend `400`
- Mensajes esperados:
  - `Faltan datos generales.`
  - `La solicitud contiene datos invalidos. Revisa los campos e intenta nuevamente.`
- Comportamiento esperado:
  - enfocar al usuario en el paso correspondiente
  - no perder datos ya cargados

## Errores de dashboard admin

### Token faltante o sesión inválida

- Origen: autenticación / permisos
- Mensaje:
  - `Tu sesion no es valida o no tienes permisos para realizar esta accion.`
- Comportamiento esperado:
  - no mostrar datos sensibles
  - invitar a volver a iniciar sesión

### Error al cargar estadísticas

- Origen: backend / red / filtros
- Mensaje:
  - `No se pudieron obtener estadisticas del backend.`
  - o el mensaje normalizado de conexión / servidor
- Comportamiento esperado:
  - mantener la página viva
  - mostrar toast de error
  - permitir reintento manual con `Actualizar`

### Error al cargar resumen

- Origen: backend / red
- Mensaje:
  - `No se pudo cargar el resumen del dashboard.`
  - o el mensaje normalizado correspondiente

## Errores de exportación

### Exportación PDF fallida

- Origen: frontend o backend
- Mensaje:
  - `No se pudo exportar el PDF.`
- Comportamiento esperado:
  - mantener la pantalla estable
  - permitir reintentar

### Exportación Excel fallida

- Origen: backend / exportador Python / red
- Mensaje:
  - `No se pudo exportar el archivo Excel.`
  - o mensaje normalizado de conexión / servidor
- Comportamiento esperado:
  - si hay fallback local habilitado, usarlo
  - si no, mostrar toast claro

## Errores de backend

### Backend no configurado

- Origen: entorno local / variable faltante
- Mensaje:
  - `El backend no esta configurado para esta accion.`

### Servicio temporalmente no disponible

- Origen: `503`
- Mensaje:
  - `El servicio esta temporalmente no disponible. Intenta nuevamente en unos minutos.`

### Timeout / gateway

- Origen: `408`, `502`, `504`
- Mensajes:
  - `La solicitud tardo demasiado. Intenta nuevamente.`
  - `No se pudo completar la conexion con el servidor. Intenta nuevamente en unos minutos.`

### Sobrecarga

- Origen: `429`
- Mensaje:
  - `Hay demasiadas solicitudes en este momento. Espera unos segundos e intenta nuevamente.`

## Estrategia de persistencia si se pierde internet

### Estado actual esperado

- progreso visual en pantalla: se conserva
- progreso local: se guarda en `localStorage`
- progreso remoto en `encuesta_sesiones`: puede fallar si no hay conexión

### Qué hace el usuario

- si vuelve la conexión sin cerrar la página:
  - puede seguir y enviar
- si cerró o recargó:
  - vuelve a `/encuesta`
  - el borrador local se restaura
  - completa o revisa y luego envía manualmente

## Observaciones para testing

Estos escenarios deberían cubrirse con:

- unit tests de normalización de errores
- tests de validación de encuesta
- E2E de flujo encuestado
- verificación manual con backend apagado y restauración de borrador
