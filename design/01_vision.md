# 01 — Vision

## What this is

The **Questionnaire Apps Ecosystem** is an open, modular platform for designing, distributing, and analysing questionnaires used in psychological research. It is built for scientific instruments — validated scales, longitudinal studies, behavioural experiments — not for marketing surveys.

The ecosystem is organised around a shared canonical data standard: a single questionnaire definition can be authored once and rendered consistently in a web browser, in a native (Godot) application, or embedded in a game or VR environment. PDF is available as an export format for paper administration. Responses and fine-grained interaction telemetry flow from every rendering target through the Viewer Service into a common research data backend ([Behaverse](https://behaverse.org)) — a sibling project operated by the same organisation (see [12_governance.md](12_governance.md)).

## Why it exists

Existing tools for survey delivery fall into two camps:

- **Commercial survey platforms** (Qualtrics, SurveyMonkey, Typeform) are optimised for marketing and customer-feedback workflows. They lack first-class support for psychometric metadata, validated-instrument libraries, fine-grained interaction telemetry, embedding, and offline operation.
- **Open research tools** (REDCap, LimeSurvey, PsychoPy, jsPsych) each cover a slice of the space but are not integrated, do not share a data model, and do not span the full author-to-deploy-to-analyse pipeline.

This ecosystem is intended to be the integrated, research-first option: a single data standard, multiple rendering targets, a peer-reviewed library of validated instruments, and a participant platform for longitudinal studies.

## Who it is for

**Primary users**

- **Researchers** — design studies, deploy questionnaires, analyse responses
- **Participants** — complete questionnaires in lab, online, on mobile, offline, or within games
- **Research teams and labs** — collaborate on instruments, manage longitudinal cohorts

**Secondary users**

- **Clinicians** using validated assessment tools
- **Educators** deploying classroom or curriculum-linked assessments
- **Game developers** embedding research questionnaires into game/VR experiences

**Scale.** A research lab or small academic community runs the system as a self-hosted single-tenant deployment. Multi-user, with study-level permissions; not multi-tenant SaaS.

## What makes it different

1. **One canonical questionnaire definition, many viewers.** Web and native (Godot) viewers render the same JSON; the same definition also exports cleanly to PDF. A researcher authors once.
2. **Research-grade data model.** Psychometric metadata (reliability, validity, norms), versioning, translations, and scoring rules are first-class — not afterthoughts.
3. **Fine-grained interaction telemetry.** Every viewer emits xAPI 2.0 statements (IEEE 9274.3.1-2023) for semantic events, and produces per-session behavioural-channel attachments (mouse, keyboard, response-time, future webcam/microphone) referenced from the xAPI stream.
4. **Reusable content components — by design, going forward.** Questions, option-sets (e.g. a five-point Likert), instructions, and prompts are independent versioned entities in the Library. A questionnaire is a composition of references, not a self-contained blob. This is a forward-looking commitment: the model is chosen to encourage and reward reuse in new research, not to retrofit a description of past authoring practice.
5. **Research-tooling, not just a catalogue.** The ecosystem supports ongoing development of new questions and questionnaires; the reusable pool is the substrate that future instruments compose from.
6. **Peer-reviewed contributions.** New submissions to the Library go through a community review/contribution workflow (GitHub-backed) before publication. The Library catalogues content with transparent licensing metadata (see [11_content_licensing.md](11_content_licensing.md)); it does not enforce licensing — users are responsible for ensuring they have the rights required to use a given instrument in their study.
7. **Behaverse-integrated.** Responses, events, and behavioural-channel attachments flow into the Behaverse Data Collection API ([api.behaverse.org](https://api.behaverse.org/docs)) via the Viewer Service; custom schemas are published under `behaverse.org/schemas/`. Behaverse and this project are sibling projects operated by the same organisation (see [12_governance.md](12_governance.md)).

## What it explicitly is not

- **Not a marketing/customer-feedback survey tool.** Different feature set, different priorities (no funnel analytics, no NPS dashboards).
- **Not a statistical-analysis package.** Data is exported in formats (CSV wide/long, SPSS, R) that researchers load into existing tools (SPSS, R, Python, JASP).
- **Not a clinical-decision system.** It may host validated clinical instruments, but it does not produce clinical diagnoses or treatment recommendations.
- **Not multi-tenant SaaS.** Single-tenant self-hosted; no billing, no per-customer encryption keys, no public sign-up flow for organisations.
- **Not a biometric / medical-device platform.** Webcam and microphone are optional research data channels; integration with regulated medical devices is out of scope.

## Guiding principles

1. **Standards-first.** Open standards (JSON Schema, xAPI, OAuth2, ISO 639/8601, Schema.org, DataCite) over bespoke designs wherever they fit.
2. **Modularity.** Each component (Library, Editor, Viewer Service, Viewer family, Participant Platform) operates independently with a well-defined API. Submission paths to Behaverse are written against pluggable sink interfaces, so a lab can adopt this stack without adopting Behaverse if they choose. A lab can adopt a subset of the components without adopting the rest.
3. **Privacy by design.** GDPR-aligned consent flows, data minimisation, pseudonymisation by default, and a clear data controller / processor distinction.
4. **Multi-context consistency.** The same canonical definition produces semantically equivalent participant experiences in every supporting viewer. Visual presentation is enforced as authored within the physical envelope of the participant's device; the supported feature set is declared per viewer in a conformance manifest.
5. **Reuse over duplication.** Shared questions, shared option-sets, shared translations. Composition over copy-paste.
6. **Accessibility.** WCAG 2.1 AA across all interfaces; keyboard navigation, screen-reader support, contrast and font-size controls.
7. **Documentation-first.** Specifications are written before implementation; implementation is judged against the specification.

## Success criteria

These criteria describe the **end-state** of the ecosystem. They are evaluated when the relevant components ship per the plan; per-phase outcomes are tracked in [../plan/01_roadmap.md](../plan/01_roadmap.md).

The ecosystem is successful when:

- A researcher can find, adapt, deploy, and analyse a validated instrument in less than a working day.
- The same questionnaire renders with semantic equivalence in the Web Viewer and the Native (Godot) Viewer, and exports cleanly to PDF, with zero hand-tuning per target.
- Response and event data exported from any deployment loads directly into SPSS, R, or Python without transformation.
- Reusable entities (questions, option-sets, instructions, prompts) accumulate measurable reuse over time across newly-authored questionnaires, evidenced by usage counts.
- Validated instruments contributed to the Library accumulate citations, peer-reviewed comments, and reuse across independent studies.
- A lab can run a longitudinal study (enrolment → scheduled assessments → reminders → withdrawal) end-to-end on the Participant Platform.

## Related documents

- [02_terminology.md](02_terminology.md) — terms used consistently across this ecosystem
- [03_use_cases.md](03_use_cases.md) — the scenarios the system must support
- [04_architecture.md](04_architecture.md) — components and how they fit together
- [05_data_model.md](05_data_model.md) — the data standards everything is built on
