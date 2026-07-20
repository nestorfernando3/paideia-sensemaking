create extension if not exists pg_cron;

alter table public.ps_sessions
  add constraint ps_sessions_status_ended_at_check check (
    (status = 'active' and ended_at is null)
    or (status = 'ended' and ended_at is not null)
  ),
  add constraint ps_sessions_ended_without_active_stage_check check (
    status = 'active' or active_stage_run_id is null
  ),
  add constraint ps_sessions_free_ai_notice_check check (
    not allow_free_ai_assistance
    or nullif(btrim(ai_disclosure_version), '') is not null
  ),
  add constraint ps_sessions_collective_ai_notice_check check (
    not allow_collective_external_ai
    or (
      collective_ai_attested_at is not null
      and nullif(btrim(collective_ai_notice_version), '') is not null
    )
  );

alter table public.ps_members
  add constraint ps_members_collective_consent_check check (
    (
      collective_external_ai_consent_at is null
      and collective_external_ai_consent_version is null
      and collective_external_ai_consent_revoked_at is null
    )
    or (
      collective_external_ai_consent_at is not null
      and nullif(btrim(collective_external_ai_consent_version), '') is not null
    )
  );

alter table public.ps_stage_runs
  add constraint ps_stage_runs_session_id_id_key unique (session_id, id),
  add constraint ps_stage_runs_creator_member_fk
    foreign key (session_id, created_by)
    references public.ps_members(session_id, user_id);

create unique index ps_stage_runs_one_active_idx
on public.ps_stage_runs(session_id)
where status = 'active';

alter table public.ps_sessions
  drop constraint ps_sessions_active_stage_fk,
  add constraint ps_sessions_active_stage_fk
    foreign key (id, active_stage_run_id)
    references public.ps_stage_runs(session_id, id)
    on delete set null (active_stage_run_id);

alter table public.ps_responses
  drop constraint ps_responses_stage_run_id_fkey,
  add constraint ps_responses_stage_session_fk
    foreign key (session_id, stage_run_id)
    references public.ps_stage_runs(session_id, id)
    on delete cascade;

alter table public.ps_ai_runs
  add constraint ps_ai_runs_session_id_id_key unique (session_id, id),
  drop constraint ps_ai_runs_stage_run_id_fkey,
  add constraint ps_ai_runs_stage_session_fk
    foreign key (session_id, stage_run_id)
    references public.ps_stage_runs(session_id, id)
    on delete cascade,
  add constraint ps_ai_runs_requester_member_fk
    foreign key (session_id, requested_by)
    references public.ps_members(session_id, user_id),
  add constraint ps_ai_runs_subject_member_fk
    foreign key (session_id, subject_user_id)
    references public.ps_members(session_id, user_id)
    on delete cascade;

alter table public.ps_teacher_decisions
  drop constraint ps_teacher_decisions_source_ai_run_id_fkey,
  drop constraint ps_teacher_decisions_source_stage_run_id_fkey,
  drop constraint ps_teacher_decisions_activated_stage_run_id_fkey,
  add constraint ps_teacher_decisions_source_ai_session_fk
    foreign key (session_id, source_ai_run_id)
    references public.ps_ai_runs(session_id, id)
    on delete set null (source_ai_run_id),
  add constraint ps_teacher_decisions_source_stage_session_fk
    foreign key (session_id, source_stage_run_id)
    references public.ps_stage_runs(session_id, id)
    on delete cascade,
  add constraint ps_teacher_decisions_activated_stage_session_fk
    foreign key (session_id, activated_stage_run_id)
    references public.ps_stage_runs(session_id, id)
    on delete set null (activated_stage_run_id),
  add constraint ps_teacher_decisions_teacher_member_fk
    foreign key (session_id, teacher_user_id)
    references public.ps_members(session_id, user_id);

drop policy ps_stage_runs_teacher_insert on public.ps_stage_runs;
create policy ps_stage_runs_teacher_insert
on public.ps_stage_runs for insert
to authenticated
with check (
  public.ps_is_teacher(session_id)
  and created_by = auth.uid()
  and status = 'draft'
  and exists (
    select 1
    from public.ps_sessions session
    where session.id = ps_stage_runs.session_id
      and session.status = 'active'
  )
);

