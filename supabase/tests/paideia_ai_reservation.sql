begin;
select plan(10);

select ok(
  not has_function_privilege(
    'public',
    'public.ps_reserve_ai_run(uuid,uuid,uuid,text,text,text,text,text,text)',
    'EXECUTE'
  ),
  'PUBLIC no puede reservar ejecuciones de IA'
);

insert into auth.users (id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002');

insert into public.ps_sessions (
  id, join_code, owner_user_id, grade_level, topic, learning_objective,
  success_criteria, allow_free_ai_assistance, ai_disclosure_version,
  allow_collective_external_ai, collective_ai_attested_at,
  collective_ai_notice_version
) values (
  '10000000-0000-4000-8000-000000000101', 'EDGEXX',
  '10000000-0000-4000-8000-000000000001', '10', 'Pragmática',
  'Interpretar actos de habla', 'Distinguir intención y efecto',
  true, 'free-v1', true, now(), 'collective-v1'
);

insert into public.ps_members (
  session_id, user_id, role, display_name, free_ai_consent_at
) values
  ('10000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', 'teacher', 'Docente Edge', now()),
  ('10000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000002', 'student', 'Estudiante Edge', null);

insert into public.ps_stage_runs (
  id, session_id, stage_kind, sequence_number, status, activity_spec, created_by
) values (
  '10000000-0000-4000-8000-000000000201',
  '10000000-0000-4000-8000-000000000101',
  'initial_response', 1, 'active', '{}',
  '10000000-0000-4000-8000-000000000001'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

select throws_ok(
  $$select public.ps_reserve_ai_run(
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000201', null,
    'analyze_stage', 'teacher', 'paid-or-invented-model',
    'v1', 'collective-v1', repeat('a', 64)
  )$$,
  'P0001', 'FREE_MODEL_REQUIRED',
  'La RPC rechaza modelos fuera del allowlist gratuito'
);

select lives_ok(
  $$select public.ps_reserve_ai_run(
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000201', null,
    'analyze_stage', 'teacher', 'nemotron-3-ultra-free',
    'v1', 'collective-v1', repeat('b', 64)
  )$$,
  'El docente puede reservar análisis colectivo autorizado'
);

select is(
  (select count(*) from public.ps_ai_runs where input_hash = repeat('b', 64)),
  1::bigint,
  'La primera reserva crea una sola ejecución'
);

select is(
  (select (public.ps_reserve_ai_run(
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000201', null,
    'analyze_stage', 'teacher', 'nemotron-3-ultra-free',
    'v1', 'collective-v1', repeat('b', 64)
  )).id),
  (select id from public.ps_ai_runs where input_hash = repeat('b', 64)),
  'El reintento idempotente devuelve la ejecución existente'
);

select throws_ok(
  $$select public.ps_reserve_ai_run(
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000201', null,
    'analyze_stage', 'requester', 'nemotron-3-ultra-free',
    'v1', 'collective-v1', repeat('d', 64)
  )$$,
  'P0001', 'INVALID_AI_VISIBILITY',
  'El análisis colectivo exige visibilidad docente'
);

select lives_ok(
  $test$do $block$
  begin
    perform public.ps_reserve_ai_run(
      '10000000-0000-4000-8000-000000000101',
      '10000000-0000-4000-8000-000000000201', null,
      'analyze_stage', 'teacher', 'nemotron-3-ultra-free',
      'v1', 'collective-v1', repeat('e', 64)
    );
    perform public.ps_reserve_ai_run(
      '10000000-0000-4000-8000-000000000101',
      '10000000-0000-4000-8000-000000000201', null,
      'analyze_stage', 'teacher', 'deepseek-v4-flash-free',
      'v1', 'collective-v1', repeat('f', 64)
    );
    perform public.ps_reserve_ai_run(
      '10000000-0000-4000-8000-000000000101',
      '10000000-0000-4000-8000-000000000201', null,
      'analyze_stage', 'teacher', 'mimo-v2.5-free',
      'v1', 'collective-v1', repeat('0', 64)
    );
    perform public.ps_reserve_ai_run(
      '10000000-0000-4000-8000-000000000101',
      '10000000-0000-4000-8000-000000000201', null,
      'analyze_stage', 'teacher', 'nemotron-3-ultra-free',
      'v1', 'collective-v1', repeat('1', 64)
    );
  end
  $block$$test$,
  'Las reservas válidas alcanzan el límite exacto de análisis'
);

select throws_ok(
  $$select public.ps_reserve_ai_run(
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000201', null,
    'analyze_stage', 'teacher', 'nemotron-3-ultra-free',
    'v1', 'collective-v1', repeat('2', 64)
  )$$,
  'P0001', 'RATE_LIMIT_ANALYZE_EXCEEDED',
  'La RPC aplica el límite de análisis dentro de la transacción'
);

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';

select throws_ok(
  $$select public.ps_reserve_ai_run(
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000201', null,
    'analyze_stage', 'teacher', 'nemotron-3-ultra-free',
    'v1', 'collective-v1', repeat('3', 64)
  )$$,
  'P0001', 'TEACHER_REQUIRED',
  'Un estudiante no puede reservar análisis colectivo'
);

select throws_ok(
  $$select public.ps_reserve_ai_run(
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000201',
    '10000000-0000-4000-8000-000000000002',
    'assist_user', 'requester', 'mimo-v2.5-free',
    'v1', 'free-v1', repeat('c', 64)
  )$$,
  'P0001', 'FREE_AI_CONSENT_REQUIRED',
  'La RPC falla cerrada sin consentimiento individual vigente'
);

select * from finish();
rollback;
