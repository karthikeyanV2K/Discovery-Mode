'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const fs = require('fs/promises');
const path = require('path');
const promptLoader = require('./src/prompt_loader');
const standardMode = require('./src/standard_mode');
const discoveryMode = require('./src/discovery_mode');

const DEFAULT_MODEL = process.env.DISCOVERY_MODEL || 'ollama/llama3.2';

async function main() {
  const args = process.argv.slice(2);
  const model = readOption(args, '--model') || DEFAULT_MODEL;
  const file = readOption(args, '--file') || path.join(__dirname, 'benchmarks', 'hard_cases.json');
  const prompts = await promptLoader.loadAll();
  const cases = JSON.parse(await fs.readFile(file, 'utf8'));

  console.log('Hard Discovery Benchmark');
  console.log(`Model: ${model}`);
  console.log(`Cases: ${cases.length}`);
  console.log(`File: ${file}\n`);

  const rows = [];

  for (const testCase of cases) {
    const [standard, discovery] = await Promise.all([
      standardMode.run(testCase.prompt, model, prompts),
      discoveryMode.run(testCase.prompt, model, prompts),
    ]);

    const standardEval = evaluateStandard(testCase, standard);
    const discoveryEval = evaluateDiscovery(testCase, discovery);
    rows.push({ testCase, standard, discovery, standardEval, discoveryEval });
    printCase(rows[rows.length - 1]);
  }

  printSummary(rows);
}

function evaluateStandard(testCase, result) {
  const answer = result && result.answer ? String(result.answer) : '';
  const hasAnswer = Boolean(answer.trim());
  return {
    score: scoreParts([
      hasAnswer,
      includesAll(answer, testCase.must_include),
      !result.error,
    ]),
    hasAnswer,
    hasMustInclude: includesAll(answer, testCase.must_include),
    error: result.error ? (result.error.reason || result.error.code || 'error') : null,
  };
}

function evaluateDiscovery(testCase, result) {
  const answer = result && result.final_answer ? String(result.final_answer) : '';
  const uncertainty = result && result.uncertainty;
  const hypotheses = result && Array.isArray(result.hypotheses) ? result.hypotheses : [];
  const validations = result && Array.isArray(result.validations) ? result.validations : [];
  const domainMatches = !testCase.expected_domain ||
    (uncertainty && uncertainty.domain === testCase.expected_domain);

  return {
    score: scoreParts([
      Boolean(answer.trim()),
      Boolean(uncertainty && uncertainty.unknowns && uncertainty.unknowns.length),
      hypotheses.length === 4,
      validations.length === 4,
      domainMatches,
      includesAll(answer, testCase.must_include),
      !result.error,
    ]),
    hasAnswer: Boolean(answer.trim()),
    hasUncertainty: Boolean(uncertainty && uncertainty.unknowns && uncertainty.unknowns.length),
    hypothesesCount: hypotheses.length,
    validationsCount: validations.length,
    domain: uncertainty ? uncertainty.domain : null,
    domainMatches,
    hasMustInclude: includesAll(answer, testCase.must_include),
    error: result.error ? (result.error.reason || result.error.code || 'error') : null,
  };
}

function scoreParts(parts) {
  const total = parts.length;
  const passed = parts.filter(Boolean).length;
  return Math.round((passed / total) * 100);
}

function includesAll(text, terms) {
  if (!Array.isArray(terms) || terms.length === 0) return true;
  const lower = String(text || '').toLowerCase();
  return terms.every((term) => lower.includes(String(term).toLowerCase()));
}

function printCase(row) {
  const { testCase, standardEval, discoveryEval, discovery } = row;
  console.log('------------------------------------------------------------');
  console.log(`${testCase.id} [${testCase.category}]`);
  console.log(testCase.prompt);
  console.log(`Standard:  ${standardEval.score}%${standardEval.error ? ` error=${standardEval.error}` : ''}`);
  console.log(`Discovery: ${discoveryEval.score}% domain=${discoveryEval.domain || 'none'} unknowns=${discoveryEval.hasUncertainty ? 'yes' : 'no'} hypotheses=${discoveryEval.hypothesesCount}`);

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
  const avgStandard = average(rows.map((row) => row.standardEval.score));
  const avgDiscovery = average(rows.map((row) => row.discoveryEval.score));
  const discoveryWins = rows.filter((row) => row.discoveryEval.score > row.standardEval.score).length;
  const standardWins = rows.filter((row) => row.standardEval.score > row.discoveryEval.score).length;
  const ties = rows.length - discoveryWins - standardWins;

  console.log('\n============================================================');
  console.log('BENCHMARK SUMMARY');
  console.log('============================================================');
  console.log(`Average Standard:  ${avgStandard.toFixed(1)}%`);
  console.log(`Average Discovery: ${avgDiscovery.toFixed(1)}%`);
  console.log(`Discovery wins: ${discoveryWins}`);
  console.log(`Standard wins:  ${standardWins}`);
  console.log(`Ties:           ${ties}`);

  const byCategory = new Map();
  for (const row of rows) {
    const current = byCategory.get(row.testCase.category) || { count: 0, standard: 0, discovery: 0 };
    current.count += 1;
    current.standard += row.standardEval.score;
    current.discovery += row.discoveryEval.score;
    byCategory.set(row.testCase.category, current);
  }

  console.log('\nBy category:');
  for (const [category, data] of byCategory.entries()) {
    console.log(`- ${category}: standard ${(data.standard / data.count).toFixed(1)}%, discovery ${(data.discovery / data.count).toFixed(1)}%`);
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
