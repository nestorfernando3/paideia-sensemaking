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
- [x] Independent GitHub remote exists and `main` is published.
- [ ] Product and demo contracts are frozen.
- [ ] Required accounts and local runtimes are available.
- [ ] Legacy Supabase baseline is recorded without exporting row data.
- [ ] Synthetic fixture parses successfully.
- [ ] Submission schedule and owners are explicit.
- [ ] Handoff and Wiki reflect the verified state.

## Verified Devpost draft evidence

- Submission ID: `1106114`
- Education was saved and verified on 2026-07-20.
- The final submission was not sent; the entry remains a draft.

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
