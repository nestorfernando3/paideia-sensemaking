create extension if not exists pg_cron;

create table public.ps_migration_audit (
  id bigint generated always as identity primary key,
  migration_version text not null,
  reason text not null check (reason in (
    'stages_deleted_during_hardening',
    'responses_deleted_during_hardening',
    'ai_runs_deleted_during_hardening',
    'teacher_decisions_deleted_during_hardening',
    'ai_results_cleared_by_upgrade_purge',
    'responses_deleted_by_upgrade_purge'
  )),
  affected_rows bigint not null check (affected_rows >= 0),
  created_at timestamptz not null default now()
);

alter table public.ps_migration_audit enable row level security;
revoke all on public.ps_migration_audit from public, anon, authenticated;
grant select on public.ps_migration_audit to service_role;

-- Counts only: no identifiers, names, payloads or response content are retained.
create temporary table ps_upgrade_pre_counts on commit drop as
select 'ps_stage_runs'::text as object_name, count(*)::bigint as row_count
from public.ps_stage_runs
union all
select 'ps_responses', count(*) from public.ps_responses
union all
select 'ps_ai_runs', count(*) from public.ps_ai_runs
union all
select 'ps_teacher_decisions', count(*) from public.ps_teacher_decisions;

-- Normalize rows accepted by 001 before validating stricter invariants.
-- A recorded end timestamp wins over an active flag; a missing timestamp on an
-- ended session falls back to created_at so retention is never postponed.
update public.ps_sessions
set status = 'ended'
where status = 'active'
  and ended_at is not null;

update public.ps_sessions
set ended_at = created_at
where status = 'ended'
  and ended_at is null;

-- Invalid notice configuration is disabled. No consent or attestation is
-- fabricated during upgrade.
update public.ps_sessions
set allow_free_ai_assistance = false
where allow_free_ai_assistance
  and nullif(btrim(ai_disclosure_version), '') is null;

update public.ps_sessions
set allow_collective_external_ai = false
where allow_collective_external_ai
  and (
    collective_ai_attested_at is null
    or nullif(btrim(collective_ai_notice_version), '') is null
  );

update public.ps_members
set collective_external_ai_consent_at = null,
    collective_external_ai_consent_version = null,
    collective_external_ai_consent_revoked_at = null
where collective_external_ai_consent_at is null
   or nullif(btrim(collective_external_ai_consent_version), '') is null;

-- A stage whose creator is not a member has no safe owner. Delete only that
-- ps_* stage; existing cascade rules remove its dependent ps_* artifacts.
delete from public.ps_stage_runs stage
where not exists (
  select 1
  from public.ps_members member
  where member.session_id = stage.session_id
    and member.user_id = stage.created_by
);

-- Required cross-session rows cannot be repaired without inventing ownership.
delete from public.ps_responses response
where not exists (
  select 1
  from public.ps_stage_runs stage
  where stage.id = response.stage_run_id
    and stage.session_id = response.session_id
);

delete from public.ps_ai_runs ai_run
where not exists (
  select 1
  from public.ps_members member
  where member.session_id = ai_run.session_id
    and member.user_id = ai_run.requested_by
);

-- Optional cross-session references are nulled instead of deleting the row.
update public.ps_ai_runs ai_run
set stage_run_id = null
where stage_run_id is not null
  and not exists (
    select 1
    from public.ps_stage_runs stage
    where stage.id = ai_run.stage_run_id
      and stage.session_id = ai_run.session_id
  );

update public.ps_ai_runs ai_run
set subject_user_id = null
where subject_user_id is not null
  and not exists (
    select 1
    from public.ps_members member
    where member.session_id = ai_run.session_id
      and member.user_id = ai_run.subject_user_id
  );

delete from public.ps_teacher_decisions decision
where not exists (
    select 1
    from public.ps_stage_runs stage
    where stage.id = decision.source_stage_run_id
      and stage.session_id = decision.session_id
  )
  or not exists (
    select 1
    from public.ps_members member
    where member.session_id = decision.session_id
      and member.user_id = decision.teacher_user_id
  );

update public.ps_teacher_decisions decision
set source_ai_run_id = null
where source_ai_run_id is not null
  and not exists (
    select 1
    from public.ps_ai_runs ai_run
    where ai_run.id = decision.source_ai_run_id
      and ai_run.session_id = decision.session_id
  );

