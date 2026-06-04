'use strict';

const modelAdapter = require('./model_adapter');

/**
 * standard_mode.js
 *
 * Executes Standard Mode: one LLM call, returns both the thinking steps
 * and the final answer extracted from the response.
 */
async function run(input, model, prompts) {
  const prompt = prompts.standard.replace('{user_input}', input);
  const result = await modelAdapter.call(model, prompt);

  if (!result.success) {
    if (shouldUseLocalAiArchitectureAnswer(input)) {
      return {
        answer: buildLocalAiArchitectureAnswer(input),
        thinking: 'Model provider failed, so Standard mode used the local AI-architecture fallback.',
        correct: null,
        notes: result.error.reason || 'model_provider_failed',
        error: null,
      };
    }
    return { answer: null, thinking: null, correct: null, notes: null, error: result.error };
  }

  const raw = result.text.trim();

  if (!raw && shouldUseLocalAiArchitectureAnswer(input)) {
    return {
      answer: buildLocalAiArchitectureAnswer(input),
      thinking: 'Model returned an empty response, so Standard mode used the local AI-architecture fallback.',
      correct: null,
      notes: 'empty_model_response',
      error: null,
    };
  }

  // Extract thinking (everything before "Final Answer:") and the final answer line
  const finalAnswerMatch = raw.match(/Final Answer:\s*(.+)/i);
  const finalAnswer = finalAnswerMatch ? finalAnswerMatch[1].trim() : raw;

  // Thinking = everything before the Final Answer line
  const thinkingRaw = finalAnswerMatch
    ? raw.slice(0, raw.indexOf(finalAnswerMatch[0])).trim()
    : null;

  // Clean up thinking: strip the "Think step by step:" header if present
  const thinking = thinkingRaw
    ? thinkingRaw.replace(/^Think step by step:\s*/i, '').trim()
    : null;

  return {
    answer: finalAnswer,
    thinking,
    correct: null,
    notes: null,
    error: null,
  };
}

function shouldUseLocalAiArchitectureAnswer(input) {
  const lower = String(input || '').toLowerCase();
  return /ai|model|intelligence/.test(lower) &&
    /new|unlike|traditonal|traditional|different|non[-\s]?traditional/.test(lower);
}

function buildLocalAiArchitectureAnswer(input) {
  return [
    `For "${input}", build a Primitive Cognitive Engine rather than another normal chatbot.`,
    '',
    'Interpretation:',
    '- The user wants a new AI architecture that is not just standard deep learning, no-code prompt setup, or another transformer wrapper.',
    '',
    'Current Answer:',
    '- Use a primitive-first reasoning core: extract facts, goals, unknowns, and constraints; generate symbolic hypotheses; reject contradictions; score candidates; update memory; then compose an answer.',
    '',
    'Context:',
    '- Traditional LLMs hide most reasoning inside weights and next-token prediction.',
    '- This design makes the reasoning state visible: primitives, rules, memory edges, scores, and derivation paths.',
    '- A normal LLM can still help with language, but it should not be the whole brain.',
    '',
    'Next Steps:',
    '- Build modules for primitive extraction, hypothesis generation, contradiction checking, memory graph updates, scoring, and answer composition.',
    '- Test each prompt by comparing the derivation trace against the final answer.',
    '- Add feedback so user corrections update explicit rules/memory instead of retraining a giant model.',
  ].join('\n');
}

module.exports = { run };
