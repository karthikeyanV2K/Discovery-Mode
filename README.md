# Discovery Mode

**Portable `/discover` reasoning mode for coding agents and web chats.**

Discovery Mode prevents an agent from jumping to the most common memorized answer pattern. It forces:

```text
ANALYSIS -> APPROACHES -> EVALUATION -> FINAL ANSWER
```

## Quick Start

### Portable plugin pack

```text
discovery-experiment/portable-plugin-pack/
```

### Codex plugin package

```text
discovery-experiment/plugins/discovery-mode/
```

### Real local engine

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover design a minimal kernel architecture"
```

### Codex

This Codex CLI does **not** support the old slash-learn add-file style command.

Use:

```text
discovery-experiment/AGENTS.md
```

or paste:

```text
discovery-experiment/discover-agent-modes/lib/discovery_core.md
```

into the session.

### OpenCode

```bash
mkdir -p .opencode/rules
cp discovery-experiment/discover-agent-modes/lib/discovery_core.md .opencode/rules/discovery-mode.md
```

### Antigravity

Paste this file into custom instructions:

```text
discovery-experiment/discover-agent-modes/lib/discovery_core.md
```

### ChatGPT / Claude Web

Paste this file into chat:

```text
discovery-experiment/DISCOVER_WEB_ACTIVATION.md
```

Then type:

```text
/discover design a minimal kernel architecture
```

## Validate

```bash
node discovery-experiment/discover-agent-modes/reality_test.js --all
node discovery-experiment/discover-agent-modes/reality_test.js --check response.txt
```

## Project Structure

```text
discovery-experiment/
  AGENTS.md
  plugins/discovery-mode/
  portable-plugin-pack/
  DISCOVER_AGENT_PLUGIN.md
  DISCOVER_WEB_ACTIVATION.md
  HOW_TO_USE_AND_PUBLISH.md
  discover-agent-modes/
    lib/discovery_core.md
    codex-discovery-mode.md
    opencode-discovery-mode.md
    antigravity-discovery-mode.md
    reality_test.js
```
