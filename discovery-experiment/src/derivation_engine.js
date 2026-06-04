'use strict';

const primitiveDecomposition = require('./primitive_decomposition');
const logicRules = require('./logic_rules');

/**
 * derivation_engine.js
 * 
 * Derives possibilities from primitives + logic rules
 * WITHOUT relying on training knowledge
 * 
 * Process:
 * 1. Decompose input into primitives
 * 2. Apply logic rules to find applicable derivation paths
 * 3. For each applicable rule, generate possibilities
 * 4. Test each possibility for contradictions
 * 5. Return only logically consistent possibilities
 */

async function deriveFromPrimitives(input) {
  // Step 1: Decompose input into primitives
  const primitives = primitiveDecomposition.decompose(input);

  // Step 2: Apply each logic rule category
  const derivedHypotheses = [];

  // Apply abbreviation rules
  for (const rule of logicRules.LOGIC_RULES.abbreviations) {
    const result = logicRules.applyRule(rule, primitives);
    if (result.applicable) {
      const hypotheses = generateHypothesesFromRule(
        rule.name,
        input,
        result,
        primitives
      );
      derivedHypotheses.push(...hypotheses);
    }
  }

  // Apply technical rules
  for (const rule of logicRules.LOGIC_RULES.technical) {
    const result = logicRules.applyRule(rule, primitives);
    if (result.applicable) {
      const hypotheses = generateHypothesesFromRule(
        rule.name,
        input,
        result,
        primitives
      );
      derivedHypotheses.push(...hypotheses);
    }
  }

  // Apply question/intent rules too, so real user prompts produce richer
  // primitive context instead of only broad domain labels.
  for (const rule of logicRules.LOGIC_RULES.questions) {
    const result = logicRules.applyRule(rule, primitives);
    if (result.applicable) {
      const hypotheses = generateHypothesesFromRule(
        rule.name,
        input,
        result,
        primitives
      );
      derivedHypotheses.push(...hypotheses);
    }
  }

  // Step 3: Test each hypothesis for contradictions
  const validatedHypotheses = derivedHypotheses.map((hyp, idx) => {
    const contradictionTest = logicRules.testContradiction(hyp.guess, primitives);
    return {
      id: idx + 1,
      guess: hyp.guess,
      reasoning: hyp.reasoning,
      derivation_path: hyp.derivation_path,
      contradicts: contradictionTest.has_contradiction,
      contradiction_details: contradictionTest.tests,
    };
  });

  // Filter: keep only logically consistent (non-contradictory) hypotheses
  const logicallyConsistent = validatedHypotheses.filter((h) => !h.contradicts);

  // If we have fewer than 4, include some contradictory ones with warnings
  let finalHypotheses = logicallyConsistent;
  if (finalHypotheses.length < 4) {
    const contradictoryOnes = validatedHypotheses
      .filter((h) => h.contradicts)
      .slice(0, 4 - finalHypotheses.length)
      .map((h) => ({
        ...h,
        warning: 'Contains contradiction - test anyway',
      }));
    finalHypotheses = [...finalHypotheses, ...contradictoryOnes];
  }

  if (finalHypotheses.length < 4) {
    finalHypotheses = addContextualFallbackHypotheses(
      finalHypotheses,
      input,
      primitives,
      4
    );
  }

  // Ensure exactly 4 hypotheses
  finalHypotheses = finalHypotheses.slice(0, 4);

  return {
    input,
    primitives,
    hypotheses: finalHypotheses,
    consistency_stats: {
      total_generated: derivedHypotheses.length,
      logically_consistent: logicallyConsistent.length,
      with_contradictions: validatedHypotheses.filter((h) => h.contradicts).length,
    },
  };
}

