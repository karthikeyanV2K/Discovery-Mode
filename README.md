# Discovery Mode — `/discover` for Any Coding Agent

> Stop your AI from giving the canned memorized answer. `/discover` forces structured, uncertainty-first reasoning on every request.

```
ANALYSIS → APPROACHES (H1–H4) → EVALUATION → FINAL ANSWER
```

H3 is always the default AI answer. It must score below 45. It never wins.

---

## Pick Your Agent — Run One Command

---

### 🟣 Antigravity IDE

**Windows (PowerShell):**
```powershell
$url = "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md"
$content = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content
Add-Content -Path "$env:USERPROFILE\.gemini\GEMINI.md" -Value "`n`n$content"
```

**Mac / Linux:**
```bash
curl -s https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md \
  >> ~/.gemini/GEMINI.md
```

Restart Antigravity. Then type `/discover <your task>`.

---

### 🔵 OpenCode

Run this inside your project folder:

```bash
mkdir -p .opencode/rules
curl -o .opencode/rules/discovery-mode.md \
  https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/.opencode/rules/discovery-mode.md
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path ".opencode\rules"
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/.opencode/rules/discovery-mode.md" `
  -OutFile ".opencode\rules\discovery-mode.md"
```

Open OpenCode in that project. Type `/discover <your task>`.

---

### 🟡 Codex (OpenAI CLI)

Run this inside your project folder:

```bash
curl -o AGENTS.md \
  https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/AGENTS.md
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/AGENTS.md" `
  -OutFile "AGENTS.md"
```

Codex reads `AGENTS.md` automatically from the project root.

---

### 🟠 Cursor

Run this inside your project folder:

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/discovery-mode.mdc \
  https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path ".cursor\rules"
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" `
  -OutFile ".cursor\rules\discovery-mode.mdc"
```

Restart Cursor. Type `/discover <your task>` in the agent chat.

---

### 🔴 VS Code (Cline / Roo Code / Continue)

Run this inside your project folder:

```bash
mkdir -p .github
curl -o .github/copilot-instructions.md \
  https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path ".github"
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" `
  -OutFile ".github\copilot-instructions.md"
```

Or paste the raw file contents into your extension's **Custom Instructions** field directly.

---

### 🌐 ChatGPT / Claude Web (no install)

1. Open this URL and copy all the text:

   ```
   https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
   ```

2. Paste it as your **first message** in the chat.

3. Wait for the agent to confirm, then type:

   ```
   /discover <your task>
   ```

---

## Verify It's Working

Send this to your agent after setup:

```
/discover design a minimal kernel architecture
```

**✅ Working** — you see all 4 phases, H3 scores below 30 (something like "Linux From Scratch tutorial"), winner is a staged boot architecture (boot → loader → CPU init → kernel core → drivers → shell).

**❌ Not working** — you get a single paragraph with no H1–H4, no scoring. Check the file was saved correctly and restart the agent.

---

## What It Does

Every `/discover <task>` runs four structured phases:

| Phase | What Happens |
|---|---|
| **ANALYSIS** | Extracts known facts, unknowns, constraints, speculation risk, and names the default canned answer to avoid |
| **APPROACHES** | Generates exactly 4 hypotheses (H1 best, H2 alternative, H3 the canned AI answer, H4 minimal path) |
| **EVALUATION** | Scores H1–H4 from 0–100. H3 < 45. Names the winner. |
| **FINAL ANSWER** | Full code / architecture / math based on the winner only — never a blend |

Without `/discover`, your agent answers normally. The mode only activates on demand.

---

## Advanced: Local Engine CLI

If you want to run the full reasoning engine locally (not just agent instructions):

```bash
git clone https://github.com/karthikeyanV2K/Theory-Of-Hallucation.git
cd Theory-Of-Hallucation/discovery-experiment
npm install
cp .env.example .env
# Edit .env and add your GROQ_API_KEY or GEMINI_API_KEY
node cli.js --model groq-free "/discover design a minimal kernel architecture"
```

Available models: `groq-free` · `gemini-free` · `ollama/llama3.2` · `openai/gpt-4o` · `anthropic/claude-sonnet-4-5`

---

## Files in This Repo

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
