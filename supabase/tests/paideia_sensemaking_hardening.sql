begin;
select plan(58);

select has_table(
  'public', 'ps_migration_audit',
  'El saneamiento incremental deja auditoría durable sin payloads'
);

select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ps_migration_audit'
      and column_name in (
        'payload', 'user_id', 'display_name', 'session_id', 'response_id'
      )
  ),
  0::bigint,
  'La auditoría no tiene columnas para payloads, PII o identificadores'
);

select is(
  (select count(*) from public.ps_migration_audit
    where reason like '%_during_hardening'),
  4::bigint,
  'El saneamiento registra conteos por objeto incluso cuando son cero'
);

select is(
  (select count(*) from public.ps_migration_audit
    where reason like '%_by_upgrade_purge'),
  2::bigint,
  'La purga inmediata del upgrade queda auditada'
);

select ok(
  position(
    'interval ''23 hours''' in pg_get_functiondef(
      'public.ps_purge_expired_session_data(timestamptz)'::regprocedure
    )
  ) > 0,
  'La migración incremental redefine la purga con umbral de 23 horas'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.ps_get_collective_ai_responses(uuid,uuid[])',
    'EXECUTE'
  ),
  'authenticated no puede ejecutar la extracción colectiva'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.ps_get_collective_ai_responses(uuid,uuid[])',
    'EXECUTE'
  ),
  'service_role puede ejecutar la extracción colectiva'
);

insert into auth.users (id)
values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000013'),
  ('00000000-0000-0000-0000-000000000014'),
  ('00000000-0000-0000-0000-000000000015'),
  ('00000000-0000-0000-0000-000000000016'),
  ('00000000-0000-0000-0000-000000000017');

insert into public.ps_sessions (
  id, join_code, owner_user_id, grade_level, topic,
  learning_objective, success_criteria, status, ended_at, retention_obligation,
  allow_collective_external_ai, collective_ai_attested_at, collective_ai_notice_version
)
values
  (
    '00000000-0000-0000-0000-000000000111', 'JOINAA',
    '00000000-0000-0000-0000-000000000011', '10', 'Consentimiento',
    'Filtrar evidencia autorizada', 'Excluir respuestas no consentidas',
    'active', null, null, true, now(), 'collective-v2'
  ),
  (
    '00000000-0000-0000-0000-000000000112', 'JOINBB',
    '00000000-0000-0000-0000-000000000012', '10', 'Otra sesión',
    'Probar referencias compuestas', 'Impedir referencias entre sesiones',
    'active', null, null, false, null, null
  ),
  (
    '00000000-0000-0000-0000-000000000113', 'JOINCC',
    '00000000-0000-0000-0000-000000000011', '10', 'Purga vencida',
    'Purgar evidencia vencida', 'Eliminar después del umbral seguro',
    'ended', '2026-07-19 12:59:00+00', null, false, null, null
  ),
  (
    '00000000-0000-0000-0000-000000000114', 'JOINDD',
    '00000000-0000-0000-0000-000000000011', '10', 'Purga pendiente',
    'Conservar evidencia no vencida', 'Mantener datos antes del umbral',
    'ended', '2026-07-19 13:01:00+00', null, false, null, null
  ),
  (
    '00000000-0000-0000-0000-000000000115', 'JOINEE',
    '00000000-0000-0000-0000-000000000011', '10', 'Obligación vacía',
    'Tratar texto vacío como ausencia', 'No eludir purga con espacios',
    'ended', '2026-07-19 11:59:00+00', '   ', false, null, null
  ),
  (
    '00000000-0000-0000-0000-000000000116', 'JOINFF',
    '00000000-0000-0000-0000-000000000011', '10', 'Política de etapa',
    'Forzar activación mediante RPC', 'Rechazar activación directa',
    'active', null, null, false, null, null
  );

