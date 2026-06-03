# Requirements Document

## Introduction

The Discovery Mode Experiment is a theory-testing system that compares two LLM inference strategies side by side: **Standard Mode** (single API call returning a direct answer) and **Discovery Mode** (two sequential API calls: hypothesis generation followed by validation and scoring). The goal is to empirically test whether Discovery Mode outperforms Standard Mode, particularly on weak or small models, across four structured test rounds: abbreviations, vague terms, code concepts, and trick/ambiguous inputs. Results are stored in a JSON scorecard and visualized in a browser-based side-by-side UI.

## Glossary

- **System**: The Discovery Mode Experiment application as a whole
- **Standard_Mode**: An inference strategy that makes a single API call using a direct-answer prompt and returns a one-sentence response
- **Discovery_Mode**: An inference strategy that makes two sequential API calls — a Hypothesis_Generator call followed by a Validator call — to produce a scored, confidence-rated final answer
- **Hypothesis_Generator**: The first LLM call in Discovery Mode, which produces exactly four candidate hypotheses in JSON format
- **Validator**: The second LLM call in Discovery Mode, which scores each hypothesis 0–100 and selects a winner with a final answer and confidence rating
- **Test_Runner**: The component responsible for executing test cases against a selected model using both inference modes
- **Model_Adapter**: The component that abstracts API calls to different LLM providers (Anthropic Claude and Ollama)
- **Scorecard**: The `results.json` file that persists all test results for analysis
- **UI**: The browser-based HTML interface that displays side-by-side mode outputs
- **Test_Case**: A single input record with an expected answer and a round category
- **Round**: A thematic grouping of test cases — one of: abbreviations, vague terms, code concepts, or trick/ambiguous inputs

---

## Requirements

### Requirement 1: Standard Mode Inference

**User Story:** As a researcher, I want to run a test input through Standard Mode, so that I get a direct one-sentence answer from the model using a single API call.

#### Acceptance Criteria

1. WHEN a test input is submitted in Standard Mode, THE Standard_Mode SHALL send exactly one API call to the configured model using the prompt template: `"You are a direct answer engine. Answer this in one sentence only. No thinking. No explanation. Input: {user_input} Answer:"`
2. WHEN the API call completes successfully, THE Standard_Mode SHALL return the model's raw response string trimmed of leading and trailing whitespace; IF the model returns more than one sentence, THE Standard_Mode SHALL return the full response as-is without truncation and record a warning in the test result notes
3. IF the API call fails, returns an HTTP error status, or does not receive a response within 30 seconds, THEN THE Standard_Mode SHALL return a structured error object containing at minimum the fields `reason` (a human-readable failure description) and `code` (one of: `timeout`, `http_error`, `network_error`), and SHALL preserve the test record with `answer` set to `null` and `correct` set to `null`

---

### Requirement 2: Discovery Mode — Hypothesis Generation

**User Story:** As a researcher, I want Discovery Mode to generate exactly four hypotheses for a given input, so that the system explores multiple candidate interpretations before committing to an answer.

#### Acceptance Criteria

1. WHEN a test input is submitted in Discovery Mode, THE Hypothesis_Generator SHALL send the first API call using the hypothesis prompt template loaded from `prompts/hypothesis.txt`, requesting exactly four candidate hypotheses
2. WHEN the Hypothesis_Generator call completes, THE Hypothesis_Generator SHALL parse the response and return a JSON array of exactly four objects; each object SHALL contain: `id` (a unique integer in the range 1–4), `guess` (a non-empty string), and `reasoning` (a non-empty string)
3. IF the parsed response contains fewer than four objects, more than four objects, or malformed JSON that cannot be parsed, THEN THE Hypothesis_Generator SHALL log a parse error and abort the Discovery Mode run for that test case, recording the failure in the Scorecard with `discovery.correct` set to `null`
4. IF the Hypothesis_Generator API call fails, returns an HTTP error status, or does not receive a response within 30 seconds, THEN THE Hypothesis_Generator SHALL abort the Discovery Mode run for that test case, record the failure in the Scorecard with `discovery.correct` set to `null`, and NOT record this as a parse error

---

### Requirement 3: Discovery Mode — Validation and Scoring

**User Story:** As a researcher, I want each hypothesis scored and a winner selected, so that Discovery Mode produces a single confident final answer backed by comparative evaluation.

#### Acceptance Criteria

