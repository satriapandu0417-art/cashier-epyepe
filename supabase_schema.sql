-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Menu Items Table
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  base_price numeric not null,
  category text not null,
  image text,
  bundle_config jsonb default '{"enabled": false}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric not null,
  status text not null default 'Pending',
  payment_status text not null default 'Unpaid',
  note text,
  edit_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Items Table (Relational approach)
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id text not null,
  name text not null,
  quantity integer not null,
  base_price numeric not null,
  is_prepared boolean default false,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Realtime policies (public access for demo purposes)
alter table public.menu_items enable row level security;
create policy "Allow public access" on public.menu_items for all using (true);

alter table public.orders enable row level security;
create policy "Allow public access" on public.orders for all using (true);

alter table public.order_items enable row level security;
create policy "Allow public access" on public.order_items for all using (true);

-- Enable realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.menu_items, public.orders, public.order_items;
commit;
