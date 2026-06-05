-- =============================================================
-- RLS PATCH — Ejecutar en Supabase SQL Editor
-- Contexto: matches y teams son datos públicos (el fixture del
-- Mundial) que cualquiera debe poder leer. Sin esta policy,
-- la anon key ve 0 filas aunque la tabla tenga datos.
-- =============================================================

-- Habilitar RLS (seguro si ya está habilitado — no falla)
alter table if exists matches enable row level security;
alter table if exists teams   enable row level security;

-- Permitir SELECT a cualquiera (anon + authenticated)
-- Si la policy ya existe, el bloque DO la omite sin error.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'matches'
      and policyname = 'matches_select_public'
  ) then
    execute 'create policy "matches_select_public" on matches for select using (true)';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'teams'
      and policyname = 'teams_select_public'
  ) then
    execute 'create policy "teams_select_public" on teams for select using (true)';
  end if;
end;
$$;

-- Verificar que quedó bien:
select schemaname, tablename, policyname, cmd, qual
from   pg_policies
where  tablename in ('matches', 'teams')
order  by tablename, policyname;
