create table if not exists savings_goals (
  id uuid primary key references auth.users(id) on delete cascade,
  monthly_goal numeric(12,2) not null default 0,
  monthly_income numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table savings_goals enable row level security;

drop policy if exists savings_goals_select on savings_goals;
create policy savings_goals_select on savings_goals for select using (auth.uid() = id);
drop policy if exists savings_goals_insert on savings_goals;
create policy savings_goals_insert on savings_goals for insert with check (auth.uid() = id);
drop policy if exists savings_goals_update on savings_goals;
create policy savings_goals_update on savings_goals for update using (auth.uid() = id);
drop policy if exists savings_goals_delete on savings_goals;
create policy savings_goals_delete on savings_goals for delete using (auth.uid() = id);