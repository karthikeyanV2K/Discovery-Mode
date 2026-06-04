/**
 * reality_test.js
 *
 * Validates whether an agent's /discover response follows the Discovery Mode protocol.
 *
 * Usage:
 *   node discover-agent-modes/reality_test.js --all
 *   node discover-agent-modes/reality_test.js --check response.txt
 *   node discover-agent-modes/reality_test.js 1
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Sections the agent must output
const REQUIRED_SECTIONS = [
  'ANALYSIS',
  'KNOWN',
  'UNKNOWN',
  'CONSTRAINTS',
  'STRATEGY',
  'APPROACHES',
  'EVALUATION',
  'FINAL ANSWER',
];

// Test cases matching the canonical core protocol
const TEST_CASES = [
  {
    input: 'design a minimal kernel architecture',
    domain: 'systems',
    known: ['"kernel" = OS core component', '"minimal" = small scope, from scratch', '"architecture" = structural design'],
    unknown: ['Boot target: BIOS or UEFI', 'CPU mode: 16/32/64-bit', 'First driver scope'],
    constraints: ['Prefer smallest bootable architecture', 'Not a full OS clone'],
    avoidPattern: 'Full textbook OS outline with virtual memory, filesystem, networking',
    strategyType: 'architecture_explore',
    strategyPlan: 'Generate staged boot architecture options, prefer smallest testable path',
    approaches: [
      { id: 1, description: 'Staged bare-metal architecture: boot sector → loader → CPU setup → kernel core → VGA → IDT → keyboard → shell',
        rationale: 'Smallest viable architecture, each stage independently testable in QEMU',
        evidence: '"Minimal" and "kernel" imply focused scope. BIOS is safest first target.' },
      { id: 2, description: 'Use C with minimal assembly instead of pure assembly',
        rationale: 'Faster development, but violates "minimal" constraint by adding compiler toolchain',
        evidence: 'Practical but adds unnecessary complexity for a minimal design' },
      { id: 3, description: 'Full OS architecture: virtual memory, filesystem, networking, userspace',
        rationale: 'Standard textbook OS layout',
        evidence: 'Default memorized pattern — contradicts "minimal" constraint entirely' },
      { id: 4, description: 'Quick prototype: boot sector that prints to screen, then expand',
        rationale: 'Fastest path to a visible result, then iterate',
        evidence: 'Good for rapid iteration, less architectural depth than H1' },
    ],
    evaluation: [
      { id: 1, score: 92, evidence: 'Matches all constraints, smallest viable architecture, fully staged and testable' },
      { id: 2, score: 45, evidence: 'Violates "minimal" constraint by adding compiler complexity' },
      { id: 3, score: 12, evidence: 'Default pattern, contradicts "minimal" with full OS complexity' },
      { id: 4, score: 78, evidence: 'Practical, good for prototype, but less structural depth than H1' },
    ],
    winnerId: 1,
    confidence: 89,
  },
  {
    input: 'new approach to AI architecture',
    domain: 'ai_architecture',
    known: ['Input asks for an AI architecture', '"new approach" implies non-standard design'],
    unknown: ['Target capability', 'Required scale', 'Which parts are symbolic vs learned'],
    constraints: ['Avoid generic neural network descriptions', 'Avoid suggesting existing models as-is'],
    avoidPattern: 'Standard transformer architecture description or prompt engineering advice',
    strategyType: 'architecture_explore',
    strategyPlan: 'Generate architecture options that differ from standard deep learning patterns',
    approaches: [
      { id: 1, description: 'Structured reasoning core: extract primitives → generate hypotheses → test contradictions → compose answer',
        rationale: 'Reasoning from first principles, neural component only as language layer',
        evidence: '"New approach" implies departure from end-to-end neural networks' },
      { id: 2, description: 'Hybrid system combining symbolic rules with learned pattern matching',
        rationale: 'Keeps neural capabilities while adding explicit reasoning structure',
        evidence: 'Viable alternative but partially relies on existing neural patterns' },
      { id: 3, description: 'Use prompt engineering on existing models to simulate new behavior',
        rationale: 'Standard approach: improve output without changing architecture',
        evidence: 'Default pattern — misses "new approach" entirely' },
      { id: 4, description: 'Minimal prototype: input parser → rule engine → output composer',
        rationale: 'Smallest testable implementation of a non-neural reasoning system',
        evidence: 'Fastest path to a working demonstration of the concept' },
    ],
    evaluation: [
      { id: 1, score: 94, evidence: 'Directly addresses "new approach" with explicit reasoning architecture' },
      { id: 2, score: 68, evidence: 'Valid hybrid but partially defaults to standard patterns' },
      { id: 3, score: 5, evidence: 'Standard pattern, contradicts "new approach" entirely' },
      { id: 4, score: 82, evidence: 'Good minimal implementation path, practical for prototype' },
    ],
    winnerId: 1,
    confidence: 91,
  },
  {
    input: 'analyze this APK for security issues and dangerous permissions',
    domain: 'security',
    known: ['APK file analysis requested', 'Look for dangerous permissions and security issues'],
    unknown: ['Actual APK file not provided', 'Testing environment (CTF vs real-world)', 'Static vs dynamic analysis scope'],
    constraints: ['Must be defensive and authorized', 'No exploitation or live system modification', 'Evidence-first approach'],
    avoidPattern: 'Running the APK without sandboxing or suggesting exploit tools',
    strategyType: 'defensive_analysis',
    strategyPlan: 'Provide a safe defensive analysis workflow: static analysis first, dynamic analysis in sandbox second',
    approaches: [
      { id: 1, description: 'Static analysis: decompile with jadx, inspect AndroidManifest.xml permissions, review code patterns',
        rationale: 'Safest first step, reveals most permission abuse without executing code',
        evidence: 'Static analysis is the standard first step in APK analysis' },
      { id: 2, description: 'Dynamic analysis in sandboxed emulator: monitor network and file access in isolated environment',
        rationale: 'Reveals runtime behavior but requires sandbox setup',
        evidence: 'Useful second step after static analysis' },
      { id: 3, description: 'Upload to VirusTotal for signature-based detection',
        rationale: 'Quick community-driven detection but limited to known signatures',
        evidence: 'Default pattern — useful but incomplete, misses behavioral analysis' },
      { id: 4, description: 'Complete workflow: static analysis → sandboxed dynamic → evidence documentation → risk report',
        rationale: 'Covers all phases without unauthorized actions',
        evidence: 'Most thorough safe approach' },
    ],
    evaluation: [
      { id: 1, score: 88, evidence: 'Best first step, static analysis reveals most issues safely' },
      { id: 2, score: 76, evidence: 'Good second step but requires sandbox setup' },
      { id: 3, score: 50, evidence: 'Useful but passive, limited to known signatures only' },
      { id: 4, score: 85, evidence: 'Complete workflow covering all phases' },
    ],
    winnerId: 1,
    confidence: 90,
  },
];

function generateExpectedOutput(testCase) {
  const lines = [];
  lines.push('============================================================');
  lines.push('DISCOVERY MODE — EXPECTED OUTPUT');
  lines.push('============================================================');
  lines.push('');
  lines.push(`Input: /discover ${testCase.input}`);
  lines.push(`Domain: ${testCase.domain}`);
  lines.push('');
  lines.push('--- PHASE 1: ANALYSIS ---');
  lines.push('');
  lines.push('KNOWN:');
  testCase.known.forEach(k => lines.push(`  - ${k}`));
  lines.push('');
  lines.push('UNKNOWN:');
  testCase.unknown.forEach(u => lines.push(`  - ${u}`));
  lines.push('');
  lines.push('CONSTRAINTS:');
  testCase.constraints.forEach(c => lines.push(`  - ${c}`));
  lines.push(`  - Default pattern to avoid: ${testCase.avoidPattern}`);
  lines.push('');
  lines.push('STRATEGY:');
  lines.push(`  Type: ${testCase.strategyType}`);
  lines.push(`  Plan: ${testCase.strategyPlan}`);
  lines.push('');
  lines.push('--- PHASE 2: APPROACHES ---');
  lines.push('');
  testCase.approaches.forEach(a => {
    const winner = a.id === testCase.winnerId ? ' [SELECTED]' : '';
    lines.push(`H${a.id}${winner}: ${a.description}`);
    lines.push(`  Rationale: ${a.rationale}`);
    lines.push(`  Evidence: ${a.evidence}`);
    lines.push('');
  });
  lines.push('--- PHASE 3: EVALUATION ---');
  lines.push('');
  testCase.evaluation.forEach(v => {
    const winner = v.id === testCase.winnerId ? ' [SELECTED]' : '';
    lines.push(`H${v.id}${winner}: Score ${v.score}/100`);
    lines.push(`  Evidence: ${v.evidence}`);
    lines.push('');
  });
  lines.push(`Selection: H${testCase.winnerId} (highest score)`);
  lines.push('');
  lines.push('--- PHASE 4: FINAL ANSWER ---');
  lines.push('');
  lines.push('[Complete answer with reasoning chain]');
  lines.push('');
  lines.push(`Confidence: ${testCase.confidence}%`);
  lines.push('============================================================');
  return lines.join('\n');
}

function checkResponse(responseText) {
  const report = [];
  const upper = responseText.toUpperCase();

  report.push('============================================================');
  report.push('DISCOVERY MODE — VALIDATION REPORT');
  report.push('============================================================');
  report.push('');

  let sectionsPass = 0;
  report.push('Required Sections:');
  for (const section of REQUIRED_SECTIONS) {
    const present = upper.includes(section);
    if (present) sectionsPass++;
    report.push(`  ${present ? '✓' : '✗'} ${section}`);
  }
  report.push('');

  let approachesPass = 0;
  report.push('Approach Count (H1-H4):');
  for (let i = 1; i <= 4; i++) {
    const present = upper.includes(`H${i}`);
    if (present) approachesPass++;
    report.push(`  ${present ? '✓' : '✗'} H${i} present`);
  }
  report.push('');

  let validationPass = 0;
  report.push('Validation Checks:');
  const hasScores = /\b([5-9][0-9]|100)\b/.test(responseText);
  const hasWinner = /\bselect(ed|ion)\b|winner/i.test(responseText);
  const hasConfidence = /\bconfidence\b/i.test(responseText);
  const hasAvoid = /\bavoid\b|default pattern/i.test(responseText);

  if (hasScores) validationPass++;
  if (hasWinner) validationPass++;
  if (hasConfidence) validationPass++;
  if (hasAvoid) validationPass++;

  report.push(`  ${hasScores ? '✓' : '✗'} Numerical scores present`);
  report.push(`  ${hasWinner ? '✓' : '✗'} Selection declared`);
  report.push(`  ${hasConfidence ? '✓' : '✗'} Confidence score present`);
  report.push(`  ${hasAvoid ? '✓' : '✗'} Default pattern identified`);
  report.push('');

  const total = 4 + 4 + 4;
  const passed = sectionsPass + approachesPass + validationPass;
  const pct = Math.round((passed / total) * 100);

  report.push('Summary:');
  if (pct >= 80) {
    report.push(`  PASS (${passed}/${total}, ${pct}%) — Agent is following Discovery Mode protocol.`);
  } else if (pct >= 50) {
    report.push(`  PARTIAL (${passed}/${total}, ${pct}%) — Some protocol elements present. Check missing items above.`);
  } else {
    report.push(`  FAIL (${passed}/${total}, ${pct}%) — Agent is NOT running Discovery Mode. Install the plugin.`);
  }
  report.push('============================================================');
  return report.join('\n');
}

function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--check' && args[1]) {
    const p = path.resolve(args[1]);
    if (!fs.existsSync(p)) {
      console.error(`File not found: ${p}`);
      process.exit(1);
    }
    console.log(checkResponse(fs.readFileSync(p, 'utf8')));
    process.exit(0);
  }

  if (args[0] === '--all') {
    TEST_CASES.forEach(tc => {
      console.log(generateExpectedOutput(tc));
      console.log('\n');
    });
    process.exit(0);
  }

  if (args[0] && !isNaN(Number(args[0]))) {
    const idx = Number(args[0]) - 1;
    if (idx >= 0 && idx < TEST_CASES.length) {
      console.log(generateExpectedOutput(TEST_CASES[idx]));
      process.exit(0);
    }
    console.error(`Invalid index. Use 1-${TEST_CASES.length}.`);
    process.exit(1);
  }

  console.log('Discovery Mode — Validation Tool\n');
  console.log('Commands:');
  console.log('  node discover-agent-modes/reality_test.js              Show this menu');
  console.log('  node discover-agent-modes/reality_test.js --all        Show all expected outputs');
  console.log('  node discover-agent-modes/reality_test.js 1            Show output for test case 1');
  console.log('  node discover-agent-modes/reality_test.js --check f    Validate agent response in file f');
  console.log('\nTest cases:');
  TEST_CASES.forEach((tc, i) => console.log(`  ${i+1}. /discover ${tc.input}  [${tc.domain}]`));
}

main();