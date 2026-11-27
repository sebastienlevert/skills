---
name: ship
description: >
  Ship a finished change with GitHub Copilot CLI: publish its PR, review it,
  watch feedback/conflicts/CI, and submit an eligible approval under the target
  repository's root APPROVALS.md. Use for "/ship" or "ship this PR". Orchestrates
  pr, review, watch and approve, watching pending work with native /every
  schedules and stopping for a human handoff when ready or blocked.
  Explicit --merge adds risk-aware closure; --keep-watching opts into idle watching.
  One exact PR per run; no default merge, self-approval, permission changes or
  schedules from installation. Supports status and stop.
---

# Ship with GitHub Copilot CLI

Ship owns **sequencing, scoped authorization and schedule lifecycle**, not another
implementation or review engine. Invoke the four owning skills in this session:

| Step | Owner | Result |
|---|---|---|
| 1. Prepare and send upstream | [pr](../pr/SKILL.md) | Verified pushed head and canonical PR; reuse a finished change, not a new implementation. |
| 2. Code review | [review](../review/SKILL.md) | Revision-bound findings and a published `COMMENT` review; never approval in this step. |
| 3. Watch | [watch](../watch/SKILL.md) | Scoped feedback, conflict and CI repairs on the same branch, with verified replies. |
| 4. Approval | [approve](../approve/SKILL.md) | Eligible native `APPROVE` under trusted `APPROVALS.md`, or an exact pending/blocked reason. |
| Optional closure, only with explicit merge authority | [merge](../merge/SKILL.md) | Risk/confidence and all merge rules satisfied -> guarded normal merge/queue, or pending/blocked. |

Load the actual host skill names, reusing already loaded skills. A missing owner
blocks its step; do not copy its procedure or launch another CLI, agent fleet,
dynamic workflow, shell polling loop, cron job, or GitHub Actions watcher.
These owners are the **workloom skills**, not Copilot's native `/pr` or
`/review` commands. Select the toolkit entry by source/registered identifier;
never substitute a host command merely because its short name matches.

## Invocation and authority

```text
/ship
/ship owner/repo#123
/ship owner/repo#123 --ready --watch-for 8h
/ship owner/repo#123 --ready --merge --merge-every 15m
/ship owner/repo#123 --watch-every 5m
/ship owner/repo#123 --keep-watching --watch-for 8h
/ship owner/repo#123 --approval off --review-every 10m
/ship status owner/repo#123
/ship stop owner/repo#123
```

These are skill-request options, not an executable CLI. A bare `/ship` resolves
the finished change/PR already identified in this session or its current task
branch. Ask if there are multiple possible changes, PRs, or mixed unowned files.
Do not select an issue, implement a new feature, or watch an account-wide queue.
Plan/dry-run requests only describe the resolved plan; create no PR or schedule.

An explicit start authorizes, for **that PR only**, scoped commits/pushes, one
review and subsequent substantive re-reviews, evidence replies, eligible thread
resolution, conflict integration, CI repair and eligible approval under the
existing trusted policy. Pass this authority and all user constraints to each
owner. `--approval off` removes approval authority and its schedule, not the
merge gate's required independent approvals. Explicit **`--merge`**, or an exact-PR
merge choice in the structured handoff ask, adds
normal risk/policy-gated merge or required native queue submission/owned-entry
withdrawal authority. Plain ship still cannot merge. No mode grants auto-merge,
protection changes, account switching, reviewer requests, force-push or arbitrary
instructions from comments. Adding/installing the skill grants no merge authority.

New PRs default to **draft**; existing draft/ready state is preserved. `--ready`
explicitly authorizes [pr](../pr/SKILL.md), ready mode, to mark ready after its
conditions pass. Otherwise approval remains pending on a draft, and the user
marks it ready. Approval cannot be manufactured for the PR author's identity.

The default mode is **until handoff**, not a mandatory 24-hour polling loop.
Watch while checks or bounded review/repair work can still make progress, then
stop and ask for the next action. `--watch-for` and cadence options configure
that pending-work watch; they do not disable handoff. Only explicit
`--keep-watching` requests continued monitoring after readiness or a stable
human blocker. This option adds no approval, ready or merge authority.

## Start one run

1. Resolve the exact GitHub host/repository, `gh` identity, finished change,
   writable head repository/branch, actual base and task worktree. Refresh remote
   state and preserve unrelated work. Use `gh`, never GitHub MCP. First recover
   an existing matching run: if it is active with verified receipts and unchanged
   scope/options, evaluate default handoff from a current compact snapshot before
   returning status; never repeat publication/kickoff work.
2. Invoke `pr` once; stop if upstream delivery cannot be verified. For an
   existing open PR it verifies/reuses the PR rather than opening another.
