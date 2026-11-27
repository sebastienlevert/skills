---
name: approve
description: >
  Submit an eligible GitHub PR approval only under the target repository's trusted
  root APPROVALS.md plus deterministic APPROVALS.yml and actual branch rules, with a current evidence-backed code
  review and exact-commit publication. Use for "approve this PR" or ship's approval
  tick. Missing/ambiguous policy, draft, stale/red checks or ineligible identity
  remain pending/blocked. Never self-approve, switch accounts, merge, or bypass rules.
---

# Approve under repository rules

This step owns the **approval gate and exact-commit publication**, not code
authoring or another mandatory review cast. Standalone approval is one pass;
scheduled use follows the [ship watch contract](../ship/references/watch-contract.md).
It creates no child schedules. A review recommendation, green checks, run record
or approval-policy file is not itself a native approval or new user authority.

## Resolve authority and trusted policy

1. Require an explicit approval request for one exact PR or an active ship record
   containing that authority. Plan/evaluate-only requests post nothing. Use the
   existing authenticated `gh` identity and exact GitHub host; no GitHub MCP,
   impersonation, token substitution or account switching.
2. Verify PR state, draft status, author, head repository/ref/SHA, actual base
   branch/SHA and existing reviews. Closed/merged PRs end the watch; draft stays
   pending without an unauthorized ready transition. The authenticated author
   cannot approve their own PR. Report **blocked: independent eligible reviewer
   needed**, not an attempted self-approval or a substitute COMMENT called approval.
3. Read **`APPROVALS.md` at the repository root from the actual PR's base commit**,
   not the worktree/PR-head copy or an assumed default branch. For example:

   ```text
   gh api --hostname <host> repos/<owner>/<repo>/contents/APPROVALS.md -X GET -f ref=<base-sha>
   ```

   Retain the blob SHA, source commit/link and decoded policy. The `ref` above is
   data passed to `gh`, not a PowerShell `--flag=value` token. Encode path segments
   for branch/rule API calls; use the exact SHA for policy retrieval.
4. Interpret the repository's Markdown rules without imposing a new schema or
   invented threshold. [The example](assets/APPROVALS.md) is opt-in guidance, not
   an installed policy or permission grant. Missing/empty/inaccessible/ambiguous
   policy blocks approval. Do not create or relax a policy to approve this PR.
   The head's proposed policy changes cannot authorize their own approval.
   Also read **APPROVALS.yml** from that same base (APPROVALS.yaml only when .yml
   is absent), following the [deterministic policy contract](references/yaml-policy.md).
   Pin both blobs; missing/invalid sidecar, observe mode or incomplete facts
   cannot authorize approval. Use the bundled evaluator, not model-guessed glob
   matches, counts or precedence. Require its `automationApprovalAllowed=true`
   for this exact head/base, then intersect Markdown/user/native conditions.
5. Read actual applicable branch protection/rulesets, required checks, reviewer
   eligibility, CODEOWNERS and review state using `gh`. Inspect branch protection
   and effective branch rules, not just a ruleset catalog; include inherited
   organization rules where applicable. Use the checked
   [native-rule capability reader](references/native-rule-access.md).
   GitHub.com's verified private-plan feature-unavailable response is an optional
   inspection capability, not an approval/merge prerequisite or proof of absent
   rules. A trusted base policy may permit normal GitHub enforcement for that
   case while retaining every other gate. Authentication failures, other denials,
   ambiguous 404s and incomplete/unknown responses remain blocked. An authoritative
   unprotected/no-rule response is different from an access error.
6. Intersect user authority, trusted policy and native repository enforcement.
   Policy may narrow, never bypass them. A ship run pins its initial policy blob;
   either changed base-policy blob pauses approval pending explicit owner renewal,
   even if the new file is more permissive. Recheck live branch rules each pass.

## Evidence-backed gate

Make a concise requirement/evidence verdict for each actual policy condition:
**satisfied**, **pending**, **failed**, or **unknown**. Approve only when all
submission prerequisites are demonstrably satisfied:

