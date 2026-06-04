# Discovery Mode — Core Protocol

This is the canonical specification for Discovery Mode.  
All agent plugins reference this core. Do not modify individual agent files — update this core instead.

## What Discovery Mode Does

When an agent receives a prompt prefixed with `/discover`, it replaces its normal response with a structured reasoning process:

1. **Analyze the request** — separate known facts from unknowns and constraints
2. **Generate alternative interpretations** — derive multiple possible approaches from first principles
3. **Evaluate and select** — score each approach against criteria, pick the strongest
4. **Deliver a complete answer** — full trace of reasoning from analysis to conclusion

This prevents the agent from jumping to the most common or memorized response pattern when a more careful analysis is needed.

---

## Protocol Phases

### Phase 1: Request Analysis

Before attempting any answer, decompose the input.

```
KNOWN:
- [Explicit facts extracted from the input]
- [Domain or subject area]
- [Technologies, tools, or concepts mentioned]

UNKNOWN:
- [Missing details or ambiguous terms]
- [Unspecified requirements]
- Speculation risk: [low | medium | high]

CONSTRAINTS:
- What the answer must respect
- Default response pattern to avoid

STRATEGY:
- Type: [direct_solve | architecture_explore | defensive_analysis | clarify_first]
- Plan: [one sentence describing the approach]
```

**Strategy selection rules:**
- `direct_solve` — math, logic, puzzles with a single correct answer
- `architecture_explore` — create, build, design, architecture, system design
- `defensive_analysis` — security, forensics, CTF, malware analysis (must be defensive and authorized)
- `clarify_first` — general cases where assumptions must be stated before answering

---

### Phase 2: Generate Alternative Approaches

Generate exactly **4 distinct approaches**. Do NOT recall a single memorized answer — derive these from the unknowns and constraints above.

| ID | Role | Description |
|---|---|---|
| **H1** | Primary path | Most direct, practical, and well-reasoned approach |
| **H2** | Alternative | A different viable method or architecture |
| **H3** | Default pattern | The approach a standard agent would likely take (to be evaluated critically) |
| **H4** | Minimal/safe | The fastest, safest, or most constrained path |

**Rules:**
- H3 should represent the most obvious or commonly memorized response pattern
- For math/logic tasks, H4 should be a direct calculation approach
- For security tasks, all approaches must be defensive and authorized
- Do NOT invent platforms, vendors, CPUs, threat actors, or specifications not present in the input
- When details are missing but a bounded answer is possible, state assumptions and proceed

```
APPROACHES:
| ID | Description | Rationale | Evidence from input |
|----|-------------|-----------|---------------------|
| H1 | ... | ... | ... |
| H2 | ... | ... | ... |
| H3 | ... | ... | ... |
| H4 | ... | ... | ... |
```

---

### Phase 3: Evaluate & Select

Score each approach 0–100 against the known facts and constraints.

| Score | Meaning |
|---|---|
| 0–25 | Weak fit — contradicts constraints or misses the request |
| 26–50 | Possible — could work but has significant gaps |
| 51–75 | Good fit — addresses most requirements |
| 76–100 | Strong match — satisfies constraints, efficient, well-reasoned |

**Reward:** approaches that match constraints, provide a concrete path, and acknowledge limitations  
**Penalize:** approaches that ignore constraints, invent unsupported specifics, or hedge without providing value

```
EVALUATION:
| ID | Score | Evidence | Valid |
|----|-------|----------|-------|
| H1 | 92 | Matches all constraints, most efficient path | ✓ |
| H2 | 68 | Valid alternative but requires more setup | ✓ |
| H3 | 15 | Default pattern, does not address specifics | ✗ |
| H4 | 78 | Good fallback, safe but less depth | ✓ |

Selection: H1 (highest score — 92/100)
```

---

### Phase 4: Final Answer

Produce a complete answer based on the selected approach. Include the reasoning chain.

```
FINAL ANSWER:

[Complete answer with context and reasoning]

Reasoning chain:
  ANALYSIS → APPROACHES → EVALUATION → CONCLUSION

[Practical answer addressing the original request]

Confidence: [0-100]%
```

---

## When Discovery Mode Is Active

The agent MUST:
- Prefix the response with `/discover` trace sections (ANALYSIS, APPROACHES, EVALUATION, FINAL ANSWER)
- Keep all intermediate reasoning visible — do not collapse into just the final answer
- Show all 4 approaches with scores

## When Discovery Mode Is NOT Active

For prompts without the `/discover` prefix, the agent answers normally using its standard capabilities.

---

## Quick Verification

Test prompt:
```
/discover design a minimal kernel architecture
```

Expected output:
1. ANALYSIS: kernel domain, "minimal" implies bare-metal focus
2. UNKNOWN: boot target, CPU mode, driver scope
3. H3 (to evaluate critically): full OS textbook outline
4. Selected: staged architecture — boot → loader → CPU setup → core → drivers → shell
5. Full answer with implementation order and build targets

If the output is a one-line answer or standard tutorial, Discovery Mode is not active.