# Personal Toolkit approval and merge policy

This policy applies to `sebastienlevert/skills`. Pair it with root
`APPROVALS.yml` and read both from the actual PR base commit. Proposed policy
changes cannot authorize their own approval or merge. The bundled policies in
`skills/approve/assets/` remain opt-in examples, not this repository's policy.

The owner adopts a maintainer-gated model: bounded low-risk text changes may use
automation; consequential changes require explicit maintainer sign-off. A
maintainer may sign off on their own change, but cannot submit a native
self-approval. YAML seats and sign-off never replace GitHub-required independent
or CODEOWNER approvals.

## Authority and common gates

- Policy grants no action by itself. Approval needs an explicit approval/ship
  request; merge needs a scoped merge request, `ship --merge`, or an exact-PR
  merge choice at handoff. Ready transitions need separate explicit authority.
- The PR must target `main`, be open and non-draft, and have no merge conflicts,
  unresolved consequential findings, changes-requested reviews or required
  unresolved discussion. Never switch identities or manufacture self-approval.
- A substantive review must cover the actual head/base and affected contracts,
  consumers and compatibility. All required local checks must pass:
  `npm test`, `npm run validate`, and `git diff --check`.
- Require a successful current-head `packaging` check from this repository's
  **Validate marketplace** workflow, plus all native required checks and reviews.
  Verify the source workflow/run and candidate SHA, not only the check name.
  Missing, pending, failed, cancelled or stale results block; skipped/neutral
  is not accepted for `packaging`.
- Evaluate the base-pinned sidecar with a complete, verified snapshot using the
  bundled `skills/approve/scripts/approval-policy.mjs`. Approval requires
  `automationApprovalAllowed=true`; merge requires `policySatisfied=true` plus
  every Markdown and native gate. A `comments` verdict permits gated merge,
  never an automated approving review.
- Each successful rule requires a verified human with repository write access.
  An eligible same-repository author may fill this YAML seat using verified
  opener/pusher evidence. Forks and outside contributors need a current eligible
  review to fill it. This is not a GitHub approval or an independence guarantee.

## Risk and confidence

| Risk | Scope and sufficient-confidence evidence | Automated outcome |
|---|---|---|
| Low | At most 10 changed files and 300 added/deleted lines; bounded reversible text/presentation edits with no change to runtime behavior, contracts, permissions, policy, workflow or executable assets. Current substantive review, relevant acceptance/regression checks and no material evidence gaps. | Eligible automated approval and explicitly requested merge after all gates pass. |
| Moderate | Observable skill/contract behavior, executable/tooling/dependency/catalog changes, a protected path, or a change exceeding the low-risk bounds. Current substantive review and relevant checks plus affected-consumer/integration verification, an actionable recovery path and explicit maintainer sign-off for this head/base and risk. | `comments` only; explicitly requested merge after sign-off and all gates pass. No automated approving review. |
| High | Security/privilege-boundary expansion, destructive or irreversible data effects, difficult recovery or broad unbounded impact. | No automated approval or merge; manual owner decision outside these skills. |
| Unknown | Missing, ambiguous, incomplete or stale risk/review/sign-off evidence. | Block until resolved; never infer low risk from extensions, CI or model agreement. |

For moderate changes, sign-off must be an explicit decision by a verified human
with repository `maintain` or `admin` access. Retain the native comment/review URL
or an exact session decision reference, actor, head/base and accepted risk/recovery
scope. A generic merge request, co-author trailer, YAML seat, bot review or this
policy's adoption is not sign-off on a future change. The author may be that
maintainer; native independent-review requirements still apply.

Protected paths include policy/owner/Git configuration, `.github/**`, and the
approval, merge, ship, review, watch, PR, implementation, factory, feedback,
setup, workspace initialization, queue and session control skills. Even a small
text-only edit there requires moderate-risk review and maintainer sign-off.
Symlink, submodule, `.gitattributes` and hierarchical-sidecar changes remain
manual-only under the current evaluator. Unverified file modes remain blocked;
security-sensitive impact cannot be downgraded merely by maintainer sign-off.

## Classifier evidence for the sidecar

Use the existing evaluator's classifier snapshot contract; no remote classifier
or fixed-model workflow is required. Each result must have `status: complete`,
the exact `headSha` and `baseSha`, a nonempty evidence `source`, and a listed
`value`. The owner must verify the source before supplying a result; JSON fields
alone cannot establish review, sign-off or access.

| Classifier | Allowed values | Required source |
|---|---|---|
| `copilot/code_review` | `pass`, `fail` (built in) | Current substantive review and dispositions of consequential findings. `pass` requires the common review gates above. |
| `repo/change_risk` | `low`, `moderate`, `high`, `unknown` | Recorded assessment of the full authored diff, counts, old/new paths and modes, impact, compatibility, recovery and evidence gaps under the risk table. |
| `repo/maintainer_signoff` | `pass`, `absent` | The verified explicit maintainer decision described above. `absent`, missing or stale evidence cannot permit a moderate change. |

Supply the listed `values` for each custom `repo/` result. Cache a decision for
at most one hour, and only while revisions, policy blobs and relevant evidence
match. A new head or relevant base/evidence change needs affected re-review,
revalidation and, for moderate changes, renewed sign-off. Errors and incomplete
classifiers fail closed.
Native GitHub requirements are checked separately; the evaluator does not query
GitHub, create approvals or verify human intent on its own.

## Merge method and verified closure

Use **squash** when enabled by the repository. If it becomes unavailable, stop
for an explicit method decision rather than choosing another method. A required
native merge queue takes precedence; satisfy admission gates and record its
owned entry. Admission is queued, not merged.

Recheck identity, authority, head/base, policy blobs, native rules, checks,
reviews and discussion immediately before writing. Bind direct merge to the
expected head SHA, or native queue admission to `expectedHeadOid`. Native rules
enforce required atomic freshness; if a mandatory invariant cannot be enforced,
block rather than claim the head guard also pins base/check state.

Never bypass protection, jump a queue, dismiss reviews, enable deferred
auto-merge, alter permissions or delete the branch/worktree as part of closure.
Verify the actual merge commit, or owned queue admission/withdrawal. Stopping
schedules or a session does not retract native queue intent.

## Initial adoption and policy changes

The initial policy PR has no policy on its base and cannot authorize itself.
The owner must adopt it through a manual native GitHub decision before these
skills can use it for subsequent PRs. Later policy changes use the old trusted
base policy and require fresh moderate-risk sign-off; high-risk relaxation is
manual-only. A changed pinned policy pauses an existing ship run until the owner
explicitly renews authority. This policy changes no GitHub branch rules or grants.
