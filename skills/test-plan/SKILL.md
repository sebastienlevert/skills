---
name: test-plan
description: >
  Derive a concise, risk-based test plan from a task, local changes, or a PR in
  any project. Cover intended behavior, important edge cases, compatibility,
  and existing validation commands. Use for "test plan" or "what should I test".
  Standalone use is read-only and runs no tests. Also supplies the lightweight
  planning step inside implement without requiring a second review or artifact.
---

# Test plan

Answer "what evidence would establish this change works?" using the actual
requirements and affected paths. A small change gets a small plan, not a test
strategy document.

## Derive the plan

1. Resolve the requested task, local change set, or exact PR/head/base. Preserve
   provided acceptance criteria and read applicable project instructions.
2. Inspect the intended behavior, changed execution path and nearby tests.
   For GitHub use `gh`; do not assume the current checkout matches a supplied PR.
3. Identify the smallest meaningful set of cases:
   - The primary behavior or original bug reproduction.
   - Relevant boundaries and failure/permission paths.
   - Existing behavior or data contracts most likely to regress.
4. Map cases to existing test files/runners and required checks. Distinguish
   proposed tests from existing coverage, and manual verification from automation.
5. Prioritize material gaps. Do not propose tests of constants, trivial accessors
   or framework behavior, or add a new runner for a task the existing tools cover.

Output a compact table when useful:

| Case | Expected outcome | Existing check or proposed verification |
|---|---|---|
| Primary scenario | Observable behavior. | Focused test or safe manual step. |
| Relevant regression | Preserved contract. | Existing targeted test. |

Omit irrelevant rows. Name commands only when found in project evidence; label
any proposed command as unverified. Do not equate "no tests added" with a defect
when meaningful existing coverage already verifies the change.

## Lightweight integration with implement

Before editing, `implement` keeps a brief in-session plan tied to acceptance.
Usually a few cases suffice; a trivial change may need only one. Do not require
a committed plan file, a separate skill session, delegated reviewers, or a fixed
case count. Update the plan only when scope, evidence or risk changes.

After implementation, map actual check results back to those cases. Reuse valid
results for the same revision, inputs and environment. Rerun when affected code,
configuration, dependencies or relevant base integration changes, or when the
required project policy demands it.

## Boundaries

Standalone invocation only returns a plan. It does not execute tests, edit files,
install tools, post comments, approve a PR, or change its state. Within an
authorized implementation, `implement` owns edits and execution.

Testing against live data or services requires the normal authorization for those
actions. Never treat a desired test outcome as permission to provision, delete,
change identities, or bypass an access restriction.

## Acceptance checks

- Planning before a diff exists uses the task/contract, not invented changes.
- A one-line fix receives a focused plan rather than an exhaustive template.
- Existing coverage is reused when it verifies the actual requirement.
- Standalone planning produces no test execution or source/GitHub mutations.
- Integrated planning does not add a mandatory file, agent, or duplicate run.
