-- Authenticated Dapoer Palem OS foundation. No operational records or metrics are seeded.
begin;

create sequence public.os_project_public_id_seq;
create sequence public.os_task_public_id_seq;
create sequence public.os_subtask_public_id_seq;

create table public.os_projects (
  id uuid primary key default gen_random_uuid(), public_id text not null unique,
  name text not null, objective text, description text, owner_id uuid references public.profiles(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  start_date date, deadline date, status text not null default 'planning' check (status in ('planning','active','review','completed','cancelled')),
  tags text[] not null default '{}', notes text, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (start_date is null or deadline is null or deadline >= start_date)
);

create table public.os_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.os_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), unique (project_id,user_id)
);

create table public.os_tasks (
  id uuid primary key default gen_random_uuid(), public_id text not null unique,
  project_id uuid references public.os_projects(id) on delete cascade,
  parent_task_id uuid references public.os_tasks(id) on delete cascade,
  title text not null, description text, assigned_to uuid references public.profiles(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  deadline date, status text not null default 'todo' check (status in ('todo','in_progress','review','completed','cancelled')),
  attachment_media_id uuid references public.media(id) on delete restrict, notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (parent_task_id is null or parent_task_id <> id)
);

create table public.os_campaigns (
  id uuid primary key default gen_random_uuid(), campaign_name text not null, objective text, target_audience text,
  offer text, channels text[] not null default '{}', budget numeric(14,2) check (budget is null or budget >= 0),
  start_date date, end_date date, owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'idea' check (status in ('idea','planning','preparation','execution','monitoring','evaluation','completed','cancelled')),
  expected_result text, notes text, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (start_date is null or end_date is null or end_date >= start_date)
);

create table public.os_content_items (
  id uuid primary key default gen_random_uuid(), title text not null,
  content_type text not null check (content_type in ('instagram_post','instagram_story','reels','website','promo','event','campaign_asset')),
  campaign_id uuid references public.os_campaigns(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null, brief text, publish_at timestamptz,
  status text not null default 'idea' check (status in ('idea','brief','draft','review','approved','published','cancelled')),
  attachment_media_id uuid references public.media(id) on delete restrict, notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.os_reports (
  id uuid primary key default gen_random_uuid(), title text not null,
  report_type text not null check (report_type in ('project','campaign','content','event','operational','management_summary')),
  project_id uuid references public.os_projects(id) on delete set null,
  campaign_id uuid references public.os_campaigns(id) on delete set null,
  narrative text, status text not null default 'draft' check (status in ('draft','published','archived')),
  attachment_media_id uuid references public.media(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.os_knowledge_articles (
  id uuid primary key default gen_random_uuid(), title text not null,
  content_type text not null check (content_type in ('sop','brand_guidelines','marketing_guidelines','operational_notes','training_material','internal_faq')),
  body text, status text not null default 'draft' check (status in ('draft','published','archived')),
  attachment_media_id uuid references public.media(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.os_roadmap_items (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  horizon text not null default 'now' check (horizon in ('now','next','later')),
  display_order integer not null default 0 check (display_order >= 0), active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.os_team_responsibilities (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  responsibility text not null, active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,responsibility)
);

create or replace function private.set_os_public_id() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name = 'os_projects' then new.public_id := 'DP-P-' || lpad(nextval('public.os_project_public_id_seq')::text,4,'0');
  elsif new.parent_task_id is null then new.public_id := 'DP-T-' || lpad(nextval('public.os_task_public_id_seq')::text,4,'0');
  else new.public_id := 'DP-ST-' || lpad(nextval('public.os_subtask_public_id_seq')::text,4,'0'); end if;
  return new;
end; $$;
create trigger os_projects_public_id before insert on public.os_projects for each row execute function private.set_os_public_id();
create trigger os_tasks_public_id before insert on public.os_tasks for each row execute function private.set_os_public_id();

create or replace function private.protect_os_public_id() returns trigger language plpgsql set search_path='' as $$
begin
  if new.public_id is distinct from old.public_id then
    raise exception using errcode = '22023', message = 'OS_PUBLIC_ID_IMMUTABLE';
  end if;
  return new;
end; $$;
create trigger os_projects_protect_public_id before update on public.os_projects for each row execute function private.protect_os_public_id();
create trigger os_tasks_protect_public_id before update on public.os_tasks for each row execute function private.protect_os_public_id();

create or replace function private.set_os_actor() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op = 'INSERT' then new.created_by := auth.uid();
  else new.created_by := old.created_by;
  end if;
  return new;
end; $$;

create or replace function private.audit_os_mutation() returns trigger language plpgsql security definer set search_path='' as $$
declare target_id uuid;
begin
  if tg_op = 'DELETE' then target_id := old.id; else target_id := new.id; end if;
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
  values (auth.uid(),lower(tg_op),tg_table_name,target_id,'{}'::jsonb);
  if tg_op = 'DELETE' then return old; else return new; end if;
end; $$;

do $$ declare table_name text; begin foreach table_name in array array['os_projects','os_tasks','os_campaigns','os_content_items','os_reports','os_knowledge_articles','os_roadmap_items','os_team_responsibilities'] loop execute format('create trigger %I_set_actor before insert or update on public.%I for each row execute function private.set_os_actor()',table_name,table_name); execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',table_name,table_name); execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function private.audit_os_mutation()',table_name,table_name); end loop; end $$;
create trigger os_project_members_set_actor before insert or update on public.os_project_members for each row execute function private.set_os_actor();
create trigger os_project_members_audit after insert or update or delete on public.os_project_members for each row execute function private.audit_os_mutation();

create index os_projects_status_deadline_idx on public.os_projects(status,deadline);
create index os_tasks_project_status_deadline_idx on public.os_tasks(project_id,status,deadline);
create index os_tasks_assigned_to_idx on public.os_tasks(assigned_to,status);
create index os_campaigns_status_dates_idx on public.os_campaigns(status,start_date,end_date);
create index os_content_publish_idx on public.os_content_items(status,publish_at);
create index os_reports_status_created_idx on public.os_reports(status,created_at desc);
create index os_knowledge_status_type_idx on public.os_knowledge_articles(status,content_type);
create index os_roadmap_horizon_order_idx on public.os_roadmap_items(horizon,display_order);

do $$ declare table_name text; begin foreach table_name in array array['os_projects','os_project_members','os_tasks','os_campaigns','os_content_items','os_reports','os_knowledge_articles','os_roadmap_items','os_team_responsibilities'] loop execute format('alter table public.%I enable row level security',table_name); execute format('grant select on public.%I to authenticated',table_name); execute format('grant insert,update,delete on public.%I to authenticated',table_name); execute format('create policy %I_read on public.%I for select to authenticated using ((select private.has_any_role(array[''super_admin'',''content_manager'',''viewer'']::text[])))',table_name,table_name); execute format('create policy %I_manage on public.%I for all to authenticated using ((select private.has_any_role(array[''super_admin'',''content_manager'']::text[]))) with check ((select private.has_any_role(array[''super_admin'',''content_manager'']::text[])))',table_name,table_name); end loop; end $$;

drop policy os_team_responsibilities_manage on public.os_team_responsibilities;
create policy os_team_responsibilities_manage on public.os_team_responsibilities for all to authenticated using ((select private.has_any_role(array['super_admin']::text[]))) with check ((select private.has_any_role(array['super_admin']::text[])));

create or replace function public.sync_os_project_members(p_project_id uuid, p_member_ids uuid[])
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not private.has_any_role(array['super_admin','content_manager']::text[]) then
    raise exception using errcode='42501', message='OS_PERMISSION_DENIED';
  end if;
  if not exists (select 1 from public.os_projects where id=p_project_id) then
    raise exception using errcode='22023', message='OS_PROJECT_NOT_FOUND';
  end if;
  if exists (select 1 from unnest(coalesce(p_member_ids,'{}'::uuid[])) as members(member_id) where not exists (select 1 from public.profiles where id=members.member_id)) then
    raise exception using errcode='22023', message='OS_PROJECT_MEMBER_INVALID';
  end if;
  delete from public.os_project_members where project_id=p_project_id;
  insert into public.os_project_members(project_id,user_id)
  select p_project_id,members.member_id from unnest(coalesce(p_member_ids,'{}'::uuid[])) as members(member_id);
end; $$;
revoke all on function public.sync_os_project_members(uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.sync_os_project_members(uuid,uuid[]) to authenticated;

create or replace function public.set_os_team_member_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path='' as $$
declare previous_role text;
begin
  if auth.uid() is null or not private.has_any_role(array['super_admin']::text[]) then
    raise exception using errcode='42501', message='OS_PERMISSION_DENIED';
  end if;
  if p_role is null or p_role <> all(array['super_admin','content_manager','reservation_staff','viewer']::text[]) then
    raise exception using errcode='22023', message='OS_ROLE_INVALID';
  end if;
  select role into previous_role from public.profiles where id=p_user_id for update;
  if previous_role is null then raise exception using errcode='22023', message='OS_USER_NOT_FOUND'; end if;
  if previous_role='super_admin' and p_role<>'super_admin' and (select count(*) from public.profiles where role='super_admin') <= 1 then
    raise exception using errcode='22023', message='OS_LAST_SUPER_ADMIN_PROTECTED';
  end if;
  update public.profiles set role=p_role where id=p_user_id;
  if previous_role is distinct from p_role then
    insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
    values(auth.uid(),'update_role','profiles',p_user_id,jsonb_build_object('previous_role',previous_role,'new_role',p_role));
  end if;
end; $$;
revoke all on function public.set_os_team_member_role(uuid,text) from public,anon,authenticated;
grant execute on function public.set_os_team_member_role(uuid,text) to authenticated;

commit;
