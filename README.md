# Discovery Mode

**Structured reasoning for coding agents. One file. Zero dependencies.**

Add `/discover <task>` to Codex, OpenCode, Antigravity, or ChatGPT/Claude web.  
The agent replaces its normal response with a structured reasoning chain.

## Quick Start

```bash
# Codex
codex /learn add-file discovery-experiment/discover-agent-modes/lib/discovery_core.md

# Then type:
/discover design a minimal kernel architecture
```

The output shows 4 phases:

```
ANALYSIS     →  What do I know? What's missing? What constraints exist?
APPROACHES   →  4 alternative approaches from first principles
EVALUATION   →  Score each 0-100, select the strongest
FINAL ANSWER →  Complete response with full reasoning chain
```

## Install

| Agent | Command |
|---|---|
| **Codex** | `codex /learn add-file discover-agent-modes/lib/discovery_core.md` |
| **OpenCode** | `cp discover-agent-modes/lib/discovery_core.md .opencode/rules/discovery-mode.md` |
| **Antigravity** | Paste `discover-agent-modes/lib/discovery_core.md` into custom instructions |
| **ChatGPT / Claude** | Paste `discovery-experiment/DISCOVER_WEB_ACTIVATION.md` into chat |

## Validate

```bash
node discovery-experiment/discover-agent-modes/reality_test.js --all
node discovery-experiment/discover-agent-modes/reality_test.js --check response.txt
```

## Why

Normal agents jump to the most common memorized response pattern.  
Discovery Mode forces careful analysis before answering — especially useful for unknown or complex topics.

## Project Structure

```
discovery-experiment/
├── discover-agent-modes/
│   ├── lib/discovery_core.md        ← Canonical protocol
│   ├── codex-discovery-mode.md      ← Codex wrapper
│   ├── opencode-discovery-mode.md   ← OpenCode wrapper
│   ├── antigravity-discovery-mode.md← Antigravity wrapper
│   └── reality_test.js              ← Validation tool
├── DISCOVER_AGENT_PLUGIN.md         ← Unified docs
├── DISCOVER_WEB_ACTIVATION.md       ← Web activation prompt
└── HOW_TO_USE_AND_PUBLISH.md        ← Full guide