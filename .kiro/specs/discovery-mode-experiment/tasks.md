# Implementation Plan: Discovery Mode Experiment

## Overview

Build a Node.js + Express backend with a vanilla HTML frontend that empirically compares Standard Mode (single LLM call) against Discovery Mode (two-call pipeline) across four test rounds. No build step. All LLM calls via raw `fetch`. Supported models: `openrouter-free` (OpenRouter free tier) and `ollama/llama3.2` (local Ollama only).

## Tasks

- [x] 1. Project scaffold — package.json, folder structure, .env setup
  - Create `package.json` with `name`, `version`, `type: "module"` (or CommonJS), `main: "server.js"`, and dependencies: `express`, `dotenv`, `fast-check` (devDependency), `jest` or `vitest` (devDependency)
  - Create directory structure: `prompts/`, `tests/unit/`, `tests/integration/`, `public/` (optional static dir)
  - Create `.env` file with placeholder keys: `OPENROUTER_API_KEY=` and `OLLAMA_URL=http://localhost:11434`
  - Create `.env.example` documenting required env vars
  - Create `.gitignore` excluding `node_modules/`, `.env`, `tests/results.json`
  - Add `test` script in `package.json`: `"test": "vitest --run"` (or `jest --runInBand`)
  - _Requirements: 4.3, 7.1, 7.2, 7.3_

- [x] 2. Implement `prompt_loader.js`
  - [x] 2.1 Write `prompt_loader.js` — load and validate all three prompt files
    - Export `async function loadAll(baseDir = 'prompts')` returning `{ standard, hypothesis, validate }`
    - Read each file with `fs.readFile`; throw on ENOENT with message `"Error: Required prompt file not found: prompts/<name>.txt"`
    - Throw on empty content with message `"Error: Prompt file is empty: prompts/<name>.txt"`
    - Throw on other I/O errors with message `"Error: Cannot read prompt file: prompts/<name>.txt — <system error>"`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 2.2 Write unit tests for `prompt_loader.js`
    - Test: correct error message when file is missing (ENOENT)
    - Test: correct error message when file is empty
    - Test: correct error message on permissions/I/O error
    - Test: successful load returns `{ standard, hypothesis, validate }` with correct string content
    - _Requirements: 7.4, 7.5_

- [x] 3. Implement `model_adapter.js`
  - [x] 3.1 Write `model_adapter.js` — OpenRouter and Ollama routing, timeout, structured errors
    - Export `async function call(model, prompt, timeoutMs = 30000)`
    - Returns `{ success: true, text: string }` or `{ success: false, error: { reason, code, model? } }`
    - Route `openrouter-free` → `https://openrouter.ai/api/v1/chat/completions` with model `"mistralai/mistral-7b-instruct:free"`, headers `Authorization: Bearer <OPENROUTER_API_KEY>` and `Content-Type: application/json`, body `{ model, messages: [{ role: 'user', content: prompt }] }`
    - Route `ollama/llama3.2` → `${OLLAMA_URL}/api/generate` with body `{ model: 'llama3.2', prompt, stream: false }`
    - Unknown model identifier returns `{ success: false, error: { reason: 'unsupported_model', code: 'unsupported_model', model } }` without making any API call
    - Implement timeout using `AbortController` + `signal`; on abort return `{ success: false, error: { reason, code: 'timeout', model } }`
    - Catch network fetch failures → `code: 'network_error'`; catch HTTP 4xx/5xx → `code: 'http_error'`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.2 Write property test for `model_adapter.js` error object completeness (P7)
    - `// Feature: discovery-mode-experiment, Property 7: Error objects always contain required fields`
    - Use `fc.constantFrom('timeout', 'http_error', 'network_error', 'unsupported_model')` to simulate each failure mode
    - Assert every returned error object has non-empty `reason` string and `code` in the defined enum
    - Run with `{ numRuns: 100 }`
    - _Requirements: 1.3, 4.4, 4.5_

  - [ ]* 3.3 Write unit tests for `model_adapter.js`
    - Test: correct `Authorization` and `Content-Type` headers sent for `openrouter-free`
    - Test: no `Authorization` header sent for `ollama/llama3.2`
    - Test: unknown model returns `unsupported_model` error without making any fetch call
    - _Requirements: 4.2, 4.3, 4.5_

