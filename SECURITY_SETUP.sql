-- ============================================================
--  SECURE SETUP — run once in Supabase SQL Editor
--  (Replaces the open test rules from earlier.)
-- ============================================================

-- 1. Remove the old open policies from testing
drop policy if exists "anyone can sign up" on students;
drop policy if exists "anyone can read"   on students;
drop policy if exists "anyone can update" on students;
drop policy if exists "anyone can delete" on students;

alter table students enable row level security;

-- 2. Admin (any logged-in auth user) can do everything.
--    The public (anon) gets NO direct table access at all.
create policy "admin full access"
  on students for all
  to authenticated
  using (true) with check (true);

-- 3. Secure signup — runs with elevated rights, exposes nothing.
create or replace function student_signup(p_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into students (name, phone, status) values (p_name, p_phone, 'pending');
end;
$$;

-- 4. Secure login — checks status + binds/verifies device.
--    Returns only this one student's row status, nothing else.
create or replace function student_login(p_phone text, p_device text)
returns table (result text, name text, phone text)
language plpgsql
security definer
set search_path = public
as $$
declare s students%rowtype;
begin
  select * into s from students where phone = p_phone;
  if not found then return; end if;
  if s.status = 'pending' then
    return query select 'pending'::text, s.name, s.phone; return;
  end if;
  if s.device_id is null then
    update students set device_id = p_device where id = s.id;
    return query select 'ok'::text, s.name, s.phone; return;
  end if;
  if s.device_id <> p_device then
    return query select 'wrong_device'::text, s.name, s.phone; return;
  end if;
  return query select 'ok'::text, s.name, s.phone;
end;
$$;

-- 5. Let the public call ONLY these two functions (nothing else).
grant execute on function student_signup(text, text) to anon;
grant execute on function student_login(text, text)  to anon;
