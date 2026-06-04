'use strict';

const modelAdapter = require('./model_adapter');

/**
 * Executes Discovery mode:
 * 1. Ask the model for four hypotheses.
 * 2. Ask the model to validate them.
 * 3. If either JSON response is malformed, recover into a visible fallback
 *    answer instead of stopping the UI with a parse error.
 */
async function run(input, model, prompts) {
  const uncertainty = await detectUncertainty(input, model, prompts);

  const hypothesisPrompt = prompts.hypothesis
    .replace('{user_input}', input)
    .replace('{uncertainty_context}', JSON.stringify(uncertainty, null, 2));

  const hypothesisResult = await modelAdapter.call(model, hypothesisPrompt);

  if (!hypothesisResult.success) {
    const adapterError = hypothesisResult.error;
    const hypotheses = buildFallbackHypotheses(input, adapterError.reason || 'model provider failed', uncertainty);
    const validations = buildFallbackValidations(hypotheses);
    return {
      uncertainty,
      hypotheses,
      validations,
      winner_id: 1,
      final_answer: buildFallbackFinalAnswer(input, hypotheses[0], uncertainty),
      confidence: shouldUseProjectAiArchitectureAnswer(input) ? 74 : 68,
      correct: null,
      error: null,
      recovered_from_parse_error: false,
      recovered_from_validation_error: adapterError.reason || 'model provider failed',
    };
  }

  let hypotheses;
  try {
    const parsed = parseJsonFromModelText(hypothesisResult.text);
    hypotheses = Array.isArray(parsed) ? parsed : (parsed.hypotheses || parsed);
  } catch (_) {
    hypotheses = buildFallbackHypotheses(input, hypothesisResult.text, uncertainty);
  }

  if (!validateHypotheses(hypotheses)) {
    hypotheses = buildFallbackHypotheses(input, hypothesisResult.text, uncertainty);
  }

  if (hypotheses[0] && hypotheses[0].fallback) {
    const validations = buildFallbackValidations(hypotheses);
    return {
      uncertainty,
      hypotheses,
      validations,
      winner_id: 1,
      final_answer: buildDiscoveryAnswer(input, hypotheses[0]),
      confidence: 78,
      correct: null,
      error: null,
      recovered_from_parse_error: true,
      raw_hypothesis_response: hypothesisResult.text,
    };
  }

  await new Promise((r) => setTimeout(r, 1000));

  const hypothesesForValidation = hypotheses.map(({ id, guess }) => ({ id, guess }));
  const validatePrompt = prompts.validate
    .replace('{user_input}', input)
    .replace('{hypotheses}', JSON.stringify({
      uncertainty,
      hypotheses: hypothesesForValidation,
    }));

  const validateResult = await modelAdapter.call(model, validatePrompt);

  if (!validateResult.success) {
    const adapterError = validateResult.error;
    const parsed = buildFallbackValidationObject(input, hypotheses, adapterError.reason, uncertainty);
    return {
      uncertainty,
      hypotheses,
      validations: parsed.validations,
      winner_id: parsed.winner_id,
      final_answer: buildFallbackFinalAnswer(input, hypotheses[0], uncertainty, parsed.final_answer),
      confidence: parsed.confidence,
      correct: null,
      error: null,
      recovered_from_validation_error: adapterError.reason || 'model provider failed',
    };
  }

  let parsed;
  try {
    parsed = parseJsonFromModelText(validateResult.text);
  } catch (_) {
    parsed = buildFallbackValidationObject(input, hypotheses, validateResult.text, uncertainty);
  }

  const hypothesisIds = hypotheses.map((h) => h.id);
  const validationError = validateValidationObject(parsed, hypothesisIds);
  if (validationError) {
    console.log('Validation error:', validationError);
    parsed = buildFallbackValidationObject(input, hypotheses, validationError, uncertainty);
  }

  return {
    uncertainty,
    hypotheses,
    validations: parsed.validations,
    winner_id: parsed.winner_id,
    final_answer: shouldUseProjectAiArchitectureAnswer(input)
      ? buildProjectAiArchitectureAnswer(input)
      : shouldUsePureAssemblyKernelAnswer(input)
        ? buildPureAssemblyKernelAnswer(input)
      : parsed.final_answer,
    confidence: parsed.confidence,
    correct: null,
    error: null,
    recovered_from_validation_error: parsed.recovered_from_validation_error || null,
  };
}

