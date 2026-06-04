# Antigravity × Discovery Mode

## Overview
Adds the `/discover` command to Antigravity. When invoked, Antigravity replaces its standard response with a structured reasoning process defined in the Discovery Mode protocol.

No external dependencies. No API calls. Pure instruction-driven behavior.

## Installation

Paste the discovery core protocol into Antigravity's custom instructions, or start a session with:

```
Activate /discover mode. Follow the Discovery Mode protocol.
```

## Behavior

```
/discover <task>  →  Execute Discovery Mode (4 phases below)
Without prefix     →  Answer normally
```

### Phase 1: ANALYSIS

```
KNOWN:
- [facts from input, domain, technologies]

UNKNOWN:
- [missing details, ambiguous terms]
- Speculation risk: low | medium | high

CONSTRAINTS:
- [what answer must respect]
- [default pattern to avoid]

STRATEGY:
- Type: direct_solve | architecture_explore | defensive_analysis | clarify_first
- Plan: [approach summary]
```

### Phase 2: APPROACHES

Generate exactly 4 alternatives derived from Phase 1, not from memorized patterns.

| ID | Role |
|---|---|
| H1 | Primary path — most direct and practical |
| H2 | Alternative — different viable method |
| H3 | Default pattern — standard agent approach (evaluate critically) |
| H4 | Minimal/safe — fastest or safest path |

### Phase 3: EVALUATION

Score 0–100. Select the highest.

### Phase 4: FINAL ANSWER

Full answer with complete reasoning chain visible.

## Keep Full Trace

Do NOT collapse intermediate steps. The reasoning chain (ANALYSIS → APPROACHES → EVALUATION → ANSWER) is the product.

## Verification

```
/discover design a minimal kernel architecture
```

Expected: staged boot architecture trace. If short answer → not active.