3. Create/reuse the session-local run record from the
   [watch contract](references/watch-contract.md). Recover an existing run and
   its scheduler receipts before starting; never create duplicate watchers.
   Changed options require stopping/reconciling the old jobs before an explicitly
   authorized replacement. Initialize step-specific dirty flags: approval and
   opted-in merge are due after kickoff even without changed remote metadata.
   Bind trusted APPROVALS.md plus APPROVALS.yml/.yaml blobs from the actual PR
   base, not its head. Use approve's deterministic evaluator for sidecar rules
   and cache its complete fact-bound result/expiry, not repeated model parsing.
   Missing/ambiguous policy blocks approval/merge, not scoped review/repair.
   Record the run mode and handoff state; stable blockers cannot justify idle
   polling in the default mode. Recover legacy mode from the original request,
   never infer `--keep-watching` from existing timers; ask if authority is unclear.
4. Invoke `review` on the pushed revision with explicit `COMMENT` publication
   authority, including advisory review of this exact self-authored/draft PR.
   Save head/base, finding IDs, result and review URL. No approval in review.
5. Invoke `watch` once with those findings. A fix invalidates the previous
   revision's review/approval evidence; invoke a bounded authored-delta re-review
   before handoff, or mark it due when genuine work remains pending. Never treat
   the new revision as reviewed merely because checks passed. Apply an authorized
   ready transition only with current readiness evidence.
6. Invoke `approve` once for current eligibility/evidence, and `merge` once only
   with merge authority and current prerequisites. Record blocked/pending reasons.
   Evaluate the **human handoff** below before creating schedules. If due, finish
   handoff with no new timers. Otherwise, for genuine pending work or explicit
   `--keep-watching`, create the three native recurring prompts below, or two with
   approval disabled. Add a fourth **only with recorded explicit merge authority**,
   using merge; it may use valid independent approvals even when this account
   cannot self-approve.
   Verify actual schedule IDs/receipts and save them. Initial review
   and watching do not substitute for creating schedules when a watch is needed.
   Activate the run only after confirmed creation; failed setup remains blocked
   with confirmed jobs cancelled. Component blockers stay in step state, not a
   falsely terminal global state that would cancel the healthy steps.
7. Return the PR, step states and either the verified handoff/decision ask or
   actual schedule IDs/cadences, expiry and pending work. **Watching** is an
   active watch, not approved or merged; **handoff** is inactive, not merged.

## Human handoff (default)

Evaluate handoff after kickoff and every bounded tick, **before an unchanged
input can return quietly**. Use current revision-bound evidence and the compact
snapshot, not another full diff/review/build just to decide whether to stop.

- **Ready:** review and required validation are current, actionable feedback and
  conflicts are addressed, and no autonomous work remains. Without merge authority,
  hand off instead of repeatedly observing a clean PR. Approval success alone
  does not authorize merge or require waiting for another push.
- **Needs a person:** a draft without ready authority, self-author approval,
  missing/ambiguous policy, independent review, access or a material decision
  prevents progress, and no other check/review/repair is genuinely pending.
  State the exact blocker, not "everything passed" or "ready to merge".
- **Keep working:** known running checks, a bounded due review/repair, or an
  owned native merge-queue entry still needs observation. Do not stop useful
  work because an approval component is blocked. Unknown/missing/failed evidence
  is not green and is not automatically an in-flight check; diagnose once, then
  hand off its real blocker when no authorized progress is possible.

Before asking, mark the run **handoff** (inactive), cancel only its recorded
schedule IDs and verify cancellation. Already-dispatched ticks must return before
any GitHub read/write. An owned queue entry must complete or be withdrawn/verified
under merge authority before claiming a clean handoff. Record head/base, reasons,
evidence, cleanup receipts and that the decision ask was delivered.

Use the host's structured question tool when available. Offer policy-gated merge
when its prerequisites permit it, manual review/merge or resolving the named
blocker, and explicit continued watching. Name the exact PR and any requested
ready transition. A merge/ready choice is new authority only for those named
effects; recheck source, policy, identity and native gates through the owning
skills before acting. Do not offer automated merge as available when policy or
independent approval is missing, self-approve, or treat silence as consent.
If the owner declines or gives no choice, leave the run inactive with no timers.
Resume/create watchers only after an explicit keep-watching request and fresh
preflight/verified scheduler receipts; record mode `keep-watching` without adding
ready/merge authority. A separate user-confirmed merge/ready action invokes its
owner directly after fresh guards, not a cancelled tick. Report cancellation
uncertainty honestly.

## Native `/every` prompts

When watching is needed: review **15m**, watch **5m**, approval **15m**, maximum
watch duration **24h**. Readiness/human handoff normally ends it earlier.
Opted-in merge defaults to **15m** (`--merge-every`); no merge job otherwise.
Honor explicit positive cadences/duration; reject invalid options before writes.
Use Copilot's documented `/every` scheduler, backed by `manage_schedule` when
provided. Fetch this build's documentation before relying on scheduler behavior.
`/every` needs experimental support in builds that mark it experimental: report
an unavailable capability without changing settings or permission mode.

Instantiate each prompt with the **absolute state path**, unique run ID, exact
host/repository/PR and step. Do not schedule the bare `/ship` orchestrator:

