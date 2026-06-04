# OpenCode × Discovery Mode

## Overview
Adds the `/discover` command to OpenCode. When invoked, OpenCode replaces its standard response with a structured reasoning process defined in the Discovery Mode protocol.

No external dependencies. No API calls. Pure instruction-driven behavior.

## Installation

```bash
cp discover-agent-modes/lib/discovery_core.md .opencode/rules/discovery-mode.md
```

Or paste the core protocol (`lib/discovery_core.md`) into OpenCode's custom instructions.

## Behavior

When the user writes:
```
/discover <task>
```
OpenCode executes the **Discovery Mode protocol**:

1. **ANALYSIS** — known facts, unknowns, constraints, strategy
2. **APPROACHES** — 4 alternatives (H1 primary, H2 alternative, H3 default pattern, H4 minimal/safe)
3. **EVALUATION** — score 0–100, select winner
4. **FINAL ANSWER** — full response with reasoning chain

When `/discover` is not present, answer normally.

## Output Format

```
ANALYSIS:
[known/unknown/constraints/strategy]

APPROACHES:
[H1-H4 with rationale]

EVALUATION:
[scores with evidence, selection]

FINAL ANSWER:
[complete answer]
```

## Verification

```
/discover design a minimal kernel architecture
```

If the output is a single line or standard tutorial, Discovery Mode is not active.