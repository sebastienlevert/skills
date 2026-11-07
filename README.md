# skills

Personal skills marketplace for coding agent workflows.

## Skills

| Skill | Description |
|-------|-------------|
| **note-taker** | Structured meeting notes with GitHub issue linking |
| **ralph-loop** | Autonomous iterative development using the RALPH technique |
| **md-to-word** | Convert markdown documents to Word (.docx) |
| **paper-strategist** | Interactive strategy paper creation through guided interview |
| **oof** | Out-of-office catch-up assistant for email, Teams, tasks |
| **plugin-generator** | Scaffold new Copilot/Claude plugins with proper marketplace structure |
| **auto-review** | Evidence-backed, stack-neutral PR and local-diff reviews with incremental follow-up |

## Engines

Supports both **GitHub Copilot** and **Claude Code**.

## Installation

```bash
# Copilot CLI
copilot plugin install /path/to/skills

# Claude Code
claude plugin install /path/to/skills
```

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
