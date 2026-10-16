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