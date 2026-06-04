'use strict';

const derivationEngine = require('./derivation_engine');
const modelAdapter = require('./model_adapter');

async function run(input, model, prompts) {
  try {
    const derivationResult = await derivationEngine.deriveFromPrimitives(input);

    if (!derivationResult.hypotheses || derivationResult.hypotheses.length === 0) {
      const fullContextAnswer = buildFullContextAnswer(input, null, null, null);
      return {
        input,
        primitives: derivationResult.primitives,
        hypotheses: [],
        derivation_stats: derivationResult.consistency_stats,
        derivation_source: 'primitives',
        ai_validation: null,
        final_answer: fullContextAnswer.final_answer,
        full_context_answer: fullContextAnswer,
        confidence: fullContextAnswer.confidence,
        reasoning_chain: null,
        warning: 'Could not derive any logically consistent hypotheses',
        error: null,
      };
    }

    const validationPrompt = buildValidationPrompt(
      input,
      derivationResult.hypotheses,
      derivationResult.primitives
    );

    const validationResult = await modelAdapter.call(model, validationPrompt);

    if (!validationResult.success) {
      const errorMsg = typeof validationResult.error === 'string'
        ? validationResult.error
        : (validationResult.error.reason || JSON.stringify(validationResult.error));
      const fullContextAnswer = buildFullContextAnswer(
        input,
        derivationResult,
        derivationResult.hypotheses[0],
        null
      );

      return {
        input,
        primitives: derivationResult.primitives,
        hypotheses: derivationResult.hypotheses,
        derivation_stats: derivationResult.consistency_stats,
        derivation_source: 'primitives',
        ai_validation: null,
        final_answer: fullContextAnswer.final_answer,
        full_context_answer: fullContextAnswer,
        confidence: fullContextAnswer.confidence,
        reasoning_chain: buildReasoningChain(),
        warning: `AI validation failed: ${errorMsg}`,
        error: null,
      };
    }

    let validation;
    try {
      validation = parseJsonFromModelText(validationResult.text);
    } catch (e) {
      const fullContextAnswer = buildFullContextAnswer(
        input,
        derivationResult,
        derivationResult.hypotheses[0],
        null
      );

      return {
        input,
        primitives: derivationResult.primitives,
        hypotheses: derivationResult.hypotheses,
        derivation_stats: derivationResult.consistency_stats,
        derivation_source: 'primitives',
        ai_validation: { raw_response: validationResult.text },
        final_answer: fullContextAnswer.final_answer,
        full_context_answer: fullContextAnswer,
        confidence: fullContextAnswer.confidence,
        reasoning_chain: buildReasoningChain(),
        warning: `Failed to parse AI validation: ${e.message}`,
        error: null,
      };
    }

    const winnerHypothesis = derivationResult.hypotheses.find(
      (h) => h.id === validation.winner_id
    ) || derivationResult.hypotheses[0];

    const fullContextAnswer = buildFullContextAnswer(
      input,
      derivationResult,
      winnerHypothesis,
      validation
    );

    return {
      input,
      primitives: derivationResult.primitives,
      hypotheses: derivationResult.hypotheses,
      derivation_stats: derivationResult.consistency_stats,
      derivation_source: 'primitives_with_ai_validation',
      winner_hypothesis: winnerHypothesis,
      validation,
      final_answer: fullContextAnswer.final_answer,
      full_context_answer: fullContextAnswer,
      confidence: fullContextAnswer.confidence,
      reasoning_chain: buildReasoningChain(),
      error: null,
    };
  } catch (err) {
    const fullContextAnswer = buildFullContextAnswer(input, null, null, null);
    return {
      primitives: null,
      hypotheses: null,
      derivation_source: 'primitives',
      final_answer: fullContextAnswer.final_answer,
      full_context_answer: fullContextAnswer,
      confidence: fullContextAnswer.confidence,
      warning: err.message,
      error: null,
    };
  }
}

function buildValidationPrompt(input, hypotheses, primitives) {
  const hypothesesList = hypotheses
    .map(
      (h, idx) =>
        `${idx + 1}. ${h.guess}\n   Derivation path: ${h.derivation_path}\n   Reasoning: ${h.reasoning}`
    )
    .join('\n\n');

  return `You are given an input and hypotheses that were DERIVED FROM FIRST PRINCIPLES (primitives, not from training knowledge).

INPUT: ${input}

INPUT PRIMITIVES:
- Character types: ${JSON.stringify(primitives.char_types, null, 2)}
- Patterns: ${JSON.stringify(primitives.patterns, null, 2)}
- Domain hints: ${primitives.contextual_clues.implied_domain}
- Unknowns: ${JSON.stringify(primitives.unknowns)}

HYPOTHESES (derived from logical rules, not training):
${hypothesesList}

Your task:
1. Evaluate which hypothesis is MOST LIKELY to be correct.
2. Score each from 0-100 based on how well it matches the input.
3. Pick the winner.
4. Provide a full current answer with practical context, not a short line.

RESPOND ONLY with this JSON (no markdown):
{
  "hypothesis_scores": [
    {"id": 1, "score": 0, "evidence": "..."},
    {"id": 2, "score": 0, "evidence": "..."},
    {"id": 3, "score": 0, "evidence": "..."},
    {"id": 4, "score": 0, "evidence": "..."}
  ],
  "winner_id": 1,
  "final_answer": "A detailed answer with direct answer, context, constraints, uncertainty, and next steps.",
  "confidence": 0,
  "derivation_note": "How this answer was arrived at through the derived hypotheses",
  "next_steps": ["first practical next action", "second practical next action"]
}`;
}

function extractJson(text) {
  const jsonMatch = String(text || '').match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  return jsonMatch[0];
}