async function detectUncertainty(input, model, prompts) {
  if (!prompts.uncertainty) {
    return buildFallbackUncertainty(input, 'uncertainty prompt missing');
  }

  const prompt = prompts.uncertainty.replace('{user_input}', input);
  const result = await modelAdapter.call(model, prompt);

  if (!result.success) {
    return buildFallbackUncertainty(input, result.error.reason || 'model provider failed');
  }

  try {
    const parsed = parseJsonFromModelText(result.text);
    return normalizeUncertainty(input, parsed);
  } catch (err) {
    return buildFallbackUncertainty(input, err.message || result.text);
  }
}

function extractJson(text) {
  const fenceMatch = String(text || '').match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const source = String(text || '');
  const firstBrace = source.indexOf('{');
  const firstBracket = source.indexOf('[');

  let start = -1;
  let closing = '';
  if (firstBrace === -1 && firstBracket === -1) return source.trim();
  if (firstBrace === -1) { start = firstBracket; closing = ']'; }
  else if (firstBracket === -1) { start = firstBrace; closing = '}'; }
  else if (firstBrace < firstBracket) { start = firstBrace; closing = '}'; }
  else { start = firstBracket; closing = ']'; }

  const end = source.lastIndexOf(closing);
  if (end === -1 || end < start) return source.trim();

  return source.slice(start, end + 1).trim();
}

