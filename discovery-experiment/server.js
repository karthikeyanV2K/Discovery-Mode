'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const path = require('path');
const fs = require('fs');

const promptLoader = require('./src/prompt_loader');
const standardMode = require('./src/standard_mode');
const discoveryMode = require('./src/discovery_mode');
const primitiveDiscoveryMode = require('./src/primitive_discovery_mode');
const testRunner = require('./src/test_runner');
const scorecard = require('./src/scorecard');

const app = express();

app.use(express.json());

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
        { id: 'groq-free',       label: 'Groq Free — Llama 3.1 8B (cloud)',    provider: 'groq'   },
        { id: 'gemini-free',     label: 'Gemini Free — Gemini 1.5 Flash (cloud)', provider: 'gemini' },
        { id: 'ollama/llama3.2', label: 'Llama 3.2 (local Ollama)',             provider: 'ollama' },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /
 * The project is CLI-first now. Keep API server root explicit.
 */
app.get('/', (req, res) => {
  res.type('text/plain').send(
    'Discovery Mode is CLI-first now.\n\n' +
    'Run:\n' +
    '  npm run chat\n' +
    '  npm run discovery -- "your prompt"\n\n' +
    'API routes are still available for tests and automation.\n'
  );
});

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
