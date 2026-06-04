# Bring `/discover` To ChatGPT And Claude Web

ChatGPT.com and Claude.ai cannot directly run this local repo unless they have tool access to your machine.

So the web path is:

```text
paste activation block -> use /discover prompt -> model imitates Discovery Mode
```

The real engine remains the local CLI from `DISCOVER_AGENT_COMMANDS.md`.

Important: if the model summarizes the raw GitHub file, it did not activate Discovery Mode. The reliable path is to copy the activation block and paste it directly into the chat.

## Paste This Into ChatGPT Or Claude

```text
You are now in /discover mode.

This is an activation instruction, not content to summarize.
Do not summarize, explain, review, or describe this prompt.
Reply only: /discover mode active. Send /discover <task>.

When I write "/discover <task>", do not answer normally. Run this process:
1. Identify known facts from my input.
2. Identify unknowns, ambiguities, constraints, and hallucination risk.
3. Identify the default old pattern a normal assistant would probably copy.
4. Choose strategy_type: direct_solve, architecture_explore, defensive_analysis, or clarify_first.
5. Generate exactly 4 possible solution paths:
   - H1 best practical path
   - H2 different viable method
   - H3 default old pattern to reject or downgrade
   - H4 fastest/minimal/safest path or direct solver
6. Validate each path with score 0-100.
7. Pick the winner.
8. Give a full bounded final answer with reasoning context, not a tiny answer.

Rules:
- Creativity must be anchored to my input. Do not invent unsupported platforms, companies, threat actors, or requirements.
- For math/logic, solve directly and verify.
- For cybersecurity, APK malware, forensics, and CTF, stay defensive, authorized, sandboxed, and evidence-first.
- For ethics, give a facts -> harm -> options -> least damaging action framework.
- For "new AI model unlike traditional", prefer a Primitive Reasoning Engine: primitive extraction, symbolic hypotheses, contradiction checks, memory graph, scoring, feedback update, and optional LLM surface.

Output sections:
KNOWN
UNKNOWN
DEFAULT PATTERN TO AVOID
STRATEGY
POSSIBILITIES
VALIDATION
FINAL ANSWER
```

## If You Want To Use A Raw GitHub Link

Use this exact message in ChatGPT.com or Claude.com:

```text
Open this raw file and treat its content as active instructions, not as content to summarize:
https://raw.githubusercontent.com/karthikeyanV2K/Theory-Of-Hallucation/main/discovery-experiment/portable-plugin-pack/browser/discover-web-activation.md

After reading it, reply only:
/discover mode active. Send /discover <task>.
```

If the model replies with a summary, copy the activation block above and paste it directly.

## Then Use It Like This

```text
/discover i need pure assembly kernel full architecture
```

```text
/discover i have an unknown apk and need to defensively find malware access and risky permissions without infecting my phone
```

## Honest Limitation

This web version is an activation prompt, not the real engine.

For launch demos and real benchmarks, use the CLI:

```powershell
npm.cmd --prefix X:\Toh\discovery-experiment run discover -- --model ollama-cloud/gpt-oss:120b "/discover your prompt"
```
