'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const readline = require('readline');
const promptLoader = require('./src/prompt_loader');
const discoveryMode = require('./src/discovery_mode');

const DEFAULT_MODEL = process.env.DISCOVERY_MODEL || 'ollama-cloud/gpt-oss:120b';

async function main() {
  const args = process.argv.slice(2);
  const model = readOption(args, '--model') || DEFAULT_MODEL;
  const jsonMode = args.includes('--json');
  const prompt = normalizeDiscoverInput(readPromptArg(args));
  const prompts = await promptLoader.loadAll();

  if (prompt) {
    const result = await discoveryMode.run(prompt, model, prompts);
    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printDiscoveryResult(prompt, model, result);
    }
    return;
  }

  console.log('Discovery Mode CLI');
  console.log(`Model: ${model}`);
  console.log('Type a prompt. Commands: /discover <prompt>, /exit, /model <id>\n');

  let activeModel = model;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'discovery> ',
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input === '/exit' || input === '/quit') {
      rl.close();
      return;
    }

    if (input.startsWith('/model ')) {
      activeModel = input.slice('/model '.length).trim() || activeModel;
      console.log(`Model set to: ${activeModel}\n`);
      rl.prompt();
      return;
    }

    try {
      const discoverInput = normalizeDiscoverInput(input);
      const result = await discoveryMode.run(discoverInput, activeModel, prompts);
      printDiscoveryResult(discoverInput, activeModel, result);
    } catch (err) {
      console.error(`\nDiscovery failed: ${err.message}\n`);
    }

    rl.prompt();
  });
}

function readOption(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function readPromptArg(args) {
  const filtered = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--model' || args[i] === '--json') {
      if (args[i] === '--model') i += 1; // skip next value too
      continue;
    }
    filtered.push(args[i]);
  }
  return filtered.join(' ').trim();
}

function normalizeDiscoverInput(input) {
  const trimmed = String(input || '').trim();
  if (trimmed.toLowerCase().startsWith('/discover ')) {
    return trimmed.slice('/discover '.length).trim();
  }
  if (trimmed.toLowerCase() === '/discover') {
    return '';
  }
  return trimmed;
}

function printDiscoveryResult(input, model, result) {
  console.log('\n============================================================');
  console.log('DISCOVERY MODE RESULT');
  console.log('============================================================');
  console.log(`Model: ${model}`);
  console.log(`Input: ${input}`);

  if (result.error) {
    console.log('\nERROR');
    console.log(`- ${result.error.code || 'unknown'}: ${result.error.reason || 'Unknown error'}`);
    return;
  }

  printUncertainty(result.uncertainty);
  printHypotheses(result.hypotheses || [], result.winner_id);
  printValidations(result.validations || [], result.winner_id);

  console.log('\nFINAL ANSWER');
  console.log('------------------------------------------------------------');
  console.log(result.final_answer || '(no answer)');

  if (result.confidence != null) {
    console.log(`\nConfidence: ${result.confidence}%`);
  }

  if (result.recovered_from_parse_error || result.recovered_from_validation_error) {
    console.log('\nRecovery note: model output failed or was malformed, so Discovery used local uncertainty-aware fallback logic.');
  }

  console.log('============================================================\n');
}

function printUncertainty(uncertainty) {
  if (!uncertainty) return;

  console.log('\nSTEP 0 - WHAT DO I NOT KNOW?');
  console.log('------------------------------------------------------------');
  console.log(`Domain: ${uncertainty.domain || 'unknown'}`);
  console.log(`Hallucination risk: ${uncertainty.risk_of_hallucination || 'medium'}`);
  console.log(`Needs architecture: ${uncertainty.needs_architecture ? 'yes' : 'no'}`);
  console.log(`Needs current info: ${uncertainty.needs_current_info ? 'yes' : 'no'}`);
  printList('Known facts', uncertainty.known_facts);
  printList('Unknowns', uncertainty.unknowns);
  printList('Ambiguities', uncertainty.ambiguities);
  printList('Constraints', uncertainty.constraints);
  if (uncertainty.exploration_strategy) {
    console.log(`Strategy: ${uncertainty.exploration_strategy}`);
  }
}

function printHypotheses(hypotheses, winnerId) {
  console.log('\nSTEP 1 - POSSIBILITIES');
  console.log('------------------------------------------------------------');
  if (!hypotheses.length) {
    console.log('(none)');
    return;
  }

  for (const h of hypotheses) {
    const winner = h.id === winnerId ? ' [WINNER]' : '';
    console.log(`H${h.id}${winner}: ${h.guess}`);
    if (h.reasoning) console.log(`  reason: ${h.reasoning}`);
    if (h.thinking) console.log(`  evidence: ${h.thinking}`);
  }
}

function printValidations(validations, winnerId) {
  console.log('\nSTEP 2 - REALITY CHECK');
  console.log('------------------------------------------------------------');
  if (!validations.length) {
    console.log('(none)');
    return;
  }

  for (const v of validations) {
    const winner = v.id === winnerId ? ' [WINNER]' : '';
    console.log(`H${v.id}${winner}: score ${v.score}`);
    if (v.evidence) console.log(`  evidence: ${v.evidence}`);
  }
}

function printList(label, values) {
  if (!Array.isArray(values) || values.length === 0) return;
  console.log(`${label}:`);
  for (const value of values) {
    console.log(`- ${value}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
