begin;
select plan(27);

select has_table('public', 'sessions', 'La tabla clásica sigue existiendo');
select has_table('public', 'tool_entries', 'Las respuestas clásicas siguen existiendo');
select has_table('public', 'ps_sessions', 'Existe ps_sessions');
select has_table('public', 'ps_members', 'Existe ps_members');
select has_table('public', 'ps_stage_runs', 'Existe ps_stage_runs');
select has_table('public', 'ps_responses', 'Existe ps_responses');

insert into auth.users (id)
values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004');

insert into public.ps_sessions (
  id, join_code, owner_user_id, grade_level, topic,
  learning_objective, success_criteria, status, ended_at, retention_obligation
)
values
  (
    '00000000-0000-0000-0000-000000000101', 'ABCDEF',
    '00000000-0000-0000-0000-000000000001', '10', 'Pragmática',
    'Interpretar actos de habla', 'Distinguir intención y efecto', 'active', null, null
  ),
  (
    '00000000-0000-0000-0000-000000000102', 'BCDEFG',
    '00000000-0000-0000-0000-000000000003', '10', 'Transferencia',
    'Transferir el aprendizaje', 'Justificar una interpretación', 'active', null, null
  ),
  (
    '00000000-0000-0000-0000-000000000103', 'CDEFGH',
    '00000000-0000-0000-0000-000000000001', '10', 'Sesión cerrada',
    'Comprobar la purga segura', 'Eliminar datos al vencer el plazo', 'ended',
    '2026-07-19 11:59:00+00', null
  ),
  (
    '00000000-0000-0000-0000-000000000104', 'DEFGHJ',
    '00000000-0000-0000-0000-000000000001', '10', 'Retención documentada',
    'Comprobar la excepción institucional', 'Conservar datos bajo obligación', 'ended',
    '2026-07-19 11:59:00+00', 'Orden de conservación 42'
  );

insert into public.ps_members (session_id, user_id, role, display_name)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'teacher', 'Docente A'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'student', 'Estudiante A'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000004', 'student', 'Estudiante B'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000003', 'teacher', 'Docente B'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'teacher', 'Docente A'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'teacher', 'Docente A');

insert into public.ps_stage_runs (
  id, session_id, stage_kind, sequence_number, status, activity_spec, created_by
)
values
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'initial_response', 1, 'active', '{}',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'initial_response', 1, 'active', '{}',
    '00000000-0000-0000-0000-000000000003'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000103',
    'initial_response', 1, 'closed', '{}',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000104',
    'initial_response', 1, 'closed', '{}',
    '00000000-0000-0000-0000-000000000001'
  );

insert into public.ps_responses (id, session_id, stage_run_id, user_id, payload)
values
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000004', '{"answer":"ajena"}'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000002', '{"answer":"purgar"}'
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000002', '{"answer":"retener"}'
  );

insert into public.ps_ai_runs (
  id, session_id, stage_run_id, requested_by, operation, visibility,
  requested_model, used_model, fallback_index, is_free_model,
  prompt_version, notice_version, input_hash, status, result
)
values
  (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    'analyze_stage', 'teacher', 'free-model', 'free-model', 0, true,
    'prompt-v1', 'notice-v1', 'purge-hash', 'succeeded', '{"extract":"purgar"}'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000001',
    'analyze_stage', 'teacher', 'free-model', 'free-model', 0, true,
    'prompt-v1', 'notice-v1', 'retain-hash', 'succeeded', '{"extract":"retener"}'
  );

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

select is(
  (select count(*) from public.ps_responses where id = '00000000-0000-0000-0000-000000000301'),
  0::bigint,
  'Un estudiante no puede leer respuestas ajenas'
);

select throws_ok(
  $$select public.ps_activate_stage('00000000-0000-0000-0000-000000000201')$$,
  'P0001', 'TEACHER_REQUIRED',
  'Un estudiante no puede activar etapas'
);

select throws_ok(
  $$update public.ps_members set role = 'teacher'
    where session_id = '00000000-0000-0000-0000-000000000101'
      and user_id = '00000000-0000-0000-0000-000000000002'$$,
  '42501', 'permission denied for table ps_members',
  'Un estudiante no puede elevar su rol'
);

