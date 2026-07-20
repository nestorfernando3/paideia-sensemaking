# Paideia Sensemaking Pre-Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dejar resueltos y verificados todos los prerrequisitos externos, pedagógicos, operativos y de seguridad antes de ejecutar el plan de desarrollo de Paideia Sensemaking.

**Architecture:** esta fase cero no modifica código funcional. Produce un paquete mínimo de evidencia —remoto independiente, borrador de envío, contrato del MVP, accesos comprobados, línea base de seguridad, datos sintéticos y guion de demo— y termina en una puerta `GO/NO-GO` única. El plan de desarrollo existente sigue siendo la fuente autoritativa de implementación.

**Tech Stack:** Git/GitHub CLI, Devpost, Node.js 20+, Supabase CLI, Docker, Deno, OpenCode Zen, OpenAI GPT-5.6, Markdown y JSON.

## Global Constraints

- La fecha límite oficial de OpenAI Build Week es el martes 21 de julio de 2026 a las 5:00 p. m. PDT, equivalente a las 7:00 p. m. de Colombia.
- El envío se preparará para la categoría **Education**.
- Esta fase no modifica `src/`, `server/`, `electron/`, `supabase/schema.sql` ni ninguna tabla remota.
- `nestorfernando3/paideia` permanece sin cambios y `upstream` nunca recibe `push`.
- El nuevo repositorio será público, independiente y con licencia MIT: `nestorfernando3/paideia-sensemaking`.
- No se guardan claves, tokens, contraseñas, datos de menores ni respuestas reales en Git, Obsidian, capturas o logs.
- El gasto de IA de la semana queda limitado a USD 10 en OpenCode Zen; cualquier aumento requiere una decisión explícita del propietario.
- La preparación pedagógica usa únicamente datos sintéticos identificados como `S01`, `S02`, etc.
- No se inicia la Tarea 1 del plan de desarrollo hasta que la Puerta 0 quede en estado `GO`.
- La fase cero tiene un límite de 90 minutos; el desarrollo debe congelarse a más tardar el 21 de julio a la 1:00 p. m. COT, la demo debe estar desplegada a las 3:00 p. m., el video publicado a las 5:00 p. m. y el envío finalizado a las 6:00 p. m.
- El plugin de Devpost es opcional según las reglas oficiales y no bloquea el trabajo.
- Cada tarea termina en un commit local enfocado para permitir revisión por diff; solo se publica al crear el remoto en la Tarea 2 y al sincronizar el resultado final en la Tarea 8.

---

## File Map

- Create: `docs/preimplementation/BUILD_WEEK_READINESS.md` — evidencia de elegibilidad, accesos, seguridad, tiempos y Puerta 0.
- Create: `docs/preimplementation/BUILD_WEEK_SUBMISSION.md` — texto en inglés, guion de demo y lista de activos del envío.
- Create: `docs/preimplementation/fixtures/speech-acts-classroom.json` — conjunto sintético antes/intervención/después.
- Modify: `2026-07-20-paideia-sensemaking-implementation-plan.md` — enlazar la fase cero y registrar los pasos de repositorio ya satisfechos.
- Modify: `/Users/nestor/wiki/Handoff Paideia Sensemaking.md` — reflejar el resultado y el siguiente paso.
- Modify: `/Users/nestor/wiki/entities/Paideia Sensemaking.md` — reflejar el estado de preparación.

---

### Task 1: Proteger el plazo y crear el envío de OpenAI Build Week

**Timebox:** 10 minutos.

**Files:**
- Create: `docs/preimplementation/BUILD_WEEK_READINESS.md`
- External: `https://openai.devpost.com/challenges/start_a_submission`

**Produces:** un borrador asociado al hackathon, categoría elegida y requisitos oficiales registrados.

- [ ] **Step 1: registrar los hechos oficiales**

Crear `docs/preimplementation/BUILD_WEEK_READINESS.md` con este contenido inicial:

