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
| Owners | Actual registered owner skill names, plugin version and absolute watch-contract path from the loaded skill. |
| Target | Head repository/branch, actual base branch, verified task worktree and push remote. |
| Authority | Exact allowed effects, publication mode `COMMENT`, approval on/off, merge off by default/explicit on, explicit ready authority and user constraints. |
| Lifetime | Start/expiry timestamps, starting/active/stopped/blocked/expired/closed/merged run status, stop reason; separate step states/blockers. |
| Schedules | Review/watch/approval and opted-in merge intervals, each native schedule ID and verified receipt/state. |
| Policy | Base Markdown and YAML blob SHAs, source commit/links, validated sidecar fingerprint, complete deterministic result/fact fingerprint and expiry, eligibility constraints/gaps; no policy from PR head. |
| Evidence | Last observed head/base, review head/base/scope and finding IDs/statuses, current validation/check evidence references, verified review/approval URLs and exact commit IDs. |
| Repair | Feedback IDs and dispositions, pushed fix SHAs/reply URLs/thread states, failed run/job IDs and attempted reruns, consecutive unsuccessful repair count. |
| Merge | Candidate head/base, risk/confidence verdict and gate evidence, permitted method, owned native queue entry/admission/withdrawal status or verified merge SHA/URL. |
| Delta probe | Successful snapshot timestamp, head/base and relevant update/CI/feedback/review/queue fingerprints, review/repair/approval/opted-in merge dirty flags and last reported blocker fingerprint. |

No local state proves GitHub state or independent review. Recover uncertain
publication/creation from the remote/native scheduler before retrying. If the
record is missing, malformed, belongs to another session/run/target, or its
authority cannot be established, **perform no GitHub writes**. Stop the current
tick's actual schedule ID if supplied by the host; report unrecoverable other IDs
instead of guessing, deleting unrelated jobs, or reconstructing permissions.

## Every tick, in this order

1. Read the run record and applicable skill/contract. Check exact run/session,
   destination, active status, expiry, user constraints and permitted step.
   An inactive/expired run cancels owned jobs and performs only authorized owned
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
4. Check whether a substantive change needs work. Key review evidence by exact
   head/base/scope; feedback by native IDs and current replies; CI attempts by
   run/job IDs and revision; approval by reviewer, commit and policy blob.
   Merge also keys risk/gate evidence and queue intent by candidate and policy.
   Base/check/feedback changes can matter even without a new head. Do not repeat
   equivalent reviews/replies/approvals or rerun the same unchanged CI blindly.
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
| Head/base | Review/integration evidence, approval and opted-in merge risk/gate; repair only if feedback/conflict/CI is actionable. |
| New/edited feedback or unresolved finding | Repair; review only when the concern changes its evidence/verdict; approval/merge gates. |
| Check/run conclusion or mergeability | Diagnose actionable failure/conflict; approval/merge readiness; no automatic whole-code review. |
| Draft state or trusted policy/rules | Approval/merge eligibility; no gratuitous code repair/review. |
| Current review/validation result, native approvals or finding disposition | Approval/merge gate; do not skip just because PR metadata is unchanged. |
| Native queue state | Observe verified outcome; no duplicate enqueue or candidate mutation. |
| Deterministic policy result/expiry or required classifier result | Approval/merge gates; parse policy once per blob, evaluate complete facts locally, never guess precedence. |
| No relevant input change | Quiet return; no full diff/log/thread reads, posts, tests, commits or approval retry. |

A generic PR `updatedAt` is not proof that checks or thread replies are unchanged.
Use reliable source-specific markers/complete bounded metadata; when unavailable,
perform the smallest relevant evidence read and retain **unknown** if incomplete.
Cache negative eligibility facts (e.g. self-author, unchanged missing policy) only
while their inputs match; do not retry a permanent blocker or repeat its report
every tick. At an expiry/stop/target change, cleanup still runs on a quiet tick.

Only changed-step owners need loading/execution; reuse loaded context. Reviews
use authored-delta re-review and stable finding IDs, repairs batch related concerns,
and approval reuses exact-revision review/validation rather than another pipeline.
Never print raw tool envelopes/pages/logs or copy the whole PR into the ledger.
Report actual changes, changed blockers and terminal states; otherwise remain quiet.
Clear a step's dirty flag only after its pass records a verified result for those
inputs; keep pending dependent work due. Initial approval/opted-in merge are due after kickoff,
and a repair push marks review/approval/merge due before the next metadata probe.

## Revision invalidation and bounded repair

A new head invalidates old code-review, validation and approval evidence. A new
base invalidates integration-sensitive evidence. Preserve prior finding IDs and
review URLs for re-review, but never reuse an old verdict as current approval.
The review tick explicitly allows advisory self-authored/draft review for this
one run; this exception does not make it independent/native approval.

Watching makes one scoped batch per tick, never a nested polling loop. After
**three consecutive unsuccessful repair attempts for the same root cause**,
pause repair with evidence and ask for the material decision/access needed;
don't reset the budget just because a retry created another commit or CI run.
Review may still observe the PR; approval remains blocked by unresolved evidence.
One demonstrably transient failed CI run may be rerun once under the start
authority. Do not endlessly retry flaky CI, lower gates, skip tests or change
workflow permissions to get green. Record actual run/job IDs to avoid duplicates.

Missing policy blocks approval/merge only; self-author identity blocks approval,
not an otherwise eligible merge with actual valid independent approvals.
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
| A create/post times out after delivery | Reconcile matching scheduler/review records before retrying. |
| Review and repair on an unchanged PR | No equivalent comments, commits, approvals or repeated CI reruns. |
| Watch pushes after review | New SHA cannot be approved using the old review; next review tick re-reviews. |
| Base moves with unchanged head | Reassess integration-sensitive evidence; do not report base work as an authored defect. |
| Draft or self-authored PR | Review/repair remain useful; approval pending on draft or blocked for author, never a fake approval. |
| Missing APPROVALS.md or denied rule read | Approval is blocked, not permissive; review/repair continue within scope. |
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
| Author cannot approve, but valid independent approvals satisfy merge rules | Merge may proceed under explicit authority; do not require this account's approval. |
| Head changes or native gate rejects at merge submission | No unguarded retry or auto-merge; return to affected gate. |
| Queue admission or submission timeout | Reconcile actual entry/state; queued is not merged and duplicate submission is forbidden. |
| Stop/expiry or new blocker while owned candidate is queued | Withdraw/verify the owned entry before repair or cancellation claims; external entries are untouched. |