1. WHEN the four hypotheses are available, THE Validator SHALL send the second API call using the validation prompt template loaded from `prompts/validate.txt`, passing the original `user_input` and all four hypothesis objects as input
2. WHEN the Validator call completes, THE Validator SHALL parse the response and return a JSON object containing: a `validations` array of exactly four objects (each with `id` matching a hypothesis id and `score` as an integer in the range 0–100 inclusive), a `winner_id` value that matches one of the four hypothesis `id` values, a non-empty `final_answer` string, and a `confidence` integer in the range 0–100 inclusive
3. IF the Validator response is missing any of the required fields, contains scores outside 0–100, or `winner_id` does not match any hypothesis `id`, THEN THE Validator SHALL record the Discovery Mode result as failed for that test case with `discovery.correct` set to `null`
4. WHEN the Validator records a failure per criterion 3, THE Validator SHALL attempt to log a validation error message identifying the specific field or constraint that failed; the failure record SHALL be written to the Scorecard regardless of whether the log attempt succeeds
5. IF the Validator API call fails, returns an HTTP error status, or does not receive a response within 30 seconds, THEN THE Validator SHALL abort the Discovery Mode run for that test case, record the failure in the Scorecard with `discovery.correct` set to `null`, and NOT record this as a validation error

---

### Requirement 4: Multi-Model Support

**User Story:** As a researcher, I want to run experiments across multiple models, so that I can compare Discovery Mode performance on both large and small models.

#### Acceptance Criteria

1. THE Model_Adapter SHALL support the following four model identifiers: `claude-sonnet` (Anthropic provider), `claude-haiku` (Anthropic provider), `ollama/llama3.2` (Ollama provider), and `ollama/phi3` (Ollama provider)
2. WHEN a model from the Anthropic provider is selected, THE Model_Adapter SHALL authenticate using the configured Anthropic API key and route requests to the Anthropic Messages API
3. WHEN a model from the Ollama provider is selected, THE Model_Adapter SHALL route requests to the locally running Ollama HTTP endpoint (`http://localhost:11434` by default) without requiring an API key
4. IF a selected model is unavailable, the provider endpoint is unreachable, or authentication fails (e.g., invalid or missing API key), THEN THE Model_Adapter SHALL return a structured error object containing at minimum the fields `reason` (human-readable description) and `model` (the identifier of the failing model), and SHALL skip that model's test run without halting the overall experiment
5. IF a model identifier not in the supported list is passed to the Model_Adapter, THEN THE Model_Adapter SHALL return a structured error with `reason` set to `"unsupported_model"` and `model` set to the unrecognized identifier, without making any API call

---

### Requirement 5: Test Case Structure and Rounds

**User Story:** As a researcher, I want test cases organized into four thematic rounds, so that I can systematically evaluate model performance across distinct input types.

#### Acceptance Criteria

1. THE System SHALL load test cases from `tests/test_cases.json` before accepting requests; IF the file is missing or cannot be read, THE System SHALL halt initialization and display an error message identifying the file path
2. WHEN loading test cases, THE System SHALL validate that each record contains all four required fields: `test_id`, `input`, `expected_answer`, and `round`; IF a record is missing any required field, THE System SHALL skip that record, log a warning identifying the `test_id` (or record index if `test_id` is absent), and continue loading the remaining records
3. THE System SHALL support exactly four valid `round` values: `abbreviations`, `vague_terms`, `code_concepts`, and `trick_ambiguous`; IF a test case contains a `round` value not in this set, THE System SHALL skip that record and log a warning identifying the unrecognized value and the associated `test_id`
4. WHEN the Test_Runner executes, THE Test_Runner SHALL run both modes against each loaded test case for the selected model and write results to the Scorecard with each result record including the `round` value from the test case, enabling downstream grouping by round

---

### Requirement 6: Results Scorecard

**User Story:** As a researcher, I want all test results saved to a structured JSON file, so that I can analyze and compare mode performance after the experiment.

#### Acceptance Criteria

1. WHEN a test case completes for any mode, THE Scorecard SHALL append or update a result record in `tests/results.json`; the merge key SHALL be the composite of `test_id` and `model`
2. THE Scorecard SHALL store each result with the following top-level fields: `test_id` (string or integer matching the test case), `input` (the original input string), `model` (the model identifier), `standard` (an object containing `answer` and `correct`), `discovery` (an object containing `hypotheses`, `winner`, `final_answer`, and `correct`), `discovery_better` (boolean or null), and `notes` (string or null)
3. WHEN new results are written, THE Scorecard SHALL merge new records by the composite key `(test_id, model)` without deleting existing records associated with other models or prior runs; an existing record with the same composite key SHALL be overwritten with the new result
4. IF `tests/results.json` exists but cannot be read or parsed (e.g., corrupted JSON), THEN THE Scorecard SHALL proceed with writing the new results to the file, overwriting the unreadable content, and SHALL log a warning stating that prior records could not be preserved
5. IF `tests/results.json` does not exist at startup, THEN THE Scorecard SHALL create the file containing an empty JSON array (`[]`) before writing the first result record

