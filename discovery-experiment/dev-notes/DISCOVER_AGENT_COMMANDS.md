# Bring `/discover` To Coding Agents

This is the official integration path for Codex, OpenCode, and Antigravity.

The agent must call the local CLI engine. Do not copy or rewrite the internal prompts inside the agent.

## What The Agent Does

When the user writes:

```text
/discover <task>
```

the agent runs:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover <task>"
```

Then the agent returns the CLI output to the user.

## Codex

Use this command from any Codex task:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover i need pure assembly kernel full architecture"
```

Codex rule:

```text
If the user starts with /discover, call the Discovery CLI. Do not answer normally.
```

## OpenCode

Use the same CLI command:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover i have an unknown apk and need to defensively find malware access and risky permissions"
```

OpenCode rule:

```text
/discover is an external tool command. Run the local CLI and summarize the result only after the CLI returns.
```

## Antigravity

Use the same CLI command:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover create a pure assembly kernel but do not copy the usual OS tutorial pattern"
```

Antigravity rule:

```text
Route /discover prompts to the Discovery CLI. Keep the full trace: unknowns, default pattern, strategy, hypotheses, validation, final answer.
```

## Model Switch

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model openai/gpt-5-mini "/discover your prompt"
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model anthropic/claude-sonnet-4.5 "/discover your prompt"
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover your prompt"
```

## Important Boundary

This does not install a plugin into Codex/OpenCode/Antigravity.

It gives every coding agent the same portable command:

```text
/discover -> run local CLI -> return Discovery trace
```
