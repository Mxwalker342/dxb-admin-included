-- Run once in the Supabase SQL editor, then run seed.sql.
begin;
create table public.menu_items (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  price integer not null check (price between 1 and 100000),
  available boolean not null default true,
  sort_order integer not null default 0
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null,
  request_payload jsonb not null,
  reference text unique not null default ('DXB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  kind text not null check (kind in ('pickup', 'dine-in', 'reservation')),
  guests integer,
  scheduled_at timestamptz not null,
  notes text not null default '',
  items jsonb not null,
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid'))
);
create index orders_schedule on public.orders (scheduled_at);
create index orders_phone_created on public.orders (phone, created_at);
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
revoke all on public.menu_items, public.orders from anon, authenticated;
grant select on public.menu_items to anon, authenticated;
grant update (price, available) on public.menu_items to authenticated;
grant select on public.orders to authenticated;
grant update (status, payment_status) on public.orders to authenticated;
create policy menu_read on public.menu_items for select to anon, authenticated using (true);
create policy menu_admin_update on public.menu_items for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'cafe_role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'cafe_role') = 'admin');
create policy orders_admin_read on public.orders for select to authenticated
  using ((select auth.jwt()->'app_metadata'->>'cafe_role') = 'admin');
create policy orders_admin_update on public.orders for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'cafe_role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'cafe_role') = 'admin');

-- Guest customers can only create through this validated function. They cannot read orders.
create function public.place_order(p_request_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  existing public.orders;
  saved public.orders;
  product public.menu_items;
  entry jsonb;
  line_items jsonb := '[]'::jsonb;
  total_price integer := 0;
  qty integer;
  item_count integer := 0;
  seen text[] := '{}';
  customer text := trim(p_payload->>'name');
  telephone text := regexp_replace(coalesce(p_payload->>'phone',''), '[^0-9]', '', 'g');
  booking_kind text := p_payload->>'kind';
  arrival timestamptz;
  party integer;
  local_hour integer;
begin
  if p_request_id is null or p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 15000 then
    raise exception 'Invalid booking request.';
  end if;
  if customer is null or char_length(customer) not between 2 and 80 or telephone !~ '^[0-9]{10,15}$' then
    raise exception 'Enter your name and a valid phone number.';
  end if;
  -- Serialize retries and per-phone rate checks across concurrent requests.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select * into existing from public.orders where request_id = p_request_id;
  if found then
    if existing.request_payload <> p_payload then raise exception 'This request was already submitted. Start a new booking.'; end if;
    return jsonb_build_object('reference',existing.reference,'total',existing.total,'items',existing.items,'scheduled_at',existing.scheduled_at);
  end if;
  perform pg_advisory_xact_lock(hashtextextended(telephone, 1));
  if (select count(*) from public.orders where phone = telephone and created_at > now() - interval '15 minutes') >= 5 then
    raise exception 'Too many requests for this phone number. Please wait 15 minutes or call the cafe.';
  end if;
  if booking_kind is null or booking_kind not in ('pickup','dine-in','reservation') then raise exception 'Invalid booking type.'; end if;
  arrival := (p_payload->>'scheduled_at')::timestamptz;
  if arrival is null or arrival < now() + interval '30 minutes' or arrival > now() + interval '30 days' then
    raise exception 'Choose a time at least 30 minutes ahead and within 30 days.';
  end if;
  local_hour := extract(hour from arrival at time zone 'Asia/Kolkata');
  if local_hour >= 1 and local_hour < 12 then raise exception 'Bookings are available from noon to 1 am India time.'; end if;
  if char_length(coalesce(p_payload->>'notes','')) > 500 then raise exception 'Notes must be 500 characters or fewer.'; end if;
  if booking_kind in ('dine-in','reservation') then
    if coalesce(p_payload->>'guests','') !~ '^[0-9]{1,2}$' then raise exception 'Enter a guest count from 1 to 20.'; end if;
    party := (p_payload->>'guests')::integer;
    if party not between 1 and 20 then raise exception 'For more than 20 guests, please call the cafe.'; end if;
  end if;
  if jsonb_typeof(p_payload->'items') is distinct from 'array' then raise exception 'Invalid order items.'; end if;
  if jsonb_array_length(p_payload->'items') > 50 then raise exception 'Too many items.'; end if;
  if booking_kind = 'reservation' and jsonb_array_length(p_payload->'items') <> 0 then raise exception 'Table requests cannot contain food items.'; end if;
  for entry in select value from jsonb_array_elements(p_payload->'items') loop
    if coalesce(entry->>'quantity','') !~ '^[0-9]{1,2}$' then raise exception 'Invalid quantity.'; end if;
    qty := (entry->>'quantity')::integer;
    if qty not between 1 and 20 or (entry->>'id') = any(seen) then raise exception 'Invalid or duplicate item.'; end if;
    select * into product from public.menu_items where id = entry->>'id' and available for share;
    if not found then raise exception 'An item is no longer available. Refresh the menu and try again.'; end if;
    if (entry->>'price') is distinct from product.price::text then raise exception 'A menu price changed. Refresh the menu and review your total.'; end if;
    seen := array_append(seen, product.id);
    item_count := item_count + qty;
    total_price := total_price + product.price * qty;
    line_items := line_items || jsonb_build_array(jsonb_build_object('id',product.id,'name',product.name,'quantity',qty,'price',product.price));
  end loop;
  if booking_kind <> 'reservation' and item_count = 0 then raise exception 'Add food to your order first.'; end if;
  if item_count > 100 then raise exception 'For orders over 100 items, please call the cafe.'; end if;
  insert into public.orders (request_id,request_payload,customer_name,phone,kind,guests,scheduled_at,notes,items,total)
    values (p_request_id,p_payload,customer,telephone,booking_kind,party,arrival,coalesce(p_payload->>'notes',''),line_items,total_price)
    returning * into saved;
  return jsonb_build_object('reference',saved.reference,'total',saved.total,'items',saved.items,'scheduled_at',saved.scheduled_at);
end;
$$;
revoke all on function public.place_order(uuid,jsonb) from public;
grant execute on function public.place_order(uuid,jsonb) to anon, authenticated;
commit;
