-- ===========================================================================
-- ESQUEMA DE BASE DE DATOS - TERRAVE
-- ===========================================================================

-- 1. Tabla de Usuarios (Administracion de Roles)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente')),
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Nota de seguridad:
-- No se insertan administradores hardcodeados en el esquema base.
-- El alta de usuarios con rol 'admin' debe hacerse por migracion de entorno
-- o flujo administrativo autenticado.
-- El perfil 'super_admin' no se persiste como rol de tabla: se deriva por
-- correo autorizado en backend para la rama main.

-- 2. Tabla de Encuestas Sensoriales (Resultados de las Evaluaciones)
-- Nota: usuario_id es nullable; las encuestas son anonimas por diseno.
-- La columna existe para uso futuro si se requiere trazabilidad opcional.
CREATE TABLE IF NOT EXISTS public.encuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sexo VARCHAR(50) NOT NULL,
    dieta VARCHAR(50) NOT NULL,

    -- Atributos sensoriales (escala del 1 al 5)
    color INTEGER NOT NULL CHECK (color >= 1 AND color <= 5),
    aroma INTEGER NOT NULL CHECK (aroma >= 1 AND aroma <= 5),
    firmeza INTEGER NOT NULL CHECK (firmeza >= 1 AND firmeza <= 5),
    untuosidad INTEGER NOT NULL CHECK (untuosidad >= 1 AND untuosidad <= 5),
    sabor_tostado INTEGER NOT NULL CHECK (sabor_tostado >= 1 AND sabor_tostado <= 5),
    persistencia INTEGER NOT NULL CHECK (persistencia >= 1 AND persistencia <= 5),

    -- Metricas generales
    aceptacion INTEGER NOT NULL CHECK (aceptacion >= 1 AND aceptacion <= 5),
    liked VARCHAR(10) NOT NULL,
    consume_again VARCHAR(10) NOT NULL,
    recommend INTEGER NOT NULL CHECK (recommend >= 1 AND recommend <= 5),

    -- Comentarios abiertos
    descriptive_comments TEXT,
    willingness_to_pay TEXT,
    affective_comments TEXT
);

-- 3. Tabla de Sesiones de Encuesta (borradores / encuestas en curso)
CREATE TABLE IF NOT EXISTS public.encuesta_sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_session_key VARCHAR(255) NOT NULL UNIQUE,
    encuesta_id UUID UNIQUE REFERENCES public.encuestas(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'completada', 'abandonada')),
    paso_actual INTEGER NOT NULL DEFAULT 1 CHECK (paso_actual >= 1 AND paso_actual <= 3),
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    sexo VARCHAR(50),
    dieta VARCHAR(50),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indices recomendados para optimizacion de reportes del Administrador
CREATE INDEX IF NOT EXISTS idx_encuestas_fecha ON public.encuestas(fecha);
CREATE INDEX IF NOT EXISTS idx_encuestas_sexo ON public.encuestas(sexo);
CREATE INDEX IF NOT EXISTS idx_encuestas_dieta ON public.encuestas(dieta);
CREATE INDEX IF NOT EXISTS idx_encuestas_usuario ON public.encuestas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_encuesta_sesiones_estado ON public.encuesta_sesiones(estado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_encuesta_sesiones_client_session_key ON public.encuesta_sesiones(client_session_key);
CREATE INDEX IF NOT EXISTS idx_encuesta_sesiones_actualizacion ON public.encuesta_sesiones(fecha_actualizacion);
CREATE INDEX IF NOT EXISTS idx_encuesta_sesiones_sexo ON public.encuesta_sesiones(sexo);
CREATE INDEX IF NOT EXISTS idx_encuesta_sesiones_dieta ON public.encuesta_sesiones(dieta);
CREATE INDEX IF NOT EXISTS idx_usuarios_email_lower ON public.usuarios((lower(email)));
