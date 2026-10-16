create table if not exists budgets (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id text references categories(id) on delete cascade,
  name text not null,
  monthly_limit numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists budgets_user_id_idx on budgets(user_id);
create index if not exists budgets_category_id_idx on budgets(category_id);

alter table budgets enable row level security;

drop policy if exists budgets_select on budgets;
create policy budgets_select on budgets for select using (auth.uid() = user_id);
drop policy if exists budgets_insert on budgets;
create policy budgets_insert on budgets for insert with check (auth.uid() = user_id);
drop policy if exists budgets_update on budgets;
create policy budgets_update on budgets for update using (auth.uid() = user_id);
drop policy if exists budgets_delete on budgets;
create policy budgets_delete on budgets for delete using (auth.uid() = user_id);