- [x] 4. Implement `standard_mode.js`
  - [x] 4.1 Write `standard_mode.js` — single LLM call, trim, multi-sentence note
    - Export `async function run(input, model, prompts)` returning `{ answer: string|null, correct: null, notes: string|null, error: object|null }`
    - Build prompt by replacing `{user_input}` in `prompts.standard` with `input`
    - Call `model_adapter.call(model, prompt)`; on failure return `{ answer: null, correct: null, notes: null, error }`
    - On success, trim whitespace from response text
    - Detect multi-sentence heuristic: if response contains more than one sentence-ending punctuation sequence (`.`, `!`, or `?` followed by whitespace or end), add `notes: "Warning: model returned more than one sentence"`
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Implement `discovery_mode.js`
  - [x] 5.1 Write `discovery_mode.js` — two-call pipeline with JSON parsing and validation
    - Export `async function run(input, model, prompts)` returning `DiscoveryResult`
    - Implement `function extractJson(text)` using fence regex `/```(?:json)?\s*([\s\S]*?)```/`; fall back to `text.trim()`
    - **Step 1** — Hypothesis generation: replace `{user_input}` in `prompts.hypothesis`, call adapter, extract + parse JSON, validate exactly 4 objects each with `id` in 1–4, non-empty `guess`, non-empty `reasoning`; on failure return error with `code: 'parse_error'`, `correct: null`
    - **Step 2** — Validation: replace `{user_input}` and `{hypotheses}` (JSON-stringified) in `prompts.validate`, call adapter, extract + parse JSON, validate `validations[]` (4 items, each `id` + `score` 0–100), `winner_id` matches a hypothesis id, non-empty `final_answer`, `confidence` 0–100; on failure return error with `code: 'validation_error'`, `correct: null`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.2 Write property test for hypothesis array structure invariant (P4)
    - `// Feature: discovery-mode-experiment, Property 4: Hypothesis array structure invariant`
    - Use `fc.array(fc.record({ id: fc.integer(), guess: fc.string(), reasoning: fc.string() }))` with arbitrary sizes
    - Assert: only arrays of exactly 4 objects where each `id` ∈ {1,2,3,4}, `guess` non-empty, `reasoning` non-empty pass validation; any other input is rejected entirely
    - Run with `{ numRuns: 100 }`
    - _Requirements: 2.2, 2.3_

  - [ ]* 5.3 Write property test for validator score bounds (P5)
    - `// Feature: discovery-mode-experiment, Property 5: Validator scores are bounded integers`
    - Use `fc.integer()` generating values including out-of-range (< 0, > 100) for `score` and `confidence`
    - Assert: any `score` or `confidence` outside [0, 100] causes the validation step to reject the record; `winner_id` not matching a hypothesis id also causes rejection
    - Run with `{ numRuns: 100 }`
    - _Requirements: 3.2, 3.3_

  - [ ]* 5.4 Write unit tests for `discovery_mode.js`
    - Test: markdown fence stripping (`\`\`\`json ... \`\`\``) yields the inner JSON string
    - Test: fence stripping with no fence returns trimmed input unchanged
    - Test: hypothesis count < 4 returns `parse_error`
    - Test: hypothesis count > 4 returns `parse_error`
    - Test: malformed JSON (non-parseable) returns `parse_error`
    - _Requirements: 2.2, 2.3, 3.2, 3.3_

