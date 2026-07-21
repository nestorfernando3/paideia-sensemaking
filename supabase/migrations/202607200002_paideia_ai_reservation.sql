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
  caller_id uuid;
  is_teacher boolean;
  is_member boolean;
  run_count integer;
  existing_run public.ps_ai_runs;
  new_run public.ps_ai_runs;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select public.ps_is_member(p_session_id) into is_member;
  if not is_member then
    raise exception 'MEMBER_REQUIRED';
  end if;

  select public.ps_is_teacher(p_session_id) into is_teacher;

  if p_operation in ('analyze_stage', 'compare_learning') and not is_teacher then
    raise exception 'TEACHER_REQUIRED';
  end if;

  -- Idempotency check: if run already exists for this hash and operation by this user, return it
  select * into existing_run
  from public.ps_ai_runs
  where requested_by = caller_id
    and operation = p_operation
    and input_hash = p_input_hash;

  if existing_run.id is not null then
    return existing_run;
  end if;

  -- Rate limiting checks
  if p_operation = 'assist_user' and p_stage_run_id is not null then
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
  end if;

  if p_operation = 'analyze_stage' and p_stage_run_id is not null then
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
    session_id,
    stage_run_id,
    subject_user_id,
    requested_by,
    operation,
    visibility,
    requested_model,
    used_model,
    fallback_index,
    is_free_model,
    prompt_version,
    notice_version,
    input_hash,
    status
  )
  values (
    p_session_id,
    p_stage_run_id,
    p_subject_user_id,
    caller_id,
    p_operation,
    p_visibility,
    p_requested_model,
    null,
    0,
    true,
    p_prompt_version,
    p_notice_version,
    p_input_hash,
    'pending'
  )
  returning * into new_run;

  return new_run;
end;
$$;

grant execute on function public.ps_reserve_ai_run(
  uuid, uuid, uuid, text, text, text, text, text, text
) to authenticated;
