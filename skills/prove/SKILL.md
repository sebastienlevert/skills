---
name: prove
description: >
  Prove that a requested feature or fix works through observed acceptance
  scenarios, evaluations and real experience evidence. For UI changes, capture
  screenshots or a short recording, preferably with Playwright CLI. Publish
  revision-bound proof as a verified PR comment. Used by ship before readiness,
  approval or merge; reuse current functional evidence rather than another test
  pipeline. No code repair, fabricated media, live writes beyond authorized
  verification/publication, GitHub approval, readying, merge or schedules.
---

# Prove the requested outcome

Answer **"What did we observe that establishes the ask is done and works?"**
Review assesses the implementation; prove demonstrates the experience. A green
test suite or a screenshot with no acceptance context is not enough.

## Scope and authority

| Request | Action |
|---|---|
| `prove`, "prove this works", or ship's proof step | Verify the known change and publish its proof comment on the exact PR. |
| "Preview proof" or verification-only | Collect the authorized evidence; do not upload or post. |
| Plan-only | Describe the evidence plan; do not run scenarios, capture, upload or post. |
| "Post this proof" | Verify the supplied evidence and revision, then publish; do not silently repeat valid scenarios. |

Resolve the repository/host, authenticated identity, exact PR/head/base, original
ask and acceptance criteria. Reuse the current task worktree and test plan.
An ambiguous target or missing material acceptance criterion needs clarification.
Use `gh` for GitHub; do not switch accounts or create another implementation.

An explicit prove request authorizes bounded local verification, capture and
publication to that PR. It does not authorize production mutations, provisioning,
new identities, unrelated external uploads or exposure of private data.
Use authorized fixtures/test accounts. Preserve unrelated work; report missing
access instead of bypassing it. Installation alone grants no authority.

## 1. Choose the smallest convincing evidence

Map each material acceptance criterion to a scenario, expected outcome and
observable result. Include the important error/regression path when relevant.
Reuse trustworthy current functional checks, evaluations and media; do not add
one command per criterion, rerun a full suite or invent edge cases for ceremony.

| Changed surface | Evidence |
|---|---|
| Graphical UI / web, mobile or desktop experience | Actual screenshots or a short recording of the affected flow, with actions and observed outcomes. |
| CLI, API, library or background behavior | A bounded real-entry-point scenario or relevant existing evaluation, with assertions and observed state/output. |
| Documents, contracts or agent instructions | Applicable contract checks and a scenario-based evaluation; state what was not exercised live. |

For UI, media is required, not optional decoration. Capture enough to show the
requested behavior, not every screen. Prefer a short recording for transitions
or multi-step interactions; a screenshot can establish a meaningful final state.
Use before/after evidence only when it materially clarifies the change.
Do not manufacture a UI demonstration for a non-UI task.

## 2. Exercise and inspect the real experience

- Prefer **Playwright CLI** for web UI capture and functional confirmation.
  Reuse project browser setup and verified commands; an existing browser runner
  is an explicit fallback when CLI is unavailable. Other UI uses the appropriate
  available capture/automation tool. Missing capture capability is a blocker,
  not permission to substitute a mockup or unit-test report.
- Exercise the flow and assert the expected visible behavior plus relevant
  state/network effects. Inspect console/page errors when applicable. A running
  server, homepage load or screenshot alone does not establish an interaction.
  Inspect every image/recording actually selected for publication.
- Verify that the app/build/preview came from the recorded candidate, with
  relevant source, configuration, dependencies, fixtures and environment.
  An unrelated deployment or dirty source tree is not exact-head proof.
  Record tested head/base, build provenance, scenario inputs and material limits.
- Keep real evidence honest: no generated illustrations, edited success states,
  staged mock data passed off as actual behavior or unsupported "all works" claims.
  Use safe test data; exclude secrets and private information before capture.
  Any necessary redaction must not conceal a failure or alter the claimed result.
- Keep captures in the session artifact directory, not source commits by default.
  Use finite runs and stop task-owned test helpers after capture. Never open
  another agent session or require a reviewer/evaluation cast to produce proof.

For evaluations, distinguish proposed criteria from observed results. An agent
instruction review can establish contract consistency, not live-agent adherence;
label that limit rather than fabricate an executed evaluation.

## 3. Publish strong proof on the PR

Use one concise conversation comment, separate from the code-review COMMENT.
Include:

1. The original ask and tested head/base or verified artifact revision.
2. A compact **scenario -> expected -> observed** table with actual results.
3. For UI, embedded hosted screenshots with useful captions/alt text or a playable
   short recording; for other tasks, relevant hosted evaluation/check references.
4. Material limitations or untested acceptance gaps, and an honest result.

Use the [PR media recipe](references/pr-media.md); prefer the host's
`github-pr-media` skill when available. Upload only actual selected evidence to
the authorized PR's host. UI proof must contain accessible hosted media,
not local paths, temporary URLs, broken embeds or a promise to attach later.
Video URLs need their own paragraph, not image Markdown. Non-UI proof uses
applicable evaluation/contract references rather than an invented image.

Before writing, recheck identity, open PR, head/base, evidence provenance and
publication authority. Deduplicate by candidate, scenarios and evidence assets.
Reuse an equivalent verified proof comment; do not repeatedly post "still works."
For a changed candidate, preserve prior proof as historical and publish only the
needed updated proof. Do not edit unrelated comments or use `--edit-last` blindly.

Read back the exact comment URL/ID and every expected media reference. Confirm
the observed outcomes and tested revision are represented, attachments landed,
no local references remain, and head/base still match. A comment existing does
not prove all uploads succeeded. Reconcile partial/uncertain delivery before
retrying; retain successful assets and retry only identified missing evidence.
A concurrent push leaves the published proof stale, not proof of the new head.

## 4. Record the result and stop

Return **proven**, **failed**, **blocked** or **stale**, with tested revision,
acceptance results, verified proof comment URL, asset references and material
limits. `proven` requires the applicable acceptance evidence and verified comment
publication; verification-only returns observed results without claiming delivery.
Missing UI media, an unexercised material criterion or unverifiable publication
cannot be presented as completed proof.

Within [ship](../ship/SKILL.md), save proof status, scenario/evidence fingerprints,
tested head/base and relevant runtime inputs, assets and verified comment receipt.
An unchanged result is reused. Changed inputs invalidate affected proof; a new
head requires current candidate accounting, not automatically a full rerun.
Reuse media only when its relevant inputs and provenance remain valid, disclose
the reuse, and bind the current comment/receipt to the new candidate.

Failed acceptance becomes a scoped concern for [watch](../watch/SKILL.md).
Prove does not repair code, rerun until green, post an approving review, mark
ready, merge or create schedules. Missing credentials/capture/upload support
remain a precise blocker. Ship must not call stale/failed/blocked proof ready.

## Acceptance scenarios

- UI change: observed flow plus actual hosted media and assertions, not a mockup
  or screenshot of an unrelated deployment.
- Non-UI change: applicable evaluation/scenario evidence without invented media
  or live-agent claims.
- Current functional evidence: reuse it and capture only missing useful evidence.
- Failed scenario or missing UI/upload capability: return failed/blocked, never
  a success comment that hides the gap.
- Duplicate, partial upload or changed head: reuse/reconcile safely; no duplicate
  assets or stale proof reported as current.
