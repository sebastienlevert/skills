# Skill Patterns

Reference for generating well-structured skills inside plugins.

## SKILL.md Structure

Every skill requires a `SKILL.md` with YAML frontmatter and markdown body:

```markdown
---
name: skill-identifier
description: >
  Clear description of what the skill does AND when to use it.
  Include trigger phrases: "create a widget", "build a widget", "widget help".
---

# Skill Title

Instructions for the AI agent when this skill triggers.
```

## Frontmatter Rules

- `name` (required): lowercase with hyphens
- `description` (required): must include both purpose AND trigger conditions
- No other fields needed (keep it minimal)

### Description Best Practices

The description is the **only thing the AI reads to decide when to invoke the skill**. Make it comprehensive:

```yaml
# Good — lists what it does + when to trigger
description: >
  Create and manage database migrations. Use when the user asks to
  "create a migration", "add a column", "modify the schema", or
  needs help with database schema changes.

# Bad — too vague, won't trigger reliably
description: Database migration helper
```

## Body Guidelines

- Write instructions FOR the AI agent (imperative form)
- Keep under 500 lines; split into reference files if larger
- Use progressive disclosure: core workflow in SKILL.md, details in `references/`
- Only add context the AI doesn't already have

## Directory Structure

```
skill-name/
├── SKILL.md          # Required
├── references/       # Optional: docs loaded on demand
│   └── patterns.md
├── scripts/          # Optional: executable code
│   └── helper.py
└── assets/           # Optional: files used in output
    └── template.html
```

## Multi-Step Workflow Pattern

```markdown
## Workflow

### Step 1: Gather Input
Ask the user for [specific inputs].

### Step 2: Analyze
Check [conditions] and determine [approach].

### Step 3: Execute
[Perform the work using tools].

### Step 4: Verify
Confirm [expected outcomes].
```

## Conditional Workflow Pattern

```markdown
## Workflow

### Step 1: Determine Type
Ask the user what kind of [thing] they need.

**Option A** → Follow "Path A" below
**Option B** → Follow "Path B" below

### Path A: [Description]
[Steps specific to option A]

### Path B: [Description]
[Steps specific to option B]
```

## Reference File Pattern

When a skill supports multiple variants, keep selection logic in SKILL.md and details in references:

```markdown
# SKILL.md
Based on the user's choice:
- **React**: See [references/react.md](references/react.md)
- **Vue**: See [references/vue.md](references/vue.md)
- **Svelte**: See [references/svelte.md](references/svelte.md)
```
