-- Daily spending limit, set from the Beranda budget panel.
-- monthly_income = uang jajan bulan ini; daily_limit = jajan harian.
alter table savings_goals
  add column if not exists daily_limit numeric(12,2) not null default 0;