- The deterministic sidecar authorizes an automated approving review. Its
  author-filled YAML seats do not create GitHub approvals or waive independent
  reviewer requirements. Reuse its cached complete decision only while both
  blobs, facts/classifier evidence, revisions and expiry match.

- A current completed [review](../review/SKILL.md) covers this exact
  head/base and relevant scope, including prior findings and integration risk.
  Reuse trustworthy current evidence; if missing, invoke an advisory review once,
  not a fixed independent-agent cast or duplicate whole pipeline. In ship, leave
  stale/missing review pending for its review tick. Self-review does not fulfill
  an independent-review requirement. No unresolved P0/P1 or other policy-blocking
  findings, material unknowns or unaddressed required discussion.
- Required local/project and CI checks have sufficient current revision evidence
  and acceptable conclusions under the actual policy/rules. Inspect required
  contexts and source app/workflow when required; a name alone may not identify
  the right check. Pending, stale, failing, cancelled or missing required results
  do not pass. Skipped/neutral is acceptable only when the actual rule permits it.
  Successful required CI is not a substitute for review. `gh pr checks --required`
  is useful evidence, not the entire repository-policy gate.
- In ship, [prove](../prove/SKILL.md) must have current acceptance evidence and
  a verified PR proof comment, including real media for UI. Missing, stale,
  failed or blocked proof is pending for its owner; never rerun/capture proof
  inside approval or substitute green CI for it.
- The current identity is eligible under GitHub and the policy's roles/team/path
  rules; verify membership/access rather than guessing from names. Current
  blocking reviews or unresolved concerns follow the trusted policy. Do not
  dismiss other reviewers' changes-requested reviews or resolve their threads
  to unlock approval. A bot/self review is not independent human approval.
- Draft, merge-conflict, freshness/integration and sensitive-path requirements
  are satisfied where applicable. Unavailable evidence is **unknown**, not pass.
  Follow a stricter submission condition when APPROVALS.md explicitly requires it.

Separate **eligibility to submit this approval** from **eligibility to merge**.
Native minimum approval/CODEOWNER counts may still need this review and other
reviewers; don't require all approvals to exist before contributing an eligible
one unless the trusted policy explicitly says so. Submission never claims all
merge/queue requirements are fulfilled, and this skill never merges.

## Publish and verify exactly once

1. Re-read active authority, identity, PR state/draft, head/base, trusted policy
   blob, applicable rules, current checks, reviews and blocking discussion
   immediately before writing. A changed input returns pending to the affected
   gate; never publish against a newer unreviewed SHA.
2. Reconcile existing reviews by PR, reviewer, exact `commit_id`, state and intent.
   Reuse a valid existing `APPROVED` review rather than duplicating it. An uncertain
   previous write requires reconciliation, not another blind request.
3. Submit a native review through `gh api` to
   `repos/<owner>/<repo>/pulls/<number>/reviews` with **`--method POST`** and a JSON
   payload passed as data (`--input -` or a session artifact), containing
   **`event: "APPROVE"`**, the
   verified **`commit_id`**, and a concise body with policy source, reviewed
   revision and material evidence references. Never use an unbound latest-head
   approval or claim the author can approve themselves.
4. Fetch the review and verify reviewer, `APPROVED` state, `commit_id` and canonical
   URL; then re-read PR head/base. A concurrent push leaves the recorded approval
   **stale**, even if GitHub has not dismissed it. Do not call it current or waive
   the new revision's gate. In ship, evaluate default handoff before retaining an
   idle watch; explicit kept watches may continue for re-review/reapproval.
   Never auto-dismiss old reviews or enable auto-merge.

Return **approved**, **already approved**, **pending** or **blocked**, exact
reviewed head/policy source, verified review URL when present, requirement gaps
and any remaining independent approvals. No code changes, readying, reviewer
assignments, rule edits, merges or fabricated percent-confidence scores.
