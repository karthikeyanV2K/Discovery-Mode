# Discovery Mode — Publish & Usage Guide

## Publish (GitHub Release)

This project is at `github.com/karthikeyanV2K/Theory-Of-Hallucation`.  
Tag a release to distribute:

```bash
cd x:\Toh
git tag v1.0.0-discovery-mode
git push origin v1.0.0-discovery-mode
```

Then on GitHub → Releases → Create release with:

> **Title:** Discovery Mode v1.0 — Agent Plugin  
> **Description:** Zero-dependency `/discover` plugin for Codex, OpenCode, Antigravity. No npm, no API, no external services. Pure instruction-driven structured reasoning.

---

## Install Per Agent

### Codex

```bash
codex /learn add-file discovery-experiment/discover-agent-modes/lib/discovery_core.md
```

Or via raw GitHub URL:

```bash
codex /learn add-file https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/discover-agent-modes/lib/discovery_core.md
```

Test:

```
/discover design a minimal kernel architecture
```

### OpenCode

```bash
mkdir -p .opencode/rules
cp discovery-experiment/discover-agent-modes/lib/discovery_core.md .opencode/rules/discovery-mode.md
```

### Antigravity

Paste `discovery-experiment/discover-agent-modes/lib/discovery_core.md` into custom instructions.

### ChatGPT / Claude Web

1. Paste `DISCOVER_WEB_ACTIVATION.md` into chat
2. Then type: `/discover <task>`

---

## Validate

```bash
# Show expected output
node discovery-experiment/discover-agent-modes/reality_test.js --all

# Validate agent output
node discovery-experiment/discover-agent-modes/reality_test.js --check response.txt
```

---

## Pitch

> "Add `/discover` to any coding agent — structured reasoning from first principles. No install, no API, just one file."

### Use Cases

- **System design:** `/discover design a minimal kernel architecture`
- **Architecture:** `/discover new approach to system design patterns`
- **Security:** `/discover analyze this APK for dangerous permissions`
- **Unknown topics:** `/discover [anything the agent hasn't memorized]`

---

## File Structure After Install

```
discovery-experiment/
├── discover-agent-modes/
│   ├── lib/
│   │   └── discovery_core.md       ← Canonical protocol (this is what agents load)
│   ├── codex-discovery-mode.md     ← Install instructions for Codex
│   ├── opencode-discovery-mode.md  ← Install instructions for OpenCode
│   ├── antigravity-discovery-mode.md← Install instructions for Antigravity
│   └── reality_test.js             ← Validates agent output
├── DISCOVER_AGENT_PLUGIN.md        ← Unified documentation
├── DISCOVER_WEB_ACTIVATION.md      ← ChatGPT/Claude web prompt
└── HOW_TO_USE_AND_PUBLISH.md       ← This file
```

## Notes

- The CLI engine at `cli.js` and server at `server.js` still exist for programmatic benchmarks
- Web activation prompt `DISCOVER_WEB_ACTIVATION.md` is a prompt imitation, not the real engine
- All three agent wrappers reference `lib/discovery_core.md` — update one file to update all agents