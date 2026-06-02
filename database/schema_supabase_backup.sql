create extension if not exists pgcrypto;

create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre character varying not null,
  email character varying not null,
  rol character varying not null default 'usuario',
  fecha_registro timestamp with time zone not null default now(),
  activo boolean default true,

  constraint usuarios_email_key unique (email),
  constraint usuarios_rol_check
    check (
      (rol)::text = any (
        (
          array[
            'admin'::character varying,
            'usuario'::character varying,
            'encuestador'::character varying
          ]
        )::text[]
      )
    )
);

create table public.encuestas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid null,
  fecha timestamp with time zone default now(),
  sexo character varying,
  dieta character varying,
  descriptive_comments text,
  affective_comments text,
  color integer,
  aroma integer,
  firmeza integer,
  untuosidad integer,
  sabor_tostado integer,
  persistencia integer,
  aceptacion integer,
  liked character varying,
  consume_again character varying,
  recommend integer,

  constraint encuestas_usuario_id_fkey
    foreign key (usuario_id)
    references public.usuarios(id)
    on delete set null,

  constraint encuestas_aceptacion_check
    check ((aceptacion >= 1) and (aceptacion <= 5)),

  constraint encuestas_aroma_check
    check ((aroma >= 1) and (aroma <= 5)),

  constraint encuestas_color_check
    check ((color >= 1) and (color <= 5)),

  constraint encuestas_comentarios_afectivos_check
    check (char_length(affective_comments) <= 500),

  constraint encuestas_comentarios_descriptivos_check
    check (char_length(descriptive_comments) <= 500),

  constraint encuestas_consume_again_check
    check (
      (consume_again)::text = any (
        (
          array[
            'si'::character varying,
            'no'::character varying,
            'tal_vez'::character varying
          ]
        )::text[]
      )
    ),

  constraint encuestas_dieta_check
    check (
      (dieta)::text = any (
        (
          array[
            'omnivoro'::character varying,
            'ovo_lacto'::character varying,
            'vegano'::character varying,
            'flexitariano'::character varying,
            'otro'::character varying
          ]
        )::text[]
      )
    ),

  constraint encuestas_firmeza_check
    check ((firmeza >= 1) and (firmeza <= 5)),

  constraint encuestas_liked_check
    check (
      (liked)::text = any (
        (
          array[
            'si'::character varying,
            'no'::character varying
          ]
        )::text[]
      )
    ),

  constraint encuestas_persistencia_check
    check ((persistencia >= 1) and (persistencia <= 5)),

  constraint encuestas_recommend_check
    check ((recommend >= 1) and (recommend <= 5)),

  constraint encuestas_sabor_tostado_check
    check ((sabor_tostado >= 1) and (sabor_tostado <= 5)),

  constraint encuestas_sexo_check
    check (
      (sexo)::text = any (
        (
          array[
            'femenino'::character varying,
            'masculino'::character varying,
            'otro'::character varying
          ]
        )::text[]
      )
    ),

  constraint encuestas_untuosidad_check
    check ((untuosidad >= 1) and (untuosidad <= 5))
);

create unique index idx_usuarios_email_unique
  on public.usuarios using btree (email);

create index idx_usuarios_rol
  on public.usuarios using btree (rol);

create index idx_encuestas_dieta
  on public.encuestas using btree (dieta);

create index idx_encuestas_fecha
  on public.encuestas using btree (fecha desc);

create index idx_encuestas_sexo
  on public.encuestas using btree (sexo);