/**
 * Integration tests for the Express API routes in server.js.
 *
 * Strategy:
 *  - vi.mock prompt_loader so start() succeeds without real prompt files
 *  - vi.mock model_adapter so POST /api/run-single never hits a real LLM
 *  - vi.mock fs so existsSync('tests/test_cases.json') returns true
 *  - Import server.js AFTER mocks are registered (Vitest hoists vi.mock calls)
 *  - Spin up the exported Express app on a random port for each test suite
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import http from 'node:http';

// ── Mocks (hoisted by Vitest before any imports) ────────────────────────────

vi.mock('../../src/prompt_loader', () => ({
  loadAll: async () => ({
    standard: 'Standard prompt: {user_input}',
    uncertainty: 'Uncertainty prompt: {user_input}',
    hypothesis: 'Hypothesis prompt: {user_input}',
    validate: 'Validate prompt: {user_input} {hypotheses}',
  }),
}));

vi.mock('../../src/model_adapter', () => ({
  call: async () => ({ success: true, text: 'Test answer.' }),
}));

// Mock fs so the test_cases.json guard in start() passes
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      existsSync: (filePath) => {
        if (typeof filePath === 'string' && filePath.includes('test_cases.json')) {
          return true;
        }
        return actual.existsSync ? actual.existsSync(filePath) : true;
      },
    },
    existsSync: (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('test_cases.json')) {
        return true;
      }
      return actual.existsSync ? actual.existsSync(filePath) : true;
    },
  };
});

// ── Load app AFTER mocks are registered ─────────────────────────────────────

// Set PORT=0 so server.js's own start() binds on a random port (not 3000),
// preventing EADDRINUSE conflicts when the test also calls app.listen(0).
process.env.PORT = '0';

// Suppress console output from server startup during tests
const origLog = console.log;
const origError = console.error;
console.log = () => {};
console.error = () => {};

// Dynamic import so Vitest mock hoisting takes effect first.
// server.js calls start() at module load; with mocks in place and PORT=0 it
// completes without error — we just suppress its console output.
const { default: app } = await import('../../server.js');

console.log = origLog;
console.error = origError;


// ── Test server lifecycle ────────────────────────────────────────────────────

let server;
let baseUrl;

beforeAll(
  () =>
    new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    })
);

afterAll(
  () =>
    new Promise((resolve) => {
      server.close(resolve);
    })
);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Make an HTTP GET request and return { status, body }. */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

/** Make an HTTP POST request with a JSON body and return { status, body }. */
function httpPost(url, payload) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(payload);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: Number(urlObj.port),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/models', () => {
  it('Test 1 — returns exactly 8 models with required fields', async () => {
    const { status, body } = await httpGet(`${baseUrl}/api/models`);

    expect(status).toBe(200);
    expect(body).toHaveProperty('models');
    expect(body.models).toHaveLength(8);

    for (const model of body.models) {
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('label');
      expect(model).toHaveProperty('provider');
    }

    const ids = body.models.map((m) => m.id);
    expect(ids).toContain('openai/gpt-5.1');
    expect(ids).toContain('openai/gpt-5-mini');
    expect(ids).toContain('anthropic/claude-sonnet-4.5');
    expect(ids).toContain('groq-free');
    expect(ids).toContain('gemini-free');
    expect(ids).toContain('ollama-cloud/gpt-oss:120b');
    expect(ids).toContain('ollama/llama3.2');
    expect(ids).toContain('ollama/gpt-oss:120b');
  });

  it('Test 4 — returns correct provider values', async () => {
    const { status, body } = await httpGet(`${baseUrl}/api/models`);

    expect(status).toBe(200);
    const providers = body.models.map((m) => m.provider);

    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers).toContain('groq');
    expect(providers).toContain('gemini');
    expect(providers).toContain('ollama-cloud');
    expect(providers).toContain('ollama');
  });
});

describe('POST /api/run-single', () => {
  it('Test 2 — response shape has standard and discovery fields', async () => {
    const { status, body } = await httpPost(`${baseUrl}/api/run-single`, {
      input: 'cv2',
      model: 'groq-free',
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty('standard');
    expect(body).toHaveProperty('discovery');
  });
});

describe('GET /api/results', () => {
  it('Test 3 — returns an array', async () => {
    const { status, body } = await httpGet(`${baseUrl}/api/results`);

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});