- [x] 6. Implement `scorecard.js`
  - [x] 6.1 Write `scorecard.js` — read, write, and merge `tests/results.json`
    - Export `async function read()` — on ENOENT return `[]`; on parse failure log warning `"Warning: results.json was unreadable; prior records could not be preserved."` and return `[]`
    - Export `async function write(records)` — overwrite `tests/results.json` with `JSON.stringify(records, null, 2)`
    - Export `async function merge(newRecord)` — call `read()`, find index by composite key `(test_id, model)`, replace if found else push, call `write()`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.2 Write property test for scorecard merge invariant (P6)
    - `// Feature: discovery-mode-experiment, Property 6: Scorecard merge preserves all other records`
    - Use `fc.array(fc.record({ test_id: fc.string(), model: fc.string() }))` for existing records plus a new record with a distinct key
    - Assert: after merge, all records with different `(test_id, model)` keys are present and unchanged; exactly one record with the matching key exists
    - Run with `{ numRuns: 100 }`
    - _Requirements: 6.3_

  - [ ]* 6.3 Write unit tests for `scorecard.js`
    - Test: `read()` returns `[]` when file does not exist (ENOENT)
    - Test: `read()` logs warning and returns `[]` when file contains invalid JSON
    - Test: `merge()` appends new record when no matching composite key exists
    - Test: `merge()` replaces existing record when composite key matches
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 7. Implement `test_runner.js`
  - [x] 7.1 Write `test_runner.js` — iterate test cases, evaluate correctness, compute `discovery_better`
    - Export `async function runAll(model, testCases, prompts, scorecardInstance)` returning `ResultRecord[]`
    - For each test case (sequentially, not in parallel): call `standard_mode.run` and `discovery_mode.run`, call `evaluateCorrectness` for each mode, compute `discovery_better`, call `scorecardInstance.merge(record)`
    - Export `function evaluateCorrectness(expectedAnswer, returnedAnswer)`: return `null` if `expectedAnswer` is null/undefined/empty; return `false` if `returnedAnswer` is null/undefined/empty; otherwise return `returnedAnswer.toLowerCase().includes(expectedAnswer.toLowerCase())`
    - Skip test case (log warning with `test_id`) if required fields `test_id`, `input`, `expected_answer`, `round` are missing
    - Skip test case (log warning with unrecognized value and `test_id`) if `round` is not one of `abbreviations`, `vague_terms`, `code_concepts`, `trick_ambiguous`
    - `discovery_better`: `true` if discovery `correct === true` and standard `correct === false`; `false` if standard `correct === true` and discovery `correct === false`; `null` otherwise
    - _Requirements: 5.2, 5.3, 5.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 7.2 Write property test for correctness evaluation — case-insensitive substring (P1)
    - `// Feature: discovery-mode-experiment, Property 1: Correctness evaluation is case-insensitive substring containment`
    - Use `fc.string()` × 2 filtered to non-empty; assert `evaluateCorrectness(expected, returned) === returned.toLowerCase().includes(expected.toLowerCase())`
    - Run with `{ numRuns: 100 }`
    - _Requirements: 9.1, 9.2_

  - [ ]* 7.3 Write property test for null/empty correctness inputs (P2)
    - `// Feature: discovery-mode-experiment, Property 2: Null/empty inputs yield null or false correctness`
    - Use `fc.constantFrom(null, '', undefined)` for expected; assert result is `null`
    - Use `fc.constantFrom(null, '', undefined)` for returned (with valid non-empty expected); assert result is `false`
    - Run with `{ numRuns: 100 }`
    - _Requirements: 9.4, 9.5_

  - [ ]* 7.4 Write property test for `discovery_better` tri-state consistency (P3)
    - `// Feature: discovery-mode-experiment, Property 3: discovery_better tri-state is consistent`
    - Use `fc.tuple(fc.boolean(), fc.boolean())` for `(standard_correct, discovery_correct)`
    - Assert: `discovery_better === true` iff `discovery && !standard`; `false` iff `standard && !discovery`; `null` otherwise
    - Run with `{ numRuns: 100 }`
    - _Requirements: 9.3_

- [x] 8. Checkpoint — core logic complete
  - Ensure all tests pass: `npm test` (or `vitest --run`)
  - All modules (`prompt_loader`, `model_adapter`, `standard_mode`, `discovery_mode`, `scorecard`, `test_runner`) are independently importable without errors
  - Ask the user if questions arise before proceeding to server and UI.

- [x] 9. Implement `server.js`
  - [x] 9.1 Write `server.js` — Express routes and startup validation
    - Load `.env` using `dotenv.config()` at the top of the file
    - On startup: call `prompt_loader.loadAll()`; if it throws, log the error message and call `process.exit(1)`
    - On startup: verify `tests/test_cases.json` exists and is readable; if not, log the file path and call `process.exit(1)`
    - Mount routes:
      - `POST /api/run-single`: accept `{ input, model }`, run `standard_mode.run` and `discovery_mode.run` in parallel via `Promise.all`, return `{ standard, discovery }`
      - `POST /api/run-all`: accept `{ model }`, load test cases from `tests/test_cases.json`, call `test_runner.runAll`, return `{ results }`
      - `GET /api/results`: call `scorecard.read()`, return the array
      - `GET /api/models`: return `{ models: [{ id: 'openrouter-free', label: 'OpenRouter Free (cloud)', provider: 'openrouter' }, { id: 'ollama/llama3.2', label: 'Llama 3.2 (local)', provider: 'ollama' }] }`
    - Serve `index.html` as a static file for `GET /`
    - _Requirements: 4.1, 5.1, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1_

  - [ ]* 9.2 Write unit tests for `server.js` startup validation
    - Test: startup halts (`process.exit(1)`) when prompt file is missing (mock `prompt_loader.loadAll` to throw)
    - Test: startup halts when `tests/test_cases.json` is missing (mock `fs.access`)
    - _Requirements: 5.1, 7.4, 7.5_

