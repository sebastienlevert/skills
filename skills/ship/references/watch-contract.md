# Ship watch contract

All scheduled owners use this contract. A scheduled prompt is a scoped reminder,
not new user authority. Its run ID and exact destination must match an existing
owner-authorized record. Standalone skills do one pass unless recurrence was
explicitly requested; they never create child schedules.

## Session-local record

Keep one structured JSON record in the host's persistent **session artifact
directory**, outside source worktrees. Use a unique opaque run ID and absolute
state path, not a global filename shared across sessions. Do not commit it,
capture credentials/raw comments/logs, or use cross-session memory as a ledger.

Record these fields and persist after every meaningful transition:

| Field | Content |
|---|---|
| Identity | Run ID, session binding, GitHub hostname, owner/repo, PR number/URL, authenticated login. |
| Owners | Actual registered owner skill names, including resolve/prove, plugin version and absolute watch-contract path from the loaded skill. |
| Target | Head repository/branch, actual base branch, verified task worktree and push remote. |
| Authority | Exact allowed effects, target-into-feature merge and integration-comment scope, publication mode `COMMENT`, proof verification/capture and PR-comment/media scope, approval on/off, PR merge off by default/explicit on, explicit ready authority and consent/sign-off references. Session consent is not a GitHub approval. |
| Lifetime | Start/expiry timestamps, starting/active/handoff/stopped/blocked/expired/closed/merged run status, stop reason; separate step states/blockers. |
| Handoff | Mode `until-handoff` (default) or explicitly authorized `keep-watching`; exact head/base, ready or human-blocked reason, pending work, cleanup receipts, decision-ask status and chosen effects. |
| Schedules | Review/watch/approval and opted-in merge intervals, each native schedule ID and verified receipt/state. |
| Policy | Base Markdown/YAML presence, present blob SHAs or verified absent paths, source commit/links, applicable merge mode, validated sidecar fingerprint/result/expiry when present and eligibility gaps; no policy from PR head or invented evaluator success. |
| Approval eligibility | Verified PR author/current identity, native contribution eligible/unavailable_self_author/blocked, and actual required independent/CODEOWNER review/sign-off gates with source evidence. Unavailable contribution is not a global readiness verdict. |
| Evidence | Last observed head/base, review head/base/scope and finding IDs/statuses, current validation/check evidence references, verified review/approval URLs and exact commit IDs. |
| Proof | Proven/failed/blocked/stale status, tested head/base/build and relevant inputs, acceptance scenarios/results, media/evaluation references and asset fingerprints, verified comment URL/ID, publication completeness and material limits. No raw recordings/logs in this ledger. |
| Resolve | Original/pushed head, fetched/integrated/latest-observed target SHAs, verified ancestry, affected validation, owned unfinished-merge checkpoint, integration concern IDs and verified reply/summary receipts/fingerprints; no raw comments/logs. |
| Repair | Feedback IDs and dispositions, pushed fix SHAs/reply URLs/thread states, failed run/job IDs and attempted reruns, consecutive unsuccessful repair count. |
| Merge | Candidate head/base, risk/confidence verdict and gate evidence, permitted method, owned native queue entry/admission/withdrawal status or verified merge SHA/URL. |
| Delta probe | Successful snapshot timestamp, head/target and integration-comment/CI/feedback/review/proof/queue fingerprints, resolve/review/repair/proof/approval/opted-in merge dirty flags and last reported blocker fingerprint. |

No local state proves GitHub state or independent review. Recover uncertain
publication/creation from the remote/native scheduler before retrying. If the
record is missing, malformed, belongs to another session/run/target, or its
authority cannot be established, **perform no GitHub writes**. Stop the current
tick's actual schedule ID if supplied by the host; report unrecoverable other IDs
instead of guessing, deleting unrelated jobs, or reconstructing permissions.

## Every tick, in this order

