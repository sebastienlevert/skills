---
name: new-epic
description: >
  Turn a product outcome into a grounded epic with priorities, scope boundaries,
  measurable completion criteria, and optionally approved child issues in any
  GitHub project. Use for "new epic", "create an epic", "epic proposal", or
  "break this epic into features". Research existing work and preserve open
  decisions; do not implement features or invent customer demand.
---

# New epic

Create a useful planning surface, not a burst of speculative implementation tasks.
An epic describes an outcome and its boundaries; child issues represent coherent,
independently verifiable slices of that outcome.

## Resolve the requested deliverable

- Preserve the full original theme, user scenarios, priorities, existing feature
  list, and scope decisions. Ask only for missing material decisions.
- Distinguish **draft proposal**, **create parent epic only**, and **create epic
  plus children**. A request to create an epic does not by itself authorize a
  batch of invented child issues.
- Verify the exact repository and host using `gh repo view`. Use `gh`, never
  GitHub MCP; do not switch accounts to overcome an access error.
- Read project instructions, existing epic/issue templates, related specs and
  current backlog. Use current remote evidence or safely refreshed local files.
  Planning alone requires no code changes or implementation worktree.

## 1. Ground and bound the outcome

1. State who benefits and what will be observably true when the epic succeeds.
   Separate known customer needs from proposed scenarios and hypotheses.
2. Search both open and closed issues and PRs. Read likely overlaps before
   deciding whether to reuse, extend, or create work. Never duplicate a parent
   already owning the same outcome.
3. Discover project-native priorities, types, labels, milestone conventions and
   parent-child support. Do not invent IDs, metadata or a new taxonomy.
4. Identify a useful initial release rather than declaring every important
   capability P0. If P0-P3 is used without a project definition, explicitly
   propose: P0 initial-release essential; P1 next; P2 advanced; P3 deferred.
5. Keep user scenarios separate from implementation choices. Record dependencies
   and open decisions honestly; a POC or design proposal is not production proof.

## 2. Propose the planning shape

Use the repository template or a small structure:

```markdown
## Outcome and status
User-visible goal; proposal versus agreed scope.

## Initial scope and non-goals
The smallest useful release and explicit exclusions.

## Requirements
| ID | Priority | User scenario | Scope boundary |
|---|---|---|---|
| R01 | P0 | A verifiable user capability. | What this does not require. |

## Completion criteria
Observable epic-level success, not just child-issue counts.

## Work breakdown
Existing links and proposed slices; distinguish proposed from created work.

## Open decisions and dependencies
Unresolved choices and evidence needed.
```

Preserve existing requirement IDs and agreed priorities when updating a proposal.
Do not silently reclassify deferred work as required. Do not treat every
requirement row as a separate issue.

For child creation, present a bounded candidate table with outcome, acceptance,
priority, dependencies, and **new versus reuse**. Seek agreement before filing
newly invented children. An explicitly supplied and authorized exact breakdown
can proceed without asking for the same approval again.

Each child should stand alone with its outcome, scope, evidence, acceptance and
verification. Keep necessary tests/docs with the feature unless independent
delivery genuinely warrants a separate issue.

## 3. Create only the approved records

1. An explicit create request authorizes the parent. Draft/proposal requests
   authorize no publication. Use `gh issue create` with body supplied as data.
2. Create only approved missing children; reuse existing issues without changing
   their scope or status. Do not move an existing issue from another parent or
   change its metadata without specific permission.
3. Prefer native parent-child links when supported by the host and permissions.
   Discover the supported operation through `gh` rather than guessing schema.
   Otherwise add clearly labeled Markdown links/checklists to the new parent,
   without claiming that native hierarchy was established.
4. Link dependencies only when known. Do not invent owners, schedules, estimates,
   accepted decisions, or a claim that all blocked work is implementation-ready.
5. Verify each created record and link. Capture its canonical URL before moving
   to the next item. On partial failure retain/report created URLs and remaining
   work; reconcile uncertain writes before retrying.

Return the parent, created/reused children, actual linking state, and unresolved
decisions. Do not start implementation, create a spec automatically, or close
existing work as a side effect.

## Acceptance checks

- "Create an epic proposal" returns a draft; it does not file ten guessed issues.
- Parent-only creation preserves requirement tables without forcing decomposition.
- Previously agreed priorities and IDs remain stable across revisions.
- Existing children with another parent are not silently reparented.
- Markdown fallback is reported as Markdown, not native hierarchy.
- Partial creation can resume without duplicating already-created records.
