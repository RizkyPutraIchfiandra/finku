-- Flag a category as a debt category. Expenses logged under a debt category
-- accumulate into the "Daftar hutang" list on Beranda.
alter table categories
  add column if not exists is_debt boolean not null default false;
