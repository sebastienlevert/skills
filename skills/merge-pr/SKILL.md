---
name: merge-pr
description: >
  Merge one GitHub PR when its assessed risk and evidence-backed confidence meet
  the trusted root APPROVALS.md and deterministic APPROVALS.yml rules and all native repository checks and
  reviews are satisfied. Use for "merge this PR", "merge-pr", or an explicitly
  authorized ship --merge tick. Exact-head normal merge or required native queue;
  no admin bypass, invented confidence percentage, self-approval or rule changes.
---

# Risk-aware PR merge

One bounded closure pass, not another review/repair pipeline. A standalone merge
request authorizes this exact PR's normal merge/required queue submission when the
gate passes; evaluate/plan-only posts nothing. Scheduled use requires ship's
explicit **`--merge`** authority and [watch contract](../ship/references/watch-contract.md).
Plain ship, review, approval and APPROVALS.md alone grant no merge authority.

## Gate: authority, policy, risk and current evidence

1. Resolve the exact host/repository/PR and existing `gh` identity. Verify open,
   non-draft state, head repository/ref/SHA, actual base/SHA and merge access.
   Never switch accounts, ready a draft, approve, repair code or change rules.
2. Use [approve-pr's trusted-policy method](../approve-pr/SKILL.md) for policy/rule
   reads, not its reviewer-specific eligibility gate: root
   `APPROVALS.md` and its `APPROVALS.yml`/`.yaml` sidecar from the **actual base
   commit**, both blobs/sources, effective
   native branch protection/rulesets and complete current reviews/check evidence.
   Reuse already collected policy evidence, not another pipeline. Interpret its
   **merge** conditions separately from approval-submission conditions; do not
   invoke approve-pr to manufacture a missing review. Missing/ambiguous merge
   criteria, inaccessible rules, or a changed pinned policy blocks this step.
   Follow the [deterministic sidecar contract](../approve-pr/references/yaml-policy.md)
   and require a complete current evaluator result with `policySatisfied=true`.
   `comments` can permit merge with actual required approvals; automated review
   permission is separate. Observe/missing/invalid/expired YAML never passes.
3. Classify this actual diff under the policy's risk categories. Consider
   consequential likelihood/impact, blast radius, compatibility, sensitive paths,
   data/schema/permission changes, reversibility/recovery and evidence gaps.
   Use repository criteria, not an invented score or blanket "docs are safe" rule.
   [The opt-in example](../approve-pr/assets/APPROVALS.md) illustrates a risk matrix;
   it is not authority or a universal risk appetite. Unknown risk stays unknown.
4. Evaluate confidence **against the evidence required for that risk**: current
   substantive code review, resolved consequential findings, focused acceptance
   and regression verification, affected integration behavior, required sign-offs
   and any recovery evidence the policy asks for. Reuse exact-head/base
   [auto-review](../auto-review/SKILL.md) and
   [prepare-pr](../prepare-pr/SKILL.md) evidence. In ship, missing/stale review is
   pending for its owner; standalone may obtain an advisory review/readiness pass.
   Green CI, metadata checkboxes or agreement between models is not sufficient
   confidence. Never fabricate a calibrated percentage. If the policy demands a
   numeric criterion, require its defined measurable evidence rather than guess.
5. Require **all merge prerequisites**, unlike merely contributing an approval:
   current required checks with accepted conclusions/source apps, independent
   approvals and CODEOWNER/path/team requirements, discussion resolution, no
   policy-blocking reviews/findings, permitted risk/confidence, freshness and
   mergeability. Pending/stale/failed/cancelled/missing evidence does not pass;
   skipped/neutral counts only if actual rules allow it. Human-only risk needs
   the specific owner decision; don't waive it because other gates are green.
   The PR author may merge when eligible, but cannot self-approve: use the actual
   valid independent reviews, not whether this account's approve-pr tick succeeded.
   `--approval off` never removes native/policy approval requirements.
   For a required queue, satisfy all **PR-side admission** prerequisites; merge-
   group checks/order/fresh-base enforcement run natively after admission. Don't
   require a not-yet-created merge-group check to exist before enqueuing or claim
   admission proves those final checks passed. A stricter policy still applies.
6. Record a compact **risk, confidence sufficient/insufficient/unknown, policy
   source, evidence references and unmet conditions** verdict. Proceed without
   another confirmation only when existing scoped authority and every gate pass.
   A material missing decision stays blocked; don't widen scope to obtain green.

## Guarded merge or queue, never deferred auto-merge

Re-read active authority, identity, head/base, policy blob, effective rules,
checks/reviews/discussion and mergeability immediately before the write. A changed
input returns to its affected gate. Select only a policy-permitted, repository-
enabled merge method; ambiguity is a blocker. Normal enforcement remains in place.

- **Direct merge:** use `gh api --method PUT` on
  `repos/<owner>/<repo>/pulls/<number>/merge`, with JSON passed as data containing
  the verified **`sha`** and permitted **`merge_method`** (`merge`, `squash` or
  `rebase`). The expected head is mandatory, not a best-effort preflight. A rejected
  head/rule/check condition returns pending/blocked; never retry unguarded.
- **Required merge queue:** use the host's native `enqueuePullRequest` operation
  through `gh api graphql`, with this PR's node ID and **`expectedHeadOid`**.
  Verify support on this GitHub host; no head-bound enqueue means blocked, not
  an unguarded fallback. Never jump the queue or bypass it with a direct/admin
  merge. Record the verified queue entry, candidate SHA and policy/evidence.
- Never use `--admin`, alter protection, dismiss reviews, change identities,
  enable auto-merge or delete the branch/worktree. In particular, `gh pr merge`
  can enable auto-merge on a queue branch when checks are pending; don't use it
  as an unverified substitute for the explicit guarded APIs above. Existing
  external auto-merge/queue intent needs reconciliation, not adoption as this
  run's successful submission or a conflicting duplicate write.

The expected head does **not** pin the base, policy or check state. Use native
freshness/queue enforcement for requirements that must hold atomically; if a
mandatory invariant cannot be enforced by the chosen operation/rules, block
instead of claiming the head guard guarantees it. Queue admission authorizes the
native queue's eventual merge under its checks, not a future agent bypass.

## Reconcile and report the actual outcome

On timeout/uncertain delivery, read PR/queue state before retrying. Direct success
needs `merged=true` plus verified `MERGED` state, intended head and merge commit
URL/SHA. Queue acceptance is **queued**, never merged: verify the native entry
and preserve observation under the watch contract. A native rejection or ejection
returns pending/blocked; changed candidates require fresh review/risk evidence.

For queued ship work, suspend candidate-mutating repair; new blockers need the
normal withdrawal of this run's owned queue entry before repair/re-gating.
`--merge` authorizes that withdrawal on stop/expiry/new blockers, not removing
someone else's entry. Cancel owned schedules after verified merge; preserve the
worktree/branch for follow-ups. Return **merged**, **queued**, **pending** or
**blocked**, policy/risk/confidence verdict, exact candidate and verified outcome
reference. No live test merges or queue submissions to validate this skill.