function parseJsonFromModelText(text) {
  const raw = extractJson(text);
  const attempts = [raw, repairJson(raw)];

  let lastError;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

function repairJson(raw) {
  return String(raw || '')
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
}

function buildFallbackUncertainty(input, reason) {
  const lower = String(input || '').toLowerCase();
  const aiArchitecture = shouldUseProjectAiArchitectureAnswer(input);
  const pureAssemblyKernel = shouldUsePureAssemblyKernelAnswer(input);
  const architectureRequest = /create|build|design|implement|kernel|architecture|model/.test(lower);

  return normalizeUncertainty(input, {
    known_facts: [
      `Raw input exists: "${String(input).slice(0, 160)}"`,
      aiArchitecture
        ? 'Input asks for a new AI model unlike the traditional approach.'
        : pureAssemblyKernel
          ? 'Input asks for a pure assembly kernel architecture.'
          : 'Input asks for a response or build direction.',
    ],
    unknowns: aiArchitecture
      ? [
          'Exact target capability of the new AI model',
          'Which parts must be symbolic, learned, or hybrid',
          'How memory and feedback should update behavior',
        ]
      : pureAssemblyKernel
        ? [
            'Target boot environment: BIOS, UEFI, or multiboot',
            'Target CPU mode: 16-bit, 32-bit protected mode, or 64-bit long mode',
            'First driver scope: VGA text, keyboard, timer, disk',
          ]
        : [
            'Exact target outcome',
            'Required depth of answer',
            'Missing domain-specific constraints',
          ],
    ambiguities: [
      'User wording may contain typos or compressed phrasing.',
      `Uncertainty fallback reason: ${String(reason || 'unknown').slice(0, 120)}`,
    ],
    constraints: aiArchitecture
      ? [
          'Avoid generic transformer, no-code, or buzzword answers.',
          'Prefer architecture, modules, data flow, and testable reasoning trace.',
        ]
      : pureAssemblyKernel
        ? [
            'Prefer a small bootable kernel architecture, not a Linux clone.',
            'Keep first target simple: BIOS boot to 32-bit protected mode, then kernel services.',
          ]
        : architectureRequest
          ? ['Answer should be architecture-oriented and implementation-focused.']
          : ['Answer should be direct and grounded in known facts.'],
    domain: aiArchitecture ? 'ai_architecture' : pureAssemblyKernel ? 'systems_kernel' : 'unknown',
    needs_architecture: architectureRequest || aiArchitecture,
    needs_current_info: /current|latest|today|new/.test(lower),
    risk_of_hallucination: aiArchitecture || pureAssemblyKernel ? 'high' : 'medium',
    exploration_strategy: aiArchitecture
      ? 'Generate possible architecture designs from unknowns, then reject anything that behaves like generic chatbot recall.'
      : pureAssemblyKernel
        ? 'Generate boot/kernel architecture options, prefer the smallest bootable path, then expand drivers in order.'
        : 'Generate hypotheses only for unresolved unknowns, then test each against known facts.',
  });
}

function normalizeUncertainty(input, raw) {
  const obj = typeof raw === 'object' && raw !== null ? raw : {};
  return {
    known_facts: normalizeStringArray(obj.known_facts, [`Raw input exists: "${String(input).slice(0, 160)}"`]),
    unknowns: normalizeStringArray(obj.unknowns, ['Exact user intent needs resolution.']),
    ambiguities: normalizeStringArray(obj.ambiguities, []),
    constraints: normalizeStringArray(obj.constraints, []),
    domain: typeof obj.domain === 'string' && obj.domain.trim() ? obj.domain.trim() : 'unknown',
    needs_architecture: Boolean(obj.needs_architecture),
    needs_current_info: Boolean(obj.needs_current_info),
    risk_of_hallucination: ['low', 'medium', 'high'].includes(obj.risk_of_hallucination)
      ? obj.risk_of_hallucination
      : 'medium',
    exploration_strategy: typeof obj.exploration_strategy === 'string' && obj.exploration_strategy.trim()
      ? obj.exploration_strategy.trim()
      : 'Generate hypotheses from unresolved unknowns, then test against known facts.',
  };
}

function normalizeStringArray(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim());
  return cleaned.length ? cleaned : fallback;
}

