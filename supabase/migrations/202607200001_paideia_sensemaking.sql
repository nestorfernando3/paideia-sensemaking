create extension if not exists pgcrypto;

create table public.ps_sessions (
  id uuid primary key default gen_random_uuid(),
  join_code text not null unique check (join_code ~ '^[A-Z2-9]{6}$'),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  grade_level text not null check (char_length(grade_level) between 1 and 30),
  topic text not null check (char_length(topic) between 3 and 160),
  learning_objective text not null check (char_length(learning_objective) between 10 and 800),
  success_criteria text not null check (char_length(success_criteria) between 10 and 800),
  status text not null default 'active' check (status in ('active', 'ended')),
  active_stage_run_id uuid,
  allow_free_ai_assistance boolean not null default false,
  ai_disclosure_version text,
  allow_collective_external_ai boolean not null default false,
  collective_ai_attested_at timestamptz,
  collective_ai_notice_version text,
  retention_obligation text,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.ps_members (
  session_id uuid not null references public.ps_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  display_name text not null check (char_length(display_name) between 1 and 80),
  free_ai_consent_at timestamptz,
  collective_external_ai_consent_at timestamptz,
  collective_external_ai_consent_version text,
  collective_external_ai_consent_revoked_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table public.ps_stage_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ps_sessions(id) on delete cascade,
  stage_kind text not null check (
    stage_kind in ('initial_response', 'intervention', 'transfer', 'reflection')
  ),
  sequence_number integer not null check (sequence_number > 0),
  status text not null default 'draft' check (
    status in ('draft', 'active', 'closed')
  ),
  activity_spec jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  activated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, sequence_number)
);

alter table public.ps_sessions
  add constraint ps_sessions_active_stage_fk
  foreign key (active_stage_run_id)
  references public.ps_stage_runs(id)
  on delete set null;

create table public.ps_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ps_sessions(id) on delete cascade,
  stage_run_id uuid not null references public.ps_stage_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_run_id, user_id)
);

create table public.ps_ai_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ps_sessions(id) on delete cascade,
  stage_run_id uuid references public.ps_stage_runs(id) on delete cascade,
  subject_user_id uuid references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  operation text not null check (
    operation in ('analyze_stage', 'compare_learning', 'assist_user')
  ),
  visibility text not null check (visibility in ('teacher', 'requester')),
  provider text not null default 'opencode_zen',
  requested_model text not null,
  used_model text,
  fallback_index integer not null check (fallback_index >= 0),
  is_free_model boolean not null check (is_free_model = true),
  prompt_version text not null,
  notice_version text not null,
  input_hash text not null,
  status text not null default 'pending' check (
    status in ('pending', 'running', 'succeeded', 'failed')
  ),
  result jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (requested_by, operation, input_hash)
);

create table public.ps_teacher_decisions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ps_sessions(id) on delete cascade,
  source_ai_run_id uuid references public.ps_ai_runs(id) on delete set null,
  source_stage_run_id uuid not null references public.ps_stage_runs(id) on delete cascade,
  option_key text not null,
  activity_spec jsonb not null,
  activated_stage_run_id uuid references public.ps_stage_runs(id) on delete set null,
  teacher_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index ps_members_user_idx on public.ps_members(user_id);
create index ps_stage_runs_session_idx on public.ps_stage_runs(session_id, sequence_number);
create index ps_responses_stage_idx on public.ps_responses(stage_run_id, created_at);
create index ps_ai_runs_session_idx on public.ps_ai_runs(session_id, created_at);

alter table public.ps_sessions enable row level security;
alter table public.ps_members enable row level security;
alter table public.ps_stage_runs enable row level security;
alter table public.ps_responses enable row level security;
alter table public.ps_ai_runs enable row level security;
alter table public.ps_teacher_decisions enable row level security;

