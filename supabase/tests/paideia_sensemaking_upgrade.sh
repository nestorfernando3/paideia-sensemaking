#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f supabase/config.toml ]]; then
  echo "Run from the repository root." >&2
  exit 1
fi

task2_db_container="supabase_db_Paideia_Hackaton"

restore_latest_schema() {
  echo "Restoring latest local schema..."
  npx supabase db reset >/dev/null
}
trap restore_latest_schema EXIT

npx supabase db reset --version 202607200001 --no-seed

docker exec -i "$task2_db_container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<'SQL'
insert into auth.users(id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003');

insert into public.ps_sessions(
  id, join_code, owner_user_id, grade_level, topic,
  learning_objective, success_criteria, status, ended_at,
  allow_free_ai_assistance, allow_collective_external_ai,
  retention_obligation
) values
  (
    '10000000-0000-0000-0000-000000000101', 'UPGRAA',
    '10000000-0000-0000-0000-000000000001', '10', 'Legacy inválido',
    'Normalizar datos heredados', 'Conservar únicamente datos seguros',
    'ended', null, true, true, null
  ),
  (
    '10000000-0000-0000-0000-000000000102', 'UPGRBB',
    '10000000-0000-0000-0000-000000000002', '10', 'Otra sesión',
    'Probar referencias cruzadas', 'Eliminar referencias inseguras',
    'active', null, false, false, null
  ),
  (
    '10000000-0000-0000-0000-000000000103', 'UPGRCC',
    '10000000-0000-0000-0000-000000000001', '10', 'Purga inmediata',
    'Cerrar la ventana del scheduler', 'Purgar antes de veinticuatro horas',
    'ended', now() - interval '23 hours 59 minutes', false, false, null
  ),
  (
    '10000000-0000-0000-0000-000000000104', 'UPGRDD',
    '10000000-0000-0000-0000-000000000001', '10', 'Retención obligatoria',
    'Respetar obligación documentada', 'Conservar datos bajo obligación',
    'ended', now() - interval '23 hours 59 minutes', false, false,
    'legal hold fixture'
  );

insert into public.ps_members(
  session_id, user_id, role, display_name,
  collective_external_ai_consent_version,
  collective_external_ai_consent_revoked_at
) values
  ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', 'teacher', 'Docente', null, null),
  ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000002', 'student', 'Consentimiento inválido', 'v-old', now()),
  ('10000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000002', 'teacher', 'Otro docente', null, null),
  ('10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001', 'teacher', 'Docente', null, null),
  ('10000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000001', 'teacher', 'Docente', null, null);

insert into public.ps_stage_runs(
  id, session_id, stage_kind, sequence_number, status, activity_spec, created_by
) values
  ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000101', 'initial_response', 1, 'active', '{}', '10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000101', 'transfer', 2, 'active', '{}', '10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000102', 'initial_response', 1, 'active', '{}', '10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000101', 'reflection', 3, 'draft', '{}', '10000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000103', 'initial_response', 1, 'closed', '{}', '10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000104', 'initial_response', 1, 'closed', '{}', '10000000-0000-0000-0000-000000000001');

update public.ps_sessions
set active_stage_run_id = '10000000-0000-0000-0000-000000000203'
where id = '10000000-0000-0000-0000-000000000101';

insert into public.ps_responses(session_id, stage_run_id, user_id, payload) values
  ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000001', '{"sensitive":"must-not-be-audited"}'),
  ('10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000001', '{"answer":"expired"}'),
  ('10000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000001', '{"answer":"retained"}');

insert into public.ps_ai_runs(
  session_id, stage_run_id, subject_user_id, requested_by,
  operation, visibility, requested_model, fallback_index, is_free_model,
  prompt_version, notice_version, input_hash, result
) values
  ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'analyze_stage', 'teacher', 'free-model', 0, true, 'v1', 'v1', 'invalid-ai', '{"sensitive":"must-not-be-audited"}'),
  ('10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000205', null, '10000000-0000-0000-0000-000000000001', 'analyze_stage', 'teacher', 'free-model', 0, true, 'v1', 'v1', 'expired-ai', '{"extract":"expired"}'),
  ('10000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000206', null, '10000000-0000-0000-0000-000000000001', 'analyze_stage', 'teacher', 'free-model', 0, true, 'v1', 'v1', 'retained-ai', '{"extract":"retained"}');

insert into public.ps_teacher_decisions(
  session_id, source_stage_run_id, option_key, activity_spec, teacher_user_id
) values (
  '10000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000203',
  'invalid-decision', '{}', '10000000-0000-0000-0000-000000000003'
);
SQL

npx supabase migration up --local

docker exec -i "$task2_db_container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<'SQL'
do $$
begin
  if not exists (
    select 1 from public.ps_sessions
    where id = '10000000-0000-0000-0000-000000000101'
      and status = 'ended'
      and ended_at is not null
      and active_stage_run_id is null
      and not allow_free_ai_assistance
      and not allow_collective_external_ai
  ) then raise exception 'legacy session was not normalized'; end if;

  if exists (
    select 1 from public.ps_members
    where session_id = '10000000-0000-0000-0000-000000000101'
      and user_id = '10000000-0000-0000-0000-000000000002'
      and (
        collective_external_ai_consent_at is not null
        or collective_external_ai_consent_version is not null
        or collective_external_ai_consent_revoked_at is not null
      )
  ) then raise exception 'invalid consent was not cleared'; end if;

  if exists (select 1 from public.ps_stage_runs where id = '10000000-0000-0000-0000-000000000204')
    or exists (select 1 from public.ps_responses where session_id = '10000000-0000-0000-0000-000000000101')
    or exists (select 1 from public.ps_ai_runs where input_hash = 'invalid-ai')
    or exists (select 1 from public.ps_teacher_decisions where option_key = 'invalid-decision')
  then raise exception 'unsafe legacy rows survived'; end if;

  if exists (select 1 from public.ps_responses where session_id = '10000000-0000-0000-0000-000000000103')
    or exists (select 1 from public.ps_ai_runs where input_hash = 'expired-ai' and result is not null)
  then raise exception 'upgrade purge did not run immediately'; end if;

  if not exists (select 1 from public.ps_responses where session_id = '10000000-0000-0000-0000-000000000104')
    or not exists (select 1 from public.ps_ai_runs where input_hash = 'retained-ai' and result is not null)
  then raise exception 'documented retention obligation was ignored'; end if;

  if (select affected_rows from public.ps_migration_audit where reason = 'stages_deleted_during_hardening') <> 1
    or (select affected_rows from public.ps_migration_audit where reason = 'responses_deleted_during_hardening') <> 1
    or (select affected_rows from public.ps_migration_audit where reason = 'ai_runs_deleted_during_hardening') <> 1
    or (select affected_rows from public.ps_migration_audit where reason = 'teacher_decisions_deleted_during_hardening') <> 1
    or (select affected_rows from public.ps_migration_audit where reason = 'ai_results_cleared_by_upgrade_purge') <> 1
    or (select affected_rows from public.ps_migration_audit where reason = 'responses_deleted_by_upgrade_purge') <> 1
  then raise exception 'sanitization audit counts are incomplete'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ps_migration_audit'
      and column_name in ('payload', 'user_id', 'display_name', 'session_id', 'response_id')
  ) then raise exception 'audit schema can retain payloads or PII'; end if;
end
$$;
SQL

echo "PASS: incremental hardening, immediate purge, retention, and audit"
