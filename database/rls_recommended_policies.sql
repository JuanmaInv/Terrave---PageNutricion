-- Recommended hardening for Supabase public tables used by NutriLen.
-- This keeps browser roles away from raw table access while preserving
-- server-side access through the backend connection.

revoke all on table public.usuarios from anon, authenticated;
revoke all on table public.encuestas from anon, authenticated;
revoke all on table public.encuesta_sesiones from anon, authenticated;

alter table public.usuarios enable row level security;
alter table public.encuestas enable row level security;
alter table public.encuesta_sesiones enable row level security;

-- No browser-facing policies are created on purpose.
-- The intended data path is:
-- browser -> backend API -> PostgreSQL
--
-- If in the future a Supabase client needs direct reads for a limited use case,
-- add explicit least-privilege policies for that case only.