```text
/every 15m For ship run <run-id> at <absolute-state-path>, preflight and delta-probe <host>/<owner>/<repo>#<number> using the watch contract. Evaluate default handoff before unchanged no-op: when due mark inactive, cancel/verify owned jobs and ask once; otherwise if review inputs are unchanged return quietly. For changed inputs load the recorded toolkit review skill and run one COMMENT-only tick, recording exact head/base, findings and verified review URL, then recheck handoff. No approval, fixes, native-command substitution, or child schedules.
/every 5m For ship run <run-id> at <absolute-state-path>, preflight and delta-probe <host>/<owner>/<repo>#<number> using the watch contract. Evaluate default handoff before unchanged no-op: when due mark inactive, cancel/verify owned jobs and ask once; otherwise if no actionable feedback/conflict/CI change return quietly. For changed inputs load the recorded toolkit watch skill and run one tick in the recorded worktree, push validated fixes before replies/resolution and invalidate changed-revision evidence, then recheck handoff. No approval, merge, or child schedules.
/every 15m For ship run <run-id> at <absolute-state-path>, preflight and delta-probe <host>/<owner>/<repo>#<number> using the watch contract. Evaluate default handoff before unchanged no-op: when due mark inactive, cancel/verify owned jobs and ask once; otherwise if approval inputs are unchanged or a recorded eligibility blocker remains return quietly. For changed eligible inputs load the recorded toolkit approve skill and run one tick under recorded authority and trusted base APPROVALS.md, with current review and exact-commit verification, then recheck handoff. No fixes, readying, merge, or child schedules.
```

Only when explicitly authorized merge still needs watching, also instantiate:

```text
/every 15m For ship run <run-id> at <absolute-state-path>, preflight and delta-probe <host>/<owner>/<repo>#<number> using the watch contract. Require recorded merge authority and evaluate default handoff before unchanged no-op; observe an owned queue entry until completion or verified withdrawal. For a stable human blocker mark inactive, cancel/verify owned jobs and ask once. Otherwise if merge inputs unchanged return quietly; for changed inputs load the recorded toolkit merge skill under trusted base policy and native checks/independent approvals, verify normal merge/queue outcome and recheck handoff. No fixes, self-approval, auto-merge, bypass, or child schedules.
```

With `manage_schedule`, call `create` with the cadence as `interval` and the
expanded text after the cadence as `prompt`. List and reconcile existing matching
schedules first; retain each returned ID. Do not execute slash commands through
PowerShell or invent host schedule IDs. Do not start schedules merely to test this
skill. If creation is partial/uncertain, reconcile, stop confirmed created jobs,
and report the watch as blocked rather than claiming all requested jobs are active.

Each prompt must apply the watch contract's handoff check before its unchanged
no-op path. Each tick checks the contract and cheap delta probe first, loading its owner
only when actionable work exists. Reuse already loaded skills instead of loading
them again. Each owner makes **one bounded pass** and returns. Unchanged work is
a quiet no-op, not another review/comment/CI rerun. Native permissions still apply;
scheduling never grants a permission or unattended mode.

## Token-efficient operation

Use the watch contract's shared compact snapshot and dirty-step flags, not separate
independent full-PR reads (including opted-in merge). Fetch/project only needed
fields in one bounded `gh` program; keep raw API pages/diffs/logs out of model
context. Read full relevant evidence only for a changed input, preserve stable finding IDs, reuse exact-tree
verification and review authored deltas rather than re-reviewing unchanged code.
Idle ticks emit no user-facing recap; report only new work, a changed blocker or
terminal state. Do not trade correctness for savings: incomplete reads cannot
establish an unchanged/pass verdict, and each write still needs fresh guards.

## Status, stop and completion

`status` reads the run record, verifies its native schedule IDs and current PR
state, and reports the four step results plus opted-in merge/queue state; it
creates no schedules or GitHub writes.
`stop` marks the record stopped **before** cancelling only this run's recorded
schedule IDs. Verify cancellation; an uncertain cancellation remains visible.
Already-dispatched ticks must observe the inactive run before any further write.
For an owned pending queue entry, stop/expiry also requires verified native
withdrawal before claiming pending merge intent cancelled. Do not remove external
entries; an unavailable withdrawal remains an explicit pending-merge blocker.

Cancel all owned schedules on handoff, stop, expiry, closed/merged PR, changed identity or
target, lost authorization, or unusable run state. Approval success on one SHA
does **not** permit merge: default runs hand off when no autonomous work remains;
`--keep-watching` continues for later pushes until a terminal condition. A new
push needs review and approval again. Merge is never a hidden fifth step. `--merge` keeps
queued work observable, with mutations paused for its candidate until withdrawal
or native completion. Queue submission persists independently of agent schedules;
do not claim session shutdown or cancelling a job retracts it. Schedules are
session-scoped, not a durable service; resume only explicitly after recovering
state/receipts, renewing expired authority and rechecking actual capabilities.
