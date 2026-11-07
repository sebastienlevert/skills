---
name: factory
description: >
  Orchestrate existing development skills from issue triage/selection through
  implementation, review, feedback repair and PR readiness. Modes draft, ready
  and merge control final authority; draft is default. Invoke the owning skills
  rather than duplicating their logic. Explicit merge mode requires current,
  evidence-backed high confidence and normal repository checks/reviews; never
  self-approve, bypass protection or run an unbounded queue.
---

# Software delivery factory

This is a **router, not another implementation/review framework**. The component
skills own their procedures. Factory owns only scope, mode, sequencing, limits,
and the final authorized closure.

## Input and authority

Resolve the exact repository, supplied issue or selection scope, mode and limits:

```text
/factory owner/repo --mode draft
/factory owner/repo#123 --mode ready
/factory owner/repo --mode merge
```

These are skill-request options, not a new executable CLI. Default to **one issue
and at most two correction cycles**; honor explicit validated limits instead.
Plan-only/dry-run requests cause no writes. Do not schedule recurring work or
expand to an account-wide queue.

| Mode | Authority |
|---|---|
| `draft` | Author and push, review, address scoped feedback; create a draft and preserve an existing PR's state. No readying, approval or merge. |
| `ready` | Also authorize `prepare-pr` to mark ready when its conditions pass. No approval or merge. |
| `merge` | Also authorize eligible approval through `auto-review` and normal merge/queue submission after the closure gate. |

An explicit mode grants only those scoped effects. "Factory" alone never means
merge. Pass the original request, constraints and mode authority to every invoked
skill; invoking a component does not widen permissions.

## Invoke the owners

Resolve and use the host's actual skill invocations, not a guessed executable or
new CLI session. If a skill is already loaded, follow it without loading it again.
If a required skill cannot be invoked/loaded, report that dependency and stop the
affected phase; do not silently replace it with a duplicate workflow.

| Phase | Owning skill | Input and required result |
|---|---|---|
| Repository setup, only when needed/requested | [setup-repo](../setup-repo/SKILL.md) | Verified destination/layout; no surprise conversion of an existing checkout. |
| Backlog readiness and next issue | [triage](../triage/SKILL.md), backlog mode | Requested issue or bounded queue -> eligible canonical issue, selection reason, acceptance and blockers. |
| Root cause, only when unclear | [investigate](../investigate/SKILL.md) | Selected issue -> evidence and bounded correction plan. |
| Contract/decision work, only when warranted | [new-spec](../new-spec/SKILL.md), [new-adr](../new-adr/SKILL.md) | Required behavior/choice -> project-native contract, without invented approval. |
| Verification plan | [test-plan](../test-plan/SKILL.md) | Acceptance/scope -> brief focused cases; reuse implement's integrated planning, not a second plan. |
| Authoring and first draft | [implement](../implement/SKILL.md) | Selected issue/plan -> validated pushed revision and task worktree/PR. |
| Review | [auto-review](../auto-review/SKILL.md) | Actual pushed head -> findings/recommendation and evidence limits. Advisory on the first pass. |
| Feedback disposition | [triage](../triage/SKILL.md), review-feedback mode | Current findings/threads -> reasoned correction plan. |
| Corrections/conflicts and communication | [address-pr-feedback](../address-pr-feedback/SKILL.md) | Authorized concerns -> pushed fixes, verified evidence replies, eligible thread resolutions. |
| Final readiness | [prepare-pr](../prepare-pr/SKILL.md) | Current revision/evidence -> readiness or material blockers; readying only in ready/merge mode. |

An obvious fix need not invoke investigation, a spec or an ADR. Use component
outputs as the next input, not a parallel re-derivation. Do not impose a fixed
model cast, extra review pipeline, committed plan or repeated tests.

## Route corrections, don't reimplement them

Reuse the same issue's worktree and PR. Follow the repository's registered layout;
in a bare container, task worktrees are siblings of main/default inside it.

After review, route actionable concerns through triage and address-pr-feedback,
then back to review/readiness for the changed revision. Reuse valid unchanged
evidence; the owning skills decide affected revalidation. Keep author/self review
distinct from genuinely independent review.

Stop when the selected mode is satisfied, a material decision/permission is
missing, or the issue/correction budget is exhausted. Return partial state and
blockers rather than inventing tasks, waiving gates or looping indefinitely.

## Final closure is mode-bound

For `draft`, return the verified PR without transitioning it. For `ready`, let
`prepare-pr` own the authorized readying operation and verify its result.

For `merge`, require the **current** auto-review and prepare-pr results to support
high confidence, with no unresolved consequential findings or material ambiguity
and all actual repository/user-required checks and reviews satisfied. Confidence
is evidence-backed, not an invented percentage or green CI alone.

If native approval is appropriate and the current identity is eligible, let
`auto-review` publish the supported approval for its verified head. GitHub does
not permit approving one's own PR: never switch identities or claim self-review
is native approval. For own PRs, apply the actual independent-approval requirements;
do not invent an extra requirement or bypass an existing one.

Re-fetch head/base/state immediately before final operations. A changed head
returns to the affected component phase. Factory may then submit the normal,
repository-permitted merge, bound to the verified head where supported. Never use
admin bypass, dismiss reviews, alter protection, force-push or hide disputed work
to unlock merge.
With `gh`, pass `--match-head-commit <verified-sha>`; a mismatch returns to
review/revalidation, not an unguarded merge retry.

Verify actual `MERGED` state and merge commit. Queue admission is **queued**, not
merged; don't wait indefinitely or claim issue closure prematurely. Retain
worktrees/registered source paths unless cleanup is explicitly requested.

## Result

Report selected issue/reason, mode, worktree/PR, pushed revision, component
validation/review evidence, feedback outcomes, blockers and actual final state:
**draft**, **ready**, **blocked**, **queued**, or **merged**.

## Acceptance checks

- Most work is performed by invoked owning skills, not copied procedures.
- Default mode cannot ready, approve or merge.
- Triage owns issue selection and feedback assessment in distinct modes.
- Corrections reuse the same PR and ship before evidence replies/resolution.
- Merge mode honors real checks/reviews and cannot self-approve or bypass rules.
- Missing skills, concurrent updates and exhausted limits remain visible blockers.
