---
name: prepare-pr
description: >
  Assess a PR or prospective draft for review readiness using a lightweight
  check of scope, diff, tests, project rules and available CI evidence. Use for
  "prepare PR", "is this PR ready", or "check readiness". Assessment is read-only;
  fixes and marking ready need explicit authorization. Integrated into implement
  as one final pass that reuses current validation and leaves its PR a draft.
---

# Prepare PR

Determine whether the actual revision is ready for human review, and name the
remaining blockers. This is a lightweight completion check, not another full
review engine or mandatory test-suite run.

## Resolve the scope and intent

- Accept an existing PR or an implementation's local branch before its draft PR
  exists. Read applicable project instructions, intended outcome, and acceptance.
- Establish repository, actual base/head, worktree state and existing findings.
  Use `gh` for GitHub operations; do not silently select an unrelated PR.
- "Prepare" or "is it ready?" means assess. It does not authorize edits, commits,
  GitHub comments, reviewer requests, or changing draft state.
- An explicit request to fix blockers authorizes scoped authoring through the
  existing task worktree. An explicit request to mark ready authorizes that
  transition only when the project's readiness conditions are satisfied.

## One proportionate pass

| Check | What to establish |
|---|---|
| Scope and compatibility | The diff addresses the agreed outcome without unrelated churn or unexplained contract changes. |
| Validation | Relevant acceptance has evidence; required project checks ran against the current tree. Known gaps and failures are visible. |
| Review and documentation | Consequential findings are addressed; necessary call sites, schemas, docs and examples are consistent. |
| Delivery | The intended branch/base, owned files, issue links and PR description are correct; no sensitive or accidental files are included. |

Use evidence already collected by implementation or a completed review. Do not
re-run passing checks on an unchanged validated tree merely because this skill
was invoked. Run a missing focused check only if execution is authorized and it
is needed by project policy or an unresolved risk.

Inspect available CI once when relevant. Distinguish pending, failing, stale and
unavailable results; do not poll or wait automatically. The repository's rules
determine readiness and required checks. Do not ignore a failing required check,
invent a coverage threshold, or assume green CI proves correctness.

A changed revision, expanded scope, expired evidence or affected integration can
justify new checks; explain that reason rather than repeating the whole pipeline.
Do not require a fixed agent cast, model family, score or fresh review receipt.

## Report or perform the authorized action

Return **ready for review**, **not ready**, or **insufficient evidence**, followed
by only the material blockers, check limitations and smallest next corrections.
Keep suggestions distinct from blockers; do not manufacture nits.

Within `implement`, this pass stays advisory and local. The author fixes relevant
blockers under the implementation request and reruns only affected checks.
Delivery remains a **draft PR**, even when this assessment says ready for review.

For standalone repair requests, preserve the task's worktree/PR and project
validation conventions. Reassess the changed revision before claiming readiness.
For explicitly authorized readying, re-fetch the PR head/state immediately before
the transition; do not ready a newer unreviewed revision. Verify the resulting
state and URL. Never merge, enable auto-merge, approve, or request reviewers.

## Acceptance checks

- Existing validation is reused only while its revision and relevant inputs match.
- Assessment leaves code, comments, commits and PR state unchanged.
- Pending CI is reported, not hidden or polled indefinitely.
- Integrated implementation always delivers a draft, not an automatic ready flip.
- Fixes or readying occur only within their separately authorized scope.
