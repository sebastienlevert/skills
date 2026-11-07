# Migrate an ordinary checkout without losing work

Migration is an explicit operation, not a side effect of implementation. Start
from the real primary checkout and registered worktree paths; a folder containing
worktrees is not necessarily a checkout itself.

## Inventory and recovery checkpoint

1. Record the canonical remote, default/current branches, all refs/HEADs,
   registered worktrees, Git-common directory, staged/unstaged/untracked state and
   relevant file hashes. Include ignored files that must move.
2. Confirm the primary checkout is clean on the intended base before safely
   fetching/pulling it. Dirty linked worktrees can be preserved with native
   moves; do not stash or commit another person's work to simplify migration.
3. Inspect destinations and locks. Worktree-specific configuration, submodules,
   symlinks, cross-volume moves or unusual layouts need an explicit supported
   procedure; do not force a simple recipe onto them.
4. Inventory application references to the old paths, including custom skill
   directories, editor/workspace links and running tasks. Record old-to-new
   mappings. Coordinate active use; do not kill processes by name.
5. Retain a verified refs bundle and appropriate local working-file snapshots in
   a separate authorized recovery location. This is not permission to upload
   private code or claim a refs bundle backs up every configuration/reflog.
6. Rehearse the exact procedure in a disposable fixture, including staged,
   unstaged, untracked and ignored data. Do not trial destructive commands on the
   actual repository.

## Conversion sequence

For a supported ordinary primary checkout with a real `.git` directory:

1. Preserve that existing metadata by relocating it to `<container>/.bare`;
   do not replace it with a new remote clone that loses local-only state.
2. Set `core.bare=true` using native Git against that exact metadata directory,
   and create the container's `.git` pointer file (`gitdir: ./.bare`).
3. Use native `git worktree repair` to reconnect existing linked worktrees after
   the common-directory move.
4. Add the actual default branch under `<container>/<default-folder>`.
5. Move registered task worktrees into unique sibling directories inside the
   container with `git worktree move`. Preserve their branch, index and files.
6. Relocate any primary-checkout ignored files deliberately. Remove old source
   duplicates only after verifying they match the new primary checkout and the
   pre-move snapshot. Target individual resolved files and known empty
   directories; never recursively delete the container, metadata or checkout roots.
7. Repair configured source paths using the application's supported registration
   mechanism. Change only mappings actually affected by the move. If old paths
   must be unregistered first, retain a recovery map and restore registrations
   to whichever verified path holds the data after any partial failure.

Do not manually rewrite shared refs or replace registered worktree internals when
native Git can repair them. If a step fails, preserve data and recovery artifacts,
report the actual completed stages, and repair from the observed state rather
than blindly rerunning the whole conversion.

## Verification

Compare all pre/post refs, remote identity, HEADs, tracked/untracked/ignored
content, staged patches and dirty status. Verify every worktree's `.git` pointer
resolves into the new common directory and all referenced skill/resources still
exist. Distinguish an intentional fast-forward of the clean default branch from
an unintended ref change.

Retain recovery artifacts until the owner chooses to remove them. Do not prune
unknown worktrees or delete branches as migration cleanup.
