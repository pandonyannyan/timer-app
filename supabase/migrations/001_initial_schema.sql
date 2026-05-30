-- Timer App — initial Supabase schema
-- Rule: DB and backend store/process datetime values in UTC.
-- Frontend displays datetime values in user's local timezone.

-- Extensions
create extension if not exists pgcrypto;

-- Enums
create type public.app_role as enum (
  'admin',
  'manager',
  'member'
);

create type public.timer_status as enum (
  'active',
  'stopped'
);

create type public.timer_log_action as enum (
  'created',
  'updated',
  'restarted',
  'stopped',
  'deleted',
  'role_changed'
);

-- Tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  email text,
  display_name text,

  role public.app_role not null default 'member',
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_email_not_empty check (
    email is null or length(trim(email)) > 0
  ),
  constraint profiles_display_name_not_empty check (
    display_name is null or length(trim(display_name)) > 0
  )
);

create table public.timers (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text not null default '',
  image_url text,

  duration_seconds integer not null,
  min_duration_seconds integer,

  started_at timestamptz not null default now(),
  last_run_by uuid references public.profiles(id) on delete set null,

  time_shift_seconds integer not null default 0,
  status public.timer_status not null default 'stopped',

  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint timers_title_not_empty check (length(trim(title)) > 0),
  constraint timers_description_not_null check (description is not null),

  constraint timers_image_url_not_empty check (
    image_url is null or length(trim(image_url)) > 0
  ),

  constraint timers_duration_seconds_valid check (
    duration_seconds > 0
    and duration_seconds <= 86400
  ),

  constraint timers_min_duration_seconds_valid check (
    min_duration_seconds is null
    or (
      min_duration_seconds > 0
      and min_duration_seconds < duration_seconds
    )
  ),

  constraint timers_time_shift_seconds_valid check (
    time_shift_seconds >= 0
    and time_shift_seconds <= duration_seconds
  )
);

create table public.user_pinned_timers (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  timer_id uuid not null references public.timers(id) on delete cascade,

  position integer not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_pinned_timers_position_valid check (position >= 0),

  constraint user_pinned_timers_user_timer_unique
    unique (user_id, timer_id),

  constraint user_pinned_timers_user_position_unique
    unique (user_id, position)
    deferrable initially immediate
);

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  global_sound_enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_settings_user_unique unique (user_id)
);

create table public.timer_user_settings (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  timer_id uuid not null references public.timers(id) on delete cascade,

  sound_enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint timer_user_settings_user_timer_unique
    unique (user_id, timer_id)
);

create table public.timer_logs (
  id uuid primary key default gen_random_uuid(),

  timer_id uuid references public.timers(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,

  action public.timer_log_action not null,

  old_status public.timer_status,
  new_status public.timer_status,

  details jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- Indexes
create index profiles_role_idx on public.profiles(role);
create index profiles_is_active_idx on public.profiles(is_active);

create index timers_status_idx on public.timers(status);
create index timers_updated_at_idx on public.timers(updated_at desc);
create index timers_created_at_idx on public.timers(created_at desc);
create index timers_last_run_by_idx on public.timers(last_run_by);
create index timers_created_by_idx on public.timers(created_by);
create index timers_updated_by_idx on public.timers(updated_by);

create index user_pinned_timers_user_position_idx
on public.user_pinned_timers(user_id, position);

create index user_pinned_timers_timer_id_idx
on public.user_pinned_timers(timer_id);

create index user_settings_user_id_idx
on public.user_settings(user_id);

create index timer_user_settings_user_id_idx
on public.timer_user_settings(user_id);

create index timer_user_settings_timer_id_idx
on public.timer_user_settings(timer_id);

create index timer_logs_created_at_idx
on public.timer_logs(created_at desc);

create index timer_logs_timer_id_created_at_idx
on public.timer_logs(timer_id, created_at desc);

create index timer_logs_user_id_created_at_idx
on public.timer_logs(user_id, created_at desc);

create index timer_logs_action_idx
on public.timer_logs(action);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger timers_set_updated_at
before update on public.timers
for each row execute function public.set_updated_at();

create trigger user_pinned_timers_set_updated_at
before update on public.user_pinned_timers
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create trigger timer_user_settings_set_updated_at
before update on public.timer_user_settings
for each row execute function public.set_updated_at();

-- Automatically create a profile for a new Supabase Auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id, global_sound_enabled)
  values (new.id, true)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS helper functions
create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'manager')
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.timers enable row level security;
alter table public.user_pinned_timers enable row level security;
alter table public.user_settings enable row level security;
alter table public.timer_user_settings enable row level security;
alter table public.timer_logs enable row level security;

-- profiles policies
create policy profiles_select_authenticated
on public.profiles
for select
to authenticated
using (public.is_active_user());

-- Users may update only their own non-security profile fields.
-- Do not expose role/is_active changes through frontend. Role changes should go through FastAPI service-role logic.
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  and public.is_active_user()
)
with check (
  id = auth.uid()
  and public.is_active_user()
);

-- timers policies
-- Frontend can read timers and subscribe to realtime changes.
-- Global timer mutations should go through FastAPI using service role.
create policy timers_select_authenticated
on public.timers
for select
to authenticated
using (public.is_active_user());

-- user_pinned_timers policies
create policy user_pinned_timers_select_own
on public.user_pinned_timers
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_user()
);

create policy user_pinned_timers_insert_own
on public.user_pinned_timers
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_active_user()
);

create policy user_pinned_timers_update_own
on public.user_pinned_timers
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_user()
)
with check (
  user_id = auth.uid()
  and public.is_active_user()
);

create policy user_pinned_timers_delete_own
on public.user_pinned_timers
for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_user()
);

-- user_settings policies
create policy user_settings_select_own
on public.user_settings
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_user()
);

create policy user_settings_insert_own
on public.user_settings
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_active_user()
);

create policy user_settings_update_own
on public.user_settings
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_user()
)
with check (
  user_id = auth.uid()
  and public.is_active_user()
);

-- timer_user_settings policies
create policy timer_user_settings_select_own
on public.timer_user_settings
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_user()
);

create policy timer_user_settings_insert_own
on public.timer_user_settings
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_active_user()
);

create policy timer_user_settings_update_own
on public.timer_user_settings
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_user()
)
with check (
  user_id = auth.uid()
  and public.is_active_user()
);

create policy timer_user_settings_delete_own
on public.timer_user_settings
for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_user()
);

-- timer_logs policies
create policy timer_logs_select_manager_or_admin
on public.timer_logs
for select
to authenticated
using (
  public.is_active_user()
  and public.current_user_role() in ('admin', 'manager')
);

-- Realtime publication for shared timers.
-- Supabase projects usually already have the supabase_realtime publication.
-- This statement may fail if the table is already in the publication; run only once.
alter publication supabase_realtime add table public.timers;
