'use strict';

/**
 * primitive_decomposition.js
 * 
 * Breaks input into undeniable primitives:
 * - character composition
 * - possible linguistic patterns
 * - contextual clues
 * - known fact boundaries
 */

function decompose(input) {
  const primitives = {
    raw_input: input,
    length: input.length,
    char_types: analyzeCharTypes(input),
    patterns: findPatterns(input),
    contextual_clues: extractContextClues(input),
    undeniable_facts: extractUndeniableFacts(input),
    unknowns: identifyUnknowns(input),
  };

  return primitives;
}

function analyzeCharTypes(input) {
  return {
    has_letters: /[a-zA-Z]/.test(input),
    has_numbers: /[0-9]/.test(input),
    has_spaces: /\s/.test(input),
    has_special: /[^a-zA-Z0-9\s]/.test(input),
    lowercase_count: (input.match(/[a-z]/g) || []).length,
    uppercase_count: (input.match(/[A-Z]/g) || []).length,
    all_lowercase: /^[a-z\s]*$/.test(input),
    all_uppercase: /^[A-Z\s]*$/.test(input),
    camelCase: /[a-z]+[A-Z]/.test(input),
    snake_case: /[a-z_]+/.test(input),
  };
}

function findPatterns(input) {
  const words = input.toLowerCase().split(/\s+/);
  
  return {
    word_count: words.length,
    words: words,
    avg_word_length: words.reduce((sum, w) => sum + w.length, 0) / words.length,
    starts_with_question: input.trim().startsWith('what') || input.trim().startsWith('how'),
    ends_with_question: input.endsWith('?'),
    looks_like_abbreviation: input.length <= 4 && /^[a-z0-9]+$/.test(input),
    looks_like_technical: /[a-z]+\d+|[A-Z]{2,}/.test(input),
    looks_like_phrase: words.length > 2,
    looks_like_proper_noun: /^[A-Z]/.test(input),
  };
}

function extractContextClues(input) {
  const lower = input.toLowerCase();
  
  return {
    contains_programming_keywords: /kernel|api|library|framework|language|package|module|function|code|cpu|gpu|tpu|memory|model|ai|reasoning|training/.test(lower),
    contains_hardware_keywords: /cpu|gpu|tpu|chip|processor|memory|cache|core/.test(lower),
    contains_question_words: /what|how|why|when|where|who|is|can|should/.test(lower),
    contains_tech_field_hints: /pure|assembly|architecture|create|build|design|implement|model|ai|traditional|reasoning|training|discover/.test(lower),
    implied_domain: inferDomain(lower),
  };
}

function inferDomain(lower) {
  if (/ai|model|reasoning|training|discover|traditional/.test(lower)) return 'ai_architecture';
  if (/kernel|cpu|gpu|memory|assembly/.test(lower)) return 'systems';
  if (/api|library|framework|package|module/.test(lower)) return 'software';
  if (/architecture|design|protocol|network/.test(lower)) return 'architecture';
  if (/tpu|processor|chip|quantum/.test(lower)) return 'hardware';
  if (/language|syntax|compile/.test(lower)) return 'programming';
  return 'unknown';
}

function extractUndeniableFacts(input) {
  return {
    input_exists: true,
    input_has_length: input.length > 0,
    input_is_string: typeof input === 'string',
    language_likely_english: /[a-zA-Z]/.test(input),
    contains_characters: input.length > 0,
    contains_words: input.split(/\s+/).length > 0,
  };
}

function identifyUnknowns(input) {
  const lower = input.toLowerCase();
  
  // Words we cannot confidently interpret without more context
  const ambiguous_words = [];
  
  if (/^[a-z0-9]{2,4}$/.test(lower)) {
    ambiguous_words.push('abbreviation_meaning');
  }
  if (/kernel|tpu|architecture/.test(lower)) {
    ambiguous_words.push('specific_implementation');
  }
  if (/current|latest|new/.test(lower)) {
    ambiguous_words.push('temporal_reference');
  }
  if (/ai|model|traditional|reasoning|discover/.test(lower)) {
    ambiguous_words.push('architecture_definition');
  }
  
  return ambiguous_words;
}

module.exports = { decompose };
