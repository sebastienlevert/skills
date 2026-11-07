---
name: new-spec
description: >
  Research and author or update a focused specification in any project, following
  its contracts, document conventions, and acceptance criteria. Use for "new spec",
  "write a spec", "specify this feature", or "update this specification". Persisted
  repository changes use a dedicated worktree from a refreshed base and finish
  with validation and a draft PR. Draft-only requests remain in chat.
---

# New spec

Write an implementable behavioral contract, not an implementation diary.
Use project-native formats and preserve established requirements. Do not require
a specific framework, document generator, diagramming tool, or spec per issue.

## 1. Establish scope and the existing contract

1. Resolve the original request, intended repository, related issue/epic, audience
   and requested deliverable. A chat-only draft does not authorize file changes,
   commits, or publication. `/new-spec <request>` or an explicit request to persist
   a spec in the resolved repo authorizes the scoped branch and draft PR.
2. Verify repository/host and read applicable instructions, spec indexes,
   templates, relevant contracts and decisions. Use `gh` for GitHub operations;
   never use GitHub MCP or silently switch accounts.
3. Search for the existing owning spec before creating another one. Update it
   when the capability is the same; create a new spec for a genuinely distinct
   contract. Use an issue/proposal first when product scope is still exploratory.
4. Distinguish accepted requirements, proposed options, POC evidence, current
   implementation and missing functionality. Code is evidence, not permission
   to weaken a commitment. Resolve material contradictions or mark them open.

## 2. Refresh the base and isolate file changes

For a persisted spec, use a dedicated branch and worktree:

- Record worktree status and resolve the selected remote and actual target branch;
  never assume `origin/main`.
- Always fetch latest remote refs before starting. If the clean base checkout is
  on that target branch, pull it with `git pull --ff-only <remote> <base>`.
  Never pull a different branch into an unrelated checked-out branch.
- If the base checkout is dirty, shared, or diverged, do not stash, reset,
  overwrite, or move it. Use the freshly fetched remote base for the new worktree
  and disclose that the base checkout itself was not pulled. If fetch fails, stop
  rather than claim the work starts from latest.
- Create a uniquely named sibling worktree beside the core repository, with a
  dedicated branch from that refreshed base. Respect user-selected drive/location
  rules; do not nest it inside another checkout or use an unrelated scratch drive.
- Reuse the same task's existing worktree/PR for follow-ups. Inspect remote changes
  first and integrate them only without overwriting local work; never create a
  second PR for the same task or force-push by default.

## 3. Define a small, testable specification

Follow the repository's template and path convention; use `specs/` only when
that is the project's convention. When no format exists, use:

```markdown
# Capability
Status: Draft
Related issue: <canonical link when one exists>

## Problem and outcome
Audience, need and observable result.

## Scope and responsibilities
Ownership, dependencies, initial scope and non-goals.

## Behavioral requirements
Inputs, outputs, defaults, permissions, errors, lifecycle and compatibility.

## Acceptance criteria
Stable IDs and verifiable positive, negative and failure cases.

## Open decisions
Material unresolved choices and their consequences.

## Deferred work
Only explicitly deferred scope; not a speculative roadmap.
```

Keep priorities and requirement IDs aligned with the parent issue when present.
Describe guarantees before choosing internals. Include a short design overview
only where it explains a necessary boundary or tradeoff.

Check existing commands/APIs, environment precedence, saved-data formats,
serialization, exit/status semantics, and migration implications as applicable.
Define unknown evidence and failure behavior rather than inferring success.
Use diagrams only when they clarify nontrivial control flow; do not generate a
second representation that duplicates the contract.

Do not silently mark the spec Accepted, remove unresolved questions, or convert
future work into mandatory implementation. Do not rewrite unrelated specs or
invent ADRs for routine local design choices.

## 4. Validate and deliver a draft PR

1. Review the complete touched contract and its direct references for consistency.
   Preserve existing obligations, stable IDs and consumers; avoid format-only
   migrations outside scope.
2. Run existing relevant documentation/link/schema checks and whitespace checks.
   No application build is needed for prose alone unless the project requires
   it. Distinguish document validation from implementation verification.
3. Stage only owned files, inspect the exact diff, and commit using project
   conventions and applicable attribution trailers.
4. Refresh remote refs before publishing; inspect any base/branch movement.
   Integrate only safely and revalidate affected changes; do not claim an old
   validation run covers a modified tree.
5. Push only the dedicated branch. Reconcile any existing PR, otherwise create
   with `gh pr create --draft --base <base> --head <branch>`, following the
   project's PR template. Include scope, issue links, open decisions and checks.
6. Verify the PR is a draft with the intended repository, base, head, commit and
   files. Return its canonical URL and blockers. Do not ready, merge, or implement
   the spec as an automatic follow-on.

If publication is blocked, retain the work and explain the precise blocker;
do not claim a draft PR exists without a verified URL.

## Acceptance checks

- A chat-only draft creates no files, commits, or PRs.
- A dirty/shared base checkout is preserved while fresh remote evidence is used.
- An existing governing spec is updated rather than duplicated.
- Unsettled choices remain visible; requirements are not rewritten to fit code.
- Persisted spec work is validated and delivered through one draft PR.