1. Read the run record and applicable skill/contract. Check exact run/session,
   destination, active status, expiry, user constraints and permitted step.
   A **handoff** run is inactive: cancel any remaining owned jobs and return
   without GitHub reads/writes or repeating the decision ask. An inactive/expired run cancels owned jobs and performs only authorized owned
   queue-intent cancellation, if needed; otherwise return without GitHub writes.
   A still-starting run returns pending without child jobs or GitHub writes;
   it must not cancel the orchestrator's in-progress creation. A component-level
   approval/repair blocker does not make the whole active run inactive.
2. Verify `gh` identity and canonical PR with needed fields: state, draft,
   author, head repository/ref/SHA, actual base ref/SHA and URL. Refresh recorded
   head/base refs. A closed/merged PR ends the run. A changed account, head
   repository/ref, base branch, worktree ownership or permission pauses the run
   and cancels jobs; do not silently retarget or switch credentials.
3. Read only the tick's relevant evidence with complete pagination where needed.
   A failed/truncated read is **unknown**, not empty, unchanged or passing.
   Record a precise blocker; do not perform a mutation requiring missing data.
4. Evaluate [ship's human handoff](../SKILL.md#human-handoff-default) before an
   unchanged-input no-op. In default mode, current clean evidence or a stable
   human-only blocker with no other genuinely pending work ends polling: mark
   handoff, verify owned schedule cancellation, and deliver one structured ask.
   Missing/unknown evidence is a blocker, not readiness or assumed running work.
   An unincorporated target or new integration concern is due autonomous resolve
   work, even when GitHub reports mergeable. Do not hand off as clean or for an
   approval-only blocker while that authorized work can proceed. Legacy records
   without verified target/head ancestry mark resolve due before handoff.
   Existing owned queue intent must complete or have verified authorized withdrawal.
   Explicit `keep-watching` may retain idle observation; cadence/duration alone
   is not that opt-in. Then check whether a substantive change needs work. Key review evidence by exact
   head/base/scope; feedback by native IDs and current replies; CI attempts by
   run/job IDs and revision; approval by reviewer, commit and policy blob.
   Merge also keys risk/gate evidence and queue intent by candidate and policy.
   Base/check/feedback changes can matter even without a new head. Do not repeat
   equivalent reviews/replies/approvals or rerun the same unchanged CI blindly.
   Proof keys the tested candidate, relevant runtime inputs/scenarios/assets and
   exact verified comment, not just a screenshot file or generic PR update.
5. Complete one bounded owner pass. Before each write, reread active authority
   and destination/head plus the relevant thread/check/review. If changed, abort
   the stale write and return to the next tick's affected phase. Native schedules
   run through this session serially; never delegate mutation ticks or depend on
   an advisory state flag as a cross-process lock. Detect external work and
   preserve it; an uncertain/different dirty checkout blocks authoring.
6. Verify every side effect against its receipt/remote state, update the record,
   and return a concise result. A failed or uncertain write is not success and
   must be reconciled before retrying. Re-read remote head/base before recording
   evidence as current; a revision change leaves it stale.

## Cheap probe before expensive work

Use one bounded `gh` API program per probe: derive identifiers, join/filter/project
locally and return only an answer-ready snapshot. Fetch needed PR/identity/branch
metadata and relevant check/feedback IDs or update fingerprints, not full patches,
log archives or comment bodies on every tick. A successful snapshot from another
step within **60 seconds** may serve non-writing triage; do not treat it as a
write guard. Mark only affected steps dirty:

| Changed input | Work to revisit |
|---|---|
| Target SHA or unknown/unincorporated target ancestry | Resolve due before clean handoff, even without conflicts; queued candidates stay native-owned until authorized withdrawal/completion. |
| Head | Refresh ancestry and affected review/proof/validation/approval/merge evidence; preserve other authors' commits. |
| New/edited integration or conflict comment/reply | Resolve assesses/replies within recorded scope; no unnecessary merge if already incorporated or duplicate evidence replies. |
| New/edited feedback or unresolved finding | Repair; review only when the concern changes its evidence/verdict; approval/merge gates. |
| Check/run conclusion or mergeability | Diagnose actionable failure/conflict; approval/merge readiness; no automatic whole-code review. |
| Draft state or trusted policy/rules | Approval/merge eligibility; no gratuitous code repair/review. |
| Current review/validation result, native approvals or finding disposition | Approval/merge gate; do not skip just because PR metadata is unchanged. |
| Proof scenario/input/build change, failed acceptance, missing media or comment receipt | Mark affected proof and approval/merge gates due; route failed behavior to repair, capture/upload/access gaps to a precise blocker. |
| Native queue state | Observe verified outcome; no duplicate enqueue or candidate mutation. |
| Deterministic policy result/expiry or required classifier result | Approval/merge gates; parse policy once per blob, evaluate complete facts locally, never guess precedence. |
| No relevant input change | Evaluate default handoff first; only genuinely pending or explicitly kept watches return quietly without another full read/review/test. |

A generic PR `updatedAt` is not proof that checks or thread replies are unchanged.
Use reliable source-specific markers/complete bounded metadata; when unavailable,
perform the smallest relevant evidence read and retain **unknown** if incomplete.
Cache negative eligibility facts (e.g. self-author, unchanged missing policy) only
while their inputs match; do not retry a permanent blocker or repeat its report
every tick. Stable human blockers with no other pending work trigger default
handoff instead of repeated probes. At handoff/expiry/stop/target change, cleanup
still runs on a quiet tick. Do not repeat an already delivered handoff ask.

For self-authored PRs, cache the unavailable native contribution separately from
actual merge gates. Omit/cancel only the owned approval job while unchanged;
preserve approval authority and useful review/watch/opted-in merge observation.
Do not demand a GitHub reviewer when none is actually required. A personal/private
PR with current ancestry/review/validation/proof can use normal ready handoff and
policy-permitted session consent. A real required review, sign-off, unavailable
evidence or missing ready/merge authority remains its own precise condition.

Only changed-step owners need loading/execution; reuse loaded context. Reviews
use authored-delta re-review and stable finding IDs, repairs batch related concerns,
and approval reuses exact-revision review/validation rather than another pipeline.
Never print raw tool envelopes/pages/logs or copy the whole PR into the ledger.
Report actual changes, changed blockers and terminal states; otherwise remain quiet.
Clear a step's dirty flag only after its pass records a verified result for those
inputs; keep pending dependent work due. Initial resolve/proof/approval/opted-in merge are
due after kickoff; legacy records without ancestry/proof mark them due. A repair or integration push marks
review/proof/approval/merge due before the next metadata probe.

## Revision invalidation and bounded repair

Target movement triggers [resolve](../../resolve/SKILL.md), not merely a
mergeability check. Reuse verified ancestry for matching target/head; fetch and
integrate when it changes. The existing watch cadence owns dispatch, including
relevant comment assessment/replies. Integrate at most one pinned target per pass;
newer target movement stays due rather than triggering an endless chase.

A new head invalidates old code-review, current proof receipt and approval evidence. A new
base invalidates integration-sensitive evidence. Preserve prior finding IDs and
review URLs for re-review, but never reuse an old verdict as current approval.
The review tick explicitly allows advisory self-authored/draft review for this
one run; this exception does not make it independent/native approval.

Use [prove's reuse rules](../../prove/SKILL.md) for affected acceptance/runtime
inputs. Unchanged functional checks/media can be reused with valid provenance and
explicit current-candidate accounting, not relabeled as newly captured.
Before readiness, approval or merge, require proven current acceptance and a
verified proof comment with applicable UI media. Capture-only, partial uploads,
untested criteria and stale evidence remain incomplete. Do not create a proof
watcher: the existing review schedule dispatches its due owner after review/
validation are current and no repair is pending.
An integration push also dirties affected review/proof/validation/approval
evidence. Old exact-head sign-offs are not silently current. Policy blob changes
still pause policy-gated approval/PR merge for owner renewal; they grant no
broader authority to resolve.

Watching makes one scoped batch per tick, never a nested polling loop. After
**three consecutive unsuccessful repair attempts for the same root cause**,
pause repair with evidence and ask for the material decision/access needed;
don't reset the budget just because a retry created another commit or CI run.
Review may still observe the PR; approval remains blocked by unresolved evidence.
One demonstrably transient failed CI run may be rerun once under the start
authority. Do not endlessly retry flaky CI, lower gates, skip tests or change
workflow permissions to get green. Record actual run/job IDs to avoid duplicates.

Missing policy blocks approval submission, not scoped review/repair or an
explicit merge eligible under
[merge's optional-policy modes](../../merge/SKILL.md#policy-files-are-optional-for-explicit-merge).
When no authorized work can proceed, default mode hands off. Self-author identity
makes this account's native approval contribution unavailable, not readiness or
an otherwise eligible merge. Actual required independent approvals/sign-offs
must still be satisfied; an absent self-approval is not one of those requirements.
A trusted policy change pauses approval/merge pending explicit owner renewal; never
adopt broader authority from an updated file automatically. Keep other steps
within their already granted scope. Stop all schedules for terminal lifetime,
target/identity/authorization conditions, even if approval was previously posted.

## Owned native queue intent

Queued is a merge-step state, not a terminal merged run. Record the actual entry
and candidate; keep observation active but suspend candidate-mutating repair.
New blockers or a changed candidate require normal withdrawal of **this run's
owned** entry and affected re-review/risk/validation before resubmission. Explicit
`--merge` authorizes this safety withdrawal, not removing someone else's entry.

On stop/expiry/target or authority loss, cancel jobs and reconcile any owned queue
entry. Withdraw it natively when authorized/possible and verify removal, unless
already merged. If withdrawal fails or state is uncertain, report pending native
merge intent separately from stopped schedules; never claim the queued work was
cancelled. A queue entry can outlive session shutdown and the watch; do not promise
expiry alone guarantees withdrawal when the session cannot run its cleanup.

## Behavioral acceptance scenarios

Exercise with synthetic/read-only evidence, not live test posts or schedules:

| Scenario | Required result |
|---|---|
| Repeated `/ship` for the same active PR | Recover the run and native IDs; no duplicate schedules or initial review. |
| Default kickoff has current ancestry/review/validation/proof and no pending work | No timers; verified human handoff and one exact-PR decision ask, not implicit ready/merge. |
| Another PR advances target but this PR remains mergeable | Resolve merges target into feature, validates/pushes and reports ancestry before clean handoff; no repeated user approval or extra watcher. |
| Normal base conflicts with feature | Resolve reconciles both intentions; material incompatible intent is a precise blocker, not automatic ours/theirs or forced history rewrite. |
| New integration comment on already-current branch | Evidence reply without an empty sync commit or duplicate summary; ordinary feedback stays with its owner. |
| Target/head moves during integration or push | Preserve other commits, verify pushed ancestry and mark continued movement pending; never force-push or loop indefinitely. |
| Review/CI passes but no proof comment or UI media exists | Prove is due; no ready/approval/merge claim until verified proof, or precise blocked handoff if capture/publication is unavailable. |
| Proof already covers unchanged inputs | Reuse checks/media/comment; no duplicate screenshot, post or additional watcher. |
| Proof fails acceptance after review | Route to watch's repair owner under the existing budget; affected review/proof becomes due after a fix. |
| Upload partially succeeds or head moves during publication | Reconcile receipts/assets or mark stale; do not report current proven acceptance or replay the entire upload batch. |
| Default watch becomes clean without changed feedback | Handoff is checked before quiet no-op; mark inactive, cancel/verify all owned jobs, ask once. |
| Draft without ready authority or an actual unsatisfied required review/decision, and no other pending work | Handoff for that exact condition; no polling or claim that self-authorship alone requires another GitHub reviewer. |
| Required checks are genuinely running | Continue bounded watching until their outcome; hand off only after evidence or a real blocker is known. |
| Owner passes only cadence/duration options | Configure the pending-work watch; still stop at default handoff. |
| Owner explicitly requests `--keep-watching` | Preserve scoped idle watching until stop/expiry/terminal state, without new merge/ready authority. |
| Owner accepts policy-gated merge or explicit readying at handoff | Recheck the exact revision and invoke owning skills; no self-approval, bypass or silent merge. |
| Handoff ask is declined/unanswered, or a tick was already dispatched | Inactive/no timers/no further GitHub reads/writes; do not repeat the ask or restart schedules. |
| Cancellation or owned queue withdrawal is uncertain | Report incomplete handoff; do not claim all monitoring/intent stopped or duplicate the operation. |
| A create/post times out after delivery | Reconcile matching scheduler/review records before retrying. |
| Review and repair on an unchanged PR | No equivalent comments, commits, approvals or repeated CI reruns. |
| Watch pushes after review/proof | New SHA needs current review and proof accounting before approval; reuse only unaffected evidenced inputs. |
| Base moves with unchanged head | Mark resolve due and refresh affected evidence after integration; do not report upstream work as an authored feature defect. |
| Draft PR without ready authority | Preserve draft state and hand off the ready decision when no autonomous work remains; never fake approval. |
| Self-authored public/private PR with no required independent review | Native contribution unavailable; ready/session-consent handoff or eligible authorized merge can proceed after actual gates, without a reviewer demand or approval timer. |
| Self-authored Advanced PR with permitted author seat/session sign-off | Enforce policy evidence and record session decision; do not require native self-approval to make the approval component green. |
| Self-authored PR with actual required independent/CODEOWNER review | Report that missing native/policy review; session consent cannot replace it. |
| Private-plan rule inspection capability unavailable with verified identity/access | Use the existing permitted normal-enforcement route; no invented paid feature/reviewer prerequisite, and no claim that unknown rules are absent. |
| Missing APPROVALS.md or denied rule read | Approval is blocked, not permissive; review/repair continue within scope. |
| Verified absent Markdown/sidecar and explicit exact-PR merge authority | Merge owner applies optional-policy modes and native gates; an approval-only blocker does not force handoff before eligible merge. |
| Personal/self-authored PR with Simple or Advanced session consent | No native self-approval; merge can proceed if session decisions satisfy applicable policy and actual native requirements. |
| Invalid/unreadable policy or denied native rule read | Not an absent-policy fallback; affected merge gates stay blocked. |
| PR proposes weaker Markdown or YAML policy | Use both trusted actual-base blobs; head cannot relax its own gate. |
| YAML path allowlist, exclusion, rename or overlapping rules | Deterministic evaluation, both rename paths and strictest verdict; no model-guessed match. |
| YAML observes, is malformed or has missing/expired evidence | No automated approval/merge; keep the gate blocked/pending. |
| Required CI is pending/cancelled/missing | Approval stays pending/blocked; no claim that it passed. |
| Reviewer adds another concern during repair | Leave the thread open until all concerns are verified addressed. |
| Check rerun fails again for same cause | No duplicate rerun or unlimited repair loop; preserve bounded failure evidence. |
| Stop/expiry while a tick is dispatched | Inactive record prevents the next mutation; cancel only owned IDs. |
| PR merged/closed or branch/identity changes | End/pause the run, cancel owned schedules and report actual state. |
| Another author dirties/pushes the worktree | Preserve their work; refresh/integrate safely or block the repair. |
| Native scheduler unavailable or partial creation | Report blocked watch and reconcile/cancel confirmed jobs; no shell-loop fallback. |
| Plain ship or approval succeeds without merge opt-in | No merge job or merge write. |
| Allowed low-risk change with all actual merge requirements satisfied | Exact-head normal merge or required guarded queue; verify actual outcome. |
| Policy risk is human-only/unknown or confidence evidence incomplete | Block merge, even with green CI; never invent a percentage or waive required approvals. |
| Author cannot approve, but actual merge-review conditions are satisfied | Readiness/authorized merge may proceed; do not require this account's approval or add an independent-review condition of your own. |
| Head changes or native gate rejects at merge submission | No unguarded retry or auto-merge; return to affected gate. |
| Queue admission or submission timeout | Reconcile actual entry/state; queued is not merged and duplicate submission is forbidden. |
| Stop/expiry or new blocker while owned candidate is queued | Withdraw/verify the owned entry before repair or cancellation claims; external entries are untouched. |
