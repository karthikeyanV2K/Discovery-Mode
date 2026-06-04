'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const fs = require('fs/promises');
const path = require('path');
const promptLoader = require('./src/prompt_loader');
const reasoningMode = require('./src/reasoning_mode');
const discoveryMode = require('./src/discovery_mode');
const evaluator = require('./src/evaluator');

const DEFAULT_MODEL = process.env.DISCOVERY_MODEL || 'ollama-cloud/gpt-oss:120b';

async function main() {
  const args = process.argv.slice(2);
  const model = readOption(args, '--model') || DEFAULT_MODEL;
  const file = readOption(args, '--file') || path.join(__dirname, 'benchmarks', 'hard_cases.json');
  const prompts = await promptLoader.loadAll();
  const cases = JSON.parse(await fs.readFile(file, 'utf8'));

  console.log('Reasoning vs Discovery Benchmark');
  console.log(`Model: ${model}`);
  console.log(`Cases: ${cases.length}`);
  console.log(`File: ${file}\n`);

  const rows = [];

  for (const testCase of cases) {
    const [reasoning, discovery] = await Promise.all([
      reasoningMode.run(testCase.prompt, model, prompts),
      discoveryMode.run(testCase.prompt, model, prompts),
    ]);

    const reasoningEval = evaluator.evaluateReasoning(testCase, reasoning);
    const discoveryEval = evaluator.evaluateDiscovery(testCase, discovery);
    rows.push({ testCase, reasoning, discovery, reasoningEval, discoveryEval });
    printCase(rows[rows.length - 1]);
  }

  printSummary(rows);
}

function printCase(row) {
  const { testCase, reasoningEval, discoveryEval, discovery } = row;
  console.log('------------------------------------------------------------');
  console.log(`${testCase.id} [${testCase.category}]`);
  console.log(testCase.prompt);
  console.log(`Reasoning: ${reasoningEval.score}%${reasoningEval.error ? ` error=${reasoningEval.error}` : ''}`);
  console.log(`Discovery: ${discoveryEval.score}% domain=${discoveryEval.domain || 'none'} unknowns=${discoveryEval.hasUncertainty ? 'yes' : 'no'} hypotheses=${discoveryEval.hypothesesCount} strategy=${discoveryEval.usedRightStrategy ? 'ok' : 'bad'}`);
  console.log(`Winner:    ${evaluator.winnerLabel(reasoningEval, discoveryEval)}`);

  if (discovery && discovery.uncertainty) {
    console.log(`Discovery unknowns: ${discovery.uncertainty.unknowns.join(' | ')}`);
  }

  const winner = discovery && Array.isArray(discovery.hypotheses)
    ? discovery.hypotheses.find((h) => h.id === discovery.winner_id)
    : null;
  if (winner) {
    console.log(`Discovery winner: H${winner.id} ${winner.guess}`);
  }
}

function printSummary(rows) {
  const avgReasoning = average(rows.map((row) => row.reasoningEval.score));
  const avgDiscovery = average(rows.map((row) => row.discoveryEval.score));
  const discoveryWins = rows.filter((row) => row.discoveryEval.score > row.reasoningEval.score).length;
  const reasoningWins = rows.filter((row) => row.reasoningEval.score > row.discoveryEval.score).length;
  const ties = rows.length - discoveryWins - reasoningWins;

  console.log('\n============================================================');
  console.log('BENCHMARK SUMMARY');
  console.log('============================================================');
  console.log(`Average Reasoning: ${avgReasoning.toFixed(1)}%`);
  console.log(`Average Discovery: ${avgDiscovery.toFixed(1)}%`);
  console.log(`Discovery wins: ${discoveryWins}`);
  console.log(`Reasoning wins: ${reasoningWins}`);
  console.log(`Ties:           ${ties}`);

  const byCategory = new Map();
  for (const row of rows) {
    const current = byCategory.get(row.testCase.category) || { count: 0, reasoning: 0, discovery: 0 };
    current.count += 1;
    current.reasoning += row.reasoningEval.score;
    current.discovery += row.discoveryEval.score;
    byCategory.set(row.testCase.category, current);
  }

  console.log('\nBy category:');
  for (const [category, data] of byCategory.entries()) {
    console.log(`- ${category}: reasoning ${(data.reasoning / data.count).toFixed(1)}%, discovery ${(data.discovery / data.count).toFixed(1)}%`);
  }
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function readOption(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
