<!-- personal-toolkit:start -->
# Personal Toolkit workspace

Use the `personal-toolkit` plugin from `sebastienlevert/skills` as this workspace's
workflow entry point. Load the relevant skill and follow its current instructions
instead of duplicating its procedures in this file.

## Route work by intent

| Intent | Skill |
|---|---|
| Clone, check out, reuse, or explicitly migrate a repository | `setup-repo` |
| Investigate a failure or establish a root cause | `investigate` |
| Draft or create an issue or epic | `new-issue`, `new-epic` |
| Write a specification or architecture decision | `new-spec`, `new-adr` |
| Implement a scoped change through a draft PR | `implement` |
| Explicitly orchestrate the delivery lifecycle | `factory`, with the requested mode |
| Plan focused verification | `test-plan` |
| Review changes or assess review feedback | `auto-review`, `triage` |
| Fix authorized PR feedback or conflicts | `address-pr-feedback` |
| Publish reviewed findings at specific diff lines | `post-pr-comments` |
| Assess PR readiness | `prepare-pr` |
| Research a decision or write a strategy paper | `research-brief`, `paper-strategist` |

Use only the stages the task needs; a question or small lookup isn't a full
delivery pipeline. If a required skill isn't available, report the missing
dependency instead of inventing its behavior.

## Keep responsibilities clear

- `setup-repo` owns checkout layout, approved identities, and local registry
  maintenance. Read the local registry before repository work when one exists;
  preserve unrelated work and keep edits in the task's actual checkout.
- Project-specific instructions and the host's instruction precedence still
  apply. This routing file doesn't replace contributor rules or tool permissions.
- Use `gh` for GitHub operations. Review or preparation alone doesn't authorize
  posting, pushing fixes, approving, resolving threads, or merging.
- Installation and initialization don't authorize any downstream workflow.
  Run `init-toolkit` only when explicitly invoked by the user, never implicitly
  because this file is present or another skill needs a workspace.

Keep local overrides and machine-specific repository registry data outside this
managed block. Refresh the block through `init-toolkit`, not by copying skill
procedures here. This file doesn't install skills, change host settings or trust,
or guarantee that every host loads it across child repository boundaries.
<!-- personal-toolkit:end -->
