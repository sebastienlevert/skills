---
name: merge
description: >
  Merge one GitHub PR with Simple approvals (explicit session consent and native
  gates) or Advanced approvals (also enforce the trusted base Markdown/YAML
  policy pair). No policy setup or GitHub self-approval is required for Simple
  approvals; present policy remains binding.
  Use for "merge this PR", "merge", or an explicitly
  authorized ship --merge tick. Exact-head normal merge or required native queue;
  no admin bypass, invented confidence percentage, self-approval or rule changes.
---

# Risk-aware PR merge

One bounded closure pass, not another review/repair pipeline. A standalone merge
request authorizes this exact PR's normal merge/required queue submission when the
gate passes; evaluate/plan-only posts nothing. Scheduled use requires ship's
recorded explicit merge authority (`--merge` or an exact-PR merge choice at
handoff) and the [watch contract](../ship/references/watch-contract.md).
Plain ship, review, approval and APPROVALS.md alone grant no merge authority.

## Gate: authority, policy, risk and current evidence

1. Resolve the exact host/repository/PR and existing `gh` identity. Verify open,
   non-draft state, head repository/ref/SHA, actual base/SHA and merge access.
   Never switch accounts, ready a draft, approve, repair code or change rules.
2. Read policy and native rules using
   [approve's trusted-policy method](../approve/SKILL.md), but apply the
   [merge policy modes below](#policy-files-are-optional-for-explicit-merge),
   not its approval-submission eligibility gate. Read root `APPROVALS.md` and
   `APPROVALS.yml` (`.yaml` only when `.yml` is absent) from the **actual base
   commit**. Pin present blobs and verified absence with source references.
   Inspect effective branch protection/rulesets and complete current reviews/
   checks. Reuse evidence; do not invoke approve to manufacture a missing review.
   Use the checked [native-rule capability reader](../approve/references/native-rule-access.md)
   to distinguish a verified private-plan inspection limitation from an access
   error. Where permitted by present policy, or the explicit-authority fallback,
   retain all other gates and normal expected-head-bound GitHub enforcement.
   Never infer absent rules from a capability limitation, skip available reads,
   or turn other denials into permission.
3. Classify this actual diff under present policy's risk categories, or assess
   the relevant risks directly when none are defined. Consider
   consequential likelihood/impact, blast radius, compatibility, sensitive paths,
   data/schema/permission changes, reversibility/recovery and evidence gaps.
   Use available repository criteria, not an invented score or blanket
   "docs are safe" rule.
   [The opt-in example](../approve/assets/APPROVALS.md) illustrates a risk matrix;
   it is not authority or a universal risk appetite. Unknown risk stays unknown.
4. Evaluate confidence **against the evidence required for that risk**: current
   substantive code review, resolved consequential findings, focused acceptance
   and regression verification, affected integration behavior, required sign-offs
   and any recovery evidence present policy asks for. Reuse exact-head/base
   [review](../review/SKILL.md) and
   [pr](../pr/SKILL.md) assessment evidence. In ship, missing/stale review is
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
   valid independent reviews, not whether this account's approve tick succeeded.
   `--approval off` never removes native/policy approval requirements.
   For a required queue, satisfy all **PR-side admission** prerequisites; merge-
   group checks/order/fresh-base enforcement run natively after admission. Don't
   require a not-yet-created merge-group check to exist before enqueuing or claim
   admission proves those final checks passed. A stricter policy still applies.
6. Record a compact **risk, confidence sufficient/insufficient/unknown, policy
   source, evidence references and unmet conditions** verdict. Proceed without
   another confirmation only when existing scoped authority and every gate pass.
   A material missing decision stays blocked; don't widen scope to obtain green.

## Policy files are optional for explicit merge

Support two approval models without forcing policy setup:

- **Simple approvals:** explicit user consent in this session authorizes the
  exact PR's merge after current review/validation and native gates. No policy
  installation, deterministic evaluator, invented seat or GitHub `APPROVE` review
  is required merely to use this mode.
- **Advanced approvals:** the actual base has the Markdown/YAML pair; enforce
  its risk, evidence, seats and sign-off conditions as well as native gates.
  Session consent may satisfy a policy-permitted maintainer sign-off or
  author-eligible seat, with verified identity/access and exact head/base evidence.
  Do not require a GitHub review when the policy permits a session decision.

An exact-PR merge request, including recorded ship `--merge` authority, supplies
merge authority in either model; do not ask again solely because policy files
are absent or the authenticated author cannot self-approve. A separate policy-
required sign-off still needs its specified decision and evidence. Record session
consent as such, never as a native GitHub approving review. Do not switch accounts,
post a fake approval, or force the user to create policy files for a personal repo.

| Verified actual-base state | Merge gate |
|---|---|
| Markdown and sidecar present | Advanced approvals: honor Markdown merge conditions and require the complete current sidecar result `policySatisfied=true`. |
| Markdown only | Simple session consent plus its explicit merge conditions; a missing sidecar alone is not a blocker unless the Markdown expressly requires it. |
| Sidecar only | Simple session consent plus its complete current rules and `policySatisfied=true`; do not invent Markdown requirements. |
| Neither present | Simple approvals: session consent, current risk/review/validation evidence and native requirements; no policy files or evaluator needed. |
| Present policy is invalid, ambiguous, unreadable, unsupported, observing, or its required evidence is incomplete/expired | Block the affected gate; this is not absence and the fallback cannot bypass it. |

Use the [deterministic contract](../approve/references/yaml-policy.md) for every
present sidecar. A `comments` verdict can permit merge with actual required
approvals; it never permits an automated approving review. Honor any applicable
nested policy; an unsupported hierarchy is not a no-policy repository.

Establish absence through a successful read of the exact base tree or a
confirmed missing path after verifying repository/ref access. A denied read,
ambiguous 404, empty malformed response or missing head copy proves nothing.
Do not use a PR's deletion/change of policy to evade the existing base policy.
Record authority, exact candidate, present policy blobs or absent paths, risk,
evidence, native prerequisites and selected merge method. Recheck before writing;
a changed candidate or newly added/removed/changed base policy needs affected
reassessment, and changed policy requires explicit owner renewal.

Without policy-defined risk thresholds, do not impose the bundled example or
invent mandatory sign-offs. Material unknowns or consequential unresolved
findings still block. User merge consent never substitutes for native independent
approvals, required checks, discussion resolution, freshness, mergeability or
queue admission. Missing policy may block `approve` while `merge` is eligible;
do not require this account's approval when GitHub does not require it.

Prefer the user's or present policy's merge method. With neither, use squash
when enabled, otherwise the sole enabled method; ask only if the remaining
choice is ambiguous. A required native queue always takes precedence.

## Guarded merge or queue, never deferred auto-merge

Re-read active authority, identity, head/base, policy presence/blobs, effective rules,
checks/reviews/discussion and mergeability immediately before the write. A changed
input returns to its affected gate. Select a repository-enabled merge method
permitted by present policy or the Simple-mode rule above; ambiguity is a blocker.
Normal enforcement remains in place.

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

## Acceptance scenarios

- No policy files plus explicit exact-PR merge consent and satisfied native/
  review/validation gates permits guarded merge without another policy ask.
- Personal/self-authored PRs use session consent, not an attempted native
  self-approval. Advanced policy may accept session sign-off/author seats when
  explicitly permitted; actual required independent GitHub approvals still apply.
- A single policy file is enforced; the missing companion alone does not block.
  An explicit requirement for that companion is not silently waived.
- Missing policy without merge authority never permits a write; ordinary ship,
  installation, a policy template or a successful approval grants no merge consent.
- Denied/ambiguous reads, invalid/observing/expired policy, unsupported nested
  rules, pending checks and required independent approvals remain blocked.
- Changed head/base/policy is re-gated; policy removal in the PR cannot authorize
  itself, and queue admission remains queued rather than merged.
