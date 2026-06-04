# Discovery Mode - Usage And Publish Guide

## What We Are Bringing

`/discover` is a portable reasoning mode.

There are two forms:

1. Agent instruction mode: Codex/OpenCode/Antigravity/ChatGPT/Claude imitate Discovery Mode from the canonical protocol file.
2. Local engine mode: this repo runs the real Discovery engine through the CLI.

## Canonical Protocol

```text
discovery-experiment/discover-agent-modes/lib/discovery_core.md
```

Update that file to update the instruction version for all agents.

## Codex

This installed Codex CLI does not support the old slash-learn add-file style command.

Use project instructions:

```text
discovery-experiment/AGENTS.md
```

Or paste the canonical protocol into the session.

For the real local engine:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover design a minimal kernel architecture"
```

## OpenCode

```bash
mkdir -p .opencode/rules
cp discovery-experiment/discover-agent-modes/lib/discovery_core.md .opencode/rules/discovery-mode.md
```

## Antigravity

Paste this file into custom instructions:

```text
discovery-experiment/discover-agent-modes/lib/discovery_core.md
```

## ChatGPT / Claude Web

Paste this file into the web chat:

```text
discovery-experiment/DISCOVER_WEB_ACTIVATION.md
```

Then type:

```text
/discover <task>
```

## Validate

```bash
node discovery-experiment/discover-agent-modes/reality_test.js --all
node discovery-experiment/discover-agent-modes/reality_test.js --check response.txt
```

## Publish

Release the repo with:

```bash
cd x:\Toh
git tag v1.0.0-discovery-mode
git push origin v1.0.0-discovery-mode
```

Release title:

```text
Discovery Mode v1.0 - Portable /discover Reasoning Mode
```

Pitch:

```text
Add /discover to any coding agent: uncertainty-first reasoning, four candidate approaches, validation, and a full final answer.
```
