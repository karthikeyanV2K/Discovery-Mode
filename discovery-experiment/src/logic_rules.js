'use strict';

/**
 * logic_rules.js
 * 
 * Pure logic rules for deriving possibilities
 * These rules are domain-agnostic and based on linguistic/logical principles
 */

const LOGIC_RULES = {
  // Abbreviation rules
  abbreviations: [
    {
      name: 'multi_word_abbreviation',
      description: 'Abbreviations often compress multiple words',
      rule: (primitives) => {
        if (primitives.patterns.looks_like_abbreviation) {
          const chars = primitives.raw_input.toLowerCase().split('');
          return {
            applicable: true,
            possibilities: [
              'Each character could be first letter of a word',
              'Characters could represent common tech terms',
              'Could be version notation (letter + number)',
            ],
          };
        }
        return { applicable: false };
      },
    },
    {
      name: 'word_combination',
      description: 'Abbreviations compress logical word combinations',
      rule: (primitives) => {
        const input = primitives.raw_input.toLowerCase();
        if (input.length <= 5 && /^[a-z]+\d*$/.test(input)) {
          return {
            applicable: true,
            possibilities: [
              'Two-word combination (first parts)',
              'Word + version number',
              'Domain-specific acronym',
            ],
          };
        }
        return { applicable: false };
      },
    },
  ],

  // Technical context rules
  technical: [
    {
      name: 'ai_architecture_request',
      description: 'Requests for new/non-traditional AI models imply architecture, learning loop, memory, and evaluation design',
      rule: (primitives) => {
        const lower = primitives.raw_input.toLowerCase();
        const asksForAiModel = /ai|model|intelligence|reasoning/.test(lower);
        const asksForNovelty = /new|unlike|non[-\s]?traditional|traditional|different|from scratch|not normal/.test(lower);

        if (asksForAiModel && asksForNovelty) {
          return {
            applicable: true,
            architecture_goal: 'non_traditional_ai_model',
            required_parts: [
              'primitive extraction',
              'symbolic hypothesis generation',
              'constraint and contradiction testing',
              'memory graph',
              'feedback-driven refinement',
              'optional neural/LLM validator',
            ],
            reasoning: 'Input asks for a new AI model unlike the traditional approach.',
          };
        }

        return { applicable: false };
      },
    },
    {
      name: 'tech_domain_clue',
      description: 'Presence of tech keywords narrows domain',
      rule: (primitives) => {
        if (primitives.contextual_clues.contains_tech_field_hints) {
          const domain = primitives.contextual_clues.implied_domain;
          return {
            applicable: true,
            domain: domain,
            reasoning: `Input contains tech hints, likely from ${domain} domain`,
          };
        }
        return { applicable: false };
      },
    },
    {
      name: 'hardware_vs_software',
      description: 'Hardware keywords suggest hardware, software keywords suggest software',
      rule: (primitives) => {
        const lower = primitives.raw_input.toLowerCase();
        const hardware_score = (lower.match(/cpu|gpu|tpu|chip|processor|memory|cache/gi) || []).length;
        const software_score = (lower.match(/library|package|module|framework|api|function/gi) || []).length;
        
        return {
          applicable: true,
          hardware_likelihood: hardware_score > software_score,
          software_likelihood: software_score > hardware_score,
          scores: { hardware_score, software_score },
        };
      },
    },
  ],

  // Question answering rules
  questions: [
    {
      name: 'question_implies_answer_type',
      description: '"What is X" asks for definition; "Can you" asks for capability',
      rule: (primitives) => {
        const lower = primitives.raw_input.toLowerCase();
        
        if (lower.startsWith('what')) {
          return {
            applicable: true,
            answer_type: 'definition/explanation',
            should_explain: true,
          };
        }
        if (lower.startsWith('can') || lower.startsWith('is')) {
          return {
            applicable: true,
            answer_type: 'yes/no or capability',
            should_evaluate: true,
          };
        }
        if (lower.startsWith('how')) {
          return {
            applicable: true,
            answer_type: 'procedure/steps',
            should_detail: true,
          };
        }
        
        return { applicable: false };
      },
    },
  ],

  // Contradiction detection rules
  contradictions: [
    {
      name: 'semantic_impossibility',
      description: 'If hypothesis contradicts known primitives, mark invalid',
      test: (hypothesis, primitives) => {
        // If input has no uppercase but hypothesis says "all uppercase acronym", contradiction
        if (!primitives.patterns.has_numbers && /\d/.test(hypothesis)) {
          return { contradicts: true, reason: 'Hypothesis has numbers but input does not' };
        }
        
        // If input is 2 chars but hypothesis says "three word phrase", contradiction
        if (primitives.length < 3 && hypothesis.split(/\s+/).length > 2) {
          return { contradicts: true, reason: 'Hypothesis is longer than input allows' };
        }
        
        return { contradicts: false };
      },
    },
    {
      name: 'domain_consistency',
      description: 'Hypothesis must be consistent with domain hints',
      test: (hypothesis, primitives) => {
        const domain = primitives.contextual_clues.implied_domain;
        const lower = hypothesis.toLowerCase();
        
        // If domain is "hardware" but hypothesis is "Python library", contradiction
        if (domain === 'hardware') {
          if (/library|package|framework|npm|pip/.test(lower)) {
            return { contradicts: true, reason: `Hypothesis "${hypothesis}" contradicts hardware domain` };
          }
        }
        
        // If domain is "systems" but hypothesis is "web framework", contradiction
        if (domain === 'systems') {
          if (/web|frontend|react|vue|html|css/.test(lower)) {
            return { contradicts: true, reason: `Hypothesis "${hypothesis}" contradicts systems domain` };
          }
        }
        
        return { contradicts: false };
      },
    },
  ],
};

function applyRule(rule, primitives) {
  try {
    return rule.rule(primitives);
  } catch (e) {
    return { applicable: false, error: e.message };
  }
}

function testContradiction(hypothesis, primitives, ruleType = 'all') {
  const contradictionRules = LOGIC_RULES.contradictions;
  
  const results = contradictionRules.map((rule) => ({
    rule: rule.name,
    result: rule.test(hypothesis, primitives),
  }));
  
  const hasContradiction = results.some((r) => r.result.contradicts);
  
  return {
    hypothesis,
    has_contradiction: hasContradiction,
    tests: results,
  };
}

module.exports = {
  LOGIC_RULES,
  applyRule,
  testContradiction,
};