function parseJsonFromModelText(text) {
  const raw = extractJson(text);
  const attempts = [
    raw,
    raw
      .replace(/\u201c|\u201d/g, '"')
      .replace(/\u2018|\u2019/g, "'")
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":'),
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

function buildFullContextAnswer(input, derivationResult, winnerHypothesis, validation) {
  const primitives = derivationResult && derivationResult.primitives;
  const hypotheses = (derivationResult && derivationResult.hypotheses) || [];
  const stats = (derivationResult && derivationResult.consistency_stats) || {};
  const domain = primitives && primitives.contextual_clues
    ? primitives.contextual_clues.implied_domain
    : 'unknown';
  const unknowns = primitives && Array.isArray(primitives.unknowns)
    ? primitives.unknowns
    : [];
  const best = winnerHypothesis || hypotheses[0] || null;
  const confidence = validation && Number.isInteger(validation.confidence)
    ? validation.confidence
    : best
      ? 72
      : 35;

  const interpretation = best
    ? `The input is best interpreted as: ${best.guess}.`
    : 'The input asks for a complete answer, but the current primitive rules did not derive a strong hypothesis.';

  const directAnswer = validation && validation.final_answer
    ? validation.final_answer
    : domain === 'ai_architecture'
      ? buildAiArchitectureAnswer(input)
      : best
        ? `Current answer: ${best.guess}. ${best.reasoning}`
        : `Current answer for "${input}": more derived structure is needed before making a confident claim.`;

  const context = [
    `Input: ${input}`,
    `Inferred domain: ${domain}`,
    `Generated hypotheses: ${stats.total_generated || hypotheses.length}`,
    `Logically consistent hypotheses: ${stats.logically_consistent != null ? stats.logically_consistent : hypotheses.filter((h) => !h.contradicts).length}`,
    unknowns.length ? `Unknowns to resolve: ${unknowns.join(', ')}` : 'Unknowns to resolve: none explicitly detected',
  ];

  const derivation = hypotheses.map((h) => (
    `H${h.id}: ${h.guess} | path=${h.derivation_path} | ${h.reasoning}`
  ));

  const nextSteps = validation && Array.isArray(validation.next_steps)
    ? validation.next_steps
    : [
        'Keep the run alive even when model JSON is malformed.',
        domain === 'ai_architecture'
          ? 'Implement the first runnable core: primitive extractor, hypothesis generator, contradiction checker, memory graph, score function, and answer composer.'
          : 'Expand primitive rules so the engine derives richer hypotheses before AI validation.',
        domain === 'ai_architecture'
          ? 'Test it on unknown prompts and compare whether answers come from derivation traces instead of model recall.'
          : 'Use the full context answer as the visible output instead of only a one-sentence final answer.',
      ];

  return {
    interpretation,
    direct_answer: directAnswer,
    context,
    derivation,
    uncertainty: unknowns.length
      ? `Confidence is limited by: ${unknowns.join(', ')}.`
      : 'Confidence is based on primitive-rule consistency and optional AI validation.',
    next_steps: nextSteps,
    confidence,
    final_answer: [
      directAnswer,
      '',
      'Context:',
      ...context.map((line) => `- ${line}`),
      '',
      'Derivation:',
      ...(derivation.length ? derivation.map((line) => `- ${line}`) : ['- No derivation available.']),
      '',
      'Next steps:',
      ...nextSteps.map((line) => `- ${line}`),
    ].join('\n'),
  };
}

function buildAiArchitectureAnswer(input) {
  return [
    `Current answer for "${input}": build a Primitive Cognitive Engine, not another normal chatbot model.`,
    '',
    'Core idea: the model should not start by predicting the next token. It should start by breaking the input into primitive facts, unknowns, goals, constraints, and possible operators. Then it derives candidate answers, rejects contradictions, updates memory, and only uses a normal LLM as an optional language/validation layer.',
    '',
    'Architecture:',
    '1. Perception layer: normalize the user input, detect intent, domain, spelling noise, time references, and unknown terms.',
    '2. Primitive layer: convert the input into facts such as "user wants creation", "target is AI model", "constraint is non-traditional", "missing detail is architecture definition".',
    '3. Reasoning layer: apply operators like decompose, compare, combine, simulate, contradict, generalize, and plan.',
    '4. Hypothesis layer: produce multiple candidate designs, each with a derivation path and confidence score.',
    '5. Memory graph: store concepts, failed guesses, accepted rules, examples, and user corrections as explicit nodes/edges.',
    '6. Critic layer: test every candidate against constraints: does it answer the user, does it contradict known facts, is it implementable, what is missing.',
    '7. Composer layer: turn the winning derivation into a useful answer with context and next steps.',
    '',
    'Learning loop:',
    'Input -> primitives -> hypotheses -> contradiction tests -> scored winner -> answer -> feedback -> memory/rule update.',
    '',
    'Why this is unlike traditional AI: normal LLM behavior hides reasoning inside weights and guesses fluent text. This design exposes the reasoning path, keeps symbolic state, can reject its own bad hypotheses, and can improve rules from feedback without retraining a giant model.',
    '',
    'First build target: implement a small JavaScript core that takes one prompt, returns primitives, four derived hypotheses, contradiction results, a confidence score, a final answer, and a memory update proposal. That becomes the seed of the new model.',
  ].join('\n');
}

function buildReasoningChain() {
  return {
    step1: 'Derived hypotheses from primitives and intent rules.',
    step2: 'Tested each hypothesis for logical contradictions.',
    step3: 'Filtered and filled context so the UI has enough live material.',
    step4: 'AI validation scores the derived options when available.',
  };
}

module.exports = { run };