function generateHypothesesFromRule(ruleName, input, ruleResult, primitives) {
  const hypotheses = [];
  const lower = input.toLowerCase();

  if (ruleName === 'ai_architecture_request') {
    hypotheses.push({
      guess: 'Build a Primitive Reasoning Engine instead of another trained chatbot',
      reasoning: 'The request asks for a new AI model unlike traditional neural-network-first training, so the core should be explicit reasoning over primitives.',
      derivation_path: 'ai_architecture_request.core_model',
    });

    hypotheses.push({
      guess: 'Use a memory graph plus contradiction checker as the model state',
      reasoning: 'A non-traditional model needs persistent structured state, not only temporary prompt context or static weights.',
      derivation_path: 'ai_architecture_request.memory_state',
    });

    hypotheses.push({
      guess: 'Generate multiple symbolic hypotheses and score them before answering',
      reasoning: 'The current experiment already compares hypotheses, so the next architecture step is to make hypothesis generation rule-driven and inspectable.',
      derivation_path: 'ai_architecture_request.hypothesis_loop',
    });

    hypotheses.push({
      guess: 'Use an LLM only as a validator or language surface, not as the whole brain',
      reasoning: 'The phrase "unlike traditional" implies the model should not depend entirely on normal LLM recall.',
      derivation_path: 'ai_architecture_request.llm_boundary',
    });
  }

  if (ruleName === 'multi_word_abbreviation') {
    // For abbreviations, generate possibilities based on first letters
    const chars = lower.split('');
    
    // Hypothesis 1: Each char is first letter
    hypotheses.push({
      guess: `Multi-word abbreviation (${chars.length} words)`,
      reasoning: `Each character '${chars.join(', ')}' likely represents first letter of a word`,
      derivation_path: 'multi_word_abbreviation',
    });

    // Hypothesis 2: Domain-specific tech term
    hypotheses.push({
      guess: 'Domain-specific technical acronym',
      reasoning: 'Length and character composition suggest specialized tech abbreviation',
      derivation_path: 'multi_word_abbreviation',
    });

    // Hypothesis 3: Version notation
    if (/\d/.test(input)) {
      hypotheses.push({
        guess: 'Library/tool name with version notation',
        reasoning: `${lower} follows pattern: name + version number`,
        derivation_path: 'multi_word_abbreviation',
      });
    }
  }

  if (ruleName === 'word_combination') {
    hypotheses.push({
      guess: 'Two-word concept abbreviation',
      reasoning: `Input length ${input.length} and composition suggest two-part compression`,
      derivation_path: 'word_combination',
    });

    hypotheses.push({
      guess: 'Abbreviated software library/tool name',
      reasoning: 'Follows naming pattern of tech libraries (short, alphanumeric)',
      derivation_path: 'word_combination',
    });
  }

  if (ruleName === 'tech_domain_clue') {
    const domain = ruleResult.domain;
    if (domain !== 'ai_architecture') {
      hypotheses.push({
        guess: `${domain} domain concept/terminology`,
        reasoning: `Input contains ${domain} keywords: ${lower}`,
        derivation_path: 'tech_domain_clue',
      });
    }
  }

  if (ruleName === 'hardware_vs_software') {
    if (ruleResult.hardware_likelihood) {
      hypotheses.push({
        guess: 'Hardware-related technology or processor',
        reasoning: `Input contains more hardware keywords (score: ${ruleResult.scores.hardware_score})`,
        derivation_path: 'hardware_vs_software',
      });
    }
    if (ruleResult.software_likelihood) {
      hypotheses.push({
        guess: 'Software library, package, or framework',
        reasoning: `Input contains more software keywords (score: ${ruleResult.scores.software_score})`,
        derivation_path: 'hardware_vs_software',
      });
    }
  }

  if (ruleName === 'question_implies_answer_type') {
    hypotheses.push({
      guess: `${ruleResult.answer_type} request`,
      reasoning: `The input form implies the answer should be a ${ruleResult.answer_type}.`,
      derivation_path: 'question_implies_answer_type',
    });
  }

  return hypotheses;
}

function addContextualFallbackHypotheses(existing, input, primitives, targetCount) {
  const finalHypotheses = [...existing];
  const lower = input.toLowerCase();
  const domain = primitives.contextual_clues.implied_domain || 'unknown';
  const nextId = () => finalHypotheses.length + 1;

  const candidates = [
    {
      guess: domain === 'ai_architecture'
        ? 'Need an executable architecture plan, not a generic explanation'
        : 'Request for a complete implementation-oriented answer',
      reasoning: domain === 'ai_architecture'
        ? 'The prompt asks to create a new AI model, so the answer should name modules, data flow, and next implementation steps.'
        : 'The phrasing asks to start work and provide all context, not a short answer.',
      derivation_path: 'intent_completeness',
    },
    {
      guess: `${domain} problem requiring current-state explanation`,
      reasoning: `Primitive domain inference is "${domain}", so the answer should explain the current state before proposing action.`,
      derivation_path: 'domain_context',
    },
    {
      guess: 'Need to separate known facts from unresolved unknowns',
      reasoning: `Unknown markers found: ${(primitives.unknowns || []).join(', ') || 'none explicit'}.`,
      derivation_path: 'unknown_boundary',
    },
    {
      guess: lower.includes('model') || lower.includes('ai')
        ? 'New AI-model architecture request'
        : 'General build or reasoning request',
      reasoning: 'The input asks for a system response that goes beyond direct recall.',
      derivation_path: 'goal_inference',
    },
  ];

  for (const candidate of candidates) {
    if (finalHypotheses.length >= targetCount) break;
    if (finalHypotheses.some((h) => h.guess === candidate.guess)) continue;
    const contradictionTest = logicRules.testContradiction(candidate.guess, primitives);
    finalHypotheses.push({
      id: nextId(),
      ...candidate,
      contradicts: contradictionTest.has_contradiction,
      contradiction_details: contradictionTest.tests,
      fallback: true,
    });
  }

  return finalHypotheses;
}

module.exports = {
  deriveFromPrimitives,
};