insert into public.ps_members (
  session_id, user_id, role, display_name,
  collective_external_ai_consent_at,
  collective_external_ai_consent_version,
  collective_external_ai_consent_revoked_at
)
values
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000011', 'teacher', 'Docente Uno', null, null, null),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000013', 'student', 'Consentido', now(), 'collective-v2', null),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000014', 'student', 'Sin consentimiento', null, null, null),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000015', 'student', 'Retirado', now(), 'collective-v2', now()),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000017', 'student', 'Versión vieja', now(), 'collective-v1', null),
  ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000012', 'teacher', 'Docente Dos', null, null, null),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000011', 'teacher', 'Docente Uno', null, null, null),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000013', 'student', 'Consentido', null, null, null),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000014', 'student', 'Sin consentimiento', null, null, null),
  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000011', 'teacher', 'Docente Uno', null, null, null),
  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000013', 'student', 'Consentido', null, null, null),
  ('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000011', 'teacher', 'Docente Uno', null, null, null),
  ('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000013', 'student', 'Consentido', null, null, null),
  ('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000011', 'teacher', 'Docente Uno', null, null, null);

insert into public.ps_stage_runs (
  id, session_id, stage_kind, sequence_number, status, activity_spec, created_by
)
values
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000111', 'initial_response', 1, 'active', '{}', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000111', 'intervention', 2, 'draft', '{}', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000112', 'initial_response', 1, 'active', '{}', '00000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000113', 'initial_response', 1, 'active', '{}', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000114', 'initial_response', 1, 'closed', '{}', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000216', '00000000-0000-0000-0000-000000000115', 'initial_response', 1, 'closed', '{}', '00000000-0000-0000-0000-000000000011');

