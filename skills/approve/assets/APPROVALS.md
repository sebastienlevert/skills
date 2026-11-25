# PR approval policy (example)

This is an opt-in example. A repository owner must adapt and explicitly adopt it
as `APPROVALS.md` at the repository root on the PR's base branch. Installing the
toolkit never installs this file or authorizes approvals. The user's scoped
approval request, GitHub enforcement and stricter contributor rules still apply.

Pair this file with root `APPROVALS.yml` (`APPROVALS.yaml` is the fallback). Markdown
defines risk/confidence and merge context; the version-1 YAML defines paths,
counts, people sets, conditions and overrides deterministically. Both are read
from the actual PR base. Observe mode is preview only; an author-filled YAML seat
never becomes a native GitHub approval or waives required independent reviews.

## Eligible reviewers

- The authenticated reviewer must have repository review access and must not be
  the PR author. Never switch identities to manufacture approval.
- CODEOWNERS and native independent-approval counts still apply for merge. An
  eligible review may contribute to those counts without satisfying all of them.
- Automated review is permitted as supporting evidence, not as a replacement for
  a required independent human or CODEOWNER review.

## Conditions before submitting approval

- The PR is open, not draft, and has no unresolved merge conflicts.
- A substantive current-head/base code review has completed. No consequential
  correctness, compatibility or access findings remain unresolved.
- All required checks and relevant project verification have passed for the
  current revision. Missing, pending, failed, cancelled or stale evidence blocks
  approval. Skipped/neutral conclusions need explicit acceptance by native rules.
- No current changes-requested review or required unresolved discussion remains.
- Required scope/contract/documentation and sensitive-path reviews have evidence;
  an unverified requirement is not satisfied by a checkbox or green CI alone.

## Publication and continuing watch

Publish approval for the exact reviewed commit and retain its review URL. A new
head or relevant base movement requires affected re-review and revalidation.
Policy changes proposed by the PR cannot relax that PR's approval conditions.
Approval does not authorize merging, auto-merge, readying, bypassing protection,
changing reviewers, dismissing reviews or altering permissions.

## Risk-aware automated merge (example)

Automated merge additionally needs an explicit scoped merge request or
`ship --merge`; approval alone is not authority. The merger needs repository
merge access and all native required independent/CODEOWNER approvals, checks,
discussion and freshness/merge-queue requirements satisfied for the candidate.
Being the PR author does not forbid eligible merging or waive independent reviews.

| Risk of the actual change | Evidence needed for sufficient confidence | Automated merge permitted? |
|---|---|---|
| Low: small, bounded, reversible impact; no sensitive contract/data/access change | Current substantive review, relevant acceptance/regression verification, no consequential unresolved finding or material evidence gap, all native merge prerequisites | Yes, when every condition is demonstrated. |
| Moderate: observable runtime/config/API behavior or wider compatibility surface | Low-risk evidence plus affected-consumer/integration tests, an actionable recovery path and an independent owner sign-off covering this risk | Only with that sign-off and complete current evidence. |
| High: irreversible data/migration effects, privilege/security-boundary changes, broad deployment impact or difficult recovery | Explicit repository-owner risk decision and recovery evidence; green CI is not enough | No unattended merge under this example; return for the owner's manual decision. |
| Unknown: unclear impact or missing review/validation/risk evidence | Resolve the unknowns before choosing a category | No. |

Use qualitative sufficient/insufficient/unknown confidence supported by evidence,
not invented probabilities. File extensions, green CI, bot approval or model
agreement alone cannot establish low risk. New head/base or relevant evidence
changes invalidate the old verdict.

For direct merge, this example selects squash **only if the repository enables
it**; otherwise resolve the method explicitly rather than guessing. A required
native merge queue takes precedence. Bind submission to the verified head and
retain the actual merge/queue reference. Never bypass rules, jump the queue,
enable deferred auto-merge or delete the branch/worktree as part of closure.
An owned queued candidate must be withdrawn on stop/new blockers before claiming
cancellation or mutating it; session shutdown itself cannot retract native intent.
