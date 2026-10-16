-- Debt is per-transaction, not per-category: the same category can have some
-- entries that are debts and some that aren't.
alter table transactions
  add column if not exists is_debt boolean not null default false;

-- The category-level flag is superseded by the per-transaction one.
alter table categories
  drop column if exists is_debt;
