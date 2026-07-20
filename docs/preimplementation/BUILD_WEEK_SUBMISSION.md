# Paideia Sensemaking — Build Week Submission

## Track

Education

## One-line description

Paideia Sensemaking helps secondary-school teachers turn live classroom evidence into an editable intervention and verify whether students can transfer the concept to a new case.

## Project description

Paideia Sensemaking is a teacher-controlled classroom feedback loop for secondary Spanish Language classes. Students respond to an initial speech-act case from their own devices. The deployed server analyzes consented, minimized evidence with the first verified-free model in a private OpenCode Zen fallback list, identifies patterns and limitations, and proposes editable teaching moves. The teacher chooses the intervention, students apply a three-column frame—what was said, what the speaker attempted to do, and what effect it produced—and then solve a new transfer case. The same free-only policy compares the before-and-after evidence, while the teacher keeps the final decision. If no verified-free model is available, Paideia continues with a manual no-AI flow. The system never grades students automatically.

Development provenance: Paideia Sensemaking was built with Codex using GPT-5.6, as required by Build Week. Runtime: the deployed product never calls GPT-5.6, OpenAI or a paid model. “Verified-free” requires exact ID availability from Zen, exact zero input/output costs from OpenCode provider metadata, and matching public Zen pricing confirmation; ambiguous candidates fail closed.

## Judging case

- Technological implementation: secure real-time orchestration, idempotent free-only Zen operations, fail-closed model verification and evidence-linked outputs.
- Design: one coherent teacher/student journey on mobile and desktop.
- Potential impact: faster formative intervention for a specific classroom problem.
- Quality of idea: AI supports pedagogical sensemaking instead of acting as a generic tutor or grader.

## Required assets

- [ ] Public GitHub repository with MIT license.
- [ ] Public deployed demo.
- [ ] README with setup, synthetic sample data, Codex/GPT-5.6 development provenance and the free-only Zen runtime policy.
- [ ] Public YouTube video under 3 minutes with English audio or English subtitles.
- [ ] `/feedback` session ID from the Codex task containing most core implementation.
- [ ] Final Devpost form submitted by 2026-07-21 18:00 COT.

## Demo script

- 0:00–0:15 — Name the teacher problem and show the initial speech-act case.
- 0:15–0:40 — Create a session and join from the student browser.
- 0:40–1:00 — Submit contrasting initial responses and show live participation.
- 1:00–1:30 — Run free-only Zen analysis; point to the verified model, patterns, cited evidence and limitations.
- 1:30–1:55 — Edit and activate the three-column intervention.
- 1:55–2:20 — Complete the transfer case from the student browser.
- 2:20–2:42 — Run comparison; show change, persistent difficulty and teacher decision.
- 2:42–2:55 — Explain where Codex accelerated the build and where human decisions remained.
- 2:55–2:59 — Show repository and deployed URL.

## Data and safety note

The demo uses only synthetic data. In real classroom use, collective external analysis is off by default and requires teacher attestation plus separate, reversible participant consent. Nonconsenting responses are excluded; payloads are minimized, PII-redacted, truncated and pseudonymized per run. Paideia does not log prompts or responses and purges classroom responses and AI artifacts by 24 hours after session close unless a documented institutional obligation applies. The notice explains that a free provider may retain or use de-identified content; institutions that do not accept those terms use the manual no-AI flow.
