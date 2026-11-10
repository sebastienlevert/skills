---
name: init-toolkit
description: >
  Explicitly initialize or refresh a selected folder or drive as a personal-toolkit
  workspace. Install the bundled AGENTS.md routing template while preserving
  existing instructions and local registry data. Use only when the user explicitly
  invokes init-toolkit; never infer initialization from ordinary repository work.
user-invocable: true
disable-model-invocation: true
---

# Initialize a personal-toolkit workspace

Run only when the user explicitly invokes this skill. A request to clone, review,
implement, or work in a folder isn't permission to initialize it. The invocation
metadata disables model-triggered invocation in Copilot/Claude; the bundled
`agents/openai.yaml` disables implicit invocation in Codex.

## Resolve the workspace

1. Require one explicit existing directory. A project folder, repositories parent,
   or whole drive root is valid. Ask for the target if it wasn't supplied; never
   default to the current directory, home directory, filesystem root, or Git root.
2. Read applicable instructions and the target's existing `AGENTS.md`, if any.
   Read the bundled [workspace template](assets/AGENTS.md) before applying it.
3. Use the template as the toolkit entry point, not a copy of every skill's
   procedures. Keep repository-specific rules, local overrides and registry data
   outside its managed block. Never copy a user's registry into this repository.

## Apply the template

Use the Node.js 22+ helper bundled with this skill; no package installation is needed.
Resolve its path from the loaded skill directory, not from the caller's repository.
For example, on Windows:

```powershell
node '<skill-directory>\scripts\init-toolkit.mjs' 'E:\Projects' --dry-run
node '<skill-directory>\scripts\init-toolkit.mjs' 'E:\Projects'
```

For an explicitly selected drive, the target can be `'E:\'`. Use native paths on
other systems. The helper requires an absolute existing directory and changes
only that directory's `AGENTS.md`, never child repositories or host settings.

- If no file exists, create it from the template.
- If an unmarked file exists, prepend the toolkit block and preserve the original.
- If one valid toolkit block exists, update only that block.
- An unchanged block is a no-op. Malformed/duplicate markers, non-UTF-8 content,
  symlinked files and other non-regular destinations fail without replacement.

An explicit initialization request authorizes this scoped write; don't demand a
second confirmation just because the target is a drive. Respect native approvals.
Don't remove conflicting local instructions silently: explain the conflict and
get authorization for any edits outside the managed block. Never use a whole-file
copy over an existing file as a fallback after the helper refuses it.

## Verify and hand off

Read the resulting file. Verify exactly one toolkit block, correct skill names,
and preserved non-toolkit content and registry data. Rerunning initialization
should report unchanged.

Report the exact file and whether it was created, updated, or unchanged. This
doesn't install/update the plugin, clone or migrate repositories, authenticate,
create a PR, or grant permission for subsequent workflows.

An `AGENTS.md` file supplies guidance only where the host loads it. Initializing a
drive doesn't register global instructions or guarantee inheritance across every
host/repository boundary. Check the host's instruction discovery at the intended
working directory; don't change trust, settings or child files automatically.
