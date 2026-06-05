# Discovery Mode Portable Plugin Pack

This pack contains plain files that bring `/discover` directly into the chat session of any coding agent or web chat. No Node.js CLI, no external APIs, and no local Ollama setup required. The agent itself executes the 4-phase reasoning protocol.

- Codex
- OpenCode
- Antigravity
- ChatGPT web
- Claude web

---

## Installation

### 1. Antigravity
Copy all contents of [`antigravity/discovery-mode.md`](file:///x:/Toh/discovery-experiment/portable-plugin-pack/antigravity/discovery-mode.md) and paste it into **Settings → Custom Instructions** of your Antigravity agent.

### 2. Codex
Add the local Codex plugin from this repository:
- Load the folder [`plugins/discovery-mode/`](file:///x:/Toh/discovery-experiment/plugins/discovery-mode) into Codex.
- Alternatively, copy the instructions from [`AGENTS.md`](file:///x:/Toh/discovery-experiment/AGENTS.md) at the project root into your project's custom agent instructions.

### 3. OpenCode
Copy [`opencode/discovery-mode.md`](file:///x:/Toh/discovery-experiment/portable-plugin-pack/opencode/discovery-mode.md) to `.opencode/rules/discovery-mode.md` in your project's root directory.

### 4. Claude.com / ChatGPT.com
Copy all contents of [`browser/discover-web-activation.md`](file:///x:/Toh/discovery-experiment/portable-plugin-pack/browser/discover-web-activation.md) and paste it as the very first message in a new chat. Once it replies `/discover mode active`, you can send `/discover <task>`.

---

## Verification

To verify it is working in any of the above, send:

```text
/discover design a minimal kernel architecture
```

### Expected Output Structure:
Every correct response must contain these exactly:
1. **ANALYSIS** - Extract known facts, unknowns, constraints, speculation risk, default pattern to avoid, and chosen strategy.
2. **APPROACHES** - Generate exactly 4 distinct hypotheses (H1 to H4), where H3 is the default/canned AI response to critically evaluate.
3. **EVALUATION** - Score H1–H4 from 0 to 100. H3 must score < 45 and never win. Choose the winner.
4. **FINAL ANSWER** - Return the complete implementation based solely on the winning approach.
