# Primitive Discovery Mode - Testing Guide

## What This Tests

The **Primitive Discovery Mode** derives answers from first principles (primitives + logic rules) instead of recalling from training knowledge.

Three-way comparison:
- **Standard Mode**: Recall from training (1 API call)
- **Discovery Mode**: Explore patterns from training (2 API calls)
- **Primitive Discovery Mode**: Derive from primitives using logic (2 internal steps + 1 AI validation)

---

## Test Prompts

### Test 1: Unknown/Future Concept
```
hey you able to create pure assembly kernel
```

**Why this tests it:**
- Very few training examples of "pure assembly kernel" creation
- Requires breaking down into primitives: "assembly" + "kernel" + "create"
- Standard mode will either hallucinate or try to recall
- Primitive mode will derive from "what assembly is" + "what kernel does"

**Expected behavior:**
- Standard: Likely hallucination or generic answer
- Discovery (training): Might mix concepts
- Primitive: Should derive "This would require understanding low-level hardware control, memory management, and assembly language"

---

### Test 2: Current Technology Question
```
what is current tpu architecture
```

**Why this tests it:**
- TPU architecture changes over time
- Asking for "current" (temporal specificity)
- Will show if AI derives understanding vs recalls training
- Primitive mode should break it to: "TPU" + "architecture" + "current"

**Expected behavior:**
- Standard: Might have outdated info from training cutoff
- Discovery (training): Similar issue
- Primitive: Should acknowledge "This is asking for current/temporal info. From primitives: TPU is a hardware accelerator, architecture means how it's structured"

---

## How to Test

### Via Terminal (One-shot test)

```bash
# Test Primitive Mode only
curl -X POST http://localhost:3000/api/run-primitive \
  -H "Content-Type: application/json" \
  -d '{"input":"hey you able to create pure assembly kernel","model":"ollama/llama3.2"}'

# Test all three modes together
curl -X POST http://localhost:3000/api/run-three \
  -H "Content-Type: application/json" \
  -d '{"input":"what is current tpu architecture","model":"ollama/llama3.2"}'
```

### Via Browser

The updated index.html will have a "Primitive Discovery" panel that shows:

1. **Primitives Extracted** — What basic facts were identified
2. **Derived Hypotheses** — Possibilities generated from logic rules
3. **Contradiction Tests** — Which hypotheses failed consistency checks
4. **AI Validation** — Which derived hypothesis AI thinks is best
5. **Final Answer** — The answer derived through logical chain

---

## What to Look For

**Primitive Discovery is working correctly when:**

1. **Primitives are correct** — Input is broken into true base facts
   ```
   Input: "pure assembly kernel"
   Primitives should include:
   - "pure" → from scratch, minimal
   - "assembly" → low-level code
   - "kernel" → OS core
   ```

2. **Logic rules applied properly** — Hypotheses follow derivation paths
   ```
   Rule applied: "tech_domain_clue"
   → Inferred domain: "systems"
   → Generated: "Systems domain concept"
   ```

3. **Contradictions detected** — Wrong hypotheses get flagged
   ```
   Hypothesis: "Web framework"
   Test: Domain contradiction (hardware/systems vs web)
   Result: MARKED AS CONTRADICTORY ❌
   ```

4. **Final answer derived, not recalled**
   - Should explain derivation chain
   - Confidence based on logic consistency, not training certainty
   - Acknowledgment of limitations (e.g., "This is current temporal data that may not be in training")

---

## Comparison: Standard vs Discovery vs Primitive

### Example Input: "tpu architecture"

**Standard Mode Output:**
```
Answer: TPU is Google's tensor processing unit for ML

(Direct recall from training)
```

**Discovery Mode Output:**
```
Hypothesis 1: Google hardware for machine learning (score: 92)
Hypothesis 2: Specialized processor for AI (score: 85)
Hypothesis 3: Accelerator for video processing (score: 20)
Hypothesis 4: Protocol for data transmission (score: 10)

Winner: H1
Answer: TPU is Google's tensor processing unit designed for machine learning workloads
(Explored training patterns, picked best match)
```

**Primitive Discovery Mode Output:**
```
Input Primitives:
- "tpu" → 3-letter acronym, likely abbreviation
- "architecture" → structure, design, how something is organized
- Domain hints: hardware keywords present
- Question type: "what is" → asking for definition

Derived Hypotheses:
1. [From abbreviation rule] Multi-word acronym (likely 3 words)
2. [From hardware rule] Hardware/processor technology
3. [From domain clue] Systems/architecture domain term
4. [From tech domain] Could be protocol or design pattern

Contradiction Tests:
H1: No contradictions ✅
H2: No contradictions ✅
H3: No contradictions ✅
H4: Contradicts (protocol doesn't match "architecture" in hardware context) ❌

AI Validation of Consistent Hypotheses:
- H2 (Hardware/processor) scored: 89
- Winner: H2

Derivation Chain:
Step 1: Broke "tpu architecture" into primitives
Step 2: Applied logic rules (abbreviation, domain, hardware)
Step 3: Tested consistency
Step 4: AI picked most likely derived hypothesis

Final Answer: TPU is a hardware technology (likely processor/accelerator) with a specific internal structure. The exact architecture depends on current implementation (may not be in training data).

Confidence: 72% (based on logical consistency of derivation, NOT training certainty)
```

---

## Key Difference You'll See

**Standard/Discovery (training-based):**
- Confident about things in training
- Uncertain about things not in training
- Can hallucinate convincingly

**Primitive Discovery (logic-based):**
- Confident about things derived from primitives + logic
- Can acknowledge unknowns while still providing logical framework
- Shows reasoning chain, not just answer
- Doesn't hallucinate — either derives or acknowledges uncertainty

---

## Next Steps

1. **Start simple** — test with "tpu" alone
2. **Then test full questions** — "what is tpu"
3. **Then test your own prompts** — "hey you able to..."
4. **Compare the three outputs** side by side
5. **Note which mode** handles novel/unknown concepts better

The real test is on prompts that go beyond training data. That's where Primitive Discovery should shine. 🔥
