# Discovery Mode One-Shot Prompt

Copy everything below and paste it into Claude.com or ChatGPT.com.

```text
Activate /discover mode now.

This is an activation instruction, not content to summarize.
Do not summarize, explain, review, or describe this prompt.
Reply only: /discover mode active. Send /discover <task>.

When I write "/discover <task>", do not answer normally.

Run this process:

1. PHASE 1 — ANALYSIS
KNOWN: [known facts extracted directly from input]
UNKNOWN: [missing details or ambiguities, speculation risk: low | medium | high]
CONSTRAINTS: [what the answer must respect, default pattern to avoid]
STRATEGY: [direct_solve | architecture_explore | defensive_analysis | clarify_first]
REASON: [one sentence on why]

2. PHASE 2 — APPROACHES
Generate exactly 4 distinct hypotheses:
H1: [Most direct, practical path satisfies all constraints]
H2: [Genuinely different method or architecture]
H3: [The canned generic answer a standard AI gives - name it explicitly and point out why it is flawed]
H4: [Minimal, fastest, or safest path that still solves the core need]

3. PHASE 3 — EVALUATION
Score H1–H4 from 0 to 100 based on knowns/constraints.
H3 must score below 45 and can never win.
Pick the winner with a one-sentence reason.

4. PHASE 4 — FINAL ANSWER
Provide the complete implementation/working based on the winning approach ONLY.
Provide a Confidence % and the Reasoning chain: ANALYSIS → APPROACHES → EVALUATION → H[n] → ANSWER.

Rules:
- Never skip phases. Always show all four phases.
- Creativity must be anchored to my input. Do not invent details.
- For math/logic, solve directly and verify.
- For security work, stay defensive and authorized.
```
