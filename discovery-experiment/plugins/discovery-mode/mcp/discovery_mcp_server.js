'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const discoveryMode = require('../../../src/discovery_mode');
const promptLoader = require('../../../src/prompt_loader');

const DEFAULT_MODEL = process.env.DISCOVERY_MODEL || 'ollama-cloud/gpt-oss:120b';

let nextId = 1;
let buffer = Buffer.alloc(0);
let promptsPromise = null;

function loadPrompts() {
  if (!promptsPromise) promptsPromise = promptLoader.loadAll();
  return promptsPromise;
}

function send(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function normalizeDiscoverInput(input) {
  const text = String(input || '').trim();
  if (text.toLowerCase().startsWith('/discover ')) {
    return text.slice('/discover '.length).trim();
  }
  return text;
}

function formatResult(input, model, result) {
  return JSON.stringify({
    mode: 'discovery',
    model,
    input,
    uncertainty: result.uncertainty || null,
    hypotheses: result.hypotheses || [],
    validations: result.validations || [],
    winner_id: result.winner_id || null,
    final_answer: result.final_answer || '',
    confidence: result.confidence ?? null,
    recovered_from_parse_error: Boolean(result.recovered_from_parse_error),
    recovered_from_validation_error: result.recovered_from_validation_error || null,
  }, null, 2);
}

async function handleRequest(message) {
  const { id, method, params = {} } = message;

  if (method === 'initialize') {
    sendResult(id, {
      protocolVersion: params.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: {
        name: 'discovery-engine',
        version: '1.0.0',
      },
    });
    return;
  }

  if (method === 'ping') {
    sendResult(id, {});
    return;
  }

  if (method === 'tools/list') {
    sendResult(id, {
      tools: [
        {
          name: 'discover_run',
          description: 'Run the local Discovery Mode engine. Use this for /discover requests instead of rewriting the Discovery prompt yourself.',
          inputSchema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                description: 'User task. May include or omit the /discover prefix.',
              },
              model: {
                type: 'string',
                description: 'Optional model id, for example ollama-cloud/gpt-oss:120b, groq-free, gemini-free, or openai/gpt-5.1.',
              },
            },
            required: ['input'],
          },
        },
      ],
    });
    return;
  }

  if (method === 'tools/call') {
    if (params.name !== 'discover_run') {
      sendError(id, -32602, `Unknown tool: ${params.name}`);
      return;
    }

    const input = normalizeDiscoverInput(params.arguments && params.arguments.input);
    if (!input) {
      sendError(id, -32602, 'discover_run requires a non-empty input string');
      return;
    }

    const model = (params.arguments && params.arguments.model) || DEFAULT_MODEL;
    const prompts = await loadPrompts();
    const result = await discoveryMode.run(input, model, prompts);

    sendResult(id, {
      content: [
        {
          type: 'text',
          text: formatResult(input, model, result),
        },
      ],
    });
    return;
  }

  if (id !== undefined) {
    sendError(id, -32601, `Method not found: ${method}`);
  }
}

function tryReadHeaderMessage() {
  const headerEnd = buffer.indexOf('\r\n\r\n');
  if (headerEnd === -1) return null;

  const header = buffer.slice(0, headerEnd).toString('utf8');
  const match = header.match(/Content-Length:\s*(\d+)/i);
  if (!match) {
    buffer = buffer.slice(headerEnd + 4);
    return null;
  }

  const length = Number(match[1]);
  const bodyStart = headerEnd + 4;
  const bodyEnd = bodyStart + length;
  if (buffer.length < bodyEnd) return null;

  const body = buffer.slice(bodyStart, bodyEnd).toString('utf8');
  buffer = buffer.slice(bodyEnd);
  return JSON.parse(body);
}

function tryReadLineMessage() {
  const newline = buffer.indexOf('\n');
  if (newline === -1) return null;

  const line = buffer.slice(0, newline).toString('utf8').trim();
  buffer = buffer.slice(newline + 1);
  if (!line) return null;
  return JSON.parse(line);
}

process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (buffer.length) {
    let message = null;
    try {
      message = buffer.includes(Buffer.from('\r\n\r\n'))
        ? tryReadHeaderMessage()
        : tryReadLineMessage();
    } catch (err) {
      sendError(nextId++, -32700, `Parse error: ${err.message}`);
      buffer = Buffer.alloc(0);
      return;
    }

    if (!message) return;

    handleRequest(message).catch((err) => {
      sendError(message.id, -32000, err.message || 'Discovery engine failed');
    });
  }
});
