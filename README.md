# Theory of Hallucination — Discovery Mode

> Portable `/discover` reasoning mode for any coding agent or web chat.

Discovery Mode prevents an AI from jumping straight to its most common memorized answer. Instead it forces structured, uncertainty-first reasoning:

```
ANALYSIS → APPROACHES → EVALUATION → FINAL ANSWER
```

Four approaches are generated (H1–H4). H3 is always the default/canned pattern — it must score below 45 and can never win.

---

## How It Works

When you type `/discover <task>` in your agent, it runs four phases:

| Phase | What Happens |
|---|---|
| **ANALYSIS** | Extracts known facts, unknowns, constraints, speculation risk, and names the default pattern to avoid |
| **APPROACHES** | Generates exactly 4 hypotheses — H1 best path, H2 alternative, H3 the canned AI answer, H4 minimal path |
| **EVALUATION** | Scores H1–H4 from 0–100. H3 < 45. Selects the winner. |
| **FINAL ANSWER** | Delivers a complete answer based on the winner only — code, architecture, math, or analysis |

---

## Quick Setup

### Antigravity IDE
Paste the contents of `discovery-experiment/DISCOVERY.md` into **Settings → Custom Instructions**.

That's it. `/discover <task>` works in every session.

---

### Codex
The `AGENTS.md` file at the root of this project auto-loads into Codex when you open this workspace:

```
discovery-experiment/AGENTS.md  ← already configured
```

---

### OpenCode
The rule file is already in place:

```
discovery-experiment/.opencode/rules/discovery-mode.md  ← already configured
```

If setting up in a new project, copy it:

```bash
cp discovery-experiment/.opencode/rules/discovery-mode.md .opencode/rules/discovery-mode.md
```

---

### Cursor / VS Code (Cline / Roo Code)
Paste the contents of `discovery-experiment/DISCOVERY.md` into the agent's **Custom Instructions** or **System Prompt** field.

---

### ChatGPT / Claude Web
Copy all text from this raw file and paste it as your first message:

```
https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/portable-plugin-pack/browser/discover-web-activation.md
```

Wait for: `/discover mode active. Send /discover <task>.`

Then use:

```
/discover your task here
```

---

## Install from NPM/GitHub

Global install (registers `discovery-mode` and `discovery-mcp` commands):

```bash
npm install -g github:karthikeyanV2K/Theory-Of-Hallucation#subdirectory=discovery-experiment
```

---

## MCP Server (Claude Desktop / Cursor)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "discovery-engine": {
      "command": "node",
      "args": [
        "--use-system-ca",
        "x:/Toh/discovery-experiment/plugins/discovery-mode/mcp/discovery_mcp_server.js"
      ],
      "env": {
        "GROQ_API_KEY": "your_key_here",
        "GEMINI_API_KEY": "your_key_here"
      }
    }
  }
}
```

Or via NPX (zero install):

```json
{
  "mcpServers": {
    "discovery-engine": {
      "command": "npx",
      "args": [
        "-y",
        "--package",
        "github:karthikeyanV2K/Theory-Of-Hallucation#subdirectory=discovery-experiment",
        "discovery-mcp"
      ],
      "env": {
        "GROQ_API_KEY": "your_key_here"
      }
    }
  }
}
```

---

## Local Engine CLI

Run the engine directly (requires Node.js + API key in `.env`):

```bash
cp discovery-experiment/.env.example discovery-experiment/.env
# add your GROQ_API_KEY or GEMINI_API_KEY
node --use-system-ca discovery-experiment/cli.js --model groq-free "/discover design a minimal kernel architecture"
```

Models: `groq-free`, `gemini-free`, `ollama/llama3.2`, `openai/gpt-4o`, `anthropic/claude-sonnet-4-5`

---

## Verify It's Working

Send this to your agent:

```
/discover design a minimal kernel architecture
```

**✅ Working** — you see all 4 phases, H3 scores below 30 (something like "Linux From Scratch tutorial"), winner is a staged boot architecture.

**❌ Not working** — you get a one-paragraph response with no H1–H4 scoring.

---

## Project Structure

```
discovery-experiment/
├── DISCOVERY.md              ← canonical protocol (paste anywhere)
├── AGENTS.md                 ← Codex workspace config (auto-loaded)
├── .opencode/rules/          ← OpenCode rules (auto-loaded)
├── plugins/discovery-mode/   ← Codex plugin package
├── portable-plugin-pack/     ← copy-paste files for each agent
│   ├── antigravity/
│   ├── opencode/
│   └── browser/
├── src/                      ← engine source code
├── cli.js                    ← local CLI runner
├── server.js                 ← HTTP server mode
└── .env.example              ← API key template
```

---

## Links

| | |
|---|---|
| **Repo** | https://github.com/karthikeyanV2K/Theory-Of-Hallucation |
| **Browser activation** | https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/portable-plugin-pack/browser/discover-web-activation.md |
| **Core protocol** | https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/DISCOVERY.md |
