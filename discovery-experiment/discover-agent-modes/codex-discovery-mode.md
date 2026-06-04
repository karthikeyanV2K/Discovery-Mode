# Codex x Discovery Mode

## Overview

Adds `/discover` behavior to Codex for this project.

When invoked, Codex replaces its normal response with the structured Discovery Mode protocol.

## Important

This installed Codex CLI does not support the old slash-learn add-file style command.

Use one of the real paths below.

## Path 1: Project Instructions

Keep this file in the project:

```text
AGENTS.md
```

It tells Codex to use the canonical protocol:

```text
discover-agent-modes/lib/discovery_core.md
```

Then ask Codex:

```text
/discover design a minimal kernel architecture
```

## Path 2: Manual Session Activation

Paste the contents of:

```text
discover-agent-modes/lib/discovery_core.md
```

into the Codex session, then use:

```text
/discover design a minimal kernel architecture
```

## Path 3: Local CLI Engine

Run the real Discovery engine:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover design a minimal kernel architecture"
```

## Expected Output

Codex should return:

```text
ANALYSIS
APPROACHES
EVALUATION
FINAL ANSWER
```

Expected behavior: staged architecture trace such as `boot -> loader -> CPU -> core -> drivers -> shell`, not a one-line answer.
