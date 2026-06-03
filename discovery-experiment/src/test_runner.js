'use strict';

const standardMode = require('./standard_mode');
const discoveryMode = require('./discovery_mode');

const VALID_ROUNDS = ['abbreviations', 'vague_terms', 'code_concepts', 'trick_ambiguous'];

/**
 * Evaluate correctness of a returned answer against the expected answer.
 *
 * - If expectedAnswer is null, undefined, or empty string → return null
 * - If returnedAnswer is null, undefined, or empty string → return false
 * - Otherwise → return boolean (case-insensitive substring match)
 *
 * @param {string|null|undefined} expectedAnswer
 * @param {string|null|undefined} returnedAnswer
 * @returns {boolean|null}
 */
function evaluateCorrectness(expectedAnswer, returnedAnswer) {
  // Null/undefined/empty expected → correctness is unknowable
  if (expectedAnswer == null || expectedAnswer === '') {
    return null;
  }

  // Null/undefined/empty returned → definitely wrong
  if (returnedAnswer == null || returnedAnswer === '') {
    return false;
  }

  return returnedAnswer.toLowerCase().includes(expectedAnswer.toLowerCase());
}

/**
 * Run all test cases sequentially, evaluating both standard and discovery modes.
 *
 * @param {string} model                  - Model identifier
 * @param {Array<object>} testCases       - Array of TestCase objects
 * @param {object} prompts                - Loaded prompt templates
 * @param {object} scorecardInstance      - Scorecard instance with a merge() method
 * @returns {Promise<Array<object>>}      - Array of ResultRecord objects
 */
async function runAll(model, testCases, prompts, scorecardInstance) {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    // 1. Validate required fields
    if (
      testCase.test_id == null ||
      testCase.input == null ||
      testCase.expected_answer == null ||
      testCase.round == null
    ) {
      console.warn(`Warning: Skipping test case at index ${i}: missing required fields`);
      continue;
    }

    // 2. Validate round value
    if (!VALID_ROUNDS.includes(testCase.round)) {
      console.warn(
        `Warning: Skipping test case ${testCase.test_id}: unrecognized round value '${testCase.round}'`
      );
      continue;
    }

    // 3. Run standard mode
    const standardResult = await standardMode.run(testCase.input, model, prompts);

    // 4. Run discovery mode
    const discoveryResult = await discoveryMode.run(testCase.input, model, prompts);

    // 5. Evaluate standard correctness
    const standardCorrect = evaluateCorrectness(testCase.expected_answer, standardResult.answer);

    // 6. Evaluate discovery correctness
    const discoveryCorrect = evaluateCorrectness(
      testCase.expected_answer,
      discoveryResult.final_answer
    );

    // 7. Compute discovery_better tri-state
    let discovery_better;
    if (discoveryCorrect === true && standardCorrect === false) {
      discovery_better = true;
    } else if (standardCorrect === true && discoveryCorrect === false) {
      discovery_better = false;
    } else {
      discovery_better = null;
    }

    // 8. Build result record
    const record = {
      test_id: testCase.test_id,
      input: testCase.input,
      model,
      round: testCase.round,
      standard: {
        answer: standardResult.answer,
        correct: standardCorrect,
      },
      discovery: {
        hypotheses: discoveryResult.hypotheses,
        winner: discoveryResult.winner_id
          ? {
              id: discoveryResult.winner_id,
              score:
                discoveryResult.validations?.find((v) => v.id === discoveryResult.winner_id)
                  ?.score,
            }
          : null,
        final_answer: discoveryResult.final_answer,
        correct: discoveryCorrect,
      },
      discovery_better,
      notes: standardResult.notes || null,
    };

    // 9. Persist via scorecard
    await scorecardInstance.merge(record);

    // 10. Collect result
    results.push(record);

    // Small delay between cases to avoid rate-limiting on free-tier cloud models
    if (i < testCases.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return results;
}

module.exports = { evaluateCorrectness, runAll };
