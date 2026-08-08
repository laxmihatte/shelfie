-- Shelfie initial schema.
--
-- Every user-owned table has RLS enabled with policies keyed on auth.uid().
-- Isolation is enforced by Postgres, not by remembering to add a
-- `.eq('user_id', ...)` filter to each query — a filter you forget once is a
-- cross-user data leak, a policy you forget fails closed instead.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile: select" on public.profiles
  for select using ((select auth.uid()) = id);

create policy "own profile: update" on public.profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Profiles are created by the trigger below, never by the client, so there is
-- deliberately no insert policy.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- shelf_life  (shared reference data, not user-owned)
-- ---------------------------------------------------------------------------
--
-- The curated table that turns a canonical food id into an expiry date. This
-- is the reason the model never invents dates: it only maps a receipt string
-- onto an id that already exists here.

create table public.shelf_life (
  id              text primary key,          -- e.g. 'milk_whole'
  label           text not null,             -- e.g. 'Whole milk'
  category        text not null,             -- e.g. 'dairy'
  default_storage text not null default 'fridge'
                  check (default_storage in ('fridge', 'pantry', 'freezer')),
  days_fridge     integer check (days_fridge  > 0),
  days_pantry     integer check (days_pantry  > 0),
  days_freezer    integer check (days_freezer > 0),

  -- Guarantees a lookup can always resolve a duration for the default storage.
  constraint shelf_life_has_default_duration check (
    case default_storage
      when 'fridge'  then days_fridge  is not null
      when 'pantry'  then days_pantry  is not null
      when 'freezer' then days_freezer is not null
    end
  )
);

alter table public.shelf_life enable row level security;

create policy "shelf life: read by authenticated" on public.shelf_life
  for select to authenticated using (true);

-- Writes are seeded by migration / service role only, so no write policies.

-- ---------------------------------------------------------------------------
-- receipts
-- ---------------------------------------------------------------------------

create table public.receipts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  storage_path   text not null,             -- path in the 'receipts' bucket
  store_name     text,
  purchased_at   date,
  extraction     jsonb,                     -- raw structured model output
  status         text not null default 'pending'
                 check (status in ('pending', 'parsed', 'failed')),
  created_at     timestamptz not null default now()
);

create index receipts_user_created_idx
  on public.receipts (user_id, created_at desc);

alter table public.receipts enable row level security;

create policy "own receipts: all" on public.receipts
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- food_items
-- ---------------------------------------------------------------------------

create table public.food_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,

  name          text not null,             -- display name, user-editable
  raw_name      text,                      -- verbatim receipt line, if any
  shelf_life_id text references public.shelf_life (id) on delete set null,

  quantity      numeric(10, 2) not null default 1 check (quantity > 0),
  unit          text,

  storage       text not null default 'fridge'
                check (storage in ('fridge', 'pantry', 'freezer')),
  purchased_at  date not null default current_date,
  expires_at    date not null,

  status        text not null default 'active'
                check (status in ('active', 'used', 'wasted')),
  resolved_at   timestamptz,               -- when it became used/wasted
  price_cents   integer check (price_cents >= 0),

  source        text not null default 'manual'
                check (source in ('manual', 'receipt')),
  receipt_id    uuid references public.receipts (id) on delete set null,

  created_at    timestamptz not null default now(),

  -- Keeps the waste stats honest: a resolved item must record when.
  constraint food_items_resolved_consistency check (
    (status = 'active' and resolved_at is null)
    or (status <> 'active' and resolved_at is not null)
  )
);

-- The dashboard's main query: this user's active items, soonest expiry first.
create index food_items_user_active_expiry_idx
  on public.food_items (user_id, expires_at)
  where status = 'active';

alter table public.food_items enable row level security;

create policy "own food items: all" on public.food_items
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- item_mappings  (per-user learned receipt-string cache)
-- ---------------------------------------------------------------------------
--
-- When the model is unsure what 'GV MLK 2% GAL' is, we ask the user once and
-- record the answer here. The next receipt from that store resolves without
-- asking, so accuracy improves per user with no retraining.

create table public.item_mappings (
  user_id       uuid not null references auth.users (id) on delete cascade,
  raw_name      text not null,
  shelf_life_id text not null references public.shelf_life (id) on delete cascade,
  confirmed_at  timestamptz not null default now(),
  primary key (user_id, raw_name)
);

alter table public.item_mappings enable row level security;

create policy "own item mappings: all" on public.item_mappings
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
