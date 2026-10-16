-- Demo preview user — must exist before the owner-scoped rows below FK auth.users(id).
-- password: rapidnative-demo (editor preview only — real GoTrue cannot verify this hash)
insert into auth.users (id, email, encrypted_password, email_confirmed_at)
values ('00000000-0000-0000-0000-000000000001', 'demo@rapidnative.com', 'pbkdf2$100000$52617069644e61746976652044656d6f$ebd41bf86ab4f47040854a1e4968e2fdc414e15db6a4397f3271e1b1d56b2061', now())
on conflict (id) do update
  set email = excluded.email,
      encrypted_password = excluded.encrypted_password,
      email_confirmed_at = excluded.email_confirmed_at;

-- Categories for the demo student user
insert into categories (id, user_id, name, color, emoji) values
  ('cat-food', '00000000-0000-0000-0000-000000000001', 'Food', '#FF5DA2', '🍜'),
  ('cat-entertainment', '00000000-0000-0000-0000-000000000001', 'Entertainment', '#FFC53D', '🎮'),
  ('cat-books', '00000000-0000-0000-0000-000000000001', 'Books', '#4EA8FF', '📚'),
  ('cat-transport', '00000000-0000-0000-0000-000000000001', 'Transport', '#59D07C', '🚌'),
  ('cat-income', '00000000-0000-0000-0000-000000000001', 'Allowance', '#9B8CFF', '💸');

-- Monthly budgets keyed to categories (IDR)
insert into budgets (id, user_id, category_id, name, monthly_limit) values
  ('budget-food', '00000000-0000-0000-0000-000000000001', 'cat-food', 'Food', 1500000),
  ('budget-entertainment', '00000000-0000-0000-0000-000000000001', 'cat-entertainment', 'Entertainment', 500000),
  ('budget-books', '00000000-0000-0000-0000-000000000001', 'cat-books', 'Books', 800000),
  ('budget-transport', '00000000-0000-0000-0000-000000000001', 'cat-transport', 'Transport', 400000);

-- Savings goal for the demo student user (one row per user, keyed by auth id)
insert into savings_goals (id, monthly_goal, monthly_income) values
  ('00000000-0000-0000-0000-000000000001', 500000, 3000000);

-- Recent transactions (IDR amounts)
insert into transactions (id, user_id, category_id, amount, description, type, spent_at) values
  ('txn-1', '00000000-0000-0000-0000-000000000001', 'cat-income', 3000000, 'Allowance & part-time', 'income', now() - interval '1 day'),
  ('txn-2', '00000000-0000-0000-0000-000000000001', 'cat-food', 45000, 'Ramen with friends', 'expense', now() - interval '1 day'),
  ('txn-3', '00000000-0000-0000-0000-000000000001', 'cat-books', 120000, 'Textbook (used)', 'expense', now() - interval '2 days'),
  ('txn-4', '00000000-0000-0000-0000-000000000001', 'cat-entertainment', 55000, 'Movie night', 'expense', now() - interval '3 days'),
  ('txn-5', '00000000-0000-0000-0000-000000000001', 'cat-transport', 30000, 'Bus pass top-up', 'expense', now() - interval '4 days');