```markdown
# Paideia Sensemaking — Build Week Readiness

## Official constraints

- Challenge: [OpenAI Build Week](https://openai.devpost.com/)
- Rules: [Official Rules](https://openai.devpost.com/rules)
- Track: Education
- Deadline: 2026-07-21 17:00 PDT / 2026-07-21 19:00 COT
- Eligibility: Colombia is included; entrant is above the legal age of majority.
- Required project: working project built with Codex using GPT-5.6.
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
- [ ] Independent GitHub remote exists and `main` is published.
- [ ] Product and demo contracts are frozen.
- [ ] Required accounts and local runtimes are available.
- [ ] Legacy Supabase baseline is recorded without exporting row data.
- [ ] Synthetic fixture parses successfully.
- [ ] Submission schedule and owners are explicit.
- [ ] Handoff and Wiki reflect the verified state.
```

- [ ] **Step 2: create the challenge submission shell**

While logged into Devpost:

1. Open `https://openai.devpost.com/challenges/start_a_submission`.
2. Register for OpenAI Build Week if the account is not already registered.
3. Select the existing project **Paideia Sensemaking**.
4. Select **Education**.
5. Save it as a draft; do not submit the unfinished project.

Expected result: the Devpost dashboard shows Paideia Sensemaking under **OpenAI Build Week**, not merely as a standalone public software page.

- [ ] **Step 3: verify the official deadline and eligibility remain unchanged**

Run:

```bash
curl -fsSL https://openai.devpost.com/ \
  | rg '2026-07-21T20:00:00-04:00|<li>Colombia</li>|A demo video|/feedback Codex Session ID'
```

Expected result: four matches covering deadline, Colombia, video and session ID.

---

### Task 2: Create and publish the independent GitHub repository

**Timebox:** 10 minutes.

**Files:**
- Modify: `docs/preimplementation/BUILD_WEEK_READINESS.md`
- Modify: `2026-07-20-paideia-sensemaking-implementation-plan.md`
- External: `https://github.com/nestorfernando3/paideia-sensemaking`

**Produces:** a public remote that preserves history without exposing the original repository to writes.

- [ ] **Step 1: recheck authentication and remote safety**

Run:

```bash
gh auth status
git remote -v
git remote get-url --push upstream
git status --short --branch
```

Expected result:

```text
GitHub account: nestorfernando3, authenticated
origin fetch/push: https://github.com/nestorfernando3/paideia-sensemaking.git
upstream fetch: https://github.com/nestorfernando3/paideia.git
upstream push: DISABLED
branch: main, one planning commit ahead of upstream/main
```

- [ ] **Step 2: create the empty public repository**

Run:

```bash
gh repo create nestorfernando3/paideia-sensemaking \
  --public \
  --description="Paideia Sensemaking — live pedagogical feedback loop for secondary language classrooms"
```

Expected result: GitHub returns `https://github.com/nestorfernando3/paideia-sensemaking`.

- [ ] **Step 3: publish the current main branch**

Run:

```bash
git push -u origin main
gh repo view nestorfernando3/paideia-sensemaking \
  --json nameWithOwner,isPrivate,url,defaultBranchRef
git ls-remote --heads origin main
```

Expected result: `isPrivate` is `false`, the default branch is `main`, and `refs/heads/main` resolves to commit `5a7d19a` or a later documentation-only commit.

- [ ] **Step 4: record the completed repository prerequisites**

In `2026-07-20-paideia-sensemaking-implementation-plan.md`:

```diff
-- [ ] **Paso 1: duplicar conservando historial y sin tocar el original**
+- [x] **Paso 1: duplicar conservando historial y sin tocar el original**
```

```diff
-- [ ] **Paso 2: impedir pushes accidentales a upstream**
+- [x] **Paso 2: impedir pushes accidentales a upstream**
```

Do not mark Step 3 or later development steps.

---

### Task 3: Freeze the product, acceptance and demo contracts

**Timebox:** 15 minutes.

**Files:**
- Modify: `docs/preimplementation/BUILD_WEEK_READINESS.md`
- Create: `docs/preimplementation/BUILD_WEEK_SUBMISSION.md`

**Produces:** one vertical story that determines what must be built and what is excluded before the deadline.

- [ ] **Step 1: append the product contract**

Append to `docs/preimplementation/BUILD_WEEK_READINESS.md`:

