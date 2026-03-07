---
name: plugin-generator
description: Scaffold new plugins for Copilot and Claude Code marketplaces. Use when the user wants to "create a plugin", "scaffold a plugin", "generate a new plugin", "start a new marketplace plugin", "build a copilot plugin", "make a claude plugin", or needs help structuring a plugin with skills, commands, agents, hooks, or MCP servers.
---

# Plugin Generator

Scaffold complete, well-structured plugins for Copilot CLI and Claude Code marketplaces.

## Workflow

### Step 1: Gather Requirements

Ask the user:
1. **Plugin name** — lowercase with hyphens (e.g., `my-awesome-plugin`)
2. **Description** — what does this plugin do?
3. **Target engines** — copilot, claude, or both?
4. **Components needed** — which of: skills, commands, agents, hooks, MCP servers?
5. **Category** — one of: productivity, development, devops, debugging, code-review, security, testing, design, database, learning, other

### Step 2: Determine Context

Check if scaffolding inside an existing marketplace or as a standalone plugin:

**Inside a marketplace** (a parent `.claude-plugin/marketplace.json` exists):
- Create the plugin directory under `plugins/`
- Register the plugin in the parent `marketplace.json`

**Standalone plugin** (no parent marketplace):
- Create a self-contained plugin with its own `.claude-plugin/` directory
- Generate both `marketplace.json` and `plugin.json`

### Step 3: Generate the Plugin Structure

Create the full directory structure based on requirements.

#### Base structure (always created):

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json
├── agency.json
├── README.md
└── skills/
    └── [skill-name]/
        └── SKILL.md
```

#### Additional directories based on components:

- **Commands**: `commands/command-name.md`
- **Agents**: `agents/agent-name.md`
- **Hooks**: `hooks/hooks.json` + `hooks/hook-script.py`
- **MCP servers**: `.mcp.json` at plugin root

### Step 4: Generate Config Files

#### plugin.json

```json
{
  "name": "plugin-name",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": {
    "name": "Author Name",
    "email": "author@example.com"
  },
  "keywords": ["relevant", "keywords"],
  "license": "MIT"
}
```

#### agency.json

```json
{
  "engines": ["copilot", "claude"],
  "category": "productivity"
}
```

#### marketplace.json (if standalone)

```json
{
  "name": "marketplace-name",
  "metadata": {
    "description": "Marketplace description",
    "version": "1.0.0"
  },
  "owner": {
    "name": "Owner Name",
    "email": "owner@example.com"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./",
      "description": "Plugin description",
      "version": "1.0.0",
      "author": { "name": "Author Name" },
      "keywords": ["..."],
      "category": "productivity"
    }
  ]
}
```

### Step 5: Generate Component Templates

For each requested component, generate the appropriate files using the patterns described in the reference files:

- **Skills**: See [references/skill-patterns.md](references/skill-patterns.md)
- **Commands**: See [references/command-patterns.md](references/command-patterns.md)
- **Agents, Hooks, MCP**: See [references/advanced-patterns.md](references/advanced-patterns.md)

### Step 6: Register in Marketplace

If inside a marketplace, add the plugin entry to the parent `marketplace.json`:

```json
{
  "name": "plugin-name",
  "source": "./plugins/plugin-name",
  "description": "...",
  "version": "1.0.0",
  "author": { "name": "..." },
  "keywords": ["..."],
  "category": "..."
}
```

Include `"strict": true` if the plugin should be strictly validated.

### Step 7: Verify

After scaffolding:
1. Confirm all JSON files are valid
2. Confirm all SKILL.md files have proper YAML frontmatter with `name` and `description`
3. Confirm directory structure matches the expected pattern
4. List created files for user review
