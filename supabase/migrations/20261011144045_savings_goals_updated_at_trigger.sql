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