---
name: setup-repo
description: >
  Clone or explicitly migrate a repository into a bare Git container with .bare
  metadata, a default-branch checkout such as main, and task worktrees beside it
  inside the container. Use for "setup repo", "clone with worktrees", or "convert
  to bare worktree layout". Preserve refs, local work, remotes and configured
  source paths; never overwrite an existing checkout or delete repository roots.
---

# Set up a worktree repository

Use one named container per repository:

```text
<parent>/<repo-name>/
  .bare/                 Shared Git metadata, objects and refs
  .git                   File pointing to ./.bare
  main/                  Actual default-branch checkout when the branch is main
  <task-name>/           Independent task branch/worktree
```

The task directories are siblings of the default checkout, not nested inside it.
The container is a bare repository, not a working tree: run builds, tests and
source edits in a registered checkout. Discover the actual default branch; use
its appropriate folder name instead of assuming every repository calls it main.

For an owner-grouped Windows project drive, the same layout is:

```text
E:\<owner>\<repo>\
  .bare\
  .git
  main\
  pr-<number>\
  <task-name>\
```

`<parent>` is the authorized owner/project directory, not the repository
container. For a fresh setup, do not substitute `<parent>/<repo>.git` with
`<repo>-main` and `<repo>-pr-<number>` beside it. Both `main` and the PR checkout
belong inside `<parent>/<repo>`, beside `.bare`. "Sibling worktrees" means
siblings within that container, not siblings beside the container.

## 1. Resolve the destination

- Preserve the requested repository, parent directory, default/task branches and
  any existing checkout reference. Respect the user's project drive/location
  conventions. Never put a new repository inside an unrelated checkout.
- Read applicable local instructions and any repository registry before creating
  directories. Resolve the container, `.bare`, default checkout, and requested
  task/PR checkout paths explicitly. If a local rule requires a conflicting
  layout, surface the conflict and obtain a resolution before writing; do not
  silently switch layouts or override higher-priority instructions. Update local
  layout rules only when authorized.
- Prefer a reference to this skill in local `AGENTS.md` files rather than copied
  setup procedures that can drift. Keep machine-specific repository registry
  data local; do not publish it with the reusable skill.
- Verify canonical host/URL and repository name. Use `gh repo view` for GitHub,
  not GitHub MCP; use native Git for other hosts. Confirm the approved account
  and Git authentication method from the registry or user; an active CLI account
  alone doesn't prove Git uses that identity. Do not switch accounts or put
  credentials into commands or reported URLs.
- Choose `<authorized-parent>/<repo-name>`. Inspect the exact path before writing.
  An existing unrelated directory is a blocker, not permission to overwrite it.
- If the requested layout already exists, verify it and refresh safely. Do not
  clone again or create duplicate main/task worktrees.
- An existing checkout or bare store in another layout is not permission to
  create a second clone. Preserve it and obtain explicit migration authorization
  before relocating its metadata or worktrees. A normal clone request or a rule
  correction does not authorize moving existing local work.

### Account verification and local registry

Use the recorded account for that repository, or an account explicitly supplied
or confirmed by the user. Never guess it from the owner or fall back to a
different identity. Don't initiate login, switch accounts or reconfigure
credential storage without authorization.

For GitHub, check `gh auth status --hostname <host>` and
`gh api --hostname <host> user --jq .login`. Separately verify the effective Git
credential helper or SSH identity and read access to the exact approved remote.
URL-scoped helper settings can override a global helper; inspect the effective
setting before declaring a mismatch. Never print credential-fill output.

For Azure DevOps, record the organization, project and approved account. Git
Credential Manager or an approved SSH identity authenticates Git separately from
Azure CLI and `az devops`; `gh` doesn't authenticate Azure DevOps. Preserve the
actual approved method rather than relabeling it.

When a local registry is configured, read it before cloning or resuming. Keep
one row per repository with its provider/owner/repository (and ADO project),
credential-free remote URL, absolute bare path, every registered worktree path
and branch/detached state, actual Git and separate CLI authentication methods,
approved accounts, and last verification date (`YYYY-MM-DD`). Record only
non-secret identifiers, never tokens, passwords, private keys, credential-bearing
URLs or raw authentication output.

Update the affected row immediately after a successful clone and after worktree
creation, authorized migration/removal, account/remote changes or verification.
Preserve unrelated rows and reflect partial completion honestly. Registry
metadata can live outside a worktree; repository edits, installs, builds, tests,
commits, merges, rebases and pulls belong in the task's actual checkout.
Don't adopt unrelated directories or migrate repositories just to populate it.

