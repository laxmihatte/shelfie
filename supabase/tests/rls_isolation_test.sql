-- RLS isolation test.
--
-- Proves that a signed-in user cannot read, update, or delete another user's
-- rows. Runs entirely inside a transaction that rolls back, so it leaves no
-- users or data behind. Paste into the Supabase SQL Editor and run.
--
-- Every assertion raises an exception on failure, so a clean run ending in
-- "all RLS isolation checks passed" is the pass condition.

begin;

do $$
declare
  user_a uuid := '00000000-0000-4000-8000-00000000000a';
  user_b uuid := '00000000-0000-4000-8000-00000000000b';
  visible int;
  affected int;
begin
  -- Two users. The on_auth_user_created trigger creates their profiles.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values
    (user_a, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'a@rls.test', '', now(), now(), now()),
    (user_b, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'b@rls.test', '', now(), now(), now());

  -- One pantry item each.
  insert into public.food_items (user_id, name, expires_at)
  values (user_a, 'A milk', current_date + 7),
         (user_b, 'B eggs', current_date + 14);

  -- ---------------------------------------------------------------------
  -- Act as user A.
  -- ---------------------------------------------------------------------
  set local role authenticated;
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_a, 'role', 'authenticated')::text,
                     true);

  select count(*) into visible from public.food_items;
  if visible <> 1 then
    raise exception 'A should see exactly 1 item, saw %', visible;
  end if;

  select count(*) into visible from public.food_items where name = 'B eggs';
  if visible <> 0 then
    raise exception 'A can read B''s item — RLS select policy is not isolating';
  end if;

  -- A must not be able to modify B's row.
  update public.food_items set name = 'hijacked' where name = 'B eggs';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'A updated % of B''s rows — RLS update policy failed', affected;
  end if;

  delete from public.food_items where name = 'B eggs';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'A deleted % of B''s rows — RLS delete policy failed', affected;
  end if;

  -- A must not be able to create rows owned by B.
  begin
    insert into public.food_items (user_id, name, expires_at)
    values (user_b, 'forged', current_date + 3);
    raise exception 'A inserted a row owned by B — with-check policy failed';
  exception
    when insufficient_privilege then null;  -- expected
  end;

  -- Profiles are equally isolated.
  select count(*) into visible from public.profiles;
  if visible <> 1 then
    raise exception 'A should see exactly 1 profile, saw %', visible;
  end if;

  -- ---------------------------------------------------------------------
  -- Act as user B: the mirror image.
  -- ---------------------------------------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_b, 'role', 'authenticated')::text,
                     true);

  select count(*) into visible from public.food_items;
  if visible <> 1 then
    raise exception 'B should see exactly 1 item, saw %', visible;
  end if;

  select count(*) into visible from public.food_items where name = 'A milk';
  if visible <> 0 then
    raise exception 'B can read A''s item — RLS is not isolating';
  end if;

  -- ---------------------------------------------------------------------
  -- Anonymous users see nothing at all.
  -- ---------------------------------------------------------------------
  set local role anon;
  perform set_config('request.jwt.claims', null, true);

  select count(*) into visible from public.food_items;
  if visible <> 0 then
    raise exception 'anon can read % food items', visible;
  end if;

  reset role;
  raise notice 'all RLS isolation checks passed';
end $$;

rollback;
