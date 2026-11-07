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
| [new-epic](skills/new-epic/SKILL.md) | Define outcomes, priorities, scope boundaries, and approved child issues. | Authenticated `gh`; no speculative bulk creation or silent reparenting. |
| [new-spec](skills/new-spec/SKILL.md) | Create or update a project-native behavioral contract. | Git and `gh`; persisted work uses an isolated worktree and draft PR. |
| [implement](skills/implement/SKILL.md) | Deliver a scoped change through validation and a draft PR. | Git, `gh`, and the target project's tools; no automatic merge. |
| [note-taker](skills/note-taker/SKILL.md) | Capture structured meetings, one-on-ones, and action items. | File access; GitHub access when filing linked action items. |
| [paper-strategist](skills/paper-strategist/SKILL.md) | Develop a strategy paper through an interview and revision process. | File access; no external service required by the skill itself. |
| [md-to-word](skills/md-to-word/SKILL.md) | Convert Markdown into a Word document. | .NET and the `SpecWorks.MarkMyWord.CLI` tool (`markmyword`), installed separately. |
| [oof](skills/oof/SKILL.md) | Prepare an out-of-office catch-up from workplace activity. | An authorized WorkIQ connection and access to the relevant M365 data. |
| [plugin-generator](skills/plugin-generator/SKILL.md) | Scaffold plugin projects and reusable skills. | Check generated metadata against your host's current format; legacy examples target Copilot/Claude. |
| [ralph-loop](skills/ralph-loop/SKILL.md) | Run an iterative development loop with persisted progress. | Requires Copilot CLI and Git, even when invoked from Claude or Codex; review its autonomous execution behavior first. |

Marketplace compatibility means the host can install and discover the toolkit.
It does not make a host-specific tool or external integration available everywhere.
Some legacy skills describe particular tool names; use only equivalent,
authorized capabilities actually provided by your host.

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
Use new-epic to propose a small preview and a prioritized requirements table.
Use new-spec to persist a focused spec in this repository and open a draft PR.
Use implement to fix owner/repo#123, preserving existing behavior.
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

### Worktrees and draft PRs

Persisted spec and implementation workflows:

1. Fetch latest remote state and safely fast-forward the clean base checkout.
2. Create a dedicated branch and sibling worktree from the refreshed base.
3. Preserve dirty/shared/diverged checkouts rather than resetting or stashing them.
4. Follow the target project's stack, tests, formatting and contribution rules.
5. Validate and review the exact changed revision, then push and open a **draft PR**.
6. Reuse the same task's worktree and PR for follow-ups.

A default branch name, framework, account, model, or numeric coverage threshold
is not hardcoded. These workflows never merge or mark a draft ready.

## Prerequisites and authorization

- Install and authenticate the host you intend to use.
- Install Git for repository workflows and GitHub CLI (`gh`) for the new
  issue/epic/spec/implementation workflows. Verify access with `gh auth status`.
- Install the target project's own tools only as that project requires.
- Configure optional dependencies only for skills you use, such as WorkIQ or
  `markmyword`. The toolkit does not bundle credentials, MCP servers, or services.
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

Removing the toolkit does not uninstall Git, `gh`, .NET tools, or WorkIQ. Removing
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
   node --test tests/marketplace.test.mjs
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
| A Markdown or Word workflow fails | Check the skill's optional tools and file-access requirements; not every workflow is dependency-free. |
| Windows checkout lacks symlink privileges | Marketplace metadata uses real files; no symlink setup is needed for these catalogs. |

## Format references

- [Copilot plugin authoring](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
- [Claude marketplace authoring](https://code.claude.com/docs/en/plugin-marketplaces)
- [Codex plugin and marketplace packaging](https://developers.openai.com/plugins/build/plugins)
- [Codex skills](https://developers.openai.com/codex/skills/)
- [Agent Skills standard](https://agentskills.io/specification)
