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
| **new-issue** | Research and file focused, evidence-backed issues without starting implementation |
| **new-epic** | Scope product outcomes, priorities, and approved child issues |
| **new-spec** | Author project-native contracts in isolated worktrees and deliver draft PRs |
| **implement** | Refresh the base, implement in a sibling worktree, validate, and open a draft PR |
| **plugin-generator** | Scaffold new Copilot/Claude plugins with proper marketplace structure |

## Authoring and delivery workflows

These workflows work with any project and follow its own instructions, templates,
technology stack and checks. Issue/epic creation does not start implementation.
Persisted specs and implementation use dedicated task worktrees, refresh latest
remote state, and finish with draft PRs. Follow-ups reuse the same worktree and PR;
dirty base checkouts are never overwritten.

To register the individual skills personally in Copilot CLI from a persistent
checkout (use your platform's native path separators):

```text
copilot skill add <checkout>/skills/new-issue
copilot skill add <checkout>/skills/new-epic
copilot skill add <checkout>/skills/new-spec
copilot skill add <checkout>/skills/implement
copilot skill list
```

Use `/skills reload` in existing sessions. Each skill includes its own workflow
and behavioral acceptance checks:
[new-issue](skills/new-issue/SKILL.md),
[new-epic](skills/new-epic/SKILL.md),
[new-spec](skills/new-spec/SKILL.md), and
[implement](skills/implement/SKILL.md).

## Engines

Supports both **GitHub Copilot** and **Claude Code**.

## Installation

```bash
# Copilot CLI
copilot plugin install /path/to/skills

# Claude Code
claude plugin install /path/to/skills
```
