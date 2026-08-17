-- Dapoer Palem CMS schema foundation.
--
-- Security baseline for Step 4A:
--   * RLS is enabled on every application table.
--   * No anon/authenticated policies are created, so API access is denied by
--     default until the role-aware policies are introduced in Step 4B.
--   * The service_role continues to bypass RLS for trusted server operations.

begin;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (
    role in ('super_admin', 'content_manager', 'reservation_staff', 'viewer')
  )
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null default 'media',
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  alt_text text,
  title text,
  description text,
  folder text,
  width integer,
  height integer,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  active boolean not null default true,
  constraint media_file_size_check check (file_size >= 0),
  constraint media_width_check check (width is null or width > 0),
  constraint media_height_check check (height is null or height > 0),
  constraint media_folder_check check (
    folder is null
    or folder in (
      'branding',
      'homepage',
      'menu',
      'promos',
      'events',
      'gallery',
      'uploads'
    )
  )
);

create table public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  eyebrow text,
  heading text,
  description text,
  primary_button_label text,
  primary_button_url text,
  secondary_button_label text,
  secondary_button_url text,
  image_media_id uuid references public.media (id) on delete restrict,
  active boolean not null default true,
  status text not null default 'published',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_content_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create table public.homepage_experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_media_id uuid references public.media (id) on delete restrict,
  link_url text,
  display_order integer not null default 0,
  active boolean not null default true,
  status text not null default 'published',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_experiences_display_order_check check (display_order >= 0),
  constraint homepage_experiences_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_media_id uuid references public.media (id) on delete restrict,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_categories_display_order_check check (display_order >= 0)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12, 2) not null default 0,
  original_price numeric(12, 2),
  image_media_id uuid references public.media (id) on delete restrict,
  sku text unique,
  badge text,
  display_order integer not null default 0,
  featured boolean not null default false,
  availability text not null default 'available',
  status text not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_price_check check (price >= 0),
  constraint menu_items_original_price_check check (
    original_price is null or original_price >= 0
  ),
  constraint menu_items_display_order_check check (display_order >= 0),
  constraint menu_items_availability_check check (
    availability in ('available', 'unavailable')
  ),
  constraint menu_items_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create table public.promos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  image_media_id uuid references public.media (id) on delete restrict,
  start_date timestamptz,
  end_date timestamptz,
  terms text,
  cta_label text,
  cta_url text,
  display_order integer not null default 0,
  status text not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promos_display_order_check check (display_order >= 0),
  constraint promos_status_check check (
    status in ('draft', 'scheduled', 'published', 'expired', 'archived')
  ),
  constraint promos_date_range_check check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  image_media_id uuid references public.media (id) on delete restrict,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  cta_label text,
  cta_url text,
  display_order integer not null default 0,
  status text not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_display_order_check check (display_order >= 0),
  constraint events_status_check check (
    status in ('draft', 'scheduled', 'published', 'completed', 'cancelled', 'archived')
  ),
  constraint events_time_range_check check (
    start_time is null or end_time is null or end_time >= start_time
  )
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media (id) on delete restrict,
  title text,
  description text,
  category text not null,
  alt_text text,
  display_order integer not null default 0,
  active boolean not null default true,
  status text not null default 'published',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_items_display_order_check check (display_order >= 0),
  constraint gallery_items_category_check check (
    category in ('food', 'drinks', 'interior', 'outdoor', 'atmosphere', 'events', 'other')
  ),
  constraint gallery_items_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  reservation_date date not null,
  reservation_time time,
  guest_count integer not null,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_guest_count_check check (guest_count > 0),
  constraint reservations_status_check check (
    status in ('pending', 'confirmed', 'completed', 'cancelled')
  )
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value text,
  setting_group text not null,
  is_public boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_group_check check (
    setting_group in ('general', 'contact', 'location', 'operations', 'seo', 'social')
  )
);

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  version integer not null,
  snapshot jsonb not null,
  change_summary text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint content_revisions_version_check check (version > 0),
  constraint content_revisions_entity_version_key unique (
    entity_type,
    entity_id,
    version
  )
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Structural seed records only. No production copy, prices, promotions,
-- events, contact details, or other business information are inserted.
insert into public.homepage_content (section_key, status)
values
  ('hero', 'draft'),
  ('introduction', 'draft'),
  ('menu_cta', 'draft'),
  ('venue', 'draft'),
  ('reservation_cta', 'draft'),
  ('location', 'draft');

insert into public.homepage_experiences (title, display_order, status)
values
  ('Food', 0, 'draft'),
  ('Drinks', 1, 'draft'),
  ('Atmosphere', 2, 'draft');

-- One trigger function keeps all mutable records consistent. The empty search
-- path prevents object-name shadowing if this function is ever called outside
-- its trigger context.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger media_set_updated_at
before update on public.media
for each row execute function public.set_updated_at();

create trigger homepage_content_set_updated_at
before update on public.homepage_content
for each row execute function public.set_updated_at();

create trigger homepage_experiences_set_updated_at
before update on public.homepage_experiences
for each row execute function public.set_updated_at();

