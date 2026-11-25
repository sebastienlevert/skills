# PR approval policy (example)

This is an opt-in example. A repository owner must adapt and explicitly adopt it
as `APPROVALS.md` at the repository root on the PR's base branch. Installing the
toolkit never installs this file or authorizes approvals. The user's scoped
approval request, GitHub enforcement and stricter contributor rules still apply.

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
