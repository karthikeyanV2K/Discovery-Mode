# Theory of Hallucination — Discovery Mode v2

> Portable `/discover` reasoning mode for any coding agent or web chat.

Discovery Mode prevents an AI from jumping to its most common memorized answer. It forces structured, uncertainty-first reasoning across 5 phases:

```
ANALYSIS → APPROACHES (H1–H5) → EVALUATION → FINAL ANSWER → CONSTRAINT CHECK
```

H3 is always the canned training-data answer. It must score below 45. It never wins.
H5 is adversarial — it tries to break the winner before the answer ships.

**Benchmark:** Discovery Mode scores **+3.2% avg** over standard reasoning. **+13%** on architecture tasks. **100%** on hard kernel design cases.

---

## One-Command Setup — Pick Your Agent

> **Windows:** Run all commands in **PowerShell** (not CMD).

---

### 🟣 Antigravity IDE

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile "$env:USERPROFILE\.gemini\GEMINI.md" -UseBasicParsing
```
**Mac / Linux:**
```bash
curl -o ~/.gemini/GEMINI.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```
Restart Antigravity. Type `/discover <task>`.

---

### 🔵 Gemini CLI (`gemini` command line tool)

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile "$env:USERPROFILE\.gemini\GEMINI.md" -UseBasicParsing
```
**Mac / Linux:**
```bash
curl -o ~/.gemini/GEMINI.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```
Same file as Antigravity. Both read `~/.gemini/GEMINI.md`. Restart and type `/discover <task>`.

---

### 🟤 Claude Code (`claude` CLI)

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile "$env:USERPROFILE\.claude\CLAUDE.md" -UseBasicParsing
```
**Mac / Linux:**
```bash
mkdir -p ~/.claude && curl -o ~/.claude/CLAUDE.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```
Claude Code auto-loads `~/.claude/CLAUDE.md` globally. Type `/discover <task>`.

---

### 🔵 OpenCode

> ⚠️ Use **Code mode**, not Plan mode. Plan mode forces tool calls which override the protocol.

**PowerShell (global install):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile "$env:USERPROFILE\.config\opencode\AGENTS.md" -UseBasicParsing
```
**Mac / Linux:**
```bash
mkdir -p ~/.config/opencode && curl -o ~/.config/opencode/AGENTS.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```
Restart OpenCode, switch to **Code mode**, type `/discover <task>`.

---

### 🟡 Codex (OpenAI CLI)

Run inside your project folder.

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile "AGENTS.md" -UseBasicParsing
```
**Mac / Linux:**
```bash
curl -o AGENTS.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```
Codex auto-loads `AGENTS.md` from the project root.

---

### 🟠 Cursor

Run inside your project folder.

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path ".cursor\rules"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile ".cursor\rules\discovery-mode.mdc" -UseBasicParsing
```
**Mac / Linux:**
```bash
mkdir -p .cursor/rules && curl -o .cursor/rules/discovery-mode.mdc https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```
Restart Cursor. Type `/discover <task>` in agent chat.

---

### ⚫ Kiro (AWS)

Run inside your project folder.

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path ".kiro\steering"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile ".kiro\steering\discovery-mode.md" -UseBasicParsing
```
**Mac / Linux:**
```bash
mkdir -p .kiro/steering && curl -o .kiro/steering/discovery-mode.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```
Kiro reads steering documents from `.kiro/steering/`. Restart Kiro and type `/discover <task>`.

---

### 🔴 VS Code — GitHub Copilot

Run inside your project folder.

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path ".github"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile ".github\copilot-instructions.md" -UseBasicParsing
```
**Mac / Linux:**
```bash
mkdir -p .github && curl -o .github/copilot-instructions.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```

---

### 🟣 VS Code — Cline

Run inside your project folder.

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path ".clinerules"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md" -OutFile ".clinerules\discovery-mode.md" -UseBasicParsing
```
**Mac / Linux:**
```bash
mkdir -p .clinerules && curl -o .clinerules/discovery-mode.md https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md
```

---

### 🌐 ChatGPT / Claude Web (zero install)

1. Open the raw file: `https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md`
2. Copy all text → paste it as your **first message**
3. Then type: `/discover <your task>`

---

## Install Everything at Once (Windows PowerShell)

Run this to install Discovery Mode into **all agents on your machine** in one shot:

```powershell
$url = "https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md"
$proto = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

