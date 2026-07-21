create or replace function public.ps_reserve_ai_run(
  p_session_id uuid,
  p_stage_run_id uuid,
  p_subject_user_id uuid,
  p_operation text,
  p_visibility text,
  p_requested_model text,
  p_prompt_version text,
  p_notice_version text,
  p_input_hash text
)
returns public.ps_ai_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  target_session public.ps_sessions;
  target_member public.ps_members;
  run_count integer;
  existing_run public.ps_ai_runs;
  new_run public.ps_ai_runs;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_requested_model not in (
    'nemotron-3-ultra-free',
    'deepseek-v4-flash-free',
    'mimo-v2.5-free'
  ) then
    raise exception 'FREE_MODEL_REQUIRED';
  end if;

  if p_operation not in ('analyze_stage', 'compare_learning', 'assist_user')
    or p_input_hash !~ '^[0-9a-f]{64}$'
    or nullif(btrim(p_prompt_version), '') is null then
    raise exception 'INVALID_AI_RESERVATION';
  end if;

  select * into target_session
  from public.ps_sessions
  where id = p_session_id and status = 'active';
  if not found then
    raise exception 'SESSION_NOT_ACTIVE';
  end if;

  select * into target_member
  from public.ps_members
  where session_id = p_session_id and user_id = caller_id;
  if not found then
    raise exception 'MEMBER_REQUIRED';
  end if;

  if not exists (
    select 1 from public.ps_stage_runs
    where id = p_stage_run_id and session_id = p_session_id
  ) then
    raise exception 'STAGE_NOT_FOUND';
  end if;

  if p_operation in ('analyze_stage', 'compare_learning') then
    if target_member.role <> 'teacher' then
      raise exception 'TEACHER_REQUIRED';
    end if;
    if p_visibility <> 'teacher' or p_subject_user_id is not null then
      raise exception 'INVALID_AI_VISIBILITY';
    end if;
    if not target_session.allow_collective_external_ai
      or target_session.collective_ai_attested_at is null
      or nullif(btrim(target_session.collective_ai_notice_version), '') is null
      or p_notice_version is distinct from target_session.collective_ai_notice_version then
      raise exception 'COLLECTIVE_AI_NOT_AUTHORIZED';
    end if;
  else
    if p_visibility <> 'requester' or p_subject_user_id is distinct from caller_id then
      raise exception 'INVALID_AI_VISIBILITY';
    end if;
    if not target_session.allow_free_ai_assistance
      or nullif(btrim(target_session.ai_disclosure_version), '') is null
      or target_member.free_ai_consent_at is null
      or p_notice_version is distinct from target_session.ai_disclosure_version then
      raise exception 'FREE_AI_CONSENT_REQUIRED';
    end if;
  end if;

  -- One lock per caller/stage/operation serializes idempotency and rate checks.
  perform pg_advisory_xact_lock(hashtextextended(
    caller_id::text || ':' || p_session_id::text || ':' ||
    p_stage_run_id::text || ':' || p_operation,
    0
  ));

  select * into existing_run
  from public.ps_ai_runs
  where requested_by = caller_id
    and operation = p_operation
    and input_hash = p_input_hash;
  if found then
    return existing_run;
  end if;

  if p_operation = 'assist_user' then
    select count(*) into run_count
    from public.ps_ai_runs
    where session_id = p_session_id
      and stage_run_id = p_stage_run_id
      and requested_by = caller_id
      and operation = 'assist_user'
      and status in ('pending', 'running', 'succeeded');
    if run_count >= 3 then
      raise exception 'RATE_LIMIT_ASSIST_EXCEEDED';
    end if;
  elsif p_operation = 'analyze_stage' then
    select count(*) into run_count
    from public.ps_ai_runs
    where session_id = p_session_id
      and stage_run_id = p_stage_run_id
      and requested_by = caller_id
      and operation = 'analyze_stage'
      and status in ('pending', 'running', 'succeeded');
    if run_count >= 5 then
      raise exception 'RATE_LIMIT_ANALYZE_EXCEEDED';
    end if;
  end if;

  insert into public.ps_ai_runs (
    session_id, stage_run_id, subject_user_id, requested_by,
    operation, visibility, requested_model, used_model, fallback_index,
    is_free_model, prompt_version, notice_version, input_hash, status
  ) values (
    p_session_id, p_stage_run_id, p_subject_user_id, caller_id,
    p_operation, p_visibility, p_requested_model, null, 0,
    true, p_prompt_version, p_notice_version, p_input_hash, 'pending'
  )
  returning * into new_run;

  return new_run;
end;
$$;

revoke execute on function public.ps_reserve_ai_run(
  uuid, uuid, uuid, text, text, text, text, text, text
) from public, anon;

grant execute on function public.ps_reserve_ai_run(
  uuid, uuid, uuid, text, text, text, text, text, text
) to authenticated;