- [x] 10. Write prompt template files
  - [x] 10.1 Write `prompts/standard.txt`
    - Content: `You are a direct answer engine. Answer this in one sentence only. No thinking. No explanation. Input: {user_input} Answer:`
    - _Requirements: 1.1, 7.1_

  - [x] 10.2 Write `prompts/hypothesis.txt`
    - Content must instruct the model to produce a JSON array of exactly 4 objects, each with integer `id` (1–4), non-empty `guess`, and non-empty `reasoning`; include `{user_input}` substitution placeholder
    - Phrase instructions clearly for weak/small models (llama3.2, mistral-7b-instruct)
    - _Requirements: 2.1, 2.2, 7.2_

  - [x] 10.3 Write `prompts/validate.txt`
    - Content must instruct the model to return a JSON object with `validations[]` (4 items, each `id` + `score` 0–100), `winner_id`, non-empty `final_answer`, and `confidence` 0–100; include `{user_input}` and `{hypotheses}` substitution placeholders
    - Phrase instructions clearly for weak/small models
    - _Requirements: 3.1, 3.2, 7.3_

- [x] 11. Populate `tests/test_cases.json` with 20 test cases across 4 rounds
  - Write 20 test case objects, 5 per round: `abbreviations`, `vague_terms`, `code_concepts`, `trick_ambiguous`
  - Each record must contain all four required fields: `test_id` (unique string or integer), `input`, `expected_answer`, `round`
  - Ensure inputs are genuinely challenging for weak models (e.g., "API" as abbreviation, "it's broken" as vague term)
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Implement `index.html` — full single-file UI
  - [x] 12.1 Write the HTML skeleton and controls section
    - Single `index.html` file with inline `<style>` and `<script>` blocks; no external JS or CSS dependencies
    - Controls row: model dropdown (populated from `GET /api/models`), test case dropdown (populated by fetching test cases or listing from server), custom text input (max 1000 chars), "Run Single" button, "Run All Tests" button
    - _Requirements: 8.3, 8.5_

  - [x] 12.2 Write the two-panel output display
    - Left panel labeled "Standard Mode": shows loading indicator while pending, then answer text on success, or error message on failure
    - Right panel labeled "Discovery Mode": shows loading indicator while pending, then hypothesis list (each `guess` + `score`), winner id, `final_answer`, and `confidence` on success, or error message on failure
    - _Requirements: 8.1, 8.2, 8.6_

  - [x] 12.3 Write the results summary table
    - Below the panels: a summary table showing per-round win rates for Standard vs Discovery per model
    - Win rate = (correct results in round) / (total non-null results in round) × 100%
    - Fetch data from `GET /api/results` on page load and after each "Run All" completion
    - Display "No results available" message when `results.json` is empty or unavailable
    - _Requirements: 8.4_

  - [x] 12.4 Wire up Run Single and Run All event handlers
    - "Run Single": POST to `/api/run-single` with `{ input, model }`, show loading indicators, render results in both panels
    - "Run All Tests": POST to `/api/run-all` with `{ model }`, show progress indication, refresh results summary on completion
    - Handle fetch errors and display in affected panel
    - _Requirements: 8.2, 8.6_

- [x] 13. Checkpoint — full system wired
  - Ensure all unit and property tests pass: `npm test`
  - Manually verify server starts without crashing with valid `.env` and prompt files in place
  - Ask the user if questions arise before proceeding to integration tests.

- [x] 14. Integration tests for API routes
  - [x] 14.1 Write `tests/integration/api.test.js`
    - Mock `model_adapter.call` to return controlled responses
    - Test `POST /api/run-single`: assert response shape is `{ standard: StandardResult, discovery: DiscoveryResult }`
    - Test `POST /api/run-all` with 2–3 test cases in a temp `test_cases.json`: assert `results.json` is written correctly after run
    - Test `GET /api/results`: assert reads and returns current `tests/results.json` as an array
    - Test `GET /api/models`: assert returns exactly 2 model descriptors with correct `id`, `label`, `provider` fields
    - _Requirements: 4.1, 5.1, 6.1, 8.1_

- [x] 15. Final checkpoint — all tests pass
  - Run full test suite: `npm test`
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP iteration
- The only supported models are `openrouter-free` and `ollama/llama3.2`; no other models should be wired into the adapter
- All LLM calls use raw `fetch` — no Anthropic SDK, no OpenAI SDK
- Test runner executes test cases sequentially to avoid rate-limiting
- `fast-check` is used for all property-based tests (P1–P7); minimum 100 runs per property
- Use `vitest --run` (or `jest --runInBand`) for single-pass test execution (no watch mode)
- Each property test includes the comment tag `// Feature: discovery-mode-experiment, Property N: <property_text>`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "3.3", "4.1"] },
    { "id": 2, "tasks": ["5.1", "6.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "5.4", "6.2", "6.3", "7.1"] },
    { "id": 4, "tasks": ["7.2", "7.3", "7.4", "9.1", "10.1", "10.2", "10.3"] },
    { "id": 5, "tasks": ["9.2", "11"] },
    { "id": 6, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 7, "tasks": ["12.4"] },
    { "id": 8, "tasks": ["14.1"] }
  ]
}
```
