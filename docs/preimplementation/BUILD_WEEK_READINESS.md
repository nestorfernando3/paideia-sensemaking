# Paideia Sensemaking — Build Week Readiness

## Official constraints

- Challenge: [OpenAI Build Week](https://openai.devpost.com/)
- Rules: [Official Rules](https://openai.devpost.com/rules)
- Track: Education
- Deadline: 2026-07-21 17:00 PDT / 2026-07-21 19:00 COT
- Eligibility: Colombia is included; entrant is above the legal age of majority.
- Required project: working project built with Codex using GPT-5.6.
- Build provenance only: the deployed runtime uses only the server-approved OpenCode Zen free-model fallback list and never calls GPT-5.6, OpenAI or paid models.
- Required assets: English description, public YouTube demo under 3 minutes, repository URL, runnable demo, README and `/feedback` Codex Session ID.
- Internal submission deadline: 2026-07-21 18:00 COT.

## Current baseline

- Local repository: `/Users/nestor/Documents/Paideia Hackaton`
- Upstream commit: `ab9f26f`
- Planning commit: `5a7d19a`
- Existing build: passing on Node.js `v22.22.3`
- Devpost public project: https://devpost.com/software/paideia-sensemaking

## Gate 0

- [ ] OpenAI Build Week draft exists and is linked to Paideia Sensemaking.
- [x] Independent GitHub remote exists and `main` is published.
- [ ] Product and demo contracts are frozen.
- [ ] Required accounts and local runtimes are available.
- [ ] Free-only Zen policy, server-only secret custody and collective-data safeguards are verified.
- [ ] Legacy Supabase baseline is recorded without exporting row data.
- [ ] Synthetic fixture parses successfully.
- [ ] Submission schedule and owners are explicit.
- [ ] Handoff and Wiki reflect the verified state.

## Verified Devpost draft evidence

- Submission ID: `1106114`
- Education was saved and verified on 2026-07-20.
- The final submission was not sent; the entry remains a draft.

## Access and runtime matrix

- [x] GitHub CLI authenticated as `nestorfernando3` with `repo` and `workflow` scopes.
- [x] Devpost OpenAI Build Week draft editable.
- [ ] YouTube upload and publication available.
- [x] Node.js 20+ available.
- [ ] Supabase CLI 2.39.2 available and project visible.
- [x] Docker daemon available for local Supabase tests.
- [x] Deno available for Edge Function tests.
- [ ] Owner pasted `OPENCODE_ZEN_API_KEY` directly from the password manager into the authenticated Supabase Edge Functions Secrets UI, outside Codex/LLM browser snapshots, then cleared the clipboard; the value never entered a local shell, argv, local environment/file, temporary file, frontend, Git or logs.
- [ ] Supabase shows only the `OPENCODE_ZEN_API_KEY` secret name and masked/hidden status; no value was displayed, copied back or recorded.
- [ ] Zen billing and paid-model access remain disabled as defense in depth.
- [ ] Ordered server allowlist is `nemotron-3-ultra-free`, `hy3-free`, `deepseek-v4-flash-free`, `mimo-v2.5-free`; availability comes only from exact IDs in `https://opencode.ai/zen/v1/models`, while exact numeric zero input/output cost comes separately from `.opencode.models[ID].cost` in `https://models.dev/api.json`.
- [ ] Both source snapshots are available and no older than five minutes; missing, stale or disagreeing evidence fails closed. The Zen registry is not treated as price or protocol metadata.
- [ ] Zen's public docs also confirm each enabled candidate as Free on the fixed Chat Completions route. `hy3-free` remains skipped because those docs omit it, even though Models.dev currently reports zero.
- [ ] Preselection tests prove that outside-allowlist, unavailable, missing/non-zero-cost, stale and unconfirmed-Hy3 candidates produce zero inference HTTP calls.
- [ ] Postresponse tests prove that a differently returned model follows an inference request but its response is never accepted, displayed or persisted as success; fallback may use only the next already-prevalidated free candidate.

## Product contract

- Primary user: Colombian secondary-school Spanish teacher in a face-to-face class.
- Domain: speech acts.
- Problem: the teacher sees answers but cannot quickly distinguish literal reading, communicative intention and produced effect.
- Promise: Paideia turns consented, de-identified and minimized classroom evidence into an editable intervention and then checks transfer on a new case.
- Teacher authority: AI proposes evidence, limitations and options; it never grades or advances the class autonomously.
- Runtime policy: `analyze_stage`, `compare_learning` and `assist_user` use the same server-owned free-only fallback, with fresh independent availability/cost checks and a fixed Chat Completions route map. The client cannot select a model; an exhausted list returns `FREE_MODEL_UNAVAILABLE` and preserves the manual no-AI flow. No paid fallback exists.
- Golden path: create session + teacher attestation → join + participant consent → activate initial case → answer → analyze with the first verified-free Zen model → edit/activate three-column intervention → answer transfer case → compare with the same policy → teacher decides.
- Acceptance evidence: two browsers complete the golden path; analysis cites synthetic responses; comparison distinguishes observed change from remaining uncertainty.
- Build Week submission cut: the golden path, free-only Zen analysis/comparison/assistance, secure data isolation, deployment and submission assets.
- Collective-data safeguards: external analysis is default-off; teacher attestation and separate reversible participant consent are required; nonconsenting responses are excluded; payloads are minimized, PII-redacted, truncated and assigned ephemeral per-run pseudonyms; no sensitive content is logged; responses, results and excerpts are purged by 24 hours after session close unless a documented institutional obligation requires otherwise.
- Runtime logging: only operation, selected/returned model, fallback index, `is_free_model`, status, input hash and notice version; never prompts or responses.
- Demo policy: only synthetic data.
- Full-MVP continuation after submission: expanded resilience and non-critical polish remain governed by the development plan.
- Excluded before submission: open chat, automatic grading, LMS, voice, photos, multi-school dashboard, React rewrite and deep LAN changes.
