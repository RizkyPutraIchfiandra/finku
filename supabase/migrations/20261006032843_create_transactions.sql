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