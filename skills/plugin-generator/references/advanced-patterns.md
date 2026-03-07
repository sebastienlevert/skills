# Advanced Patterns

Reference for agents, hooks, and MCP server configurations inside plugins.

## Agents

Agents are autonomous AI sub-processes defined as markdown files in `agents/`.

### Agent File Structure

```
agents/
├── agent-name.md
└── another-agent.md
```

### Agent Format

```markdown
---
name: agent-identifier
description: |
  Use this agent when the user asks to [trigger condition].

  <example>
  Context: [situation]
  user: "[what the user says]"
  assistant: "[response before invoking agent]"
  <commentary>[why this triggers the agent]</commentary>
  </example>

model: sonnet
color: blue
tools: ["Read", "Bash", "Edit"]
---

# Agent System Prompt

You are a specialized agent that [does X].

## Your Role
[Detailed instructions for the agent]

## Process
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Quality Standards
- [Standard 1]
- [Standard 2]
```

### Agent Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Lowercase with hyphens |
| `description` | Yes | Trigger conditions + examples |
| `model` | No | `inherit`, `sonnet`, `haiku`, `opus` |
| `color` | No | Terminal color: blue, cyan, green, yellow, red, magenta |
| `tools` | No | List of allowed tools |

### Color Conventions

| Color | Semantic Meaning |
|-------|-----------------|
| blue/cyan | Analysis, review, investigation |
| green | Generation, creation, building |
| yellow | Validation, caution, warnings |
| red | Security, critical, dangerous |
| magenta | Transformation, creative work |

---

## Hooks

Hooks run automatically on specific events (no user invocation needed).

### Hook File Structure

```
hooks/
├── hooks.json          # Hook configuration
├── pretooluse.py       # Hook script
└── posttooluse.py      # Hook script
```

### hooks.json Format

```json
{
  "description": "What these hooks do",
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PLUGIN_ROOT}/hooks/pretooluse.py",
            "timeout": 10
          }
        ],
        "matcher": "Edit|Write|MultiEdit"
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PLUGIN_ROOT}/hooks/posttooluse.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

### Hook Event Types

| Event | When it fires |
|-------|--------------|
| `PreToolUse` | Before a tool executes |
| `PostToolUse` | After a tool completes |
| `Stop` | When the agent finishes |
| `UserPromptSubmit` | When user submits a prompt |

### Matcher Patterns

Restrict hooks to specific tools: `"matcher": "Edit|Write|MultiEdit"`

Without a matcher, the hook runs on every tool invocation for that event type.

### Hook Script I/O

Hook scripts receive JSON on stdin and return JSON on stdout:

```python
#!/usr/bin/env python3
import json, sys

event = json.loads(sys.stdin.read())
tool_name = event.get("tool_name", "")
tool_input = event.get("tool_input", {})

# Return: decision + optional message
result = {
    "decision": "allow",  # or "block"
    "reason": "Optional message to show"
}
print(json.dumps(result))
```

---

## MCP Servers

MCP (Model Context Protocol) servers extend AI capabilities with external tools.

### .mcp.json Format

Place `.mcp.json` at the plugin root:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/name@latest", "mcp"],
      "tools": ["*"]
    }
  }
}
```

### Server Types

#### stdio (local process)

```json
{
  "server-name": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/server.js"],
    "tools": ["*"]
  }
}
```

#### HTTP (remote)

```json
{
  "server-name": {
    "type": "http",
    "url": "https://api.example.com/mcp/",
    "headers": {
      "Authorization": "Bearer ${API_TOKEN}"
    }
  }
}
```

#### HTTP with OAuth

```json
{
  "server-name": {
    "type": "http",
    "url": "https://mcp.service.com/mcp",
    "oauth": {
      "clientId": "your-client-id",
      "callbackPort": 3118
    }
  }
}
```

### Environment Variables

Use `${VAR_NAME}` in MCP configs for secrets. Never hardcode tokens or credentials.