```markdown
## Product contract

- Primary user: Colombian secondary-school Spanish teacher in a face-to-face class.
- Domain: speech acts.
- Problem: the teacher sees answers but cannot quickly distinguish literal reading, communicative intention and produced effect.
- Promise: Paideia turns anonymous classroom evidence into an editable intervention and then checks transfer on a new case.
- Teacher authority: AI proposes evidence, limitations and options; it never grades or advances the class autonomously.
- Golden path: create session → join → activate initial case → answer → analyze with GPT-5.6 → edit/activate three-column intervention → answer transfer case → compare learning → teacher decides.
- Acceptance evidence: two browsers complete the golden path; analysis cites synthetic responses; comparison distinguishes observed change from remaining uncertainty.
- Build Week submission cut: the golden path, GPT-5.6 analysis/comparison, secure data isolation, deployment and submission assets.
- Full-MVP continuation after submission: free-model `assist_user`, expanded resilience and non-critical polish remain governed by the development plan.
- Excluded before submission: open chat, automatic grading, LMS, voice, photos, multi-school dashboard, React rewrite and deep LAN changes.
```

- [ ] **Step 2: create the English submission contract**

Create `docs/preimplementation/BUILD_WEEK_SUBMISSION.md`:

```markdown
# Paideia Sensemaking — Build Week Submission

## Track

Education

## One-line description

Paideia Sensemaking helps secondary-school teachers turn live classroom evidence into an editable intervention and verify whether students can transfer the concept to a new case.

## Project description

Paideia Sensemaking is a teacher-controlled classroom feedback loop for secondary Spanish Language classes. Students respond to an initial speech-act case from their own devices. GPT-5.6 analyzes the group's anonymized evidence, identifies patterns and limitations, and proposes editable teaching moves. The teacher chooses the intervention, students apply a three-column frame—what was said, what the speaker attempted to do, and what effect it produced—and then solve a new transfer case. GPT-5.6 compares the before-and-after evidence, while the teacher keeps the final decision. The system never grades students automatically.

## Judging case

- Technological implementation: secure real-time orchestration, idempotent GPT-5.6 operations and evidence-linked outputs.
- Design: one coherent teacher/student journey on mobile and desktop.
- Potential impact: faster formative intervention for a specific classroom problem.
- Quality of idea: AI supports pedagogical sensemaking instead of acting as a generic tutor or grader.

## Required assets

- [ ] Public GitHub repository with MIT license.
- [ ] Public deployed demo.
- [ ] README with setup, sample data, Codex collaboration and GPT-5.6 usage.
- [ ] Public YouTube video under 3 minutes with English audio or English subtitles.
- [ ] `/feedback` session ID from the Codex task containing most core implementation.
- [ ] Final Devpost form submitted by 2026-07-21 18:00 COT.

## Demo script

- 0:00–0:15 — Name the teacher problem and show the initial speech-act case.
- 0:15–0:40 — Create a session and join from the student browser.
- 0:40–1:00 — Submit contrasting initial responses and show live participation.
- 1:00–1:30 — Run GPT-5.6 analysis; point to patterns, cited evidence and limitations.
- 1:30–1:55 — Edit and activate the three-column intervention.
- 1:55–2:20 — Complete the transfer case from the student browser.
- 2:20–2:42 — Run comparison; show change, persistent difficulty and teacher decision.
- 2:42–2:55 — Explain where Codex accelerated the build and where human decisions remained.
- 2:55–2:59 — Show repository and deployed URL.
```

- [ ] **Step 3: verify scope language is consistent**

Run:

```bash
rg -n 'speech acts|GPT-5.6|teacher|never grades|Education|three-column' \
  docs/preimplementation/BUILD_WEEK_READINESS.md \
  docs/preimplementation/BUILD_WEEK_SUBMISSION.md \
  2026-07-20-paideia-sensemaking-implementation-plan.md
```

Expected result: every concept appears in the readiness/submission documents and agrees with the development plan.

---

### Task 4: Verify accounts, secrets and local runtimes

**Timebox:** 20 minutes, excluding installer download time.

**Files:**
- Modify: `docs/preimplementation/BUILD_WEEK_READINESS.md`

**Produces:** all external dependencies reachable without writing a secret to disk.

- [ ] **Step 1: verify existing local tools**

Run:

```bash
node --version
npm --version
gh auth status
npx --yes supabase@2.39.2 --version
```