insert into public.ps_responses (id, session_id, stage_run_id, user_id, payload)
values
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000013', '{"answer":"consented"}'),
  ('00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000014', '{"answer":"not-consented"}'),
  ('00000000-0000-0000-0000-000000000313', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000015', '{"answer":"revoked"}'),
  ('00000000-0000-0000-0000-000000000314', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000017', '{"answer":"old-version"}'),
  ('00000000-0000-0000-0000-000000000315', '00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000013', '{"answer":"expired"}'),
  ('00000000-0000-0000-0000-000000000316', '00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000013', '{"answer":"not-due"}'),
  ('00000000-0000-0000-0000-000000000317', '00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000216', '00000000-0000-0000-0000-000000000013', '{"answer":"blank-obligation"}');

insert into public.ps_ai_runs (
  id, session_id, stage_run_id, requested_by, operation, visibility,
  requested_model, used_model, fallback_index, is_free_model,
  prompt_version, notice_version, input_hash, status, result
)
values
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000012', 'analyze_stage', 'teacher', 'free-model', 'free-model', 0, true, 'prompt-v1', 'notice-v1', 'other-session', 'succeeded', '{}'),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000011', 'analyze_stage', 'teacher', 'free-model', 'free-model', 0, true, 'prompt-v1', 'notice-v1', 'expired', 'succeeded', '{"extract":"expired"}'),
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000011', 'analyze_stage', 'teacher', 'free-model', 'free-model', 0, true, 'prompt-v1', 'notice-v1', 'not-due', 'succeeded', '{"extract":"not-due"}'),
  ('00000000-0000-0000-0000-000000000414', '00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000216', '00000000-0000-0000-0000-000000000011', 'analyze_stage', 'teacher', 'free-model', 'free-model', 0, true, 'prompt-v1', 'notice-v1', 'blank-obligation', 'succeeded', '{"extract":"blank-obligation"}');

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000016';

select is(
  (select count(*) from public.ps_sessions where id = '00000000-0000-0000-0000-000000000111'),
  0::bigint,
  'Un usuario externo no puede leer una sesión antes de unirse'
);

select lives_ok(
  $$select public.ps_join_session('JOINAA', 'Usuario externo')$$,
  'El usuario externo puede unirse mediante la RPC'
);

select is(
  (select count(*) from public.ps_sessions where id = '00000000-0000-0000-0000-000000000111'),
  1::bigint,
  'El nuevo miembro puede leer la sesión después de unirse'
);

reset role;

select throws_ok(
  $$insert into public.ps_stage_runs (
      session_id, stage_kind, sequence_number, status, activity_spec, created_by
    ) values (
      '00000000-0000-0000-0000-000000000111', 'transfer', 3, 'active', '{}',
      '00000000-0000-0000-0000-000000000011'
    )$$,
  '23505', 'duplicate key value violates unique constraint "ps_stage_runs_one_active_idx"',
  'El índice impide dos etapas activas aun con escrituras concurrentes'
);

select throws_ok(
  $$update public.ps_sessions
    set active_stage_run_id = '00000000-0000-0000-0000-000000000213'
    where id = '00000000-0000-0000-0000-000000000111'$$,
  '23503', 'insert or update on table "ps_sessions" violates foreign key constraint "ps_sessions_active_stage_fk"',
  'active_stage_run_id no puede apuntar a otra sesión'
);

select throws_ok(
  $$insert into public.ps_responses (session_id, stage_run_id, user_id, payload)
    values (
      '00000000-0000-0000-0000-000000000111',
      '00000000-0000-0000-0000-000000000213',
      '00000000-0000-0000-0000-000000000013', '{}'
    )$$,
  '23503', 'insert or update on table "ps_responses" violates foreign key constraint "ps_responses_stage_session_fk"',
  'Una respuesta no puede referenciar una etapa de otra sesión'
);

select throws_ok(
  $$insert into public.ps_ai_runs (
      session_id, stage_run_id, requested_by, operation, visibility,
      requested_model, fallback_index, is_free_model,
      prompt_version, notice_version, input_hash
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '00000000-0000-0000-0000-000000000213',
      '00000000-0000-0000-0000-000000000011',
      'analyze_stage', 'teacher', 'free-model', 0, true,
      'prompt-v1', 'notice-v1', 'cross-stage'
    )$$,
  '23503', 'insert or update on table "ps_ai_runs" violates foreign key constraint "ps_ai_runs_stage_session_fk"',
  'Una ejecución de IA no puede referenciar una etapa de otra sesión'
);

select throws_ok(
  $$insert into public.ps_ai_runs (
      session_id, requested_by, operation, visibility, requested_model,
      fallback_index, is_free_model, prompt_version, notice_version, input_hash
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '00000000-0000-0000-0000-000000000012',
      'analyze_stage', 'teacher', 'free-model', 0, true,
      'prompt-v1', 'notice-v1', 'cross-requester'
    )$$,
  '23503', 'insert or update on table "ps_ai_runs" violates foreign key constraint "ps_ai_runs_requester_member_fk"',
  'requested_by debe pertenecer a la sesión'
);

select throws_ok(
  $$insert into public.ps_ai_runs (
      session_id, subject_user_id, requested_by, operation, visibility,
      requested_model, fallback_index, is_free_model,
      prompt_version, notice_version, input_hash
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '00000000-0000-0000-0000-000000000012',
      '00000000-0000-0000-0000-000000000011',
      'assist_user', 'requester', 'free-model', 0, true,
      'prompt-v1', 'notice-v1', 'cross-subject'
    )$$,
  '23503', 'insert or update on table "ps_ai_runs" violates foreign key constraint "ps_ai_runs_subject_member_fk"',
  'subject_user_id debe pertenecer a la sesión'
);

select throws_ok(
  $$insert into public.ps_teacher_decisions (
      session_id, source_stage_run_id, option_key, activity_spec, teacher_user_id
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '00000000-0000-0000-0000-000000000213',
      'cross-stage', '{}', '00000000-0000-0000-0000-000000000011'
    )$$,
  '23503', 'insert or update on table "ps_teacher_decisions" violates foreign key constraint "ps_teacher_decisions_source_stage_session_fk"',
  'Una decisión no puede usar una etapa de otra sesión'
);

select throws_ok(
  $$insert into public.ps_teacher_decisions (
      session_id, source_ai_run_id, source_stage_run_id,
      option_key, activity_spec, teacher_user_id
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '00000000-0000-0000-0000-000000000411',
      '00000000-0000-0000-0000-000000000211',
      'cross-ai', '{}', '00000000-0000-0000-0000-000000000011'
    )$$,
  '23503', 'insert or update on table "ps_teacher_decisions" violates foreign key constraint "ps_teacher_decisions_source_ai_session_fk"',
  'Una decisión no puede usar una ejecución de IA de otra sesión'
);

select throws_ok(
  $$insert into public.ps_teacher_decisions (
      session_id, source_stage_run_id, option_key, activity_spec, teacher_user_id
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '00000000-0000-0000-0000-000000000211',
      'cross-teacher', '{}', '00000000-0000-0000-0000-000000000012'
    )$$,
  '23503', 'insert or update on table "ps_teacher_decisions" violates foreign key constraint "ps_teacher_decisions_teacher_member_fk"',
  'teacher_user_id debe pertenecer a la sesión'
);

select throws_ok(
  $$insert into public.ps_sessions (
      join_code, owner_user_id, grade_level, topic,
      learning_objective, success_criteria, allow_free_ai_assistance
    ) values (
      'NOVERS', '00000000-0000-0000-0000-000000000011', '10', 'Sin versión',
      'Exigir aviso de asistencia', 'Rechazar configuración incompleta', true
    )$$,
  '23514', 'new row for relation "ps_sessions" violates check constraint "ps_sessions_free_ai_notice_check"',
  'La asistencia habilitada exige versión de aviso'
);

select throws_ok(
  $$insert into public.ps_sessions (
      join_code, owner_user_id, grade_level, topic,
      learning_objective, success_criteria, allow_collective_external_ai,
      collective_ai_attested_at
    ) values (
      'NOCOLL', '00000000-0000-0000-0000-000000000011', '10', 'Sin versión',
      'Exigir aviso colectivo', 'Rechazar configuración incompleta', true, now()
    )$$,
  '23514', 'new row for relation "ps_sessions" violates check constraint "ps_sessions_collective_ai_notice_check"',
  'El análisis colectivo habilitado exige versión de aviso'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select throws_ok(
  $$insert into public.ps_stage_runs (
      session_id, stage_kind, sequence_number, status, activity_spec, created_by
    ) values (
      '00000000-0000-0000-0000-000000000116', 'initial_response', 1,
      'active', '{}', '00000000-0000-0000-0000-000000000011'
    )$$,
  '42501', 'new row violates row-level security policy for table "ps_stage_runs"',
  'Un docente no puede saltarse la RPC para activar una etapa'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000013';

select throws_ok(
  $$select * from public.ps_get_collective_ai_responses(
      '00000000-0000-0000-0000-000000000111',
      array['00000000-0000-0000-0000-000000000211'::uuid]
    )$$,
  '42501', 'permission denied for function ps_get_collective_ai_responses',
  'authenticated no puede recuperar evidencia colectiva'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select lives_ok(
  $$select public.ps_activate_stage('00000000-0000-0000-0000-000000000212')$$,
  'La activación serializada permite avanzar de etapa'
);

select is(
  (select count(*) from public.ps_stage_runs
    where session_id = '00000000-0000-0000-0000-000000000111'
      and status = 'active'),
  1::bigint,
  'Después de activar solo queda una etapa activa'
);

select is(
  (select status from public.ps_stage_runs where id = '00000000-0000-0000-0000-000000000211'),
  'closed',
  'La activación serializada cierra la etapa anterior'
);

reset role;
set local role service_role;
set local request.jwt.claim.role = 'service_role';

create temporary table collective_result on commit drop as
select * from public.ps_get_collective_ai_responses(
  '00000000-0000-0000-0000-000000000111',
  array['00000000-0000-0000-0000-000000000211'::uuid]
);

select is(
  (select count(*) from collective_result), 1::bigint,
  'La RPC devuelve solo respuestas con consentimiento vigente'
);

select is(
  (select response_id from collective_result),
  '00000000-0000-0000-0000-000000000311'::uuid,
  'La única respuesta recuperada es la consentida con versión vigente'
);

select ok(
  pg_get_function_result(
    'public.ps_get_collective_ai_responses(uuid,uuid[])'::regprocedure
  ) not like '%display_name%',
  'La RPC no expone nombres'
);

select is(
  (select count(*) from collective_result where response_id = '00000000-0000-0000-0000-000000000312'),
  0::bigint,
  'La RPC excluye respuestas sin consentimiento'
);

select is(
  (select count(*) from collective_result where response_id = '00000000-0000-0000-0000-000000000313'),
  0::bigint,
  'La RPC excluye respuestas con consentimiento retirado'
);

select is(
  (select count(*) from collective_result where response_id = '00000000-0000-0000-0000-000000000314'),
  0::bigint,
  'La RPC excluye consentimientos de otra versión'
);

reset role;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000013';

select lives_ok(
  $$update public.ps_members
    set collective_external_ai_consent_revoked_at = now()
    where session_id = '00000000-0000-0000-0000-000000000111'
      and user_id = '00000000-0000-0000-0000-000000000013'$$,
  'El participante puede retirar su consentimiento'
);

reset role;
set local role service_role;
set local request.jwt.claim.role = 'service_role';

select is(
  (select count(*) from public.ps_get_collective_ai_responses(
    '00000000-0000-0000-0000-000000000111',
    array['00000000-0000-0000-0000-000000000211'::uuid]
  )),
  0::bigint,
  'El retiro invalida toda nueva inclusión externa'
);

reset role;

select is(
  (select count(*) from public.ps_responses where id = '00000000-0000-0000-0000-000000000311'),
  1::bigint,
  'El retiro conserva la respuesta en el flujo local'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000013';

select lives_ok(
  $$update public.ps_members
    set collective_external_ai_consent_revoked_at = null
    where session_id = '00000000-0000-0000-0000-000000000111'
      and user_id = '00000000-0000-0000-0000-000000000013'$$,
  'El consentimiento reversible puede restablecerse'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select lives_ok(
  $$select public.ps_end_session('00000000-0000-0000-0000-000000000111')$$,
  'El docente puede terminar la sesión mediante RPC'
);

select ok(
  (select status = 'ended' and ended_at is not null and active_stage_run_id is null
    from public.ps_sessions where id = '00000000-0000-0000-0000-000000000111'),
  'Terminar sesión fija un estado coherente y limpia la etapa activa'
);

select is(
  (select count(*) from public.ps_stage_runs
    where session_id = '00000000-0000-0000-0000-000000000111'
      and status = 'active'),
  0::bigint,
  'Terminar sesión cierra la etapa activa'
);

select throws_ok(
  $$select public.ps_activate_stage('00000000-0000-0000-0000-000000000211')$$,
  'P0001', 'SESSION_ENDED',
  'No se pueden activar etapas después del cierre'
);

reset role;
set local role service_role;
set local request.jwt.claim.role = 'service_role';

select is(
  (select count(*) from public.ps_get_collective_ai_responses(
    '00000000-0000-0000-0000-000000000111',
    array['00000000-0000-0000-0000-000000000211'::uuid]
  )),
  0::bigint,
  'Una sesión cerrada no produce nuevas inclusiones externas'
);

reset role;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000013';

select throws_ok(
  $$insert into public.ps_responses (session_id, stage_run_id, user_id, payload)
    values (
      '00000000-0000-0000-0000-000000000111',
      '00000000-0000-0000-0000-000000000212',
      '00000000-0000-0000-0000-000000000013', '{}'
    )$$,
  '42501', 'new row violates row-level security policy for table "ps_responses"',
  'No se pueden insertar respuestas después del cierre'
);

select lives_ok(
  $$update public.ps_responses
    set payload = '{"answer":"mutated"}'
    where id = '00000000-0000-0000-0000-000000000311'$$,
  'Una actualización posterior al cierre no afecta filas visibles'
);

reset role;

select is(
  (select payload from public.ps_responses where id = '00000000-0000-0000-0000-000000000311'),
  '{"answer":"consented"}'::jsonb,
  'La respuesta permanece inmutable después del cierre'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select throws_ok(
  $$update public.ps_sessions set status = 'active'
    where id = '00000000-0000-0000-0000-000000000111'$$,
  '42501', 'permission denied for table ps_sessions',
  'El cliente no puede reabrir una sesión directamente'
);

select throws_ok(
  $$update public.ps_sessions set ended_at = now() + interval '1 day'
    where id = '00000000-0000-0000-0000-000000000111'$$,
  '42501', 'permission denied for table ps_sessions',
  'El cliente no puede posponer ended_at'
);

reset role;

select throws_ok(
  $$insert into public.ps_sessions (
      join_code, owner_user_id, grade_level, topic,
      learning_objective, success_criteria, status
    ) values (
      'BADEND', '00000000-0000-0000-0000-000000000011', '10', 'Estado inválido',
      'Rechazar cierre incoherente', 'Exigir fecha cuando termina', 'ended'
    )$$,
  '23514', 'new row for relation "ps_sessions" violates check constraint "ps_sessions_status_ended_at_check"',
  'La base rechaza combinaciones incoherentes de status y ended_at'
);

select is(
  (select schedule from cron.job where jobname = 'ps_purge_expired_session_data'),
  '0 * * * *',
  'La purga se ejecuta cada hora'
);

select ok(
  (select active and command = 'select public.ps_purge_expired_session_data();'
    from cron.job where jobname = 'ps_purge_expired_session_data'),
  'El job de purga está activo y llama la función segura'
);

select is(
  (select count(*) from cron.job where jobname = 'ps_purge_expired_session_data'),
  1::bigint,
  'Existe un solo job de purga idempotente'
);

create temporary table hardening_purge_result on commit drop as
select * from public.ps_purge_expired_session_data('2026-07-20 12:00:00+00');

select is(
  (select cleared_ai_results from hardening_purge_result),
  2::bigint,
  'La purga horaria limpia resultados elegibles a las 23h01'
);

select is(
  (select deleted_responses from hardening_purge_result),
  2::bigint,
  'La purga horaria elimina respuestas elegibles a las 23h01'
);

select is(
  (select count(*) from public.ps_responses where id = '00000000-0000-0000-0000-000000000315'),
  0::bigint,
  'La evidencia con 23h01 se elimina'
);

select is(
  (select count(*) from public.ps_responses where id = '00000000-0000-0000-0000-000000000317'),
  0::bigint,
  'Una obligación vacía no evade la purga'
);

select is(
  (select count(*) from public.ps_responses where id = '00000000-0000-0000-0000-000000000316'),
  1::bigint,
  'La evidencia con 22h59 todavía no se purga'
);

select ok(
  (select result is not null from public.ps_ai_runs where id = '00000000-0000-0000-0000-000000000413'),
  'El resultado con 22h59 todavía se conserva'
);

select ok(
  (select result is null from public.ps_ai_runs where id = '00000000-0000-0000-0000-000000000412'),
  'El resultado vencido se limpia'
);

select ok(
  (select result is null from public.ps_ai_runs where id = '00000000-0000-0000-0000-000000000414'),
  'El resultado con obligación vacía se limpia'
);

select * from finish();
rollback;