## 2. Create a fresh container

When the target is absent or an explicitly approved empty directory:

1. Determine the default branch from the remote's symbolic HEAD.
2. Create the absent or approved empty container, then clone the verified
   repository into `<container>/.bare` with `git clone --bare`, not `--mirror`.
   Do not clone a second copy into `main` or use shared-object alternates that
   depend on another disposable checkout. If a local registry is required,
   record the successful clone immediately, even if a later setup step fails.
3. Configure the bare clone's normal fetch mapping so remote-tracking refs stay
   current, then fetch:

   ```text
   git --git-dir=<container>/.bare config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
   git --git-dir=<container>/.bare fetch origin --prune
   ```

4. Create the container's `.git` text file containing `gitdir: ./.bare`.
5. Add the actual default branch as a linked worktree:

   ```text
   git --git-dir=<container>/.bare worktree add <container>/<default-folder> <default-branch>
   ```

6. Configure/verify that checkout's upstream as the corresponding remote branch.
   Refresh it with a safe fast-forward pull when needed. Create a task worktree
   only when requested, from fresh remote state, on its own branch.

### Requested PR checkouts

A request to clone a repository and inspect a PR includes creating the separate
PR checkout, not replacing the default checkout with the PR:

1. Read the PR's actual base/head branches, repositories and commit SHAs.
2. Fetch the exact PR head from the verified remote using its provider-supported
   ref. For GitHub, `refs/pull/<number>/head` on the target repository also covers
   fork PRs. Never assume the PR targets the repository's default branch.
3. Add `<container>/pr-<number>` as a separate review worktree at the fetched
   head, detached or on a dedicated local review branch as the task requires.
   Reuse a verified matching review worktree instead of duplicating it; never
   switch a dirty or unrelated checkout to the PR.
4. Verify the review worktree's HEAD equals the reviewed PR head. Preserve the
   default checkout and record both paths and their actual branch/detached state
   in any required local registry.

Work only in the PR checkout for that review or its authorized follow-ups.
Changes, builds and dependency installations never run in `.bare` or the
container root.

Examples show Git syntax, not literal shell substitutions. Use native filesystem
separators for the host. On PowerShell quote the entire `--git-dir=<path>` or
other `--flag=value` argument. Resolve the verified remote name rather than
assuming an existing repository uses origin.

## 3. Migrate an existing checkout only when authorized

Read [the migration procedure](references/migrate-existing.md). Inventory and
rehearse first; do not treat conversion as a fresh clone that discards local refs.
Preserve dirty linked worktrees, staged/untracked/ignored files, Git configuration
and known application registrations. Use native worktree repair/move operations
and verify hashes/status, not just directory presence.

Stop on an unsafe primary checkout, lock, unsupported configuration, destination
collision or unavailable access. Do not force-delete, stash/reset, kill arbitrary
processes, or move another repository to make the chosen path available.

## 4. Verify and report

- Verify `<container>/.bare` explicitly reports bare, and the container's `.git`
  file resolves to it. The default and requested task/PR directories must report
  working trees and share that same Git-common directory.
- Registered paths, branches, HEADs, upstreams and remote URLs are correct.
- Reconcile any required registry against the credential-free remote URL and
  `git worktree list --porcelain`. Record actual completed paths and branches,
  not intended operations or a successful migration that hasn't occurred.
- `fetch`, `status`, `diff` and normal repository lookup work in the appropriate
  locations. The default checkout is current without discarding local commits.
- No task checkout is nested inside another checkout. Existing work and any
  repaired source registrations match their pre-move evidence.
- Report the layout, primary working directory, task paths and any retained
  recovery artifacts or unfinished operations. Do not call a partial migration
  successful or remove recovery data automatically.

Setup does not implement an issue, install project dependencies, create/merge a PR,
or grant repository permissions.

## Acceptance checks

- Fresh clone yields `<parent>/<repo>/.bare`, the `.git` pointer and the actual
  default checkout inside that repository container, never the flat `.git`
  store plus repository-prefixed worktree layout.
- A clone-and-review request yields `<container>/pr-<number>` beside the default
  checkout, at the exact PR head, even when the PR targets a non-default branch.
- Repeated setup verifies/reuses the layout without duplicate worktrees.
- Conflicting layout instructions are surfaced before filesystem writes, not
  silently resolved into a different layout.
- Existing local refs, dirty linked work, ignored files and registrations survive
  an explicitly approved migration.
- Unknown destinations, locks or unsupported layouts fail without destructive repair.