Expected result: Node.js is `v20` or newer, npm and GitHub authentication work, and Supabase CLI reports `2.39.2`.

- [ ] **Step 2: install and verify Deno**

Install Deno using the current macOS method at `https://docs.deno.com/runtime/getting_started/installation/`, open a new shell, then run:

```bash
deno --version
```

Expected result: a stable Deno version is available on `PATH`.

- [ ] **Step 3: install and verify Docker Desktop**

Install Docker Desktop from `https://docs.docker.com/desktop/setup/install/mac-install/`, launch it, then run:

```bash
docker version
docker info >/dev/null
```

Expected result: client and server versions are present and `docker info` exits `0`.

- [ ] **Step 4: verify Supabase ownership without exposing keys**

Run:

```bash
npx --yes supabase@2.39.2 login
npx --yes supabase@2.39.2 projects list
```

Expected result: the existing Paideia Supabase project is visible to the authenticated account. Do not paste the access token or database password into the readiness document.

- [ ] **Step 5: verify Zen model availability**

Run:

```bash
curl -fsSL https://opencode.ai/zen/v1/models \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const ids=JSON.parse(s).data.map(x=>x.id);if(!ids.includes("gpt-5.6-terra")||!ids.some(x=>x.endsWith("-free")))process.exit(1);console.log("gpt-5.6-terra and at least one free model available")})'
```

Expected result:

```text
gpt-5.6-terra and at least one free model available
```

- [ ] **Step 6: verify secret custody**

Load `OPENCODE_ZEN_API_KEY` from the user's password manager into the current shell only, then run:

```bash
test -n "${OPENCODE_ZEN_API_KEY:-}" && echo 'Zen key available in process environment'
```

Expected result: the message appears. Do not print the value and do not add it to `.env`.

- [ ] **Step 7: verify Zen billing protection**

In the OpenCode Zen dashboard:

1. Confirm that the API key belongs to the active workspace.
2. Confirm that paid access to `gpt-5.6-terra` is enabled.
3. Set the workspace monthly usage limit to USD 10.
4. Keep free models enabled only after reviewing their current data-retention notice.

Expected result: GPT-5.6 can be used for the two core operations without unbounded spending.

- [ ] **Step 8: verify submission accounts manually**

Confirm that the active user can:

1. Edit the Paideia Sensemaking Devpost draft.
2. Upload an unlisted or public video to YouTube and make it public before submission.
3. Access the Codex task that will contain the majority of core implementation and run `/feedback` after the build.

- [ ] **Step 9: append the access matrix**

Append to `docs/preimplementation/BUILD_WEEK_READINESS.md`, checking each item only after its verification succeeds:

```markdown
## Access and runtime matrix

- [ ] GitHub CLI authenticated as `nestorfernando3` with `repo` and `workflow` scopes.
- [ ] Devpost OpenAI Build Week draft editable.
- [ ] YouTube upload and publication available.
- [ ] Node.js 20+ available.
- [ ] Supabase CLI 2.39.2 available and project visible.
- [ ] Docker daemon available for local Supabase tests.
- [ ] Deno available for Edge Function tests.
- [ ] OpenCode Zen key held outside Git and available to the execution shell.
- [ ] Zen workspace has paid GPT-5.6 access and a USD 10 monthly usage limit.
- [ ] `gpt-5.6-terra` and at least one `*-free` model present in the live Zen registry.
```

---

### Task 5: Establish the legacy-system safety baseline

**Timebox:** 15 minutes.

**Files:**
- Modify: `.git/info/exclude` (local only)
- Create locally, never commit: `.artifacts/preimplementation/public-schema-before.sql`
- Modify: `docs/preimplementation/BUILD_WEEK_READINESS.md`

**Produces:** a recoverable schema-only snapshot and proof that classic Paideia works before development begins.

- [ ] **Step 1: create an ignored local evidence directory**

Run:

```bash
mkdir -p .artifacts/preimplementation
```

Use `apply_patch` to add this local exclusion to `.git/info/exclude`:

```diff
+/.artifacts/
```

- [ ] **Step 2: link the Supabase CLI to the existing project**

Run, selecting the existing Paideia project when prompted:

```bash
npx --yes supabase@2.39.2 link
```

Expected result: the CLI confirms the linked project. Do not commit `.supabase/` artifacts containing local state.

