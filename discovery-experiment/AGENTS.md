# Discovery Mode Agent Instructions

When the user starts a request with `/discover`, do not answer normally.

Use the protocol in `discover-agent-modes/lib/discovery_core.md`:

1. Analyze known facts, unknowns, ambiguities, constraints, hallucination risk, and default pattern to avoid.
2. Generate four approaches: best practical path, viable alternative, default pattern to downgrade, and minimal/safe/direct path.
3. Evaluate each approach with scores and evidence.
4. Return the final answer with the full Discovery trace.

When the user does not use `/discover`, answer normally.