create or replace function public.ps_is_member(target_session uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ps_members m
    where m.session_id = target_session
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.ps_is_teacher(target_session uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ps_members m
    where m.session_id = target_session
      and m.user_id = auth.uid()
      and m.role = 'teacher'
  );
$$;

create or replace function public.ps_create_session(
  p_join_code text,
  p_display_name text,
  p_grade_level text,
  p_topic text,
  p_learning_objective text,
  p_success_criteria text,
  p_allow_free_ai_assistance boolean,
  p_ai_disclosure_version text,
  p_allow_collective_external_ai boolean,
  p_collective_ai_notice_version text,
  p_teacher_attests_authorization boolean,
  p_initial_activity jsonb
)
returns public.ps_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  created_session public.ps_sessions;
  initial_stage public.ps_stage_runs;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(p_allow_collective_external_ai, false)
    and p_teacher_attests_authorization is not true then
    raise exception 'COLLECTIVE_AI_ATTESTATION_REQUIRED';
  end if;

  insert into public.ps_sessions (
    join_code,
    owner_user_id,
    grade_level,
    topic,
    learning_objective,
    success_criteria,
    allow_free_ai_assistance,
    ai_disclosure_version,
    allow_collective_external_ai,
    collective_ai_attested_at,
    collective_ai_notice_version
  )
  values (
    upper(p_join_code),
    auth.uid(),
    p_grade_level,
    p_topic,
    p_learning_objective,
    p_success_criteria,
    p_allow_free_ai_assistance,
    case when p_allow_free_ai_assistance then p_ai_disclosure_version else null end,
    coalesce(p_allow_collective_external_ai, false),
    case when p_allow_collective_external_ai then now() else null end,
    case when p_allow_collective_external_ai then p_collective_ai_notice_version else null end
  )
  returning * into created_session;

  insert into public.ps_members (
    session_id,
    user_id,
    role,
    display_name,
    free_ai_consent_at
  )
  values (
    created_session.id,
    auth.uid(),
    'teacher',
    p_display_name,
    case when p_allow_free_ai_assistance then now() else null end
  );

  insert into public.ps_stage_runs (
    session_id,
    stage_kind,
    sequence_number,
    activity_spec,
    created_by
  )
  values (
    created_session.id,
    'initial_response',
    1,
    p_initial_activity,
    auth.uid()
  )
  returning * into initial_stage;

  return created_session;
end;
$$;

create or replace function public.ps_join_session(
  p_join_code text,
  p_display_name text
)
returns public.ps_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  found_session public.ps_sessions;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into found_session
  from public.ps_sessions
  where join_code = upper(p_join_code)
    and status = 'active';

  if found_session.id is null then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  insert into public.ps_members(session_id, user_id, role, display_name)
  values(found_session.id, auth.uid(), 'student', p_display_name)
  on conflict (session_id, user_id)
  do update set display_name = excluded.display_name;

  return found_session;
end;
$$;

create or replace function public.ps_activate_stage(p_stage_run_id uuid)
returns public.ps_stage_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  target_stage public.ps_stage_runs;
begin
  select * into target_stage
  from public.ps_stage_runs
  where id = p_stage_run_id;

  if target_stage.id is null then
    raise exception 'STAGE_NOT_FOUND';
  end if;

  if not public.ps_is_teacher(target_stage.session_id) then
    raise exception 'TEACHER_REQUIRED';
  end if;

  update public.ps_stage_runs
  set status = 'closed', closed_at = coalesce(closed_at, now())
  where session_id = target_stage.session_id
    and status = 'active'
    and id <> target_stage.id;

  update public.ps_stage_runs
  set status = 'active', activated_at = coalesce(activated_at, now())
  where id = target_stage.id
  returning * into target_stage;

  update public.ps_sessions
  set active_stage_run_id = target_stage.id
  where id = target_stage.session_id;

  return target_stage;
end;
$$;

create or replace function public.ps_purge_expired_session_data(
  p_as_of timestamptz default now()
)
returns table (cleared_ai_results bigint, deleted_responses bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ps_ai_runs a
  set result = null
  from public.ps_sessions s
  where s.id = a.session_id
    and s.status = 'ended'
    and s.ended_at <= p_as_of - interval '24 hours'
    and nullif(btrim(s.retention_obligation), '') is null
    and a.result is not null;
  get diagnostics cleared_ai_results = row_count;

  delete from public.ps_responses r
  using public.ps_sessions s
  where s.id = r.session_id
    and s.status = 'ended'
    and s.ended_at <= p_as_of - interval '24 hours'
    and nullif(btrim(s.retention_obligation), '') is null;
  get diagnostics deleted_responses = row_count;

  return next;
end;
$$;

create policy ps_sessions_member_select
on public.ps_sessions for select
to authenticated
using (public.ps_is_member(id));

create policy ps_sessions_teacher_update
on public.ps_sessions for update
to authenticated
using (public.ps_is_teacher(id))
with check (public.ps_is_teacher(id));

create policy ps_members_member_select
on public.ps_members for select
to authenticated
using (public.ps_is_member(session_id));

create policy ps_members_self_update
on public.ps_members for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy ps_stage_runs_member_select
on public.ps_stage_runs for select
to authenticated
using (public.ps_is_member(session_id));

create policy ps_stage_runs_teacher_insert
on public.ps_stage_runs for insert
to authenticated
with check (
  public.ps_is_teacher(session_id)
  and created_by = auth.uid()
);

create policy ps_stage_runs_teacher_update
on public.ps_stage_runs for update
to authenticated
using (public.ps_is_teacher(session_id))
with check (public.ps_is_teacher(session_id));

create policy ps_responses_teacher_or_self_select
on public.ps_responses for select
to authenticated
using (
  public.ps_is_teacher(session_id)
  or user_id = auth.uid()
);

create policy ps_responses_self_insert
on public.ps_responses for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.ps_is_member(session_id)
  and exists (
    select 1 from public.ps_stage_runs s
    where s.id = ps_responses.stage_run_id
      and s.session_id = ps_responses.session_id
      and s.status = 'active'
  )
);

create policy ps_responses_self_update
on public.ps_responses for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy ps_ai_runs_visible_select
on public.ps_ai_runs for select
to authenticated
using (
  (visibility = 'teacher' and public.ps_is_teacher(session_id))
  or (visibility = 'requester' and requested_by = auth.uid())
);

create policy ps_teacher_decisions_teacher_select
on public.ps_teacher_decisions for select
to authenticated
using (public.ps_is_teacher(session_id));

create policy ps_teacher_decisions_teacher_insert
on public.ps_teacher_decisions for insert
to authenticated
with check (
  public.ps_is_teacher(session_id)
  and teacher_user_id = auth.uid()
);

grant select on public.ps_sessions,
  public.ps_members,
  public.ps_stage_runs,
  public.ps_responses,
  public.ps_ai_runs,
  public.ps_teacher_decisions
to authenticated;
grant update (status, ended_at, retention_obligation) on public.ps_sessions to authenticated;
grant update (
  display_name,
  free_ai_consent_at,
  collective_external_ai_consent_at,
  collective_external_ai_consent_version,
  collective_external_ai_consent_revoked_at
) on public.ps_members to authenticated;
grant insert on public.ps_stage_runs to authenticated;
grant update (activity_spec) on public.ps_stage_runs to authenticated;
grant insert on public.ps_responses to authenticated;
grant update (payload, updated_at) on public.ps_responses to authenticated;
grant insert on public.ps_teacher_decisions to authenticated;

revoke execute on function public.ps_create_session(
  text, text, text, text, text, text, boolean, text, boolean, text, boolean, jsonb
) from public;
revoke execute on function public.ps_join_session(text, text) from public;
revoke execute on function public.ps_activate_stage(uuid) from public;
revoke execute on function public.ps_purge_expired_session_data(timestamptz) from public;

grant execute on function public.ps_create_session(
  text, text, text, text, text, text, boolean, text, boolean, text, boolean, jsonb
) to authenticated;
grant execute on function public.ps_join_session(text, text) to authenticated;
grant execute on function public.ps_activate_stage(uuid) to authenticated;
grant execute on function public.ps_purge_expired_session_data(timestamptz) to service_role;

do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array[
    'ps_sessions',
    'ps_members',
    'ps_stage_runs',
    'ps_responses'
  ]
  loop
    if exists (
      select 1 from pg_publication where pubname = 'supabase_realtime'
    ) and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = realtime_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        realtime_table
      );
    end if;
  end loop;
end
$$;
