---
name: publish-pr
description: >
  Prepare a finished change, validate and self-review its actual revision, commit
  owned files, push the task branch and create or reuse its GitHub PR. Use for
  "publish this PR", "send this change upstream", or ship's first step. New PRs
  default to draft; explicit ready authority uses prepare-pr. Preserves unrelated
  work and existing PR state; no review posting, approval, merge or schedules.
---

# Publish a finished change

This is the upstream-delivery step of [ship](../ship/SKILL.md), also callable
alone. It does not select work or implement a new feature. For a requested new
implementation use [implement](../implement/SKILL.md) instead, which already
delivers a draft PR; do not run its implementation pipeline again just to publish.

## Resolve and isolate the finished change

1. Recover the user's exact finished change, acceptance, owned paths, current
   validation and any existing task worktree/PR. Resolve GitHub host, repository,
   `gh` identity, remotes, actual base and writable head repository/branch. Use
   `gh`, not GitHub MCP; never change accounts to overcome access errors.
2. Record status, branch, remotes and registered worktrees. Fetch current head/base
   refs with pruning. Safely fast-forward a clean actual base checkout only when
   it is on that base; preserve dirty/shared/diverged or unrelated branches.
3. Reuse a verified task branch/worktree for this change. If the work is on the
   default branch or lacks isolation, create a dedicated branch and sibling
   task worktree, following project-drive/container layout. Base it on the
   finished task commits when there are any; otherwise use the refreshed remote
   base and transfer only the known owned patch/new files into it. Preserve
   original work and disclose the transfer; never discard, stash, reset, or
   accidentally omit finished commits by starting only from remote base.
4. If mixed changes cannot be attributed safely, ask for the intended paths;
   don't stage everything. If another person's PR owns this branch, stop rather
   than treating publication permission as permission to rewrite their work.
   For fork PRs, use the actual authorized head remote, not the base repository.

## Prepare once, then send upstream

Follow the [implementation delivery rules](../implement/SKILL.md) for surgical
edits, project validation, attribution and fresh-base integration, but do not
reimplement the finished change or create a second worktree/PR. Reuse valid
checks from this exact tree/inputs; a base integration, changed input or missing
required check needs affected revalidation. Use the lightweight
[prepare-pr](../prepare-pr/SKILL.md) pass for scope/compatibility, validation,
review/docs and delivery metadata. Do not impose a second full pipeline.

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

New PRs default to draft. Only an explicit ready request (including ship's
`--ready`) authorizes `prepare-pr` to transition the verified PR after current
conditions pass. An already-ready PR is not demoted to draft. No implicit reviewer
requests, review comments, approval, merge, auto-merge or schedules.

## Result

Return the exact PR and host/repository, task worktree, head repository/branch,
base and pushed SHA, current verification references, draft/ready state and
blockers. An already published finished PR may be a verification-only no-op.
Retain the worktree for the review/repair steps and future follow-ups.
