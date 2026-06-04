#!/usr/bin/env node
'use strict';

/**
 * quick_test.js
 * 
 * Fast test script for Primitive Discovery Mode
 * Run: node quick_test.js
 * 
 * Tests your two prompts and shows all three modes
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const primitiveDecomposition = require('./src/primitive_decomposition');
const derivationEngine = require('./src/derivation_engine');
const logicRules = require('./src/logic_rules');

const testInputs = [
  {
    title: 'Test 1: Novel Concept (Assembly Kernel)',
    input: 'hey you able to create pure assembly kernel',
  },
  {
    title: 'Test 2: Current Tech (TPU Architecture)',
    input: 'what is current tpu architecture',
  },
];

async function runTest(title, input) {
  console.log('\n' + '='.repeat(80));
  console.log(`${title}`);
  console.log('='.repeat(80));
  console.log(`Input: "${input}"\n`);

  try {
    // Step 1: Decompose into primitives
    console.log('STEP 1: PRIMITIVE DECOMPOSITION');
    console.log('-'.repeat(80));
    const primitives = primitiveDecomposition.decompose(input);

    console.log('Character Types:', primitives.char_types);
    console.log('\nPatterns:', primitives.patterns);
    console.log('\nContextual Clues:', primitives.contextual_clues);
    console.log('\nUndeniable Facts:', primitives.undeniable_facts);
    console.log('\nUnknowns to Resolve:', primitives.unknowns);

    // Step 2: Derive hypotheses from primitives
    console.log('\n\nSTEP 2: DERIVATION FROM PRIMITIVES');
    console.log('-'.repeat(80));
    const derivationResult = await derivationEngine.deriveFromPrimitives(input);

    console.log(
      `Generated ${derivationResult.consistency_stats.total_generated} hypotheses`
    );
    console.log(
      `${derivationResult.consistency_stats.logically_consistent} are logically consistent`
    );
    console.log(
      `${derivationResult.consistency_stats.with_contradictions} contain contradictions\n`
    );

    derivationResult.hypotheses.forEach((hyp) => {
      console.log(`Hypothesis ${hyp.id}: ${hyp.guess}`);
      console.log(`  Derivation Path: ${hyp.derivation_path}`);
      console.log(`  Reasoning: ${hyp.reasoning}`);
      if (hyp.contradicts) {
        console.log(`  ⚠️  CONTRADICTS: ${hyp.warning || 'Logic inconsistency'}`);
        hyp.contradiction_details.forEach((detail) => {
          if (detail.result.contradicts) {
            console.log(`     - ${detail.rule}: ${detail.result.reason}`);
          }
        });
      } else {
        console.log(`  ✅ Logically consistent`);
      }
      console.log();
    });

    // Step 3: Logic rules explanation
    console.log('\nSTEP 3: LOGIC RULES APPLIED');
    console.log('-'.repeat(80));

    // Apply abbreviation rules
    for (const rule of logicRules.LOGIC_RULES.abbreviations) {
      const result = logicRules.applyRule(rule, primitives);
      if (result.applicable) {
        console.log(`✓ Rule: ${rule.name}`);
        console.log(`  ${rule.description}`);
        console.log();
      }
    }

    // Apply technical rules
    for (const rule of logicRules.LOGIC_RULES.technical) {
      const result = logicRules.applyRule(rule, primitives);
      if (result.applicable) {
        console.log(`✓ Rule: ${rule.name}`);
        console.log(`  ${rule.description}`);
        if (result.domain) console.log(`  Domain: ${result.domain}`);
        if (result.reasoning) console.log(`  Reasoning: ${result.reasoning}`);
        console.log();
      }
    }

    console.log(
      '\n' +
        '💡 These hypotheses were derived from LOGIC and PRIMITIVES, not from training data.\n'
    );
    console.log('Next step: AI validates which derived hypothesis is most likely.\n');
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
  }
}

async function main() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('█  PRIMITIVE DISCOVERY MODE - QUICK TEST');
  console.log('█  Testing derivation from first principles vs training knowledge');
  console.log('█'.repeat(80));

  for (const test of testInputs) {
    await runTest(test.title, test.input);
  }

  console.log('\n' + '='.repeat(80));
  console.log('NEXT: Start server and test via API');
  console.log('='.repeat(80));
  console.log('\nStart server:');
  console.log('  npm start');
  console.log('\nThen test via curl:');
  console.log('\n  # Test Primitive Mode only:');
  console.log(
    '  curl -X POST http://localhost:3000/api/run-primitive \\\\'
  );
  console.log('    -H "Content-Type: application/json" \\\\');
  console.log(
    '    -d \'{"input":"hey you able to create pure assembly kernel","model":"ollama/llama3.2"}\''
  );
  console.log('\n  # Test all three modes:');
  console.log('  curl -X POST http://localhost:3000/api/run-three \\\\');
  console.log('    -H "Content-Type: application/json" \\\\');
  console.log(
    '    -d \'{"input":"what is current tpu architecture","model":"ollama/llama3.2"}\''
  );
  console.log('\n' + '='.repeat(80) + '\n');
}

main();
