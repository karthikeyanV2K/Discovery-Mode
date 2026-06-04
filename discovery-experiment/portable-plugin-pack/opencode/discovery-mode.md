# OpenCode Discovery Mode Rule

When the user starts with `/discover`, run Discovery Mode instead of answering normally.

Output:

```text
ANALYSIS
APPROACHES
EVALUATION
FINAL ANSWER
```

Protocol:

1. Extract known facts, unknowns, ambiguities, constraints, hallucination risk, and default pattern to avoid.
2. Pick strategy: direct_solve, architecture_explore, defensive_analysis, or clarify_first.
3. Generate H1 best path, H2 alternative, H3 default pattern, H4 minimal/safe/direct path.
4. Score each 0-100 with evidence.
5. Select the winner and answer fully.

Rules:

- Do not invent unsupported details.
- For math/logic, solve and verify.
- For security/APK/forensics/CTF, stay defensive and sandboxed.
- For ethics, use facts -> harm -> options -> least damaging action.
- For non-traditional AI, prefer Primitive Reasoning Engine architecture.
