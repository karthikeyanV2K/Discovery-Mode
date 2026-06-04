'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const path = require('path');
const fs = require('fs');

const promptLoader = require('./src/prompt_loader');
const standardMode = require('./src/standard_mode');
const reasoningMode = require('./src/reasoning_mode');
const discoveryMode = require('./src/discovery_mode');
const primitiveDiscoveryMode = require('./src/primitive_discovery_mode');
const testRunner = require('./src/test_runner');
const scorecard = require('./src/scorecard');
const evaluator = require('./src/evaluator');

const app = express();

app.use(express.json());
app.use('/tests', express.static(path.join(__dirname, 'tests')));
app.use('/benchmarks', express.static(path.join(__dirname, 'benchmarks')));

// Module-level prompts variable set during startup
let prompts;

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/run-single
 * Body: { input: string, model: string }
 * Runs standard and discovery modes in parallel, returns both results.
 */
app.post('/api/run-single', async (req, res) => {
  try {
    const { input, model } = req.body;
    const [standard, discovery] = await Promise.all([
      standardMode.run(input, model, prompts),
      discoveryMode.run(input, model, prompts),
    ]);
    res.json({ standard, discovery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/run-comparison
 * Body: { input: string, model: string, testCase?: object }
 * Runs Reasoning Mode vs Discovery Mode and returns score details.
 */
app.post('/api/run-comparison', async (req, res) => {
  try {
    const { input, model, testCase } = req.body;
    const syntheticCase = testCase || {
      id: 'custom',
      category: inferCategory(input),
      prompt: input,
      expected_domain: inferExpectedDomain(input),
      must_include: inferMustInclude(input),
    };

    const [reasoning, discovery] = await Promise.all([
      reasoningMode.run(input, model, prompts),
      discoveryMode.run(input, model, prompts),
    ]);

    const reasoningEval = evaluator.evaluateReasoning(syntheticCase, reasoning);
    const discoveryEval = evaluator.evaluateDiscovery(syntheticCase, discovery);

    res.json({
      testCase: syntheticCase,
      reasoning,
      discovery,
      reasoningEval,
      discoveryEval,
      winner: evaluator.winnerLabel(reasoningEval, discoveryEval),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/benchmark-browser
 * Body: { model: string, file?: "mini" | "hard" }
 * Runs benchmark cases through Reasoning Mode vs Discovery Mode.
 */
app.post('/api/benchmark-browser', async (req, res) => {
  try {
    const { model, file } = req.body;
    const casesFile = file === 'hard'
      ? 'hard_cases.json'
      : file === 'tech'
        ? 'tech_challenge_cases.json'
        : 'mini_api_cases.json';
    const casesPath = path.join(__dirname, 'benchmarks', casesFile);
    const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));

    const rows = [];
    for (const testCase of cases) {
      const [reasoning, discovery] = await Promise.all([
        reasoningMode.run(testCase.prompt, model, prompts),
        discoveryMode.run(testCase.prompt, model, prompts),
      ]);
      const reasoningEval = evaluator.evaluateReasoning(testCase, reasoning);
      const discoveryEval = evaluator.evaluateDiscovery(testCase, discovery);
      rows.push({
        testCase,
        reasoning,
        discovery,
        reasoningEval,
        discoveryEval,
        winner: evaluator.winnerLabel(reasoningEval, discoveryEval),
      });
    }

    res.json({ rows, summary: buildComparisonSummary(rows) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/run-three
 * Body: { input: string, model: string }
 * Runs all three modes: standard, discovery, and primitive discovery
 */
app.post('/api/run-three', async (req, res) => {
  try {
    const { input, model } = req.body;
    const [standard, discovery, primitiveDiscovery] = await Promise.all([
      standardMode.run(input, model, prompts),
      discoveryMode.run(input, model, prompts),
      primitiveDiscoveryMode.run(input, model, prompts),
    ]);
    res.json({ standard, discovery, primitiveDiscovery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/run-primitive
 * Body: { input: string, model: string }
 * Runs only primitive discovery mode
 */
app.post('/api/run-primitive', async (req, res) => {
  try {
    const { input, model } = req.body;
    const result = await primitiveDiscoveryMode.run(input, model, prompts);
    res.json({ primitiveDiscovery: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/run-all
 * Body: { model: string }
 * Reads test cases, runs all through testRunner, returns results.
 */
app.post('/api/run-all', async (req, res) => {
  try {
    const { model } = req.body;
    const testCasesPath = path.join(__dirname, 'tests', 'test_cases.json');
    const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
    const results = await testRunner.runAll(model, testCases, prompts, scorecard);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/results
 * Returns all stored result records from the scorecard.
 */
app.get('/api/results', async (req, res) => {
  try {
    const results = await scorecard.read();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/models
 * Returns the list of supported model descriptors.
 */
app.get('/api/models', (req, res) => {
  try {
    res.json({
      models: [
        { id: 'openai/gpt-5.1', label: 'OpenAI — GPT-5.1 (official)', provider: 'openai' },
        { id: 'openai/gpt-5-mini', label: 'OpenAI — GPT-5 mini (official)', provider: 'openai' },
        { id: 'anthropic/claude-sonnet-4.5', label: 'Anthropic — Claude Sonnet 4.5 (official)', provider: 'anthropic' },
        { id: 'groq-free',       label: 'Groq Free — Llama 3.1 8B (cloud)',    provider: 'groq'   },
        { id: 'gemini-free',     label: 'Gemini Free — Gemini 1.5 Flash (cloud)', provider: 'gemini' },
        { id: 'ollama-cloud/gpt-oss:120b', label: 'Ollama Cloud — GPT-OSS 120B', provider: 'ollama-cloud' },
        { id: 'ollama/llama3.2', label: 'Llama 3.2 (local Ollama)',             provider: 'ollama' },
        { id: 'ollama/gpt-oss:120b', label: 'GPT-OSS 120B (local Ollama)',      provider: 'ollama' },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/benchmark-cases', (req, res) => {
  try {
    const casesFile = req.query.file === 'hard'
      ? 'hard_cases.json'
      : req.query.file === 'tech'
        ? 'tech_challenge_cases.json'
        : 'mini_api_cases.json';
    const casesPath = path.join(__dirname, 'benchmarks', casesFile);
    res.json({ cases: JSON.parse(fs.readFileSync(casesPath, 'utf8')) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /
 * Browser comparison harness.
 */
app.get('/', (req, res) => {
  res.type('text/plain').send(
    'Discovery Mode is packaged as a portable plugin pack now.\n\n' +
    'Use:\n' +
    '  portable-plugin-pack/README.md\n' +
    '  plugins/discovery-mode/\n' +
    '  DISCOVER_WEB_ACTIVATION.md\n\n' +
    'CLI engine:\n' +
    '  npm run discover -- "/discover your prompt"\n'
  );
});

function buildComparisonSummary(rows) {
  const avgReasoning = average(rows.map((row) => row.reasoningEval.score));
  const avgDiscovery = average(rows.map((row) => row.discoveryEval.score));
  return {
    avgReasoning,
    avgDiscovery,
    discoveryWins: rows.filter((row) => row.winner === 'discovery').length,
    reasoningWins: rows.filter((row) => row.winner === 'reasoning').length,
    ties: rows.filter((row) => row.winner === 'tie').length,
    expectedWinner: 'Discovery should win ambiguous architecture, emotion, and forensics tasks. Reasoning can tie or win direct tasks unless Discovery routes to a deterministic solver first.',
  };
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function inferCategory(input) {
  const lower = String(input || '').toLowerCase();
  if (/mod|integer|solve|equation|math/.test(lower)) return 'math';
  if (/ai|model|architecture|kernel|build|create/.test(lower)) return 'architecture';
  if (/panic|friend|feel|reply|emotion/.test(lower)) return 'emotion';
  if (/forensic|login|evidence|ctf|cyber|log/.test(lower)) return 'cyber_forensics';
  return 'custom';
}

function inferExpectedDomain(input) {
  const lower = String(input || '').toLowerCase();
  if (/mod/.test(lower)) return 'math_crt';
  if (/ai|model|intelligence/.test(lower) && /new|unlike|traditional|traditonal/.test(lower)) return 'ai_architecture';
  return 'unknown';
}

function inferMustInclude(input) {
  const lower = String(input || '').toLowerCase();
  if (/mod/.test(lower)) return ['23'];
  if (/ai|model|intelligence/.test(lower) && /new|unlike|traditional|traditonal/.test(lower)) return ['Primitive', 'Reasoning', 'memory'];
  if (/forensic|login/.test(lower)) return ['evidence', 'timeline'];
  if (/panic|friend/.test(lower)) return ['wait'];
  return [];
}

// ── Startup sequence ──────────────────────────────────────────────────────────

async function start() {
  // 1. Load prompt templates — halt if any are missing or empty
  try {
    prompts = await promptLoader.loadAll();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  // 2. Verify test_cases.json exists — halt if missing
  const testCasesPath = path.join(__dirname, 'tests', 'test_cases.json');
  if (!fs.existsSync(testCasesPath)) {
    console.error('Error: tests/test_cases.json not found');
    process.exit(1);
  }

  // 3. Start the HTTP server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();

module.exports = app;