update public.ps_teacher_decisions decision
set activated_stage_run_id = null
where activated_stage_run_id is not null
  and not exists (
    select 1
    from public.ps_stage_runs stage
    where stage.id = decision.activated_stage_run_id
      and stage.session_id = decision.session_id
  );

update public.ps_sessions session
set active_stage_run_id = null
where active_stage_run_id is not null
  and not exists (
    select 1
    from public.ps_stage_runs stage
    where stage.id = session.active_stage_run_id
      and stage.session_id = session.id
      and stage.status = 'active'
  );

update public.ps_stage_runs stage
set status = 'closed',
    closed_at = coalesce(stage.closed_at, session.ended_at, stage.created_at)
from public.ps_sessions session
where session.id = stage.session_id
  and session.status = 'ended'
  and stage.status = 'active';

update public.ps_sessions
set active_stage_run_id = null
where status = 'ended';

-- Preserve the explicitly selected active stage when possible; otherwise keep
-- the earliest stage deterministically and close only the duplicates.
with ranked_active_stages as (
  select stage.id,
         row_number() over (
           partition by stage.session_id
           order by
             (stage.id = session.active_stage_run_id) desc,
             stage.sequence_number,
             stage.id
         ) as active_rank
  from public.ps_stage_runs stage
  join public.ps_sessions session on session.id = stage.session_id
  where stage.status = 'active'
)
update public.ps_stage_runs stage
set status = 'closed',
    closed_at = coalesce(stage.closed_at, now())
from ranked_active_stages ranked
where ranked.id = stage.id
  and ranked.active_rank > 1;

insert into public.ps_migration_audit (
  migration_version, reason, affected_rows
)
select '202607200003', 'stages_deleted_during_hardening',
       row_count - (select count(*) from public.ps_stage_runs)
from ps_upgrade_pre_counts where object_name = 'ps_stage_runs'
union all
select '202607200003', 'responses_deleted_during_hardening',
       row_count - (select count(*) from public.ps_responses)
from ps_upgrade_pre_counts where object_name = 'ps_responses'
union all
select '202607200003', 'ai_runs_deleted_during_hardening',
       row_count - (select count(*) from public.ps_ai_runs)
from ps_upgrade_pre_counts where object_name = 'ps_ai_runs'
union all
select '202607200003', 'teacher_decisions_deleted_during_hardening',
       row_count - (select count(*) from public.ps_teacher_decisions)
from ps_upgrade_pre_counts where object_name = 'ps_teacher_decisions';

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

-- 001 used a 24-hour threshold. The hourly job below needs a 23-hour
-- threshold so execution occurs in [23h, 24h) regardless of scheduler phase.
create or replace function public.ps_purge_expired_session_data(
  p_as_of timestamptz default now()
)
returns table (cleared_ai_results bigint, deleted_responses bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ps_ai_runs ai_run
  set result = null
  from public.ps_sessions session
  where session.id = ai_run.session_id
    and session.status = 'ended'
    and session.ended_at <= p_as_of - interval '23 hours'
    and nullif(btrim(session.retention_obligation), '') is null
    and ai_run.result is not null;
  get diagnostics cleared_ai_results = row_count;

  delete from public.ps_responses response
  using public.ps_sessions session
  where session.id = response.session_id
    and session.status = 'ended'
    and session.ended_at <= p_as_of - interval '23 hours'
    and nullif(btrim(session.retention_obligation), '') is null;
  get diagnostics deleted_responses = row_count;

  return next;
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
revoke execute on function public.ps_get_collective_ai_responses(uuid, uuid[])
from public, authenticated;

grant execute on function public.ps_is_member(uuid) to authenticated, service_role;
grant execute on function public.ps_is_teacher(uuid) to authenticated, service_role;
grant execute on function public.ps_end_session(uuid) to authenticated;
grant execute on function public.ps_get_collective_ai_responses(uuid, uuid[])
to service_role;

do $$
declare
  existing_job bigint;
  cleared_ai_results bigint;
  deleted_responses bigint;
begin
  -- Close the scheduler gap during upgrade. The function is idempotent and
  -- preserves every session with a documented retention obligation.
  select purge.cleared_ai_results, purge.deleted_responses
  into cleared_ai_results, deleted_responses
  from public.ps_purge_expired_session_data() purge;

  insert into public.ps_migration_audit (
    migration_version, reason, affected_rows
  )
  values
    (
      '202607200003', 'ai_results_cleared_by_upgrade_purge',
      cleared_ai_results
    ),
    (
      '202607200003', 'responses_deleted_by_upgrade_purge',
      deleted_responses
    );

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