- [ ] **Step 3: export schema only**

Run:

```bash
npx --yes supabase@2.39.2 db dump --linked \
  --schema public \
  --file .artifacts/preimplementation/public-schema-before.sql
shasum -a 256 .artifacts/preimplementation/public-schema-before.sql
```

Expected result: a non-empty SQL file and a SHA-256 hash. The command must not use `--data-only` and must not export row data.

- [ ] **Step 4: verify classic objects are present before any `ps_*` object exists**

Run:

```bash
rg -n 'CREATE TABLE.*(sessions|tool_entries)' \
  .artifacts/preimplementation/public-schema-before.sql
rg -n 'CREATE TABLE.*ps_' \
  .artifacts/preimplementation/public-schema-before.sql && exit 1 || true
```

Expected result: classic tables are found; no `ps_*` table is found.

- [ ] **Step 5: verify the code baseline**

Run:

```bash
npm ci
npm run build
git rev-parse upstream/main
git diff --exit-code upstream/main -- supabase/schema.sql
```

Expected result: build passes, upstream resolves to `ab9f26f` or a later explicitly reviewed commit, and `supabase/schema.sql` has no divergence.

- [ ] **Step 6: smoke-test classic Paideia**

Open `https://nestorfernando3.github.io/paideia/` and verify:

1. Home loads without console errors.
2. Teacher session creation opens.
3. Student join opens.

Do not create or inspect a real classroom session during this baseline check.

- [ ] **Step 7: append the safety evidence**

Append to `docs/preimplementation/BUILD_WEEK_READINESS.md`:

```markdown
## Legacy safety baseline

- [ ] Classic GitHub Pages deployment loads.
- [ ] `npm ci && npm run build` passes before functional changes.
- [ ] `supabase/schema.sql` matches upstream.
- [ ] Schema-only remote snapshot exists under ignored `.artifacts/`.
- [ ] Snapshot contains `sessions` and `tool_entries`.
- [ ] Snapshot contains no `ps_*` objects before development.
- [ ] No row data was exported.
```

Record the schema SHA-256 and verified upstream commit immediately below the checklist.

---

### Task 6: Create the synthetic pedagogical fixture

**Timebox:** 10 minutes.

**Files:**
- Create: `docs/preimplementation/fixtures/speech-acts-classroom.json`
- Modify: `docs/preimplementation/BUILD_WEEK_READINESS.md`

**Produces:** deterministic, non-personal evidence for tests, screenshots and the demo.

- [ ] **Step 1: create the fixture**

Create `docs/preimplementation/fixtures/speech-acts-classroom.json`:

