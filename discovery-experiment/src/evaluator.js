'use strict';

function evaluateReasoning(testCase, result) {
  const answer = result && (result.answer || result.final_answer) ? String(result.answer || result.final_answer) : '';
  const reasoning = result && result.reasoning ? String(result.reasoning) : '';
  const combined = `${reasoning}\n${answer}`;

  return {
    score: scoreParts([
      Boolean(answer.trim()),
      includesAll(combined, testCase.must_include),
      mentionsMethod(combined, testCase),
      !result.error,
    ]),
    hasAnswer: Boolean(answer.trim()),
    hasMustInclude: includesAll(combined, testCase.must_include),
    hasMethod: mentionsMethod(combined, testCase),
    error: result && result.error ? (result.error.reason || result.error.code || 'error') : null,
  };
}

function evaluateDiscovery(testCase, result) {
  const answer = result && result.final_answer ? String(result.final_answer) : '';
  const uncertainty = result && result.uncertainty;
  const hypotheses = result && Array.isArray(result.hypotheses) ? result.hypotheses : [];
  const validations = result && Array.isArray(result.validations) ? result.validations : [];
  const domainMatches = !testCase.expected_domain ||
    (uncertainty && domainsMatch(uncertainty.domain, testCase.expected_domain));
  const usedRightStrategy = discoveryUsedRightStrategy(testCase, result);

  return {
    score: scoreParts([
      Boolean(answer.trim()),
      Boolean(uncertainty && uncertainty.unknowns && uncertainty.unknowns.length),
      hypotheses.length === 4,
      validations.length === 4,
      domainMatches,
      includesAll(answer, testCase.must_include),
      usedRightStrategy,
      !result.error,
    ]),
    hasAnswer: Boolean(answer.trim()),
    hasUncertainty: Boolean(uncertainty && uncertainty.unknowns && uncertainty.unknowns.length),
    hypothesesCount: hypotheses.length,
    validationsCount: validations.length,
    domain: uncertainty ? uncertainty.domain : null,
    domainMatches,
    hasMustInclude: includesAll(answer, testCase.must_include),
    usedRightStrategy,
    error: result && result.error ? (result.error.reason || result.error.code || 'error') : null,
  };
}

function discoveryUsedRightStrategy(testCase, result) {
  const category = String(testCase.category || '').toLowerCase();
  const text = [
    result && result.solver,
    result && result.uncertainty && result.uncertainty.exploration_strategy,
    result && result.final_answer,
  ].filter(Boolean).join('\n').toLowerCase();

  if (category.includes('math')) {
    return /crt|direct|solver|modular|verify|search/.test(text);
  }
  if (category.includes('architecture')) {
    return /architecture|primitive|memory|hypothes|contradiction|score/.test(text);
  }
  if (category.includes('system') || category.includes('kernel')) {
    return /boot|gdt|vga|protected|qemu|driver|interrupt/.test(text);
  }
  if (category.includes('apk') || category.includes('malware')) {
    return /sandbox|static|dynamic|permission|manifest|evidence|yara|hash|triage/.test(text);
  }
  if (category.includes('emotion')) {
    return /uncertain|wait|avoid|panic|constraint|unknown/.test(text);
  }
  if (category.includes('ethic')) {
    return /facts|harm|risk|options|document|escalat/.test(text);
  }
  if (category.includes('forensic') || category.includes('cyber')) {
    return /evidence|timeline|uncertain|avoid accusing|attribution|log/.test(text);
  }
  if (category.includes('ctf')) {
    return /ctf|cookie|scope|safe|inspect|decode/.test(text);
  }
  if (category.includes('logic')) {
    return /constraint|label|mixed|verify|direct/.test(text);
  }
  if (category.includes('space')) {
    return /power|water|risk|redundan|habitat|failure/.test(text);
  }
  return true;
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

function mentionsMethod(text, testCase) {
  const category = String(testCase.category || '').toLowerCase();
  const lower = String(text || '').toLowerCase();
  if (category.includes('math')) return /method|mod|crt|search|verify|solve/.test(lower);
  if (category.includes('architecture')) return /architecture|engine|module|primitive|memory/.test(lower);
  if (category.includes('system') || category.includes('kernel')) return /boot|gdt|vga|interrupt|driver|qemu/.test(lower);
  if (category.includes('apk') || category.includes('malware')) return /sandbox|static|dynamic|permission|manifest|evidence|hash/.test(lower);
  if (category.includes('emotion')) return /wait|message|panic|assume|space/.test(lower);
  if (category.includes('ethic')) return /facts|harm|risk|options|document/.test(lower);
  if (category.includes('forensic') || category.includes('cyber')) return /evidence|timeline|log|report|verify/.test(lower);
  if (category.includes('ctf')) return /ctf|cookie|scope|inspect|decode/.test(lower);
  if (category.includes('logic')) return /mixed|constraint|label|draw|box/.test(lower);
  if (category.includes('space')) return /power|water|risk|habitat|failure/.test(lower);
  return Boolean(lower.trim());
}

function domainsMatch(actual, expected) {
  if (actual === expected) return true;
  const aliases = {
    ai: 'ai_architecture',
    ml: 'ai_architecture',
    osdev: 'systems_kernel',
    operating_systems: 'systems_kernel',
    android_security: 'unknown',
    apk_analysis: 'unknown',
    malware_analysis: 'unknown',
    ethics: 'unknown',
    workplace_ethics: 'unknown',
    ethics_workplace: 'unknown',
    ctf_web: 'unknown',
    web_ctf: 'unknown',
    relationships: 'unknown',
    cybersecurity: 'unknown',
    math: 'math_crt',
  };
  return aliases[actual] === expected || aliases[expected] === actual;
}

function winnerLabel(reasoningEval, discoveryEval) {
  if (discoveryEval.score > reasoningEval.score) return 'discovery';
  if (reasoningEval.score > discoveryEval.score) return 'reasoning';
  return 'tie';
}

module.exports = {
  evaluateReasoning,
  evaluateDiscovery,
  winnerLabel,
};
