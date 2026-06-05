create table if not exists special_results (
  group_id uuid references groups(id) on delete cascade primary key,
  champion text,
  golden_ball text,
  golden_boot text,
  golden_glove text,
  updated_at timestamptz default now()
);
alter table special_results enable row level security;
create policy "special_results_select" on special_results
  for select using (true);
create policy "special_results_insert" on special_results
  for insert with check (
    auth.uid() = (select owner_id from groups where id = group_id)
  );
create policy "special_results_update" on special_results
  for update using (
    auth.uid() = (select owner_id from groups where id = group_id)
  );