```json
{
  "fixtureVersion": "2026-07-20",
  "synthetic": true,
  "topic": "Actos de habla",
  "objective": "Distinguir lo dicho, la intención comunicativa y el efecto producido.",
  "initialCase": "Una estudiante llega veinte minutos tarde y la docente le dice: Qué puntual eres.",
  "transferCase": "El grupo continúa hablando y el director dice: Aquí valoramos mucho el silencio.",
  "responses": [
    {
      "studentId": "S01",
      "initial": "La docente dice que la estudiante es puntual.",
      "intervention": {
        "said": "Qué puntual eres.",
        "attempted": "Reprochar la tardanza mediante ironía.",
        "effect": "La estudiante reconoce que llegar tarde fue inapropiado."
      },
      "transfer": "El director intenta pedir silencio indirectamente; la frase busca que el grupo deje de hablar.",
      "justification": "El contexto contradice la lectura literal y muestra la intención."
    },
    {
      "studentId": "S02",
      "initial": "La docente está enojada porque la estudiante llegó tarde.",
      "intervention": {
        "said": "Qué puntual eres.",
        "attempted": "Criticar sin formular una orden directa.",
        "effect": "Provocar reconocimiento o vergüenza por la tardanza."
      },
      "transfer": "No describe una costumbre: corrige al grupo y espera que guarde silencio.",
      "justification": "El efecto esperado es un cambio de conducta."
    },
    {
      "studentId": "S03",
      "initial": "Es sarcasmo.",
      "intervention": {
        "said": "Qué puntual eres.",
        "attempted": "Señalar que ocurrió lo contrario de lo dicho.",
        "effect": "Hacer visible la tardanza ante la estudiante."
      },
      "transfer": "Es una petición indirecta para que dejen de hablar.",
      "justification": "La situación permite inferir la acción que el director intenta realizar."
    },
    {
      "studentId": "S04",
      "initial": "La frase significa que hay que llegar temprano.",
      "intervention": {
        "said": "Qué puntual eres.",
        "attempted": "Recordar la norma de puntualidad mediante un reproche.",
        "effect": "Orientar una conducta futura más puntual."
      },
      "transfer": "El director reprocha el ruido y busca producir silencio.",
      "justification": "Distingo las palabras, la intención y el efecto esperado."
    },
    {
      "studentId": "S05",
      "initial": "La estudiante llegó tarde y la profesora hizo una broma.",
      "intervention": {
        "said": "Qué puntual eres.",
        "attempted": "Usar ironía para llamar la atención sobre la tardanza.",
        "effect": "Lograr que la estudiante entienda el reproche."
      },
      "transfer": "La frase funciona como llamado de atención y petición de silencio.",
      "justification": "Aunque no ordena callar, esa es la acción comunicativa."
    },
    {
      "studentId": "S06",
      "initial": "No sé si la felicita o la regaña.",
      "intervention": {
        "said": "Qué puntual eres.",
        "attempted": "Regañar de forma indirecta porque llegó tarde.",
        "effect": "Que comprenda la crítica y corrija la conducta."
      },
      "transfer": "El director intenta que el grupo se calle, aunque habla de valorar el silencio.",
      "justification": "El contexto permite separar el contenido literal de la intención."
    }
  ]
}
```

- [ ] **Step 2: validate structure and anonymity**

Run:

```bash
node -e 'const f=require("./docs/preimplementation/fixtures/speech-acts-classroom.json");if(!f.synthetic||f.responses.length!==6||f.responses.some(x=>!/^S\d{2}$/.test(x.studentId)))process.exit(1);console.log("fixture valid")'
rg -n -i 'correo|email|teléfono|phone|@' \
  docs/preimplementation/fixtures/speech-acts-classroom.json && exit 1 || true
```

Expected result: `fixture valid` and no PII-pattern match.

- [ ] **Step 3: append fixture acceptance**

Append to `docs/preimplementation/BUILD_WEEK_READINESS.md`:

```markdown
## Pedagogical fixture

- [ ] Six synthetic students cover literal reading, intention-only reading, uncertainty and improved transfer.
- [ ] Every final response includes a justification.
- [ ] Identifiers follow `S01`–`S06`; no real names or contact data exist.
- [ ] The fixture supports initial analysis, three-column intervention and before/after comparison.
```

---

### Task 7: Lock the execution and submission schedule

**Timebox:** 5 minutes.

**Files:**
- Modify: `docs/preimplementation/BUILD_WEEK_READINESS.md`
- Modify: `docs/preimplementation/BUILD_WEEK_SUBMISSION.md`

**Produces:** deadline ownership and a safe cut line that preserves a working submission.

- [ ] **Step 1: append the execution clock**

Append to `docs/preimplementation/BUILD_WEEK_READINESS.md`:

```markdown
## Execution clock

- Phase 0 GO: within 90 minutes of starting this plan.
- Core implementation freeze: 2026-07-21 13:00 COT.
- Public deployment and two-browser golden-path test: 2026-07-21 15:00 COT.
- Screen recording, English narration/subtitles and public YouTube upload: 2026-07-21 17:00 COT.
- Devpost form validation and `/feedback` session ID: 2026-07-21 17:30 COT.
- Final submission: 2026-07-21 18:00 COT.
- Emergency buffer before official deadline: 60 minutes.

## Cut-line rules

1. Preserve the complete teacher-controlled golden path.
2. Preserve GPT-5.6 in `analyze_stage` and `compare_learning`.
3. Preserve authentication, `ps_*` isolation, RLS, anonymization and secret custody.
4. Preserve a runnable public demo, README, video and repository.
5. Defer the free-model assistant before weakening the core loop or safety.
6. Defer cosmetic improvements before weakening testability or deployment.
```

- [ ] **Step 2: assign the final submission sequence**

