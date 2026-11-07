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

## 1. Resolve the destination

- Preserve the requested repository, parent directory, default/task branches and
  any existing checkout reference. Respect the user's project drive/location
  conventions. Never put a new repository inside an unrelated checkout.
- Verify canonical host/URL and repository name. Use `gh repo view` for GitHub,
  not GitHub MCP; use native Git for other hosts. Do not switch accounts or put
  credentials into commands or reported URLs.
- Choose `<authorized-parent>/<repo-name>`. Inspect the exact path before writing.
  An existing unrelated directory is a blocker, not permission to overwrite it.
- If the requested layout already exists, verify it and refresh safely. Do not
  clone again or create duplicate main/task worktrees.
- Converting an ordinary checkout requires an explicit migration request. A
  normal clone request does not authorize relocating existing local work.

## 2. Create a fresh container

When the target is absent or an explicitly approved empty directory:

1. Determine the default branch from the remote's symbolic HEAD.
2. Clone the verified repository into `<container>/.bare` with `git clone --bare`.
   Do not clone a second copy into `main` or use shared-object alternates that
   depend on another disposable checkout.
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

- Container reports bare; the default and task directories report working trees.
- Registered paths, branches, HEADs, upstreams and remote URLs are correct.
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

- Fresh clone yields one shared bare store and the actual default checkout.
- Repeated setup verifies/reuses the layout without duplicate worktrees.
- Existing local refs, dirty linked work, ignored files and registrations survive
  an explicitly approved migration.
- Unknown destinations, locks or unsupported layouts fail without destructive repair.
