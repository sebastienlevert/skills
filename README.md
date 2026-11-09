# Personal Skills Marketplace

Reusable workflows for **GitHub Copilot CLI**, **Claude Code**, and **Codex**.
Install the `personal-toolkit` plugin from the `skills` marketplace, or use
individual skill directories when you want a smaller local setup.

The same [`skills/`](skills) content is packaged for all three hosts. Installation
does not run a workflow, grant access, or start a schedule. Skills guide the host;
its permissions, available tools, and the target project's rules still apply.

## Quick install

Run the commands for your host in a terminal:

| Host | Register the marketplace | Install the toolkit |
|---|---|---|
| Copilot CLI | `copilot plugin marketplace add sebastienlevert/skills` | `copilot plugin install personal-toolkit@skills` |
| Claude Code | `claude plugin marketplace add sebastienlevert/skills` | `claude plugin install personal-toolkit@skills` |
| Codex | `codex plugin marketplace add sebastienlevert/skills` | `codex plugin add personal-toolkit@skills` |

Use a current host version with the commands above. Run `<host> plugin --help`
if your installed version does not recognize them. Codex uses **`plugin add`**,
not `plugin install`; this is a native Codex marketplace, not a Claude command
presented as Codex support.

Restart an existing agent session after installing. See [verification](#verify-installation)
and [local preview](#install-from-a-local-checkout) below.

## What's included

| Skill | Purpose | Important prerequisites or boundaries |
|---|---|---|
| [new-issue](skills/new-issue/SKILL.md) | Research, deduplicate, draft, or file an actionable issue. | Authenticated `gh`; creates only the authorized issue, not implementation. |
| [setup-repo](skills/setup-repo/SKILL.md) | Set up a bare Git container with main/default and sibling task worktrees inside it. | Existing-repo conversion is explicit and preserves local work and configured paths. |
| [factory](skills/factory/SKILL.md) | Select an eligible issue and run a bounded delivery/review/feedback loop. | Modes draft/ready/merge; merge requires high evidence-backed confidence and normal repository enforcement. |
| [new-epic](skills/new-epic/SKILL.md) | Define outcomes, priorities, scope boundaries, and approved child issues. | Authenticated `gh`; no speculative bulk creation or silent reparenting. |
| [new-spec](skills/new-spec/SKILL.md) | Create or update a project-native behavioral contract. | Git and `gh`; persisted work uses an isolated worktree and draft PR. |
| [new-adr](skills/new-adr/SKILL.md) | Record architectural alternatives, decisions, and consequences. | Project-native conventions; proposed decisions are not automatically accepted or implemented. |
| [investigate](skills/investigate/SKILL.md) | Establish root cause and a bounded correction plan. | Advisory by default; no source fixes, dependency installs or automatic posting. |
| [test-plan](skills/test-plan/SKILL.md) | Derive focused verification from a task or actual diff. | Standalone use runs no tests; included as a brief step in implementation. |
| [implement](skills/implement/SKILL.md) | Deliver a scoped change through validation and a draft PR. | Git, `gh`, and the target project's tools; no automatic merge. |
| [triage](skills/triage/SKILL.md) | Decide which review concerns to fix, clarify, defer, or reject with evidence. | Advisory by default; corrections and GitHub side effects require authorization. |
| [address-pr-feedback](skills/address-pr-feedback/SKILL.md) | Resolve conflicts and finish authorized review fixes through code, evidence replies, and thread resolution. | Push and verify fixes first; close only fully addressed native threads, never the PR itself. |
| [prepare-pr](skills/prepare-pr/SKILL.md) | Assess review readiness without repeating a full pipeline. | Reuses current validation; assessment changes no code or PR state. |
| [paper-strategist](skills/paper-strategist/SKILL.md) | Write decision-ready papers and matching content-first HTML. | Offline template, light/dark mode, floating TOC, read time, SVG-only visuals; no build dependencies. |
| [research-brief](skills/research-brief/SKILL.md) | Produce source-grounded market, competitive, customer or technical research. | Uses authorized available sources; facts, claims, inference and unknowns remain distinct. |
| [auto-review](skills/auto-review/SKILL.md) | Review PRs, local changes, and follow-up fixes across stacks. | Read-only by default; posting and recurring sweeps require an explicit request. |
| [post-pr-comments](skills/post-pr-comments/SKILL.md) | Publish reviewed findings inline at their exact PR diff locations. | Authenticated `gh`; explicit posting, current-head verification, deduplication and verified delivery; no implicit approval or resolution. |

Marketplace compatibility means the host can install and discover the toolkit.
It does not make a host-specific tool or external integration available everywhere.
Use only authorized capabilities actually provided by your host.

Version 2 removes the legacy `ralph-loop`, `oof`, `md-to-word`, `note-taker`, and
`plugin-generator` skills. The upgraded `paper-strategist` remains included.
Older versions remain available in Git history, but updates no longer bundle
those five workflows.

## Use the skills

Explicit invocation differs by host:

| Host | Find and invoke a skill |
|---|---|
| Copilot CLI | Use `/skills list` and select the skill, or ask by name, such as "Use new-issue to draft an issue for this bug." |
| Claude Code | Plugin skills are namespaced, for example `/personal-toolkit:new-issue`. |
| Codex | Use `/skills` or mention `$new-issue` in your prompt. |

Examples of requests:

```text
Use new-issue to draft an issue describing this bug. Do not publish it yet.
Use setup-repo to clone owner/repo into my project directory with .bare and main/task checkouts.
Use factory for owner/repo --mode draft to deliver the next eligible issue.
Use factory for owner/repo#123 --mode merge to close the loop only when the required evidence, checks, and reviews permit it.
Use new-epic to propose a small preview and a prioritized requirements table.
Use new-spec to persist a focused spec in this repository and open a draft PR.
Use investigate to understand this failure without changing code.
Use new-adr to record this decision and its alternatives as Proposed.
Use implement to fix owner/repo#123, preserving existing behavior.
Use triage to assess these review comments before we change anything.
Use address-pr-feedback to fix the feedback on owner/repo#123, push verified changes, reply with evidence, and resolve addressed threads.
Use prepare-pr to assess this draft without marking it ready.
Use post-pr-comments to publish the reviewed findings inline on owner/repo#123.
```

Specify the repository when it is not the current project. Supply the actual
problem or desired outcome, not only a skill name.

### Planning is not implementation

- `new-issue` files only the requested issue; a draft request publishes nothing.
- `new-epic` keeps proposals, approved scope, existing work, and newly created
  child issues distinct.
- `new-spec` follows the project's existing contract and document conventions;
  it does not invent a spec for every small fix.
- `implement` executes the authorized task rather than returning a launch command.

### Research and rich papers

`research-brief` starts from the decision or question, verifies original sources,
compares options fairly, and makes evidence gaps explicit. It answers in chat
unless an artifact is requested; it does not publish or implement automatically.

`paper-strategist` turns that evidence into a clear thesis, alternatives, a
mechanism, proof/signals and a decision ask. It asks only material missing
questions rather than imposing a fixed interview.

The [HTML template](skills/paper-strategist/assets/paper.html) opens directly in a
browser. It is neutral, modern and content-first, with:

- System-aware light/dark mode and a manual override.
- A compact floating/collapsible TOC generated from actual headings.
- Estimated reading time, prose word count, and a thin progress indicator.
- Responsive layout, keyboard access, reduced motion and clean print styling.
- Inline SVG-only visuals; no raster assets, fonts, CDNs, tracking or build step.

Markdown remains the editable source. The skill replaces template preview content
with matching paper content; it is not a general Markdown renderer. Theme storage
is best-effort, and the narrative/native links remain readable without JavaScript.
See the [HTML visual contract](skills/paper-strategist/references/html-style.md).
Generation does not authorize uploading or sharing the paper.

### A lightweight development lifecycle

```text
new-issue -> investigate (when needed) -> new-spec / new-adr (when warranted)
          -> implement [brief test-plan -> change -> validate -> prepare-pr]
          -> draft PR -> auto-review / triage (when requested)
```

The arrows describe useful combinations, not mandatory stages for every task.
An obvious fix does not need an investigation, spec, ADR, or a separate review
session. `implement` includes a brief test plan and a final readiness pass; it
reuses evidence and does not run two pipelines just because both skills exist.
Rerun checks when relevant code, inputs or integration change, or project policy
requires it.

Standalone `test-plan` only plans. Standalone `prepare-pr` only assesses unless
the user requests fixes or readying. In implementation, readiness remains
advisory and the PR stays a draft. `triage` preserves the disposition of each
finding instead of blindly applying or dismissing feedback.

`post-pr-comments` publishes findings only when requested. It maps each concern
to the relevant changed lines, rechecks the PR revision, avoids duplicate threads
and reads the posted comments back from GitHub. A summary with file links isn't
an inline review; approval, request-changes and thread resolution are separate
permissions.

For an authorized end-to-end correction, `address-pr-feedback` goes further:
it safely integrates the base when needed, fixes and validates code, pushes to
the same PR branch, replies to each concern with actual commit/test evidence, then
resolves only fully addressed native review threads. A posted reply alone is not
a fix. Partial, disputed or blocked concerns stay open; ordinary PR comments have
no native thread-resolution state. Conflict-only requests do not trigger unrelated
feedback replies or resolutions.

### Worktrees and draft PRs

Persisted spec, ADR, and implementation workflows:

1. Fetch latest remote state and safely fast-forward the clean base checkout.
2. Create a dedicated branch and sibling worktree from the refreshed base.
3. Preserve dirty/shared/diverged checkouts rather than resetting or stashing them.
4. Follow the target project's stack, tests, formatting and contribution rules.
5. Validate and review the exact changed revision, then push and open a **draft PR**.
6. Reuse the same task's worktree and PR for follow-ups.

A default branch name, framework, account, model, or numeric coverage threshold
is not hardcoded. These workflows never merge or mark a draft ready.

### Bare container layout

`setup-repo` uses one container per repository:

```text
<project-parent>/<repo-name>/
  .bare/
  .git
  main/
  <task-worktree>/
```

The branch folder follows the actual default branch when it is not main.
Task worktrees are siblings of that checkout **within the container**, never
nested inside the source checkout. The container is not a build directory.
Existing checkout conversion requires an explicit migration request, recovery
checkpoints, native Git repair/move operations and verification of local work and
registered source paths.

An owner-grouped Windows example is `E:\owner\repo\.bare`, with
`E:\owner\repo\main` and `E:\owner\repo\pr-123` beside it. A new setup doesn't use
`E:\owner\repo.git` with repository-prefixed worktrees at the owner level.
Conflicting local layout rules must be resolved before writing; changing a rule
doesn't authorize migrating existing repositories.

### Factory modes

`factory` is a thin router that invokes the owning skills for one issue and up
to two correction cycles by default. `triage` owns backlog selection;
`implement`, `auto-review`, `address-pr-feedback` and `prepare-pr` own delivery,
review, corrections and readiness. It does not duplicate their logic.
Investigation, specs and ADRs remain conditional; test planning is reused from
implementation rather than repeated. A missing required skill is a visible
dependency, not a silent fallback pipeline.

| Mode | Final authority |
|---|---|
| `draft` | Implement, validate, review and address scoped feedback; create a draft and preserve an existing PR's state. |
| `ready` | Also mark ready when the project's conditions pass. No approval or merge. |
| `merge` | Also approve when eligible and merge normally only with high evidence-backed confidence and required checks/reviews satisfied. |

Implementation still initially produces a draft. Only the explicit factory mode
permits later state changes. No mode bypasses protection, self-approves, invents
confidence percentages, or treats queue admission as a completed merge. Own PRs
follow the actual independent-approval requirements; an approval cannot be
manufactured by changing accounts. Worktree cleanup remains separate.

## Prerequisites and authorization

- Install and authenticate the host you intend to use.
- Install Git for repository workflows and GitHub CLI (`gh`) for the new
  issue/epic/spec/implementation workflows. Verify access with `gh auth status`.
- Install the target project's own tools only as that project requires.
- Configure any research sources separately when needed. The toolkit does not
  bundle credentials, MCP servers, or services.
- Review a skill before using it. Instructions do not bypass native permission
  prompts, tenant restrictions, or repository policy.

The repository is a plugin distribution, not an npm package. You do not need
`npm install`, Python, or .NET simply to install its instruction files. Particular
skills can have additional requirements listed above.

## Verify installation

```text
# Copilot CLI
copilot plugin list --json
copilot skill list --json

# Claude Code
claude plugin marketplace list

# Codex
codex plugin marketplace list --json
codex plugin list --json
```

Look for `personal-toolkit@skills` and the toolkit's skills in the installed
plugin inventory. Claude's marketplace list confirms catalog registration; open
`/plugin` in a Claude session to inspect installed plugins, and use the command
selector to find the `personal-toolkit` namespace. This also works with older
Claude versions that do not provide `claude plugin list`. In Codex, check `/skills`.

If installed by marketplace and also registered individually, the same skill may
appear more than once. Choose one installation method per host; do not remove a
personal registration until you know which directory it points to.

### Auto-review

Use `auto-review` to review a PR, local changes, or fixes to previous findings.
It checks compatibility and proportionate complexity, applies change-specific
lenses, and returns consolidated findings. Posting and recurring sweeps require
an explicit request; the skill never merges PRs.

To make only this skill available personally in Copilot CLI, register its
directory from a persistent checkout:

```text
copilot skill add <checkout>/skills/auto-review
copilot skill list
```

Restart or run `/skills reload` in an existing session after installation.
The [skill](skills/auto-review/SKILL.md) includes the workflow and a
[re-review reference](skills/auto-review/references/re-review.md) with behavioral
acceptance scenarios. There are no language-specific tool dependencies; GitHub
reviews use the authenticated `gh` CLI.

## Install from a local checkout

Use this to test unmerged work, a selected branch, or unpublished edits. Clone
into a persistent project directory using your usual drive/location conventions:

```text
gh repo clone sebastienlevert/skills
```

From inside that checkout:

```text
# Copilot CLI
copilot plugin marketplace add .
copilot plugin install personal-toolkit@skills

# Codex
codex plugin marketplace add .
codex plugin add personal-toolkit@skills
```

For Claude Code, local source parsing varies by version and operating system.
Older Windows versions can validate a local marketplace while rejecting native
drive-qualified and relative paths when adding it. Use the GitHub installation
above, or preview a pushed branch (replace `your-branch`):

```text
claude plugin marketplace add "https://github.com/sebastienlevert/skills.git#your-branch"
claude plugin install personal-toolkit@skills
```

On clients that accept local marketplace paths, pass the local root using the
syntax documented by that installed version's `plugin marketplace add` command.
Do not treat successful manifest validation alone as a successful installation.

The marketplace's name is still `skills`. Do not register a local copy with that
name alongside an already registered remote copy; inspect/remove the old source
first if you intend to switch. Use your host's supported update/reinstall flow
after editing; cached plugin copies need not follow live checkout changes.

For Copilot-only development without installing, load the checkout as an
external plugin:

```text
copilot --plugin-dir . plugin list --json
copilot --plugin-dir . skill list --json
```

### Install only selected skills

For Copilot CLI, register a persistent individual directory:

```text
copilot skill add <checkout>/skills/new-issue
copilot skill list
```

Use your platform's native separators for filesystem paths. Run `/skills reload`
in an existing Copilot session, or start a new one.

For Codex, ask its built-in `$skill-installer` to install a named skill directory
from this GitHub repository. Alternatively, place the complete skill folder under
your personal `.agents/skills` directory. For Claude Code, place the complete
folder in your personal `.claude/skills` directory. Keep any accompanying
references, templates, and assets; copying only `SKILL.md` can break a skill.

Standalone skills are not automatically updated by marketplace commands.

## Update and uninstall

### Copilot CLI

```text
copilot plugin marketplace update skills
copilot plugin update personal-toolkit@skills

# Remove the plugin, then optionally its catalog.
copilot plugin uninstall personal-toolkit@skills
copilot plugin marketplace remove skills
```

### Claude Code

```text
claude plugin marketplace update skills
claude plugin update personal-toolkit@skills

claude plugin uninstall personal-toolkit@skills
claude plugin marketplace remove skills
```

### Codex

```text
codex plugin marketplace upgrade skills
codex plugin add personal-toolkit@skills

codex plugin remove personal-toolkit@skills
codex plugin marketplace remove skills
```

For Codex, refresh the marketplace snapshot and run `plugin add` to install the
selected snapshot. Restart sessions after updates. Local marketplace changes may
require reinstalling the plugin; a catalog refresh alone is not proof that a
running session has reloaded its instructions.

Removing the toolkit does not uninstall Git, `gh`, or other external tools. Removing
a marketplace can affect every plugin installed from it; this catalog currently
contains one plugin.

## Repository layout

```text
plugin.json                       Portable Agent Plugins manifest
.github/plugin/marketplace.json   Copilot marketplace
.claude-plugin/marketplace.json   Claude marketplace (real file, not a symlink)
.claude-plugin/plugin.json        Claude-compatible plugin manifest
.agents/plugins/marketplace.json  Codex marketplace
.codex-plugin/plugin.json         Codex-compatible plugin manifest
agency.json                       Legacy catalog engine metadata
skills/<name>/SKILL.md            Shared skill instructions and local resources
scripts/validate-marketplace.mjs  Dependency-free packaging checks
tests/marketplace.test.mjs         Packaging regression tests
```

The marketplace is named `skills`; its one plugin is named `personal-toolkit`.
Both names form the installation ID **`personal-toolkit@skills`**. Native catalog
formats differ, but each points to the same repository-root plugin and shared
skill directories. No symlink privileges are required for marketplace metadata.

## Contribute or add a skill

1. Follow applicable repository instructions and use a dedicated branch/worktree.
2. Add `skills/<name>/SKILL.md` with YAML frontmatter containing `name` and
   `description`; keep the name aligned with the directory.
3. Keep the skill scoped, preserve user authorization, and avoid fixed project
   paths, private references, credentials, or mandatory model/delegation choices.
4. Add needed references inside the skill directory and list the skill above.
5. Keep manifest identities, versions and descriptions synchronized across hosts.
   The Copilot and Claude marketplace catalogs should be identical JSON.
6. Run packaging checks and tests:

   ```text
   node scripts/validate-marketplace.mjs
   node --test
   git diff --check
   ```

7. Where available, validate Claude's native manifests:

   ```text
   claude plugin validate .
   claude plugin validate .claude-plugin/plugin.json
   ```

8. Test installation/discovery in the hosts you claim to support, using isolated
   configuration directories rather than replacing your normal setup. Open a
   draft PR with actual validation results and limitations.

The static checks do not prove that a skill's complete workflow works in every
host. Test affected workflow behavior separately. Do not execute real issues,
PRs, email actions, or autonomous loops just to test marketplace discovery.

## Troubleshooting

| Symptom | Check |
|---|---|
| Marketplace cannot be found | Confirm the repository is accessible with the selected host's Git credentials; use a local checkout to test unpublished work. |
| Plugin cannot be found | Register the catalog first and use `personal-toolkit@skills`, not the repository name as the plugin name. |
| Codex rejects `plugin install` | Use `codex plugin add`; check `codex plugin --help` and update an older client if needed. |
| Claude rejects a Windows local marketplace path | Use the GitHub source or a pushed branch; older local-source parsers do not recognize every native Windows path form. |
| Skills do not appear | Verify the installed plugin and skill selector; restart the session and check disabled skills/plugins or organizational restrictions. |
| Old content remains after an update | Refresh the catalog, update/reinstall the cached plugin, then restart. Verify which checkout or ref supplies the content. |
| Duplicate skills appear | Inspect standalone/custom registrations as well as installed plugins; remove only the redundant installation you selected. |
| A skill cannot access GitHub or M365 | Authenticate/configure its external tools. Marketplace installation does not supply service permissions. |
| Windows checkout lacks symlink privileges | Marketplace metadata uses real files; no symlink setup is needed for these catalogs. |

## Format references

- [Copilot plugin authoring](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
- [Claude marketplace authoring](https://code.claude.com/docs/en/plugin-marketplaces)
- [Codex plugin and marketplace packaging](https://developers.openai.com/plugins/build/plugins)
- [Codex skills](https://developers.openai.com/codex/skills/)
- [Agent Skills standard](https://agentskills.io/specification)
