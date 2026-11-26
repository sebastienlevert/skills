---
name: pr
description: >
  Prepare, assess or publish a PR. Readiness questions and assessment mode are
  read-only; publishing a finished change authorizes validation, scoped commits,
  push and draft PR creation/reuse. Mark ready only when explicitly requested and
  current conditions pass. Used by ship for publication and by implement for its
  final advisory readiness pass. Reuse exact-tree evidence and preserve unrelated
  work; no review posting, approval, merge or schedules.
---

# PR

One entry point for **readiness assessment, publication and explicit readying**.
It does not select work, implement a new feature or run another review pipeline.
For a new implementation use [implement](../implement/SKILL.md), which already
delivers a draft PR; reuse its final assessment rather than repeating its pipeline.

## Select the authorized action

| Request | Action and boundary |
|---|---|
| "Prepare PR", "is this PR ready", "check readiness", or `pr assess` | Assess the known PR/local branch once. No edits, commits, push, PR creation, comments or state changes. |
| "Publish this PR", "send upstream", `pr publish`, or ship's publication step | Validate/self-review the finished change, commit owned files, push and create/reuse its PR. New PRs default to draft. |
| "Mark ready" or `pr ready` | Assess current readiness, then transition the known PR only when conditions pass. Does not imply publishing or fixing blockers. |
| Explicit request to fix readiness blockers | Scoped repair in the same task worktree, affected validation and push. Preserve PR state unless readying was separately authorized. |
| Plan/dry-run | Describe the requested scope/action; perform no writes. |

A bare `pr` uses the finished change/publication intent already established in
this session; otherwise default to assessment of a known PR/branch. Ask if the
target or intended action is genuinely ambiguous. Skill options are requests,
not a new executable. Select this toolkit skill, not Copilot's native `/pr`.

Integrated into **implement**, run assessment only: the implementation owns
authoring, push and draft creation; this pass never recurses into publication or
readies the draft. **Ship** explicitly selects publication, with later readying
only under its separate `--ready`/handoff authority. **Factory** readiness and
**merge** evidence requests select assessment unless readying is authorized.
Loading this skill never widens the caller's authority.

## Resolve the target

Recover the exact intended outcome, acceptance, owned paths, existing validation,
PR and task branch/worktree. Establish GitHub host/repository, `gh` identity,
actual base/head and current findings; never select an unrelated PR. Use `gh`,
not GitHub MCP, and do not change accounts to overcome unavailable access.

Assessment may use the existing PR or implementation's branch before a PR exists.
It requires no new worktree, base integration or GitHub mutation. Preserve dirty
work; inspect available CI once when relevant. Distinguish pending/failing/stale/
unavailable results from passing evidence; do not poll automatically.

## One lightweight readiness pass

| Check | What to establish |
|---|---|
| Scope and compatibility | The actual diff addresses the agreed outcome without unrelated churn or unexplained contract changes. |
| Validation | Relevant acceptance and required checks have current-tree evidence; failures and material gaps remain visible. |
| Review and documentation | Consequential findings are addressed; necessary callers, schemas, docs and examples are consistent. |
| Delivery | Correct branch/base, owned paths, issue links and PR metadata; no sensitive or accidental files. |

Reuse checks/reviews from the exact tree and relevant inputs. Run missing focused
checks only when execution is authorized and a requirement or risk needs them.
A changed revision, scope, expired evidence or affected integration justifies
affected revalidation, not another full pipeline. Never equate green CI with
correctness, invent coverage/score requirements, or require a fixed reviewer cast.

Return **ready for review**, **not ready** or **insufficient evidence**, with only
material blockers/limitations and smallest corrections. Suggestions are not gates.
Assessment leaves code, commits and PR state unchanged; a readiness verdict is
not permission to publish, approve, merge or request reviewers.

## Publishing: isolate and send the finished change upstream

1. Verify the writable head repository/branch, remotes and existing task PR.
   Record status, branch, remotes and registered worktrees. Fetch current head/base
   refs with pruning. Safely fast-forward a clean actual base checkout only when
   it is on that base; preserve dirty/shared/diverged or unrelated branches.
2. Reuse a verified task branch/worktree for this change. If the work is on the
   default branch or lacks isolation, create a dedicated branch and sibling
   task worktree, following project-drive/container layout. Base it on the
   finished task commits when there are any; otherwise use the refreshed remote
   base and transfer only the known owned patch/new files into it. Preserve
   original work and disclose the transfer; never discard, stash, reset, or
   accidentally omit finished commits by starting only from remote base.
3. If mixed changes cannot be attributed safely, ask for the intended paths;
   don't stage everything. If another person's PR owns this branch, stop rather
   than treating publication permission as permission to rewrite their work.
   For fork PRs, use the actual authorized head remote, not the base repository.

Follow the [implementation delivery rules](../implement/SKILL.md) for surgical
edits, project validation, attribution and fresh-base integration, but do not
reimplement the finished change or create a second worktree/PR. Reuse valid
checks from this exact tree/inputs; a base integration, changed input or missing
required check needs affected revalidation. Use the readiness pass above, not
another skill invocation or second pipeline.

- Inspect the complete owned diff, including new/binary/generated files and
  necessary dependent callers/docs. Exclude secrets and unrelated artifacts.
- Fix only consequential publishing/readiness blockers within the granted
  finished-change scope. A material behavior decision remains blocked.
- Refresh again before committing/pushing; reconcile other pushes safely and
  revalidate affected work. Do not force-push or rewrite published history.
- Stage only owned paths, inspect the staged diff/whitespace, and commit using
  repository conventions and applicable attribution. Never amend by default.
- Push the exact task branch to its authorized remote. Verify the remote head
  contains the intended commit before creating or updating the PR.
- Search for the same head repository/branch PR before creation and reconcile
  uncertain creation instead of duplicating it. Preserve existing base,
  description scope, draft/ready state and reviewers unless explicitly authorized.
- For a new PR use the target template and `gh pr create --draft` with the actual
  repository/base/head and a body passed as data. Include outcome, scoped changes,
  acceptance/issue references, current verification and material limitations.
  Do not close a parent epic or an incompletely implemented issue.
- Verify canonical URL, state, head/base, changed paths and intended revision.
  Failed checks remain visible; a WIP draft is **blocked**, not validated delivery.

## Explicit readying and repair

An explicit ready request (including ship's `--ready`) authorizes transition only
after the current readiness conditions pass. Re-fetch head/state immediately
before readying; never ready a newer unassessed revision. Verify resulting state
and URL. An already-ready PR is a no-op, not demoted to draft. Blockers are reported,
not silently repaired under ready-only authority.

For explicitly authorized repair, preserve the same worktree/PR and project
validation conventions; reassess changed evidence. Within implementation,
corrections remain under its original task authority and delivery stays draft.
No implicit reviewer requests, comments, approval, merge, auto-merge or schedules.

## Result

Return the exact PR and host/repository, task worktree, head repository/branch,
base and pushed SHA, current verification references, draft/ready state and
blockers **when publishing**. Assessment reports only readiness and its evidence;
readying verifies the resulting native state. An already published finished PR
may be a verification-only no-op.
Retain the worktree for the review/repair steps and future follow-ups.
