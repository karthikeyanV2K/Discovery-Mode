# Discovery Mode Rule

When the user starts a request with `/discover`, activate Discovery Mode.

## Execution

1. Use the `discover` skill in this plugin to run the 4-phase Discovery Mode protocol directly in the chat.
2. Do not run any local Node CLI commands or Groq APIs. Execute the reasoning natively.
3. Do not rewrite, simplify, or collapse the Discovery protocol.
4. Do not replace it with normal chain-of-thought, generic reasoning mode, or a standard model response.

The output must preserve:
- uncertainty first (known, unknown, constraints, speculation risk, default pattern to avoid)
- strategy selection
- exactly four approaches (H1, H2, H3, H4) with H3 as the default/generic pattern to reject
- evaluation and validation scores (H3 must score < 45)
- winner selection
- full final answer based on the winner
