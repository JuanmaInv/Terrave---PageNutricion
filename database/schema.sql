-- ===========================================================================
-- ESQUEMA DE BASE DE DATOS - TERRAVE
-- ===========================================================================

-- 1. Tabla de Usuarios (Administración de Roles)
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
-- El alta de usuarios con rol 'admin' debe hacerse por migración de entorno
-- o flujo administrativo autenticado.


-- 2. Tabla de Encuestas Sensoriales (Resultados de las Evaluaciones)
-- Nota: usuario_id es nullable — las encuestas son anónimas por diseño.
--       La columna existe para uso futuro si se requiere trazabilidad opcional.
CREATE TABLE IF NOT EXISTS public.encuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sexo VARCHAR(50) NOT NULL,
    dieta VARCHAR(50) NOT NULL,
    
    -- Atributos sensoriales (Escala del 1 al 5)
    color INTEGER NOT NULL CHECK (color >= 1 AND color <= 5),
    aroma INTEGER NOT NULL CHECK (aroma >= 1 AND aroma <= 5),
    firmeza INTEGER NOT NULL CHECK (firmeza >= 1 AND firmeza <= 5),
    untuosidad INTEGER NOT NULL CHECK (untuosidad >= 1 AND untuosidad <= 5),
    sabor_tostado INTEGER NOT NULL CHECK (sabor_tostado >= 1 AND sabor_tostado <= 5),
    persistencia INTEGER NOT NULL CHECK (persistencia >= 1 AND persistencia <= 5),
    
    -- Métricas generales
    aceptacion INTEGER NOT NULL CHECK (aceptacion >= 1 AND aceptacion <= 5),
    liked VARCHAR(10) NOT NULL,                    -- 'si' | 'no'
    consume_again VARCHAR(10) NOT NULL,            -- 'si' | 'no' | 'tal_vez'
    recommend INTEGER NOT NULL CHECK (recommend >= 1 AND recommend <= 5),
    
    -- Comentarios abiertos
    descriptive_comments TEXT,
    affective_comments TEXT
);

-- Índices recomendados para optimización de reportes del Administrador
CREATE INDEX IF NOT EXISTS idx_encuestas_fecha ON public.encuestas(fecha);
CREATE INDEX IF NOT EXISTS idx_encuestas_sexo ON public.encuestas(sexo);
CREATE INDEX IF NOT EXISTS idx_encuestas_dieta ON public.encuestas(dieta);
CREATE INDEX IF NOT EXISTS idx_encuestas_usuario ON public.encuestas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email_lower ON public.usuarios((lower(email)));
