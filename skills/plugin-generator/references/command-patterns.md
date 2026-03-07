# Command Patterns

Reference for generating slash commands inside plugins.

## Command File Structure

Commands are markdown files in the `commands/` directory, invoked as slash commands (e.g., `/commit`).

```
commands/
├── command-name.md
└── another-command.md
```

## Command Format

```markdown
---
description: Short description shown in /help
argument-hint: <required-arg> [optional-arg]
allowed-tools: [Bash, Read, Edit, Glob, Grep]
---

# Command Title

## Context
- Current state: !`git status`
- Recent history: !`git log --oneline -5`

## Your task
Based on the above context, [do the thing].
```

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `description` | Yes | One-line description for `/help` |
| `argument-hint` | No | Shows usage pattern: `<required> [optional]` |
| `allowed-tools` | No | Restrict which tools the command can use |
| `model` | No | Override model: `sonnet`, `haiku`, `opus` |
| `disable-model-invocation` | No | If `true`, runs without AI (pure template) |

## Special Variables

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments as a single string |
| `$1`, `$2`, `$3` | Positional arguments |
| `${CLAUDE_PLUGIN_ROOT}` | Absolute path to the plugin directory |
| `` !`command` `` | Inline bash execution (output inserted) |
| `@filename` | Include file contents inline |

## Examples

### Simple command (git commit)

```markdown
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a git commit
---

## Context
- Current git status: !`git status`
- Current git diff: !`git diff HEAD`
- Current branch: !`git branch --show-current`

## Your task
Based on the above changes, create a single git commit with a conventional commit message.
```

### Command with arguments

```markdown
---
description: Search codebase for a pattern
argument-hint: <search-pattern> [--path <dir>]
allowed-tools: [Bash, Read, Glob, Grep]
---

Search the codebase for: $ARGUMENTS

1. Use grep to find all matches
2. Summarize findings grouped by file
3. Highlight the most relevant results
```

## Key Principles

- Commands are **instructions FOR the AI**, not messages to the user
- Keep commands focused on a single task
- Use `allowed-tools` to limit scope when appropriate
- Use inline bash (`` !`command` ``) to inject live context