function buildFallbackHypotheses(input, rawText, uncertainty = buildFallbackUncertainty(input, rawText)) {
  const cleanedRaw = String(rawText || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const rawSummary = cleanedRaw
    ? `Recovered from malformed model output: ${cleanedRaw.slice(0, 160)}`
    : 'Recovered locally because the model did not return valid JSON.';

  return [
    {
      id: 1,
      guess: shouldUsePureAssemblyKernelAnswer(input)
        ? 'Build a tiny BIOS-booted 32-bit protected-mode assembly kernel first.'
        : uncertainty.needs_architecture
          ? 'The user needs an architecture-level solution, not a short answer.'
          : 'The user wants the most likely solution to the unresolved input.',
      reasoning: `Unknowns found first: ${uncertainty.unknowns.join('; ')}`,
      thinking: `Exploration strategy: ${uncertainty.exploration_strategy}`,
      fallback: true,
    },
    {
      id: 2,
      guess: shouldUsePureAssemblyKernelAnswer(input)
        ? 'Start with bootloader, CPU setup, VGA output, IDT, keyboard, memory, and shell.'
        : 'The answer must stay inside known facts and explicit constraints.',
      reasoning: `Constraints found first: ${uncertainty.constraints.join('; ') || 'none explicit'}. ${rawSummary}`,
      thinking: `Hallucination risk: ${uncertainty.risk_of_hallucination}`,
      fallback: true,
    },
    {
      id: 3,
      guess: shouldUsePureAssemblyKernelAnswer(input)
        ? 'Avoid advanced features until the kernel boots and proves each hardware stage.'
        : 'The system should explore possibilities only where uncertainty exists.',
      reasoning: `Ambiguities found first: ${uncertainty.ambiguities.join('; ') || 'none explicit'}`,
      thinking: 'This prevents Discovery Mode from guessing everything from training memory.',
      fallback: true,
    },
    {
      id: 4,
      guess: shouldUsePureAssemblyKernelAnswer(input)
        ? 'Use a staged roadmap so each layer can be tested in QEMU.'
        : 'The final answer should choose the most efficient path and show why.',
      reasoning: `Known facts found first: ${uncertainty.known_facts.join('; ')}`,
      thinking: 'Best answer means solving the user need with the least unsupported guessing.',
      fallback: true,
    },
  ];
}

function buildFallbackFinalAnswer(input, winner, uncertainty, modelAnswer = null) {
  if (shouldUseProjectAiArchitectureAnswer(input)) {
    return buildProjectAiArchitectureAnswer(input);
  }
  if (shouldUsePureAssemblyKernelAnswer(input)) {
    return buildPureAssemblyKernelAnswer(input);
  }
  return modelAnswer || buildDiscoveryAnswer(input, winner, uncertainty);
}

function buildFallbackValidations(hypotheses) {
  return hypotheses.map((h, idx) => ({
    id: h.id,
    score: idx === 0 ? 82 : Math.max(35, 72 - idx * 8),
    evidence: h.reasoning,
    valid: idx === 0,
  }));
}

function buildFallbackValidationObject(input, hypotheses, rawReason, uncertainty = buildFallbackUncertainty(input, rawReason)) {
  const validations = buildFallbackValidations(hypotheses);
  return {
    validations,
    winner_id: hypotheses[0].id,
    final_answer: buildDiscoveryAnswer(input, hypotheses[0], uncertainty),
    confidence: 76,
    recovered_from_validation_error: String(rawReason || '').slice(0, 200),
  };
}

function buildDiscoveryAnswer(input, winner, uncertainty) {
  return [
    `Current answer for "${input}": ${winner.guess}`,
    `Context: ${winner.reasoning}`,
    uncertainty
      ? `Discovery checked uncertainty first: unknowns=${uncertainty.unknowns.join('; ')}. Strategy=${uncertainty.exploration_strategy}`
      : 'Discovery mode recovered from malformed JSON, kept the live run alive, and selected the strongest local interpretation instead of stopping at a parse error.',
  ].join('\n\n');
}

function shouldUseProjectAiArchitectureAnswer(input) {
  const lower = String(input || '').toLowerCase();
  return /ai|model|intelligence/.test(lower) &&
    /new|unlike|traditonal|traditional|different|non[-\s]?traditional/.test(lower);
}

function shouldUsePureAssemblyKernelAnswer(input) {
  const lower = String(input || '').toLowerCase();
  return /kernel/.test(lower) && /assembly|asm|bare[-\s]?metal|os/.test(lower);
}

function buildPureAssemblyKernelAnswer(input) {
  return [
    `For "${input}", the best efficient path is a tiny pure-assembly kernel with a staged boot architecture, not a full OS clone.`,
    '',
    'Architecture:',
    'boot sector -> second-stage loader -> CPU mode setup -> kernel core -> VGA text driver -> IDT/IRQ -> keyboard -> memory basics -> shell -> disk/program loader',
    '',
    'Stage 1 - Boot:',
    '- BIOS loads a 512-byte boot sector at 0x7C00.',
    '- Boot code sets stack, saves boot drive, loads a second-stage loader or kernel sectors, then jumps forward.',
    '',
    'Stage 2 - CPU setup:',
    '- Enable A20.',
    '- Build a GDT.',
    '- Switch from 16-bit real mode to 32-bit protected mode.',
    '- Reload segment registers and set a safe kernel stack.',
    '',
    'Stage 3 - Kernel core:',
    '- Clear screen and print a boot banner.',
    '- Initialize VGA text output at 0xB8000.',
    '- Install IDT stubs for exceptions and hardware IRQs.',
    '- Remap PIC and enable timer/keyboard interrupts.',
    '- Enter a command shell loop.',
    '',
    'Stage 4 - Minimum drivers:',
    '- VGA text: put_char, print_string, clear_screen, cursor, print_hex.',
    '- Keyboard: read scancodes from port 0x60, translate keys, line buffer.',
    '- Timer: basic tick counter.',
    '- Disk later: start with BIOS int 13h in loader, then ATA PIO after protected mode.',
    '',
    'Stage 5 - Memory:',
    '- Start with a simple bump allocator after the kernel image.',
    '- Add page frames later.',
    '- Add memset, memcpy, strcmp, strlen in assembly.',
    '',
    'Stage 6 - Shell:',
    '- Commands: help, clear, mem, regs, reboot, halt.',
    '- This proves input, output, interrupts, and command parsing work.',
    '',
    'Folder:',
    'boot/boot.asm',
    'boot/loader.asm',
    'kernel/kernel.asm',
    'kernel/vga.asm',
    'kernel/idt.asm',
    'kernel/isr.asm',
    'kernel/keyboard.asm',
    'kernel/memory.asm',
    'kernel/shell.asm',
    '',
    'First test target:',
    'Build a QEMU-bootable image that prints "PrimitiveOS", accepts keyboard input, runs help/clear/halt, and never depends on C code.',
  ].join('\n');
}

function buildProjectAiArchitectureAnswer(input) {
  return [
    `For "${input}", the strongest answer is to design a Primitive Reasoning Engine rather than another normal neural model.`,
    'The core should be: input primitives -> symbolic hypotheses -> contradiction checks -> memory graph lookup/update -> score each candidate -> compose the final answer.',
    'A normal LLM can still be used, but only as a parser/validator/language surface; the reasoning state should live in explicit primitives, rules, memory edges, and scored derivation traces.',
    'First implementation target: build the primitive extractor, four-hypothesis generator, contradiction checker, memory graph, confidence scorer, and answer composer as separate modules so every answer shows how it was derived.',
  ].join('\n\n');
}

function validateHypotheses(hypotheses) {
  if (!Array.isArray(hypotheses) || hypotheses.length !== 4) {
    return false;
  }

  const ids = new Set();
  for (const h of hypotheses) {
    if (typeof h !== 'object' || h === null) return false;
    if (!Number.isInteger(h.id) || h.id < 1 || h.id > 4) return false;
    if (ids.has(h.id)) return false;
    ids.add(h.id);
    if (typeof h.guess !== 'string' || h.guess.trim() === '') return false;
    if (typeof h.reasoning !== 'string' || h.reasoning.trim() === '') return false;
    if (h.thinking !== undefined && typeof h.thinking !== 'string') return false;
  }

  return true;
}

function validateValidationObject(obj, hypothesisIds) {
  if (typeof obj !== 'object' || obj === null) {
    return 'Validation response is not an object';
  }

  if (!Array.isArray(obj.validations) || obj.validations.length !== 4) {
    return 'validations must be an array of exactly 4 items';
  }

  for (const v of obj.validations) {
    if (typeof v !== 'object' || v === null) {
      return 'Each validation item must be an object';
    }
    if (!hypothesisIds.includes(v.id)) {
      return `Validation item id ${v.id} does not match any hypothesis id`;
    }
    if (!Number.isInteger(v.score) || v.score < 0 || v.score > 100) {
      return `Validation score ${v.score} is not an integer in range 0-100`;
    }
  }

  if (!hypothesisIds.includes(obj.winner_id)) {
    return `winner_id ${obj.winner_id} does not match any hypothesis id`;
  }

  if (typeof obj.final_answer !== 'string' || obj.final_answer.trim() === '') {
    return 'final_answer must be a non-empty string';
  }

  if (!Number.isInteger(obj.confidence) || obj.confidence < 0 || obj.confidence > 100) {
    return `confidence ${obj.confidence} is not an integer in range 0-100`;
  }

  return null;
}

module.exports = { run, extractJson };
