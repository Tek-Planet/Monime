-- 1) Create supplier_payments table
create table if not exists public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  business_id uuid not null,
  supplier_id uuid not null,
  amount numeric not null check (amount >= 0),
  payment_date date not null default current_date,
  payment_method text default 'cash',
  reference_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.supplier_payments enable row level security;

-- RLS policies
create policy "Users can view their own supplier payments"
  on public.supplier_payments for select
  using (auth.uid() = user_id);

create policy "Users can create their own supplier payments"
  on public.supplier_payments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own supplier payments"
  on public.supplier_payments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own supplier payments"
  on public.supplier_payments for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create trigger update_supplier_payments_updated_at
before update on public.supplier_payments
for each row execute function public.update_updated_at_column();

-- 2) Adjust existing expense balance function to only count credit expenses
create or replace function public.adjust_supplier_balance()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if (tg_op = 'INSERT') then
    if new.supplier_id is not null and coalesce(new.payment_method, 'cash') = 'credit' then
      update public.suppliers
      set current_balance = coalesce(current_balance,0) + coalesce(new.amount,0)
      where id = new.supplier_id;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    if old.supplier_id is not null and coalesce(old.payment_method, 'cash') = 'credit' then
      update public.suppliers
      set current_balance = coalesce(current_balance,0) - coalesce(old.amount,0)
      where id = old.supplier_id;
    end if;
    return old;
  elsif (tg_op = 'UPDATE') then
    -- If supplier changed, reverse old (if credit) and apply new (if credit)
    if (old.supplier_id is distinct from new.supplier_id) then
      if old.supplier_id is not null and coalesce(old.payment_method,'cash') = 'credit' then
        update public.suppliers
        set current_balance = coalesce(current_balance,0) - coalesce(old.amount,0)
        where id = old.supplier_id;
      end if;
      if new.supplier_id is not null and coalesce(new.payment_method,'cash') = 'credit' then
        update public.suppliers
        set current_balance = coalesce(current_balance,0) + coalesce(new.amount,0)
        where id = new.supplier_id;
      end if;
    else
      -- Same supplier. Handle payment_method transitions and amount diffs
      if new.supplier_id is not null then
        if coalesce(old.payment_method,'cash') = 'credit' and coalesce(new.payment_method,'cash') = 'credit' then
          update public.suppliers
          set current_balance = coalesce(current_balance,0) + coalesce(new.amount,0) - coalesce(old.amount,0)
          where id = new.supplier_id;
        elsif coalesce(old.payment_method,'cash') = 'credit' and coalesce(new.payment_method,'cash') <> 'credit' then
          -- was credit, now not credit -> remove old amount
          update public.suppliers
          set current_balance = coalesce(current_balance,0) - coalesce(old.amount,0)
          where id = new.supplier_id;
        elsif coalesce(old.payment_method,'cash') <> 'credit' and coalesce(new.payment_method,'cash') = 'credit' then
          -- was not credit, now credit -> add new amount
          update public.suppliers
          set current_balance = coalesce(current_balance,0) + coalesce(new.amount,0)
          where id = new.supplier_id;
        end if;
      end if;
    end if;
    return new;
  end if;
  return null;
end;
$$;

-- 3) Create function + triggers for supplier_payments to decrease balance
create or replace function public.adjust_supplier_balance_from_payments()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if (tg_op = 'INSERT') then
    if new.supplier_id is not null then
      update public.suppliers
      set current_balance = coalesce(current_balance,0) - coalesce(new.amount,0)
      where id = new.supplier_id;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    if old.supplier_id is not null then
      update public.suppliers
      set current_balance = coalesce(current_balance,0) + coalesce(old.amount,0)
      where id = old.supplier_id;
    end if;
    return old;
  elsif (tg_op = 'UPDATE') then
    if (old.supplier_id is distinct from new.supplier_id) then
      if old.supplier_id is not null then
        update public.suppliers
        set current_balance = coalesce(current_balance,0) + coalesce(old.amount,0)
        where id = old.supplier_id;
      end if;
      if new.supplier_id is not null then
        update public.suppliers
        set current_balance = coalesce(current_balance,0) - coalesce(new.amount,0)
        where id = new.supplier_id;
      end if;
    else
      if new.supplier_id is not null then
        update public.suppliers
        set current_balance = coalesce(current_balance,0) - coalesce(new.amount,0) + coalesce(old.amount,0)
        where id = new.supplier_id;
      end if;
    end if;
    return new;
  end if;
  return null;
end;
$$;

-- Triggers on supplier_payments
create trigger supplier_payments_adjust_balance_aiud
after insert or update or delete on public.supplier_payments
for each row execute function public.adjust_supplier_balance_from_payments();

-- 4) Recalculate all current balances now to correct existing data
with expense_credit as (
  select supplier_id, sum(amount) as total_expense
  from public.expenses
  where supplier_id is not null and coalesce(payment_method,'cash') = 'credit'
  group by supplier_id
),
payment_sum as (
  select supplier_id, sum(amount) as total_payment
  from public.supplier_payments
  group by supplier_id
),
agg as (
  select s.id as supplier_id,
         coalesce(ec.total_expense,0) - coalesce(ps.total_payment,0) as new_balance
  from public.suppliers s
  left join expense_credit ec on ec.supplier_id = s.id
  left join payment_sum ps on ps.supplier_id = s.id
)
update public.suppliers s
set current_balance = agg.new_balance
from agg
where agg.supplier_id = s.id;

-- 5) Ensure realtime works for the new table
alter table public.supplier_payments replica identity full;
alter publication supabase_realtime add table public.supplier_payments;