# Antigravity + Gemini CLI
New-Item -Force -Path "$env:USERPROFILE\.gemini" -ItemType Directory | Out-Null
Set-Content "$env:USERPROFILE\.gemini\GEMINI.md" $proto

# Claude Code
New-Item -Force -Path "$env:USERPROFILE\.claude" -ItemType Directory | Out-Null
Set-Content "$env:USERPROFILE\.claude\CLAUDE.md" $proto

# OpenCode
New-Item -Force -Path "$env:USERPROFILE\.config\opencode" -ItemType Directory | Out-Null
Set-Content "$env:USERPROFILE\.config\opencode\AGENTS.md" $proto

Write-Host "Discovery Mode v2 installed to: Antigravity, Gemini CLI, Claude Code, OpenCode"
```

For **Codex, Cursor, Kiro, Cline, Copilot** — run the per-project commands above inside your repo.

---

## Verify It's Working

```
/discover design a minimal kernel architecture
```

**✅ Working** — you see 5 phases (ANALYSIS, APPROACHES H1–H5, EVALUATION, FINAL ANSWER, CONSTRAINT CHECK). H3 scores below 30. H5 finds an adversarial attack on the winner.

**❌ Not working** — single paragraph, no H1–H5, no scoring. Check the file was saved and restart the agent.

---

## What It Does

| Phase | What Happens |
|---|---|
| **ANALYSIS** | Known facts, unknowns, constraints, default pattern to avoid, strategy |
| **APPROACHES** | 5 hypotheses — H1/H2/H4 first-principles, H3 training-data recall, H5 adversarial stress test |
| **EVALUATION** | Scores H1–H5. H3 < 45, never wins. H5 fatal → demotes winner. |
| **FINAL ANSWER** | Winner only — concrete code, diagram, or table. Confidence gate: < 70% forces second pass. |
| **CONSTRAINT CHECK** | 6-point checklist runs before output — catches violations and fixes inline. |

Without `/discover` → agent answers normally.

---

## Benchmark Results (groq-free model, 10 cases)

| Category | Standard Reasoning | Discovery Mode | Winner |
|---|---|---|---|
| Architecture | 75% | **88%** | 🏆 Discovery +13% |
| Kernel design (hard) | 75% | **100%** | 🏆 Discovery +25% |
| Math / CRT | 100% | 100% | Tie |
| Emotion / social | 75% | 75% | Tie |
| Cyber forensics | 75% | 75% | Tie |
| **Average** | **81.3%** | **84.5%** | **Discovery wins** |

---

## Advanced: Local Engine CLI

```bash
git clone https://github.com/karthikeyanV2K/Theory-Of-Hallucation.git
cd Theory-Of-Hallucation/discovery-experiment
npm install
cp .env.example .env
# Add GROQ_API_KEY or GEMINI_API_KEY to .env
node cli.js --model groq-free "/discover design a minimal kernel architecture"
```

Models: `groq-free` · `gemini-free` · `ollama/llama3.2` · `openai/gpt-4o` · `anthropic/claude-sonnet-4-5`

Run benchmarks:
```bash
npm run bench:mini    # 4 cases, fast
npm run bench:tech    # 6 cases
npm run bench         # full hard cases
```

---

## Repo Structure

```
discovery-experiment/
├── DISCOVERY.md              ← canonical v2 protocol (paste into any agent)
├── AGENTS.md                 ← Codex / OpenAI project config
├── .opencode/rules/          ← OpenCode auto-loaded rules
├── plugins/discovery-mode/   ← Codex plugin package
├── portable-plugin-pack/     ← per-agent copy-paste files
├── src/                      ← local engine source
├── cli.js                    ← local CLI
└── .env.example              ← API key template
```

**Repo:** https://github.com/karthikeyanV2K/Theory-Of-Hallucation · **Release:** v2.0.0
