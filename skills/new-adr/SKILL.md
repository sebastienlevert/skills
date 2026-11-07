---
name: new-adr
description: >
  Author or update an architecture decision record in any project using its own
  conventions. Use for "new ADR", "record this architectural decision", or
  "document the alternatives and tradeoffs". Separate proposed from accepted
  decisions; use a fresh-base task worktree and draft PR for persisted changes.
  No product-specific tooling, mandatory ADR gate, or automatic implementation.
---

# New ADR

Record a significant, durable choice and its tradeoffs. An ADR explains **why**
a decision was made; a specification owns the behavioral requirements. Routine
renaming, helper extraction, or a small bug fix does not require an ADR.

## Establish the decision

1. Preserve the original decision request, constraints, alternatives and actual
   approval evidence. Resolve the authorized repository and related work.
2. Read project instructions, existing ADRs, relevant specs and direct consumers.
   Follow existing placement, identifiers, numbering, statuses and index rules.
   Do not impose a new ADR framework or tooling.
3. Determine whether this clarifies an existing decision, supersedes an accepted
   choice, or records a genuinely new choice. Reuse existing records where
   appropriate; preserve supersession links and historical context.
4. Distinguish established facts from proposed choices and reconstructed rationale.
   Ask only about material unresolved decisions; never invent their approval.

## Write the smallest useful record

Use the repository's template. Otherwise:

```markdown
# Decision title
Status: Proposed
Related work: <verified links when present>

## Context
Problem, constraints, evidence and decision scope.

## Options
Viable alternatives, including keeping the current approach where meaningful.

## Decision
Chosen or proposed option, why it fits, and responsibility boundaries.

## Consequences
Benefits, costs, risks, compatibility/migration and verification implications.

## Open questions and supersession
Unknowns, actual approval evidence, and related/superseded records.
```

Do not label a proposed choice Accepted without an actual decision. Accepted does
not mean implemented or verified. Do not rewrite history to make current code
look intentional, or silently change an accepted decision through a wording fix.
Link contracts instead of duplicating requirements and acceptance lists.

## Persist and deliver when requested

A chat-only draft makes no files or GitHub changes. `/new-adr <request>` or an
explicit request to save the decision in the repository authorizes scoped document
changes and a draft PR, not source implementation.

For persisted work:

- Verify repository/host and use `gh` for GitHub operations.
- Fetch latest remote state. Safely pull the clean selected base with
  `git pull --ff-only <remote> <base>`; never pull it into an unrelated branch.
- Use a dedicated sibling worktree/branch from the fresh remote base. Preserve
  dirty/shared/diverged checkouts; disclose when the base could not safely be
  pulled. Reuse the same task worktree/PR for follow-ups, without force-pushing.
- Change only the decision and directly affected navigation/references. Run the
  project's relevant document/link checks and review consistency; do not run
  unrelated application builds or add a documentation gate to ordinary tasks.
- Inspect/stage owned files, use project commit conventions and applicable
  attribution, push the branch, and open a **draft PR**. Verify repository,
  base/head, changed files, draft state and canonical URL.

If the repository has no ADR convention, choose a minimal Markdown location,
state that choice, and avoid installing a framework. Significant unresolved
decisions remain Proposed. Do not merge, mark ready, implement the decision,
or require other work to wait for an ADR unless project policy actually says so.

## Acceptance checks

- Existing decisions are discovered before creating a competing record.
- Proposed versus accepted status matches actual evidence.
- The record explains alternatives and consequences without duplicating a spec.
- Document-only work preserves source behavior and avoids unrelated gates.
- Persisted delivery uses an isolated fresh-base worktree and one draft PR.
