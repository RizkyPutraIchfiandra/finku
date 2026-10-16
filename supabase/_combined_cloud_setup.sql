-- Finku: schema for Supabase cloud SQL Editor (paste all -> Run)
-- Generated from supabase/migrations/*.sql, in order.
-- After running this, sign up inside the app to create your account.

-- ===== 20261006032809_create_categories.sql =====
create table if not exists categories (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  emoji text not null default '💰',
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on categories(user_id);

alter table categories enable row level security;

drop policy if exists categories_select on categories;
create policy categories_select on categories for select using (auth.uid() = user_id);
drop policy if exists categories_insert on categories;
create policy categories_insert on categories for insert with check (auth.uid() = user_id);
drop policy if exists categories_update on categories;
create policy categories_update on categories for update using (auth.uid() = user_id);
drop policy if exists categories_delete on categories;
create policy categories_delete on categories for delete using (auth.uid() = user_id);

-- ===== 20261006032831_create_budgets.sql =====
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

-- ===== 20261006032843_create_transactions.sql =====
create table if not exists transactions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id text references categories(id) on delete set null,
  amount numeric(12,2) not null,
  description text not null,
  type text not null check (type in ('income', 'expense')),
  spent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on transactions(user_id);
create index if not exists transactions_category_id_idx on transactions(category_id);
create index if not exists transactions_spent_at_idx on transactions(spent_at);

alter table transactions enable row level security;

drop policy if exists transactions_select on transactions;
create policy transactions_select on transactions for select using (auth.uid() = user_id);
drop policy if exists transactions_insert on transactions;
create policy transactions_insert on transactions for insert with check (auth.uid() = user_id);
drop policy if exists transactions_update on transactions;
create policy transactions_update on transactions for update using (auth.uid() = user_id);
drop policy if exists transactions_delete on transactions;
create policy transactions_delete on transactions for delete using (auth.uid() = user_id);

-- ===== 20261011144038_create_savings_goals.sql =====
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

-- ===== 20261011144045_savings_goals_updated_at_trigger.sql =====
create or replace function set_updated_at_savings_goals()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists savings_goals_set_updated_at on savings_goals;
create trigger savings_goals_set_updated_at
  before update on savings_goals
  for each row
  execute function set_updated_at_savings_goals();

-- ===== 20261012120000_add_daily_limit.sql =====
-- Daily spending limit, set from the Beranda budget panel.
-- monthly_income = uang jajan bulan ini; daily_limit = jajan harian.
alter table savings_goals
  add column if not exists daily_limit numeric(12,2) not null default 0;

-- ===== 20261012130000_add_category_debt.sql =====
-- Flag a category as a debt category. Expenses logged under a debt category
-- accumulate into the "Daftar hutang" list on Beranda.
alter table categories
  add column if not exists is_debt boolean not null default false;

-- ===== 20261012140000_transaction_debt.sql =====
-- Debt is per-transaction, not per-category: the same category can have some
-- entries that are debts and some that aren't.
alter table transactions
  add column if not exists is_debt boolean not null default false;

-- The category-level flag is superseded by the per-transaction one.
alter table categories
  drop column if exists is_debt;

