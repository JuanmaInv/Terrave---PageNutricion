-- ===========================================================================
-- ESQUEMA DE BASE DE DATOS - NUTRILEN
-- ===========================================================================

-- 1. Tabla de Usuarios (Administración de Roles)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'user',
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Semilla para Administrador Principal (juanma.capito@gmail.com)
INSERT INTO public.usuarios (email, rol, activo, nombre)
SELECT v.email, v.rol, v.activo, v.nombre
FROM (VALUES
    ('juanma.capito@gmail.com', 'admin', true, 'Juanma')
) AS v(email, rol, activo, nombre)
WHERE NOT EXISTS (
    SELECT 1 FROM public.usuarios u WHERE lower(u.email) = lower(v.email)
);

-- Asegurar que el rol sea 'admin' y esté activo
UPDATE public.usuarios
SET rol = 'admin', activo = true
WHERE lower(email) IN (
    'juanma.capito@gmail.com'
);


-- 2. Tabla de Encuestas Sensoriales (Resultados de las Evaluaciones)
CREATE TABLE IF NOT EXISTS public.encuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    
    -- Comentarios abiertos (Soporta nombres de columnas modernos y legacy en NestJS)
    descriptive_comments TEXT,                     -- (o comentarios_descriptivos)
    affective_comments TEXT                        -- (o comentarios_afectivos)
);

-- Índices recomendados para optimización de reportes del Administrador
CREATE INDEX IF NOT EXISTS idx_encuestas_fecha ON public.encuestas(fecha);
CREATE INDEX IF NOT EXISTS idx_encuestas_sexo ON public.encuestas(sexo);
CREATE INDEX IF NOT EXISTS idx_encuestas_dieta ON public.encuestas(dieta);
