-- Pamoja initial backend schema
-- Apply only to the dedicated Pamoja Supabase project.
-- Every exposed table has RLS and explicit Data API grants.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone_number text,
  home_area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  description text,
  category text not null,
  area text,
  address text,
  latitude double precision,
  longitude double precision,
  phone_number text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchants_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint merchants_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  description text,
  price_kes numeric(12,2) not null check (price_kes >= 0),
  image_url text,
  is_available boolean not null default true,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  merchant_id uuid not null references public.merchants(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending','accepted','preparing','ready','out_for_delivery','completed','cancelled')),
  fulfillment_type text not null default 'pickup'
    check (fulfillment_type in ('pickup','delivery')),
  delivery_area text,
  delivery_address text,
  customer_note text,
  subtotal_kes numeric(12,2) not null default 0 check (subtotal_kes >= 0),
  delivery_fee_kes numeric(12,2) not null default 0 check (delivery_fee_kes >= 0),
  total_kes numeric(12,2) not null default 0 check (total_kes >= 0),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_kes numeric(12,2) not null check (unit_price_kes >= 0),
  line_total_kes numeric(12,2) not null check (line_total_kes >= 0),
  created_at timestamptz not null default now()
);

create table public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references auth.users(id) on delete restrict,
  pickup_label text not null,
  pickup_latitude double precision,
  pickup_longitude double precision,
  destination_label text not null,
  destination_latitude double precision,
  destination_longitude double precision,
  vehicle_type text not null default 'standard'
    check (vehicle_type in ('standard',' boda','van')),
  status text not null default 'requested'
    check (status in ('requested','accepted','driver_arriving','in_progress','completed','cancelled')),
  quoted_fare_kes numeric(12,2) check (quoted_fare_kes is null or quoted_fare_kes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ride_pickup_lat_range check (pickup_latitude is null or pickup_latitude between -90 and 90),
  constraint ride_pickup_lng_range check (pickup_longitude is null or pickup_longitude between -180 and 180),
  constraint ride_destination_lat_range check (destination_latitude is null or destination_latitude between -90 and 90),
  constraint ride_destination_lng_range check (destination_longitude is null or destination_longitude between -180 and 180)
);

-- WhatsApp account linking is private. Store verified numbers only after an OTP/linking flow.
create table public.whatsapp_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  phone_number text not null unique,
  verified_at timestamptz,
  marketing_opt_in boolean not null default false,
  location_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- Wallet is ledger-first. Clients can read their own records but cannot mint,
-- edit, or transfer funds. Only trusted server-side payment workflows write entries.
create table public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  currency char(3) not null default 'KES' check (currency = 'KES'),
  created_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid not null references public.wallet_accounts(id) on delete restrict,
  direction text not null check (direction in ('credit','debit')),
  amount_kes numeric(12,2) not null check (amount_kes > 0),
  status text not null default 'pending' check (status in ('pending','posted','failed','reversed')),
  reference text unique,
  provider text,
  description text,
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

create index merchants_owner_idx on public.merchants(owner_id);
create index merchants_discovery_idx on public.merchants(is_active, category, area);
create index products_merchant_idx on public.products(merchant_id, is_available);
create index orders_customer_idx on public.orders(customer_id, created_at desc);
create index orders_merchant_idx on public.orders(merchant_id, status, created_at desc);
create index order_items_order_idx on public.order_items(order_id);
create index ride_requests_rider_idx on public.ride_requests(rider_id, created_at desc);
create index wallet_transactions_account_idx on public.wallet_transactions(wallet_account_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.merchants enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.ride_requests enable row level security;
alter table public.whatsapp_links enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;

create policy "profiles_read_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "merchants_public_active_read" on public.merchants
  for select to anon, authenticated using (is_active = true or owner_id = (select auth.uid()));
create policy "merchants_owner_insert" on public.merchants
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "merchants_owner_update" on public.merchants
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "products_public_available_read" on public.products
  for select to anon, authenticated using (
    is_available = true and exists (
      select 1 from public.merchants m where m.id = merchant_id and m.is_active = true
    )
    or exists (
      select 1 from public.merchants m where m.id = merchant_id and m.owner_id = (select auth.uid())
    )
  );
create policy "products_owner_insert" on public.products
  for insert to authenticated with check (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = (select auth.uid()))
  );
create policy "products_owner_update" on public.products
  for update to authenticated using (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = (select auth.uid()))
  );
create policy "products_owner_delete" on public.products
  for delete to authenticated using (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = (select auth.uid()))
  );

create policy "orders_customer_read" on public.orders
  for select to authenticated using (customer_id = (select auth.uid()));
create policy "orders_customer_insert" on public.orders
  for insert to authenticated with check (customer_id = (select auth.uid()));
create policy "orders_customer_update" on public.orders
  for update to authenticated using (customer_id = (select auth.uid()) and status = 'pending')
  with check (customer_id = (select auth.uid()));
create policy "orders_merchant_read" on public.orders
  for select to authenticated using (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = (select auth.uid()))
  );
create policy "orders_merchant_update" on public.orders
  for update to authenticated using (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = (select auth.uid()))
  );

create policy "order_items_participant_read" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and (
      o.customer_id = (select auth.uid()) or exists (
        select 1 from public.merchants m where m.id = o.merchant_id and m.owner_id = (select auth.uid())
      )
    ))
  );
create policy "order_items_customer_insert" on public.order_items
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()) and o.status = 'pending')
  );

create policy "rides_rider_read" on public.ride_requests
  for select to authenticated using (rider_id = (select auth.uid()));
create policy "rides_rider_insert" on public.ride_requests
  for insert to authenticated with check (rider_id = (select auth.uid()));
create policy "rides_rider_update" on public.ride_requests
  for update to authenticated using (rider_id = (select auth.uid()) and status in ('requested','accepted'))
  with check (rider_id = (select auth.uid()));

create policy "whatsapp_links_read_own" on public.whatsapp_links
  for select to authenticated using (user_id = (select auth.uid()));
create policy "whatsapp_links_insert_own" on public.whatsapp_links
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "whatsapp_links_update_own" on public.whatsapp_links
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "wallet_accounts_read_own" on public.wallet_accounts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "wallet_transactions_read_own" on public.wallet_transactions
  for select to authenticated using (
    exists (select 1 from public.wallet_accounts w where w.id = wallet_account_id and w.user_id = (select auth.uid()))
  );

-- Explicit Data API exposure is required on projects created after the 2026 rollout.
grant usage on schema public to anon, authenticated;
grant select on public.merchants, public.products to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.merchants to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, insert, update on public.ride_requests to authenticated;
grant select, insert, update on public.whatsapp_links to authenticated;
grant select on public.wallet_accounts, public.wallet_transactions to authenticated;

-- No client write grants on wallet tables. Service-role workflows own ledger writes.
