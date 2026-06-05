-- =============================================================
-- special_bets table — run in Supabase SQL Editor
-- Stores per-user bets for the 4 special categories.
-- =============================================================

create table if not exists special_bets (
  id             uuid        default gen_random_uuid() primary key,
  group_id       uuid        references groups(id) on delete cascade not null,
  user_id        uuid        references profiles(id) on delete cascade not null,
  category       text        not null
                             check (category in ('champion','golden_ball','golden_boot','golden_glove')),
  team_or_player text        not null,
  locked         boolean     default false,
  updated_at     timestamptz default now(),
  unique(group_id, user_id, category)
);

alter table special_bets enable row level security;

-- Members of the group (accepted) and the owner can read all bets
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'special_bets' and policyname = 'special_bets_select'
  ) then
    execute $p$
      create policy "special_bets_select" on special_bets
        for select using (
          auth.uid() = user_id
          or exists (
            select 1 from groups g where g.id = group_id and g.owner_id = auth.uid()
          )
          or exists (
            select 1 from group_memberships gm
            where gm.group_id = special_bets.group_id
              and gm.user_id  = auth.uid()
              and gm.status   = 'accepted'
          )
        )
    $p$;
  end if;
end $$;

-- Users can insert their own bets (only when not locked)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'special_bets' and policyname = 'special_bets_insert'
  ) then
    execute $p$
      create policy "special_bets_insert" on special_bets
        for insert with check (auth.uid() = user_id and not locked)
    $p$;
  end if;
end $$;

-- Users can update their own bets (only when not locked)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'special_bets' and policyname = 'special_bets_update'
  ) then
    execute $p$
      create policy "special_bets_update" on special_bets
        for update using (auth.uid() = user_id and not locked)
    $p$;
  end if;
end $$;

-- Verify policies:
select schemaname, tablename, policyname, cmd, qual
from   pg_policies
where  tablename = 'special_bets'
order  by policyname;
