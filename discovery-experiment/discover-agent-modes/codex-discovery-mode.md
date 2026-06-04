# Codex × Discovery Mode

## Overview
Adds the `/discover` command to Codex. When invoked, Codex replaces its standard response with a structured reasoning process defined in the Discovery Mode protocol.

No external dependencies. No API calls. Pure instruction-driven behavior.

## Installation

```bash
codex /learn add-file discover-agent-modes/lib/discovery_core.md
```

Or copy this file to:
```
~/.codex/rules/discovery-mode.md
```

## Behavior

When the user writes:
```
/discover <task>
```
Codex executes the **Discovery Mode protocol** (see `lib/discovery_core.md`):

1. **ANALYSIS** — known facts, unknowns, constraints, strategy
2. **APPROACHES** — 4 alternative approaches (H1 primary, H2 alternative, H3 default pattern, H4 minimal/safe)
3. **EVALUATION** — score each 0–100, select winner
4. **FINAL ANSWER** — complete response with reasoning chain visible

When `/discover` is not present, Codex answers normally.

## Output Format

```
ANALYSIS:
[known/unknown/constraints/strategy]

APPROACHES:
[H1-H4 with descriptions and rationale]

EVALUATION:
[scores with evidence, selection]

FINAL ANSWER:
[complete answer with reasoning chain]
```

## Verification

```
/discover design a minimal kernel architecture
```

Expected: staged architecture trace (boot → loader → CPU → core → drivers → shell), not a one-line answer.