create trigger menu_categories_set_updated_at
before update on public.menu_categories
for each row execute function public.set_updated_at();

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

create trigger promos_set_updated_at
before update on public.promos
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger gallery_items_set_updated_at
before update on public.gallery_items
for each row execute function public.set_updated_at();

create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- Role and lifecycle indexes.
create index profiles_role_idx on public.profiles (role);
create index media_folder_active_idx on public.media (folder, active);
create index media_created_by_idx on public.media (created_by);
create index media_created_at_idx on public.media (created_at desc);

create index homepage_content_status_active_idx
  on public.homepage_content (status, active);
create index homepage_content_image_media_id_idx
  on public.homepage_content (image_media_id);
create index homepage_content_created_by_idx
  on public.homepage_content (created_by);
create index homepage_content_updated_by_idx
  on public.homepage_content (updated_by);
create index homepage_content_updated_at_idx
  on public.homepage_content (updated_at desc);

create index homepage_experiences_public_order_idx
  on public.homepage_experiences (status, active, display_order);
create index homepage_experiences_image_media_id_idx
  on public.homepage_experiences (image_media_id);
create index homepage_experiences_created_by_idx
  on public.homepage_experiences (created_by);
create index homepage_experiences_updated_by_idx
  on public.homepage_experiences (updated_by);
create index homepage_experiences_updated_at_idx
  on public.homepage_experiences (updated_at desc);

create index menu_categories_active_order_idx
  on public.menu_categories (active, display_order);
create index menu_categories_image_media_id_idx
  on public.menu_categories (image_media_id);
create index menu_categories_updated_at_idx
  on public.menu_categories (updated_at desc);

create index menu_items_category_public_order_idx
  on public.menu_items (category_id, status, availability, display_order);
create index menu_items_featured_idx
  on public.menu_items (featured, display_order)
  where featured = true and status = 'published';
create index menu_items_image_media_id_idx
  on public.menu_items (image_media_id);
create index menu_items_created_by_idx
  on public.menu_items (created_by);
create index menu_items_updated_by_idx
  on public.menu_items (updated_by);
create index menu_items_updated_at_idx
  on public.menu_items (updated_at desc);

create index promos_status_schedule_order_idx
  on public.promos (status, start_date, end_date, display_order);
create index promos_image_media_id_idx on public.promos (image_media_id);
create index promos_created_by_idx on public.promos (created_by);
create index promos_updated_by_idx on public.promos (updated_by);
create index promos_updated_at_idx on public.promos (updated_at desc);

create index events_status_date_order_idx
  on public.events (status, event_date, display_order);
create index events_image_media_id_idx on public.events (image_media_id);
create index events_created_by_idx on public.events (created_by);
create index events_updated_by_idx on public.events (updated_by);
create index events_updated_at_idx on public.events (updated_at desc);

create index gallery_items_public_order_idx
  on public.gallery_items (status, active, category, display_order);
create index gallery_items_media_id_idx on public.gallery_items (media_id);
create index gallery_items_created_by_idx on public.gallery_items (created_by);
create index gallery_items_updated_by_idx on public.gallery_items (updated_by);
create index gallery_items_updated_at_idx
  on public.gallery_items (updated_at desc);

create index reservations_status_date_time_idx
  on public.reservations (status, reservation_date, reservation_time);
create index reservations_created_at_idx
  on public.reservations (created_at desc);
create index reservations_updated_at_idx
  on public.reservations (updated_at desc);

create index site_settings_group_public_idx
  on public.site_settings (setting_group, is_public);
create index site_settings_updated_by_idx
  on public.site_settings (updated_by);
create index site_settings_updated_at_idx
  on public.site_settings (updated_at desc);

create index content_revisions_changed_by_idx
  on public.content_revisions (changed_by);
create index content_revisions_created_at_idx
  on public.content_revisions (created_at desc);

create index audit_logs_user_created_at_idx
  on public.audit_logs (user_id, created_at desc);
create index audit_logs_entity_created_at_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_action_created_at_idx
  on public.audit_logs (action, created_at desc);

-- Default-deny API baseline. Policies are intentionally deferred to Step 4B.
alter table public.profiles enable row level security;
alter table public.media enable row level security;
alter table public.homepage_content enable row level security;
alter table public.homepage_experiences enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.promos enable row level security;
alter table public.events enable row level security;
alter table public.gallery_items enable row level security;
alter table public.reservations enable row level security;
alter table public.site_settings enable row level security;
alter table public.content_revisions enable row level security;
alter table public.audit_logs enable row level security;

comment on table public.profiles is
  'Application profiles for Supabase Auth users; access policies arrive in Step 4B.';
comment on table public.reservations is
  'Reservation intake records; RLS policies and reservation workflows arrive in later steps.';
comment on table public.content_revisions is
  'Immutable CMS snapshots used for revision history and future rollback.';
comment on table public.audit_logs is
  'Append-only application audit trail; write restrictions arrive in Step 4B.';

-- Establish a private logical media bucket only. No object policies or files
-- are created, and the existing local logo assets remain in public/logo.
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

commit;
