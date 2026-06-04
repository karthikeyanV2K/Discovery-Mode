# Discovery Mode — Agent Plugin

Adds `/discover` to your coding agent. Zero dependencies. No npm. No API calls. Pure instruction.

## How It Works

Install one file into your agent. When you type `/discover <task>`, the agent replaces its normal response with a structured reasoning chain:

```
ANALYSIS     →  What do I know? What's missing? What constraints exist?
APPROACHES   →  4 alternative approaches (primary, alternative, default, minimal)
EVALUATION   →  Score each 0-100, select the strongest
FINAL ANSWER →  Complete response with reasoning chain visible
```

This prevents the agent from jumping to the most memorized pattern when a careful analysis is needed.

## Plugin Files

All plugins reference the same canonical protocol at `lib/discovery_core.md`.

| Agent | File | Install |
|---|---|---|
| **Codex** | `discover-agent-modes/codex-discovery-mode.md` | `codex /learn add-file discover-agent-modes/lib/discovery_core.md` |
| **OpenCode** | `discover-agent-modes/opencode-discovery-mode.md` | `cp lib/discovery_core.md .opencode/rules/` |
| **Antigravity** | `discover-agent-modes/antigravity-discovery-mode.md` | Paste `lib/discovery_core.md` into custom instructions |
| **ChatGPT / Claude Web** | `DISCOVER_WEB_ACTIVATION.md` | Paste activation prompt into chat |

## Quick Start

```bash
# Codex
codex /learn add-file discover-agent-modes/lib/discovery_core.md

# Then test
/discover design a minimal kernel architecture
```

Expected output: 4-phase trace (ANALYSIS → APPROACHES → EVALUATION → FINAL ANSWER).

## Validate

```bash
node discover-agent-modes/reality_test.js --all
# Save agent output to response.txt, then:
node discover-agent-modes/reality_test.js --check response.txt
```

## Structure

```
discover-agent-modes/
├── lib/
│   └── discovery_core.md        ← Canonical protocol (all agents reference this)
├── codex-discovery-mode.md      ← Codex wrapper
├── opencode-discovery-mode.md   ← OpenCode wrapper
├── antigravity-discovery-mode.md← Antigravity wrapper
└── reality_test.js              ← Validation tool