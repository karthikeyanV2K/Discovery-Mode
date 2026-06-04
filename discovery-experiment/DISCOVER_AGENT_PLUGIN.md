# Discovery Mode Agent Plugin

Adds `/discover` to coding agents through one canonical protocol file.

The canonical protocol is:

```text
discover-agent-modes/lib/discovery_core.md
```

The packaged plugin files are:

```text
plugins/discovery-mode/
portable-plugin-pack/
```

## How It Works

When the user writes:

```text
/discover <task>
```

the agent should produce:

```text
ANALYSIS
APPROACHES
EVALUATION
FINAL ANSWER
```

## Bring It To Each Agent

| Agent | Real Integration Path |
|---|---|
| Codex | Install/use `plugins/discovery-mode/`, use project `AGENTS.md`, or paste `discover-agent-modes/lib/discovery_core.md` into the session |
| OpenCode | Copy `portable-plugin-pack/opencode/discovery-mode.md` into `.opencode/rules/discovery-mode.md` |
| Antigravity | Paste `portable-plugin-pack/antigravity/discovery-mode.md` into custom instructions |
| ChatGPT / Claude Web | Paste `portable-plugin-pack/browser/discover-web-activation.md` into chat |

## Codex Note

This Codex CLI does not support the old slash-learn add-file style command.

Use `AGENTS.md`, manual paste, or the local CLI engine.

## Local CLI Engine

For repeatable runs:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover design a minimal kernel architecture"
```

## Validate

```bash
node discover-agent-modes/reality_test.js --all
node discover-agent-modes/reality_test.js --check response.txt
```
