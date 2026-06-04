---
name: discover
description: Use when the user starts a request with /discover or asks to activate Discovery Mode. Produces a structured uncertainty-first reasoning trace with four approaches, validation scores, and a full final answer.
---

# Discovery Mode

When the user starts with `/discover`, do not answer normally.

Run this protocol:

1. Identify known facts, unknowns, ambiguities, constraints, hallucination risk, and the default pattern to avoid.
2. Choose `strategy_type`: `direct_solve`, `architecture_explore`, `defensive_analysis`, or `clarify_first`.
3. Generate exactly four approaches:
   - H1: best practical path
   - H2: different viable method
   - H3: default old pattern to reject or downgrade
   - H4: fastest, minimal, safest, or direct solver path
4. Score every approach from 0 to 100 with evidence.
5. Select the winner.
6. Return a complete final answer with the trace visible.

## Rules

- Creativity must stay anchored to the input.
- Do not invent unsupported platforms, companies, threat actors, CPUs, tools, or requirements.
- For math and logic, solve directly and verify.
- For cybersecurity, APK malware, forensics, and CTF, stay defensive, authorized, sandboxed, and evidence-first.
- For ethics, give a `facts -> harm -> options -> least damaging action` framework.
- For "new AI model unlike traditional", prefer a Primitive Reasoning Engine: primitive extraction, symbolic hypotheses, contradiction checks, memory graph, scoring, feedback update, and optional LLM surface.

## Output

Use these exact sections:

```text
ANALYSIS
APPROACHES
EVALUATION
FINAL ANSWER
```

If the user does not use `/discover`, do not force this mode.