Append to `docs/preimplementation/BUILD_WEEK_SUBMISSION.md`:

```markdown
## Final submission sequence

1. Run all available verification commands and the two-browser golden path.
2. Record one uninterrupted demo using only synthetic data.
3. Publish the video publicly on YouTube with English audio or subtitles.
4. Run `/feedback` in the Codex task containing most core implementation and copy its session ID.
5. Confirm repository, demo and video URLs open in a private browser window.
6. Complete every Devpost field and submit by 2026-07-21 18:00 COT.
7. Save the Devpost confirmation URL in Handoff and Wiki.
```

---

### Task 8: Run Gate 0 and hand off to the development plan

**Timebox:** 5 minutes.

**Files:**
- Modify: `2026-07-20-paideia-sensemaking-implementation-plan.md`
- Modify: `docs/preimplementation/BUILD_WEEK_READINESS.md`
- Modify: `/Users/nestor/wiki/Handoff Paideia Sensemaking.md`
- Modify: `/Users/nestor/wiki/entities/Paideia Sensemaking.md`

**Produces:** one unambiguous `GO` decision and a clean starting point for development.

- [ ] **Step 1: link the prerequisite plan from the development plan**

Add after the title block in `2026-07-20-paideia-sensemaking-implementation-plan.md`:

```markdown
> **Prerequisite:** complete `docs/superpowers/plans/2026-07-20-paideia-sensemaking-preimplementation.md` and record `Gate 0: GO` before executing Tarea 1.
```

- [ ] **Step 2: execute the mechanical readiness checks**

Run:

```bash
git ls-remote --exit-code --heads origin main
test "$(git remote get-url --push upstream)" = DISABLED
npm run build
node -e 'const f=require("./docs/preimplementation/fixtures/speech-acts-classroom.json");if(!f.synthetic||f.responses.length!==6)process.exit(1)'
rg -n 'Deadline: 2026-07-21|Track: Education|Build Week submission cut|Internal submission deadline' \
  docs/preimplementation/BUILD_WEEK_READINESS.md
git diff --check
```

Expected result: every command exits `0` and `git diff --check` prints nothing.

- [ ] **Step 3: complete Gate 0**

Check every Gate 0 item only from observed evidence. Then append exactly one of these lines:

```markdown
Gate 0: GO — prerequisites verified; begin Tarea 1 of the development plan.
```

or:

```markdown
Gate 0: NO-GO — do not begin development; resolve the unchecked Gate 0 items first.
```

- [ ] **Step 4: update Obsidian**

Update `/Users/nestor/wiki/Handoff Paideia Sensemaking.md` with:

- remote and Devpost draft state;
- Gate 0 result;
- verified access/runtime state;
- exact next development task;
- official and internal submission deadlines.

Update `/Users/nestor/wiki/entities/Paideia Sensemaking.md` with the new project status and links to the GitHub repository, Devpost project and development plan.

- [ ] **Step 5: commit any final Gate 0 changes and publish the phase-zero evidence**

Run:

```bash
git add \
  2026-07-20-paideia-sensemaking-implementation-plan.md \
  docs/preimplementation \
  docs/superpowers/plans/2026-07-20-paideia-sensemaking-preimplementation.md
git diff --cached --quiet || git commit -m "docs: complete Build Week preimplementation gate"
git push origin main
git status --short --branch
```

Expected result: any remaining Gate 0 edits are committed, `main` is synchronized with `origin/main`, and the worktree is clean.

---

## Completion Criteria

This plan is complete only when:

1. The project is attached to an OpenAI Build Week draft in Education.
2. The independent public GitHub repository exists and `upstream` cannot receive pushes.
3. The teacher-controlled golden path and Build Week cut are frozen.
4. GitHub, Devpost, YouTube, Supabase, Docker, Deno and Zen prerequisites are verified.
5. The classic Supabase schema is captured without row data and Paideia classic still builds and loads.
6. The synthetic fixture validates and contains no personal information.
7. The demo/submission clock preserves a one-hour deadline buffer.
8. Handoff and Wiki are current.
9. `docs/preimplementation/BUILD_WEEK_READINESS.md` ends in `Gate 0: GO`.

Only then begin Tarea 1 of `2026-07-20-paideia-sensemaking-implementation-plan.md`.