drop policy ps_responses_self_insert on public.ps_responses;
create policy ps_responses_self_insert
on public.ps_responses for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.ps_is_member(session_id)
  and exists (
    select 1
    from public.ps_stage_runs stage
    join public.ps_sessions session on session.id = stage.session_id
    where stage.id = ps_responses.stage_run_id
      and stage.session_id = ps_responses.session_id
      and stage.status = 'active'
      and session.status = 'active'
  )
);

drop policy ps_responses_self_update on public.ps_responses;
create policy ps_responses_self_update
on public.ps_responses for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.ps_stage_runs stage
    join public.ps_sessions session on session.id = stage.session_id
    where stage.id = ps_responses.stage_run_id
      and stage.session_id = ps_responses.session_id
      and stage.status = 'active'
      and session.status = 'active'
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.ps_stage_runs stage
    join public.ps_sessions session on session.id = stage.session_id
    where stage.id = ps_responses.stage_run_id
      and stage.session_id = ps_responses.session_id
      and stage.status = 'active'
      and session.status = 'active'
  )
);

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

  perform 1
  from public.ps_sessions
  where id = target_stage.session_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'SESSION_ENDED';
  end if;

  update public.ps_stage_runs
  set status = 'closed', closed_at = coalesce(closed_at, now())
  where session_id = target_stage.session_id
    and status = 'active'
    and id <> target_stage.id;

  update public.ps_stage_runs
  set status = 'active',
      activated_at = coalesce(activated_at, now()),
      closed_at = null
  where id = target_stage.id
  returning * into target_stage;

  update public.ps_sessions
  set active_stage_run_id = target_stage.id
  where id = target_stage.session_id;

  return target_stage;
end;
$$;

create or replace function public.ps_end_session(p_session_id uuid)
returns public.ps_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.ps_sessions;
begin
  if not public.ps_is_teacher(p_session_id) then
    raise exception 'TEACHER_REQUIRED';
  end if;

  select * into target_session
  from public.ps_sessions
  where id = p_session_id
  for update;

  if target_session.id is null then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  update public.ps_stage_runs
  set status = 'closed', closed_at = coalesce(closed_at, now())
  where session_id = p_session_id
    and status = 'active';

  update public.ps_sessions
  set status = 'ended',
      ended_at = coalesce(ended_at, now()),
      active_stage_run_id = null
  where id = p_session_id
  returning * into target_session;

  return target_session;
end;
$$;

create or replace function public.ps_get_collective_ai_responses(
  p_session_id uuid,
  p_stage_run_ids uuid[]
)
returns table (
  response_id uuid,
  stage_run_id uuid,
  subject_user_id uuid,
  payload jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role'
    and not public.ps_is_teacher(p_session_id) then
    raise exception 'TEACHER_REQUIRED';
  end if;

  return query
  select response.id, response.stage_run_id, response.user_id, response.payload
  from public.ps_responses response
  join public.ps_sessions session on session.id = response.session_id
  join public.ps_members member
    on member.session_id = response.session_id
   and member.user_id = response.user_id
  where response.session_id = p_session_id
    and response.stage_run_id = any(p_stage_run_ids)
    and session.status = 'active'
    and session.allow_collective_external_ai
    and session.collective_ai_attested_at is not null
    and nullif(btrim(session.collective_ai_notice_version), '') is not null
    and member.collective_external_ai_consent_at is not null
    and member.collective_external_ai_consent_revoked_at is null
    and member.collective_external_ai_consent_version = session.collective_ai_notice_version
  order by response.created_at, response.id;
end;
$$;

revoke update on public.ps_sessions from authenticated;

revoke execute on function public.ps_is_member(uuid) from public;
revoke execute on function public.ps_is_teacher(uuid) from public;
revoke execute on function public.ps_end_session(uuid) from public;
revoke execute on function public.ps_get_collective_ai_responses(uuid, uuid[]) from public;

grant execute on function public.ps_is_member(uuid) to authenticated, service_role;
grant execute on function public.ps_is_teacher(uuid) to authenticated, service_role;
grant execute on function public.ps_end_session(uuid) to authenticated;
grant execute on function public.ps_get_collective_ai_responses(uuid, uuid[])
to authenticated, service_role;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'ps_purge_expired_session_data';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'ps_purge_expired_session_data',
    '0 * * * *',
    'select public.ps_purge_expired_session_data();'
  );
end
$$;
