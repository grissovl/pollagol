-- =============================================================
-- POLLAGOL - Schema completo de base de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Orden: 1° este archivo, luego seed.sql
-- =============================================================

-- 1. PROFILES (extiende auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. TEAMS (equipos del Mundial 2026)
create table teams (
  id serial primary key,
  name text not null,
  flag_emoji text,
  group_name text -- 'A','B',...,'L' para fase de grupos, null para TBD
);

-- 3. MATCHES (fixture completo)
create table matches (
  id serial primary key,
  phase text not null, -- 'group','r32','r16','r8','r4','r2','final'
  group_name text,
  home_team_id integer references teams(id),
  away_team_id integer references teams(id),
  scheduled_at timestamptz not null,
  home_score integer, -- null hasta que termine
  away_score integer,
  status text default 'scheduled' -- 'scheduled','finished'
);

-- 4. GROUPS (pollas)
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  code text unique not null,
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 5. GROUP_RULES
create table group_rules (
  group_id uuid references groups(id) on delete cascade primary key,
  pts_exact integer default 5,
  pts_winner integer default 3,
  pts_goal integer default 1,
  pts_unique integer default 5,
  pts_r32_bonus integer default 10,
  pts_r16_bonus integer default 8,
  pts_r8_bonus integer default 4,
  pts_r4_bonus integer default 2,
  pts_final_bonus integer default 5,
  bet_amount integer default 0,
  prize_pct_1st integer default 70,
  prize_pct_2nd integer default 20,
  prize_pct_3rd integer default 10
);

-- 6. GROUP_MEMBERSHIPS
create table group_memberships (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  subscription_number integer default 1,
  status text default 'pending', -- 'pending','accepted','rejected'
  paid boolean default false,
  created_at timestamptz default now(),
  unique(group_id, user_id, subscription_number)
);

-- 7. GROUP_MATCHES (partidos habilitados por grupo)
create table group_matches (
  group_id uuid references groups(id) on delete cascade,
  match_id integer references matches(id) on delete cascade,
  primary key (group_id, match_id)
);

-- 8. PREDICTIONS
create table predictions (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  match_id integer references matches(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  home_score_pred integer,
  away_score_pred integer,
  locked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(group_id, match_id, user_id)
);

-- 9. PREDICTION_SCORES
create table prediction_scores (
  prediction_id uuid references predictions(id) on delete cascade primary key,
  pts_exact integer default 0,
  pts_winner integer default 0,
  pts_goal integer default 0,
  pts_unique integer default 0,
  pts_bonus integer default 0,
  total integer default 0,
  calculated_at timestamptz default now()
);

-- =============================================================
-- RLS POLICIES
-- =============================================================

-- Datos públicos (fixture y equipos): RLS habilitado con SELECT abierto a todos.
-- Sin este bloque, la anon key ve 0 filas aunque la tabla tenga datos.
alter table teams   enable row level security;
alter table matches enable row level security;
create policy "teams_select_public"   on teams   for select using (true);
create policy "matches_select_public" on matches for select using (true);

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_rules enable row level security;
alter table group_memberships enable row level security;
alter table group_matches enable row level security;
alter table predictions enable row level security;
alter table prediction_scores enable row level security;

-- Profiles: cada uno ve y edita el suyo
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Groups: cualquier autenticado puede ver, solo dueño modifica
create policy "groups_select" on groups for select using (true);
create policy "groups_insert" on groups for insert with check (auth.uid() = owner_id);
create policy "groups_update" on groups for update using (auth.uid() = owner_id);
create policy "groups_delete" on groups for delete using (auth.uid() = owner_id);

-- Group rules: miembros aceptados ven, dueño modifica
create policy "rules_select" on group_rules for select using (true);
create policy "rules_insert" on group_rules for insert with check (
  auth.uid() = (select owner_id from groups where id = group_id)
);
create policy "rules_update" on group_rules for update using (
  auth.uid() = (select owner_id from groups where id = group_id)
);

-- Memberships
create policy "memberships_select" on group_memberships for select using (true);
create policy "memberships_insert" on group_memberships for insert with check (auth.uid() = user_id);
create policy "memberships_update" on group_memberships for update using (
  auth.uid() = user_id or
  auth.uid() = (select owner_id from groups where id = group_id)
);
create policy "memberships_delete" on group_memberships for delete using (
  auth.uid() = (select owner_id from groups where id = group_id)
);

-- Group matches
create policy "group_matches_select" on group_matches for select using (true);
create policy "group_matches_insert" on group_matches for insert with check (
  auth.uid() = (select owner_id from groups where id = group_id)
);
create policy "group_matches_delete" on group_matches for delete using (
  auth.uid() = (select owner_id from groups where id = group_id)
);

-- Predictions: cada uno escribe las suyas, lee las ajenas solo si el partido ya empezó
create policy "predictions_select" on predictions for select using (
  auth.uid() = user_id or
  exists (
    select 1 from matches m
    where m.id = match_id and m.scheduled_at <= now()
  )
);
create policy "predictions_insert" on predictions for insert with check (
  auth.uid() = user_id and
  not locked and
  exists (
    select 1 from matches m
    where m.id = match_id
    and m.scheduled_at > now() + interval '15 minutes'
  )
);
create policy "predictions_update" on predictions for update using (
  auth.uid() = user_id and
  not locked and
  exists (
    select 1 from matches m
    where m.id = match_id
    and m.scheduled_at > now() + interval '15 minutes'
  )
);

-- Prediction scores: todos pueden leer
create policy "scores_select" on prediction_scores for select using (true);

-- =============================================================
-- TRIGGERS
-- =============================================================

-- Auto-crear profile al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-lock predictions 15 min antes del partido
create or replace function lock_predictions_for_match(match_id_param integer)
returns void as $$
begin
  update predictions set locked = true
  where match_id = match_id_param;
end;
$$ language plpgsql security definer;
