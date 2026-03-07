---
name: ralph-loop
description: |
  Implements the RALPH (Read-Act-Learn-Persist-Halt) loop — an autonomous development
  loop that spawns fresh Copilot CLI agents per iteration to work through a PRD with
  checkboxed success criteria. State persists in files and git, not in context.
  Use when user says "run ralph loop", "start ralph", "ralph loop", "autonomous loop",
  "loop on this task", "run the loop", "create a ralph task".
---

# RALPH Loop

Orchestrates autonomous, iterative development by spawning fresh `copilot -p "..." --yolo` child agents in a loop. Each iteration gets clean context. Progress lives in files and git — not in the LLM's memory.

Inspired by the [Ralph Wiggum technique](https://ghuntley.com/ralph/): deliberately rotate to fresh context before pollution builds up.

## When to use

- User says "run ralph loop", "start ralph", or "ralph loop"
- User says "autonomous loop" or "loop on this task"
- User says "create a ralph task" (PRD scaffolding only)
- User wants to run an agent autonomously against checkboxed success criteria
- User has a well-defined task with machine-verifiable completion criteria

## Concepts

### How it works

```
┌─────────────────────────────────────────────────────────┐
│  Orchestrator (this agent — current Copilot CLI session) │
│                                                          │
│  1. Read RALPH_TASK.md (the PRD)                         │
│  2. Initialize .ralph/ state directory                   │
│  3. Loop:                                                │
│     ├─ Build prompt from PRD + guardrails + progress     │
│     ├─ Spawn: copilot -p "<prompt>" --yolo               │
│     ├─ Wait for child to finish                          │
│     ├─ Read RALPH_TASK.md → count [x] vs [ ]            │
│     ├─ Git commit iteration changes                      │
│     ├─ All checked? → HALT ✅                            │
│     ├─ Stuck 3 iterations? → Adjust prompt               │
│     └─ Max iterations? → HALT 🛑                        │
│  4. Report final summary                                 │
└─────────────────────────────────────────────────────────┘
```

### Why fresh context matters

Traditional LLM conversations suffer from context pollution — failed attempts, unrelated code, and mixed concerns accumulate and confuse the model. RALPH solves this by rotating to a **fresh agent** on each iteration. State lives in **files and git**, not in the LLM's memory.

## Workflow

### Phase 1: Validate or Scaffold the PRD

**If `RALPH_TASK.md` exists in the project root:**

1. Read and parse the file
2. Validate it has:
   - YAML frontmatter with at least a `task` field
   - A `## Success Criteria` section (or similar heading)
   - At least one unchecked checkbox (`- [ ]`)
3. Extract settings from frontmatter:
   - `task` (required) — short task name
   - `test_command` (optional) — command to run after each iteration
   - `max_iterations` (optional, default: 50) — safety cap
4. If validation fails, report what's missing and offer to fix it

**If `RALPH_TASK.md` does not exist:**

1. Ask the user to describe their task
2. Scaffold `RALPH_TASK.md` with:
   - YAML frontmatter (`task`, `test_command` if applicable, `max_iterations: 50`)
   - Task description
   - `## Success Criteria` section with `- [ ]` checkboxes
3. Show the generated file and ask for confirmation before proceeding
4. **STOP here** if user says "create a ralph task" — do not start the loop

### Phase 2: Initialize State

1. Create the `.ralph/` directory if it doesn't exist
2. Create initial state files:

**`.ralph/progress.md`:**
```markdown
# RALPH Progress

## Current Status
- Iteration: 0
- Criteria completed: 0/<total>
- Status: Not started

## Iteration Log
<!-- Each iteration appends here -->
```

**`.ralph/guardrails.md`:**
```markdown
# RALPH Guardrails

Rules and lessons learned across iterations. Each "Sign" prevents repeating mistakes.

## Signs

<!-- Signs are added by the child agent when it learns something important -->
<!-- Example:
### Sign: Always run tests before committing
- **Trigger**: After any code change
- **Instruction**: Run the test suite and fix failures before committing
- **Added after**: Iteration 2 — committed broken code
-->
```

**`.ralph/activity.log`:**
```
# RALPH Activity Log
# Task: <task name>
# Started: <ISO timestamp>
# Max iterations: <max>
```

3. If `.ralph/` already exists with state from a previous run, ask:
   - **Resume** — Continue from where it left off
   - **Reset** — Clear state and start fresh

### Phase 3: The Loop

Execute this loop until a halt condition is met:

```
for iteration in 1..max_iterations:
    1. BUILD the child agent prompt (see Prompt Template below)
    2. SPAWN the child agent:
       copilot -p "<prompt>" --yolo
    3. WAIT for the child to complete
    4. READ RALPH_TASK.md and count checkboxes:
       - total = count of "- [ ]" + "- [x]"
       - done  = count of "- [x]"
    5. APPEND to .ralph/activity.log:
       [<ISO timestamp>] Iteration <N>: <done>/<total> criteria complete
    6. UPDATE .ralph/progress.md with current status
    7. CHECK halt conditions:
       a. done == total → HALT with success ✅
       b. iteration == max_iterations → HALT with max-iterations 🛑
       c. Stuck detection (see below) → inject adjustment into next prompt
    8. REPORT iteration status to user:
       ## Iteration <N>/<max> complete
       ✅ Progress: <done>/<total> criteria
       🔄 Starting iteration <N+1>...
```

**IMPORTANT:** Run each `copilot -p "..." --yolo` command with `mode="sync"` and a generous `initial_wait` (at least 120 seconds). Child agents may take several minutes per iteration. Wait for completion before proceeding.

### Phase 4: Halt & Report

When the loop stops, present a summary:

**On success (all criteria met):**
```
## 🎉 RALPH Loop Complete!

**Task:** <task name>
**Iterations:** <N> of <max>
**Duration:** <total time>
**Criteria:** <total>/<total> ✅

All success criteria have been met. Review the changes with:
  git log --oneline -<N>
```

**On max iterations reached:**
```
## 🛑 RALPH Loop — Max Iterations Reached

**Task:** <task name>
**Iterations:** <max> of <max>
**Criteria:** <done>/<total> (<done> completed, <remaining> remaining)

Remaining criteria:
- [ ] <unchecked item 1>
- [ ] <unchecked item 2>

To continue, increase max_iterations in RALPH_TASK.md and run the loop again.
The .ralph/ state is preserved — it will resume from where it left off.
```

## Prompt Template

The orchestrator constructs this prompt for each child agent iteration. The prompt is passed to `copilot -p "..." --yolo`.

```
You are iteration <N> of a RALPH loop — an autonomous development agent.
Your job is to make progress on exactly ONE success criterion.

== INSTRUCTIONS (follow in order) ==

1. Read .ralph/guardrails.md — follow ALL Signs listed there.
2. Read RALPH_TASK.md — this is your task spec with success criteria.
3. Read .ralph/progress.md — see what previous iterations accomplished.
4. Identify the NEXT unchecked criterion (- [ ]) in RALPH_TASK.md.
5. Work on that ONE criterion. Do it thoroughly — quality over speed.
6. When done, update RALPH_TASK.md: change "- [ ]" to "- [x]" for completed items.
7. Update .ralph/progress.md with what you accomplished this iteration.
8. If you discover important gotchas or patterns, add a Sign to .ralph/guardrails.md.
<IF test_command>9. Run: <test_command> — fix any failures before finishing.</IF>
10. Commit all changes: git add -A && git commit -m "ralph: iteration <N> — <short description>"

== RULES ==

- Focus on ONE criterion. Do not attempt to complete multiple items.
- If a criterion is blocked by something outside your control, note it in progress.md and move to the next unchecked item.
- Do NOT modify this prompt or .ralph/activity.log.
- If you break something, fix it before finishing.
<IF stuck>
- ⚠️ STUCK ALERT: Previous iterations made no progress on the current criterion.
  Try a COMPLETELY DIFFERENT approach. Re-read the codebase. Consider if the
  criterion itself needs to be broken into smaller steps.
</IF>
```

## Stuck Detection

The orchestrator tracks progress between iterations:

1. After each iteration, record the count of `[x]` checkboxes
2. If the count has **not increased** for **3 consecutive iterations**:
   - Add the `STUCK ALERT` section to the next child's prompt
   - Log to activity.log: `[timestamp] ⚠️ Stuck detected — 3 iterations with no progress`
3. If stuck for **6 consecutive iterations** (double the threshold):
   - Ask the user: "The loop has been stuck for 6 iterations. Continue, adjust task, or stop?"

## RALPH_TASK.md Format

```markdown
---
task: <short task name>
test_command: "<optional shell command to validate>"
max_iterations: 50
---

# Task: <descriptive title>

<Detailed description of what needs to be built. Include:
- Context about the project
- Technical requirements
- Constraints or preferences>

## Success Criteria

- [ ] <Criterion 1 — specific, verifiable>
- [ ] <Criterion 2 — specific, verifiable>
- [ ] <Criterion 3 — specific, verifiable>
```

**Guidelines for good criteria:**
- ✅ Specific and machine-verifiable: "GET /health returns 200"
- ✅ Independently completable: each can be done in one iteration
- ❌ Vague: "Make it look nice"
- ❌ Too large: "Build the entire backend" (break into smaller criteria)

## Examples

### Example 1: Start a loop on an existing PRD

**User input:** "run ralph loop"

**Steps:**
1. Agent reads `RALPH_TASK.md` from project root
2. Validates frontmatter and checkboxes
3. Initializes `.ralph/` state
4. Starts loop — spawns `copilot -p "..." --yolo` for iteration 1
5. After child completes, reads checkboxes, reports progress
6. Continues until all criteria checked or max iterations

### Example 2: Create a PRD first

**User input:** "create a ralph task for building a REST API with user CRUD"

**Steps:**
1. Agent scaffolds `RALPH_TASK.md` with frontmatter and checkboxes
2. Shows the file for user review
3. **Stops** — does not start the loop (user said "create", not "run")

### Example 3: Resume an interrupted loop

**User input:** "run ralph loop" (with existing `.ralph/` state)

**Steps:**
1. Agent detects existing `.ralph/progress.md`
2. Asks: Resume or Reset?
3. If Resume: reads last iteration number, continues from there
4. If Reset: clears `.ralph/`, starts fresh

## Error handling

| Scenario | Action |
|----------|--------|
| `RALPH_TASK.md` not found | Offer to scaffold one interactively |
| `copilot` CLI not in PATH | Error: "Copilot CLI required. Install from https://githubnext.com/projects/copilot-cli" |
| Child agent exits with error | Log error to activity.log, continue to next iteration |
| Child agent times out | Log timeout, continue to next iteration |
| No checkboxes in PRD | Error: "RALPH_TASK.md needs `- [ ]` checkboxes in Success Criteria" |
| YAML frontmatter missing | Warn but continue with defaults (max_iterations: 50, no test_command) |
| Git not initialized | Error: "Git required. Run `git init` first." |
| Stuck for 6+ iterations | Pause loop and ask user for guidance |

## Retry and timeout limits

- **Child agent timeout:** No hard timeout — wait for `copilot -p` to complete naturally
- **Max iterations:** Configurable (default 50), hard stop
- **Stuck threshold:** 3 iterations with no progress → adjust prompt
- **User intervention:** 6 iterations with no progress → ask user

## Safety

### MUST NOT

- ❌ Modify `RALPH_TASK.md` from the orchestrator (only the child agent modifies it)
- ❌ Delete `.ralph/` state without user confirmation
- ❌ Run the loop without `--yolo` flag (child agents need autonomy)
- ❌ Spawn more than one child agent at a time
- ❌ Override `max_iterations` without user consent
- ❌ Reveal the full child prompt to the user (it's an implementation detail)

### MUST

- ✅ Validate `RALPH_TASK.md` before starting the loop
- ✅ Git commit after each iteration (rollback-friendly)
- ✅ Report progress between every iteration
- ✅ Stop when all criteria are met
- ✅ Respect `max_iterations` as a hard stop
- ✅ Preserve `.ralph/` state for resume capability

## Scope boundaries

- **Operates on:** Current project directory (where `RALPH_TASK.md` lives)
- **Creates:** `.ralph/` directory, `RALPH_TASK.md` (if scaffolding)
- **Modifies:** Nothing directly — child agents make all code changes
- **Reads:** `RALPH_TASK.md`, `.ralph/*` (between iterations)

## Dependencies

| Dependency | Required | Fallback |
|------------|----------|----------|
| `copilot` CLI | Yes | Error: "Copilot CLI is required to run the RALPH loop" |
| `git` | Yes | Error: "Git is required — the loop commits after each iteration" |
| `--yolo` flag support | Yes | Fall back to `--allow-all` if `--yolo` not recognized |

## Progress feedback

Between iterations, display:

```
─────────────────────────────────────
## Iteration <N>/<max> complete
✅ Progress: <done>/<total> criteria
📝 Last: "<latest commit message>"
⏱️  Elapsed: <total elapsed time>
🔄 Starting iteration <N+1>...
─────────────────────────────────────
```

## Exit conditions

The skill completes when:

1. ✅ All success criteria in `RALPH_TASK.md` are checked (`[x]`)
2. 🛑 Max iterations reached
3. 🤚 User interrupts (Ctrl+C or "stop")
4. ❌ Unrecoverable error (no git, no copilot CLI)
5. 🔄 User says "stop" after stuck-detection prompt

After completion, report final summary and suggest next steps.
