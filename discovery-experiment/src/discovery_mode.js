'use strict';

const modelAdapter = require('./model_adapter');

/**
 * discovery_mode.js
 *
 * Executes the two-step Discovery pipeline:
 *   1. Hypothesis generation — produce 4 candidate answers
 *   2. Validation — score each hypothesis and pick a winner
 *
 * @param {string} input   - The user input string
 * @param {string} model   - Model identifier (e.g. 'openrouter-free', 'ollama/llama3.2')
 * @param {object} prompts - Loaded prompt templates; requires `prompts.hypothesis` and `prompts.validate`
 * @returns {Promise<DiscoveryResult>}
 */
async function run(input, model, prompts) {
  // ── Step 1: Hypothesis generation ────────────────────────────────────────

  const hypothesisPrompt = prompts.hypothesis.replace('{user_input}', input);
  const hypothesisResult = await modelAdapter.call(model, hypothesisPrompt);

  if (!hypothesisResult.success) {
    const adapterError = hypothesisResult.error;
    return {
      hypotheses: null,
      validations: null,
      winner_id: null,
      final_answer: null,
      confidence: null,
      correct: null,
      error: { reason: adapterError.reason, code: 'network_error', ...adapterError },
    };
  }

  // Extract and parse JSON from response
  let hypotheses;
  try {
    const raw = extractJson(hypothesisResult.text);
    const parsed = JSON.parse(raw);
    // Model may return { hypotheses: [...] } or a raw array — handle both
    hypotheses = Array.isArray(parsed) ? parsed : (parsed.hypotheses || parsed);
  } catch (e) {
    return {
      hypotheses: null,
      validations: null,
      winner_id: null,
      final_answer: null,
      confidence: null,
      correct: null,
      error: { reason: 'Failed to parse hypothesis JSON: ' + e.message, code: 'parse_error' },
    };
  }

  // Validate hypothesis structure
  if (!validateHypotheses(hypotheses)) {
    return {
      hypotheses: null,
      validations: null,
      winner_id: null,
      final_answer: null,
      confidence: null,
      correct: null,
      error: { reason: 'Hypothesis array failed structural validation', code: 'parse_error' },
    };
  }

  // ── Step 2: Validation ────────────────────────────────────────────────────

  // Small pause between the two calls to stay within free-tier rate limits
  await new Promise((r) => setTimeout(r, 1000));

  // Strip 'reasoning' from hypotheses before injecting into validate prompt
  // to avoid prompt injection (long reasoning text can confuse the model)
  const hypothesesForValidation = hypotheses.map(({ id, guess }) => ({ id, guess }));

  const validatePrompt = prompts.validate
    .replace('{user_input}', input)
    .replace('{hypotheses}', JSON.stringify(hypothesesForValidation));

  const validateResult = await modelAdapter.call(model, validatePrompt);

  if (!validateResult.success) {
    const adapterError = validateResult.error;
    return {
      hypotheses: null,
      validations: null,
      winner_id: null,
      final_answer: null,
      confidence: null,
      correct: null,
      error: { reason: adapterError.reason, code: 'network_error', ...adapterError },
    };
  }

  // Extract and parse JSON from response
  let parsed;
  try {
    const raw = extractJson(validateResult.text);
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      hypotheses: null,
      validations: null,
      winner_id: null,
      final_answer: null,
      confidence: null,
      correct: null,
      error: { reason: 'Failed to parse validation JSON: ' + e.message, code: 'validation_error' },
    };
  }

  // Validate the parsed validation object
  const hypothesisIds = hypotheses.map((h) => h.id);
  const validationError = validateValidationObject(parsed, hypothesisIds);
  if (validationError) {
    console.log('Validation error:', validationError);
    return {
      hypotheses: null,
      validations: null,
      winner_id: null,
      final_answer: null,
      confidence: null,
      correct: null,
      error: { reason: validationError, code: 'validation_error' },
    };
  }

  return {
    hypotheses,
    validations: parsed.validations,
    winner_id: parsed.winner_id,
    final_answer: parsed.final_answer,
    confidence: parsed.confidence,
    correct: null,
    error: null,
  };
}

/**
 * Strip markdown fences and any leading/trailing non-JSON text from LLM responses.
 *
 * @param {string} text
 * @returns {string}
 */
function extractJson(text) {
  // First try to extract from markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find the first { or [ and last matching } or ]
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');

  let start = -1;
  let closing = '';
  if (firstBrace === -1 && firstBracket === -1) return text.trim();
  if (firstBrace === -1) { start = firstBracket; closing = ']'; }
  else if (firstBracket === -1) { start = firstBrace; closing = '}'; }
  else if (firstBrace < firstBracket) { start = firstBrace; closing = '}'; }
  else { start = firstBracket; closing = ']'; }

  const end = text.lastIndexOf(closing);
  if (end === -1 || end < start) return text.trim();

  return text.slice(start, end + 1).trim();
}

/**
 * Validate the hypothesis array: must be exactly 4 objects, each with
 * id (integer 1–4, unique), guess (non-empty string), reasoning (non-empty string).
 *
 * @param {*} hypotheses
 * @returns {boolean} true if valid
 */
function validateHypotheses(hypotheses) {
  if (!Array.isArray(hypotheses) || hypotheses.length !== 4) {
    return false;
  }

  const ids = new Set();
  for (const h of hypotheses) {
    if (typeof h !== 'object' || h === null) return false;
    if (!Number.isInteger(h.id) || h.id < 1 || h.id > 4) return false;
    if (ids.has(h.id)) return false; // duplicate id
    ids.add(h.id);
    if (typeof h.guess !== 'string' || h.guess.trim() === '') return false;
    if (typeof h.reasoning !== 'string' || h.reasoning.trim() === '') return false;
  }

  return true;
}

/**
 * Validate the validation response object.
 * Returns a human-readable error string if invalid, or null if valid.
 *
 * @param {*} obj
 * @param {number[]} hypothesisIds
 * @returns {string|null}
 */
function validateValidationObject(obj, hypothesisIds) {
  if (typeof obj !== 'object' || obj === null) {
    return 'Validation response is not an object';
  }

  // Check validations array
  if (!Array.isArray(obj.validations) || obj.validations.length !== 4) {
    return 'validations must be an array of exactly 4 items';
  }

  for (const v of obj.validations) {
    if (typeof v !== 'object' || v === null) {
      return 'Each validation item must be an object';
    }
    if (!hypothesisIds.includes(v.id)) {
      return `Validation item id ${v.id} does not match any hypothesis id`;
    }
    if (!Number.isInteger(v.score) || v.score < 0 || v.score > 100) {
      return `Validation score ${v.score} is not an integer in range 0–100`;
    }
  }

  // Check winner_id
  if (!hypothesisIds.includes(obj.winner_id)) {
    return `winner_id ${obj.winner_id} does not match any hypothesis id`;
  }

  // Check final_answer
  if (typeof obj.final_answer !== 'string' || obj.final_answer.trim() === '') {
    return 'final_answer must be a non-empty string';
  }

  // Check confidence
  if (!Number.isInteger(obj.confidence) || obj.confidence < 0 || obj.confidence > 100) {
    return `confidence ${obj.confidence} is not an integer in range 0–100`;
  }

  return null;
}

module.exports = { run, extractJson };
