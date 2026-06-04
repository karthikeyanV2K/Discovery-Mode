# Discovery Mode Portable Plugin Pack

This pack is not npm.

It contains plain files that bring `/discover` into:

- Codex
- OpenCode
- Antigravity
- ChatGPT web
- Claude web

## GitHub Links

Main repo:

```text
https://github.com/karthikeyanV2K/Theory-Of-Hallucation
```

Raw browser activation for Claude.com / ChatGPT.com:

```text
https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/portable-plugin-pack/browser/discover-web-activation.md
```

One-shot browser prompt:

```text
https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/portable-plugin-pack/browser/discover-one-shot-prompt.md
```

Raw core protocol:

```text
https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/discover-agent-modes/lib/discovery_core.md
```

## Codex

Use the local Codex plugin:

```text
plugins/discovery-mode/
```

Or copy the protocol into project instructions:

```text
../AGENTS.md
```

## OpenCode

Copy:

```text
opencode/discovery-mode.md
```

to:

```text
.opencode/rules/discovery-mode.md
```

## Antigravity

Paste:

```text
antigravity/discovery-mode.md
```

into Antigravity custom instructions.

## Claude.com / ChatGPT.com

Open and copy:

```text
browser/discover-web-activation.md
```

Paste it into the browser chat once. The model should reply:

```text
/discover mode active. Send /discover <task>.
```

Then use:

```text
/discover your task
```

If it summarizes the file, it did not activate. Paste the file contents directly instead of asking it to read the link.

## Local Engine

For repeatable benchmark-grade output:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover your task"
```
