'use strict';

const modelAdapter = require('./model_adapter');

/**
 * standard_mode.js
 *
 * Executes Standard Mode: one LLM call, trim whitespace, return raw response.
 * Detects multi-sentence responses and adds a warning note.
 *
 * @param {string} input        - The user input string
 * @param {string} model        - Model identifier (e.g. 'openrouter-free', 'ollama/llama3.2')
 * @param {object} prompts      - Loaded prompt templates; requires `prompts.standard`
 * @returns {Promise<{ answer: string|null, correct: null, notes: string|null, error: object|null }>}
 */
async function run(input, model, prompts) {
  // Build prompt by substituting {user_input} in the standard template
  const prompt = prompts.standard.replace('{user_input}', input);

  // Call the model adapter
  const result = await modelAdapter.call(model, prompt);

  // On failure, return structured error record
  if (!result.success) {
    return {
      answer: null,
      correct: null,
      notes: null,
      error: result.error,
    };
  }

  // Trim whitespace from response
  const answer = result.text.trim();

  // Multi-sentence heuristic:
  // Count sentence-ending punctuation (., !, ?) followed by whitespace or end of string.
  // If more than one such sequence is found, add a warning note.
  const sentenceEndPattern = /[.!?](?:\s|$)/g;
  const matches = answer.match(sentenceEndPattern);
  const sentenceCount = matches ? matches.length : 0;

  const notes =
    sentenceCount > 1
      ? 'Warning: model returned more than one sentence'
      : null;

  return {
    answer,
    correct: null,
    notes,
    error: null,
  };
}

module.exports = { run };