select throws_ok(
  $$insert into public.ps_responses (session_id, stage_run_id, user_id, payload)
    values (
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000202',
      '00000000-0000-0000-0000-000000000002',
      '{"answer":"cruzada"}'
    )$$,
  '42501', 'new row violates row-level security policy for table "ps_responses"',
  'No se puede insertar una respuesta cruzando sesión y etapa'
);

select lives_ok(
  $$update public.ps_members
    set collective_external_ai_consent_at = now(),
        collective_external_ai_consent_version = 'notice-v1',
        collective_external_ai_consent_revoked_at = now()
    where session_id = '00000000-0000-0000-0000-000000000101'
      and user_id = '00000000-0000-0000-0000-000000000002'$$,
  'El estudiante puede gestionar su consentimiento colectivo'
);

reset role;

select is(
  (select count(*) from public.ps_responses where id = '00000000-0000-0000-0000-000000000301'),
  1::bigint,
  'Retirar consentimiento no elimina respuestas del flujo local'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

select throws_ok(
  $$select public.ps_create_session(
    'EFGHJK', 'Docente A', '10', 'Atestación',
    'Verificar autorización docente', 'Impedir análisis sin atestación',
    false, null, true, 'notice-v1', false, '{}'
  )$$,
  'P0001', 'COLLECTIVE_AI_ATTESTATION_REQUIRED',
  'El análisis colectivo requiere atestación docente'
);

select is(
  (select count(*) from public.ps_sessions where join_code = 'EFGHJK'),
  0::bigint,
  'La sesión sin atestación no se crea'
);

select lives_ok(
  $$select public.ps_create_session(
    'FGHJKL', 'Docente A', '10', 'Creación segura',
    'Crear una sesión mediante RPC', 'Crear membresía y etapa inicial',
    false, null, false, null, false, '{}'
  )$$,
  'El docente autenticado puede crear una sesión'
);

select is(
  (select count(*) from public.ps_members m
    join public.ps_sessions s on s.id = m.session_id
    where s.join_code = 'FGHJKL' and m.role = 'teacher'),
  1::bigint,
  'La RPC crea la membresía docente'
);

select ok(
  not has_column_privilege('authenticated', 'public.ps_members', 'role', 'UPDATE'),
  'El rol no es una columna autoeditable'
);

select ok(
  not has_column_privilege('authenticated', 'public.ps_stage_runs', 'status', 'UPDATE'),
  'El estado de etapa solo cambia mediante RPC'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

select lives_ok(
  $$select public.ps_join_session('BCDEFG', 'Estudiante A')$$,
  'El estudiante autenticado puede unirse mediante RPC'
);

reset role;

select throws_ok(
  $$insert into public.ps_ai_runs (
    session_id, requested_by, operation, visibility, requested_model,
    fallback_index, is_free_model, prompt_version, notice_version, input_hash
  ) values (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'analyze_stage', 'teacher', 'paid-model', 0, false,
    'prompt-v1', 'notice-v1', 'paid-hash'
  )$$,
  '23514',
  'new row for relation "ps_ai_runs" violates check constraint "ps_ai_runs_is_free_model_check"',
  'La base de datos rechaza ejecuciones de modelos pagos'
);

create temporary table purge_result on commit drop as
select * from public.ps_purge_expired_session_data('2026-07-20 12:00:00+00');

select is(
  (select cleared_ai_results from purge_result), 1::bigint,
  'La purga limpia resultados y extractos de IA vencidos'
);

select is(
  (select deleted_responses from purge_result), 1::bigint,
  'La purga elimina respuestas vencidas'
);

select is(
  (select count(*) from public.ps_responses where session_id = '00000000-0000-0000-0000-000000000103'),
  0::bigint,
  'No quedan respuestas después de 24 horas'
);

select ok(
  (select result is null from public.ps_ai_runs where id = '00000000-0000-0000-0000-000000000401'),
  'No quedan resultados ni extractos después de 24 horas'
);

select is(
  (select count(*) from public.ps_responses where session_id = '00000000-0000-0000-0000-000000000104'),
  1::bigint,
  'La obligación institucional conserva respuestas'
);

select ok(
  (select result is not null from public.ps_ai_runs where id = '00000000-0000-0000-0000-000000000402'),
  'La obligación institucional conserva resultados'
);

select is(
  (
    select count(*)
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename in ('ps_sessions', 'ps_members', 'ps_stage_runs', 'ps_responses')
  ),
  4::bigint,
  'Las cuatro tablas realtime están publicadas una sola vez'
);

select * from finish();
rollback;