---

### Requirement 7: Prompt File Management

**User Story:** As a researcher, I want prompts stored as plain text files, so that I can modify them without changing application code.

#### Acceptance Criteria

1. THE System SHALL load the Standard Mode prompt template from `prompts/standard.txt` before accepting any requests
2. THE System SHALL load the Hypothesis Generation prompt template from `prompts/hypothesis.txt` before accepting any requests
3. THE System SHALL load the Validation prompt template from `prompts/validate.txt` before accepting any requests
4. IF any prompt file is missing at startup, THEN THE System SHALL halt initialization and display an error message that includes the exact missing file path (e.g., `"Error: Required prompt file not found: prompts/hypothesis.txt"`) and SHALL NOT proceed to accept requests
5. IF a prompt file exists but is empty or cannot be read due to a permissions or I/O error, THEN THE System SHALL halt initialization and display an error message identifying the affected file path and the nature of the failure (empty or unreadable), and SHALL NOT proceed to accept requests

---

### Requirement 8: Side-by-Side Browser UI

**User Story:** As a researcher, I want a browser-based UI showing both mode outputs side by side, so that I can visually compare Standard and Discovery Mode results in real time.

#### Acceptance Criteria

1. THE UI SHALL render two panels side by side: a left panel labeled "Standard Mode" and a right panel labeled "Discovery Mode"
2. WHEN a test is run from the UI, THE UI SHALL display a loading indicator in each panel while the corresponding mode's request is in progress; WHEN results are received, THE UI SHALL immediately replace the loading indicator with the Standard Mode answer in the left panel and the Discovery Mode `final_answer`, hypothesis list (each showing `guess` and `score`), and `confidence` value in the right panel
3. THE UI SHALL provide: a dropdown control listing the four supported model identifiers, a dropdown control listing all loaded test case inputs (identified by `test_id` and `input`), and a text input field for entering a custom input up to 1000 characters
4. WHEN results are available in `tests/results.json`, THE UI SHALL provide a summary view displaying per-round win rates for Standard Mode and Discovery Mode per model; the win rate SHALL be calculated as (number of test cases in that round where the mode's `correct` is `true`) divided by (total test cases in that round with a non-null `correct` value), expressed as a percentage; IF `tests/results.json` is unavailable or contains no results, THE UI SHALL display a message indicating no results are available
5. THE UI SHALL be implemented as a single `index.html` file with no external build step required, loadable directly in a browser via the `file://` protocol or a local HTTP server
6. IF a test run fails for either mode (e.g., API error, parse failure), THE UI SHALL display an error message in the affected panel describing the failure reason, replacing any loading indicator

---

### Requirement 9: Correctness Evaluation

**User Story:** As a researcher, I want each answer automatically evaluated against the expected answer, so that the scorecard reflects accuracy without manual review.

#### Acceptance Criteria

1. WHEN a Standard Mode answer is returned, THE Test_Runner SHALL evaluate correctness by checking whether the `expected_answer` string (case-insensitive) is a substring of the returned answer string (case-insensitive), and SHALL record the result as a boolean `correct` value (`true` if the substring is found, `false` otherwise)
2. WHEN a Discovery Mode `final_answer` is returned, THE Test_Runner SHALL apply the same case-insensitive substring matching — checking whether `expected_answer` appears within `final_answer` — and SHALL record the result as a boolean `correct` value
3. WHEN both mode results are available for a test case, THE Test_Runner SHALL set `discovery_better` to `true` if Discovery Mode `correct` is `true` and Standard Mode `correct` is `false`; `false` if Standard Mode `correct` is `true` and Discovery Mode `correct` is `false`; and `null` if both modes share the same `correct` value (both true or both false)
4. IF the test case `expected_answer` field is null, absent, or an empty string, THEN THE Test_Runner SHALL record `correct` as `null` for both modes and exclude the test case from win rate aggregations
5. IF a mode returns a null, absent, or empty answer string, THEN THE Test_Runner SHALL record `correct` as `false` for that mode without performing substring matching
