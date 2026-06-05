# Theory of Hallucination — Discovery Mode

> Portable `/discover` reasoning mode for any coding agent or web chat.

Discovery Mode prevents an AI from jumping straight to its most common memorized answer. Instead it forces structured, uncertainty-first reasoning:

```
ANALYSIS → APPROACHES (H1–H4) → EVALUATION → FINAL ANSWER
```

H3 is always the default AI answer. It must score below 45. It never wins.

---

## Pick Your Agent — One Command Setup

> **Windows users:** Run all commands in **PowerShell** (not CMD).  
> Right-click Start → "Windows PowerShell" or search "PowerShell" in Start menu.

---

### 🟣 Antigravity IDE

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile "$env:USERPROFILE\.gemini\GEMINI.md" -UseBasicParsing
```

**Mac / Linux:**
```bash
curl -s https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md >> ~/.gemini/GEMINI.md
```

Restart Antigravity. Type `/discover <your task>`.

---

### 🔵 OpenCode

Run inside your project folder.

**PowerShell:**
```powershell
mkdir -Force .opencode\rules; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/.opencode/rules/discovery-mode.md" -OutFile ".opencode\rules\discovery-mode.md"
```

**Mac / Linux:**
```bash
mkdir -p .opencode/rules && curl -o .opencode/rules/discovery-mode.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/.opencode/rules/discovery-mode.md
```

Open OpenCode in that project. Type `/discover <your task>`.

---

### 🟡 Codex (OpenAI CLI)

Run inside your project folder.

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/AGENTS.md" -OutFile "AGENTS.md"
```

**Mac / Linux:**
```bash
curl -o AGENTS.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/AGENTS.md
```

Codex reads `AGENTS.md` automatically from the project root.

---

### 🟠 Cursor

Run inside your project folder.

**PowerShell:**
```powershell
mkdir -Force .cursor\rules; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile ".cursor\rules\discovery-mode.mdc"
```

**Mac / Linux:**
```bash
mkdir -p .cursor/rules && curl -o .cursor/rules/discovery-mode.mdc https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```

Restart Cursor. Type `/discover <your task>` in the agent chat.

---

### 🔴 VS Code (GitHub Copilot / Cline / Roo Code)

Run inside your project folder.

**PowerShell:**
```powershell
mkdir -Force .github; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile ".github\copilot-instructions.md"
```

**Mac / Linux:**
```bash
mkdir -p .github && curl -o .github/copilot-instructions.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```

---

### 🌐 ChatGPT / Claude Web (no install needed)

1. Open this link and copy all the text:
   ```
   https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
   ```

2. Paste it as your **first message** in the chat.

3. Then type:
   ```
   /discover <your task>
   ```

---

## Verify It's Working

Send this to your agent after setup:

```
/discover design a minimal kernel architecture
```

**✅ Working** — you see all 4 phases, H3 scores below 30 (something like "Linux From Scratch tutorial"), winner is a staged boot architecture.

**❌ Not working** — you get a single paragraph with no H1–H4, no scoring. Check the file was saved and restart the agent.

---

## What It Does

Every `/discover <task>` runs four structured phases:

| Phase | What Happens |
|---|---|
| **ANALYSIS** | Extracts known facts, unknowns, constraints, and names the canned answer to avoid |
| **APPROACHES** | Generates exactly 4 hypotheses — H1 best, H2 alternative, H3 the canned AI answer, H4 minimal path |
| **EVALUATION** | Scores H1–H4 from 0–100. H3 must score below 45 and never wins. |
| **FINAL ANSWER** | Full code / architecture / math based on the winner only |

Without `/discover`, your agent answers normally. The mode only activates on demand.

---

## Advanced: Local Engine CLI

Run the full reasoning engine locally (requires Node.js):

```bash
git clone https://github.com/karthikeyanV2K/Theory-Of-Hallucation.git
cd Theory-Of-Hallucation/discovery-experiment
npm install
cp .env.example .env
```

Edit `.env` and add your `GROQ_API_KEY` or `GEMINI_API_KEY`, then:

```bash
node cli.js --model groq-free "/discover design a minimal kernel architecture"
```

Available models: `groq-free` · `gemini-free` · `ollama/llama3.2` · `openai/gpt-4o` · `anthropic/claude-sonnet-4-5`

---

## Repo Structure

```
discovery-experiment/
├── DISCOVERY.md              ← the protocol (paste into any agent)
├── AGENTS.md                 ← Codex project config (auto-loaded)
├── .opencode/rules/          ← OpenCode config (auto-loaded)
├── plugins/discovery-mode/   ← Codex plugin package
├── portable-plugin-pack/     ← per-agent copy-paste files
├── src/                      ← local engine source
├── cli.js                    ← local CLI
└── .env.example              ← API key template
```

---

**Repo:** https://github.com/karthikeyanV2K/Theory-Of-Hallucation
