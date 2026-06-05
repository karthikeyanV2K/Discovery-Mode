'use strict';

/**
 * model_adapter.js
 *
 * Abstracts all LLM provider communication. Routes a model identifier + prompt
 * to the appropriate provider and returns a normalised result object.
 *
 * Supported model identifiers:
 *   - 'groq-free'       → Groq API (free tier, llama-3.1-8b-instant)
 *   - 'gemini-free'     → Google Gemini API (free tier, gemini-1.5-flash)
 *   - 'ollama/llama3.2' → Ollama local endpoint
 *
 * Free API keys (no credit card required):
 *   - Groq:   https://console.groq.com  → GROQ_API_KEY in .env
 *   - Gemini: https://aistudio.google.com → GEMINI_API_KEY in .env
 *
 * @returns {Promise<{ success: true, text: string } | { success: false, error: { reason: string, code: string, model?: string } }>}
 */

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/responses';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const GROQ_ENDPOINT   = 'https://api.groq.com/openai/v1/chat/completions';

const OPENAI_MODELS = {
  'openai/gpt-5.1': 'gpt-5.1',
  'openai/gpt-5-mini': 'gpt-5-mini',
};

const ANTHROPIC_MODELS = {
  'anthropic/claude-sonnet-4.5': 'claude-sonnet-4-5',
};

const GROQ_MODELS = {
  'groq-free': 'llama-3.3-70b-versatile',
};

const GEMINI_MODEL    = 'gemini-flash-latest';

const OLLAMA_MODELS = {
  'ollama/llama3.2': 'llama3.2',
  'ollama/gpt-oss:120b': 'gpt-oss:120b',
};

const OLLAMA_CLOUD_MODELS = {
  'ollama-cloud/gpt-oss:120b': {
    directModel: 'gpt-oss:120b',
    localProxyModel: 'gpt-oss:120b-cloud',
  },
};

const SUPPORTED_MODELS = [
  ...Object.keys(OPENAI_MODELS),
  ...Object.keys(ANTHROPIC_MODELS),
  ...Object.keys(GROQ_MODELS),
  'gemini-free',
  ...Object.keys(OLLAMA_MODELS),
  ...Object.keys(OLLAMA_CLOUD_MODELS),
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Call an LLM via the appropriate provider.
 * Retries once on 429 (rate limit) after a short back-off.
 *
 * @param {string} model      - Model identifier
 * @param {string} prompt     - The user prompt string
 * @param {number} timeoutMs  - Request timeout in milliseconds (default 30 000)
 * @returns {Promise<{ success: true, text: string } | { success: false, error: { reason: string, code: string, model?: string } }>}
 */
async function call(model, prompt, timeoutMs = 30000) {
  return _call(model, prompt, timeoutMs, 0);
}

async function _call(model, prompt, timeoutMs, attempt) {
  // --- Unknown model guard (no network call) ---
  if (!SUPPORTED_MODELS.includes(model)) {
    return {
      success: false,
      error: {
        reason: 'unsupported_model',
        code: 'unsupported_model',
        model,
      },
    };
  }

  // --- Set up AbortController for timeout ---
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response;

    if (OPENAI_MODELS[model]) {
      response = await callOpenAI(prompt, controller.signal, OPENAI_MODELS[model]);
    } else if (ANTHROPIC_MODELS[model]) {
      response = await callAnthropic(prompt, controller.signal, ANTHROPIC_MODELS[model]);
    } else if (GROQ_MODELS[model]) {
      response = await callGroq(prompt, controller.signal, GROQ_MODELS[model]);
    } else if (model === 'gemini-free') {
      response = await callGemini(prompt, controller.signal);
    } else if (OLLAMA_CLOUD_MODELS[model]) {
      response = await callOllamaCloud(prompt, controller.signal, OLLAMA_CLOUD_MODELS[model]);
    } else if (OLLAMA_MODELS[model]) {
      response = await callOllama(prompt, controller.signal, OLLAMA_MODELS[model]);
    }

    clearTimeout(timerId);

    // --- 429 Rate limit: retry once after back-off ---
    if (response.status === 429 && attempt < 2) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
      const waitMs = (retryAfter + 1) * 1000;
      console.log(`[model_adapter] 429 rate limit on ${model}, retrying in ${waitMs}ms...`);
      await sleep(waitMs);
      return _call(model, prompt, timeoutMs, attempt + 1);
    }

    // --- HTTP error handling ---
    if (!response.ok) {
      let errorBody = '';
      try { errorBody = await response.text(); } catch (_) {}
      return {
        success: false,
        error: {
          reason: `HTTP error: ${response.status} ${response.statusText}${errorBody ? ' — ' + errorBody.slice(0, 200) : ''}`,
          code: 'http_error',
          model,
        },
      };
    }

    // --- Parse response body ---
    const data = await response.json();
    const text = extractText(model, data);

    return { success: true, text };
  } catch (err) {
    clearTimeout(timerId);

    // --- Timeout (AbortError) ---
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: {
          reason: `Request timed out after ${timeoutMs}ms`,
          code: 'timeout',
          model,
        },
      };
    }

    // --- Network / fetch failure ---
    return {
      success: false,
      error: {
        reason: err.message || 'Network request failed',
        code: 'network_error',
        model,
      },
    };
  }
}

async function callOpenAI(prompt, signal, openaiModel) {
  const apiKey = process.env.OPENAI_API_KEY;

  return fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: openaiModel,
      input: prompt,
      max_output_tokens: 4096,
    }),
    signal,
  });
}

async function callAnthropic(prompt, signal, anthropicModel) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  return fetch(ANTHROPIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: anthropicModel,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal,
  });
}

/**
 * Groq API — OpenAI-compatible chat completions.
 * Free tier: https://console.groq.com (no credit card)
 * Uses llama-3.1-8b-instant — fast and free.
 */
async function callGroq(prompt, signal, groqModel) {
  const apiKey = process.env.GROQ_API_KEY;

  return fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: groqModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
    signal,
  });
}

/**
 * Google Gemini API — free tier via AI Studio.
 * Free tier: https://aistudio.google.com (no credit card)
 * Uses gemini-flash-latest — authenticated via X-goog-api-key header.
 */
async function callGemini(prompt, signal) {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
    signal,
  });
}

/**
 * Ollama local endpoint — no API key needed.
 * Requires: ollama pull llama3.2
 */
async function callOllama(prompt, signal, ollamaModel) {
  const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const endpoint = `${baseUrl}/api/generate`;

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ollamaModel,
      prompt,
      options: {
        num_predict: 4096,
      },
      stream: false,
    }),
    signal,
  });
}

async function callOllamaCloud(prompt, signal, cloudModel) {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (apiKey) {
    return fetch('https://ollama.com/api/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cloudModel.directModel,
        prompt,
        options: {
          num_predict: 4096,
        },
        stream: false,
      }),
      signal,
    });
  }

  return callOllama(prompt, signal, cloudModel.localProxyModel);
}

/**
 * Extract the text content from a provider-specific response payload.
 *
 * Groq (OpenAI-compatible):
 *   { choices: [{ message: { content: string } }] }
 *
 * Gemini:
 *   { candidates: [{ content: { parts: [{ text: string }] } }] }
 *
 * Ollama:
 *   { response: string }
 */
function extractText(model, data) {
  if (OPENAI_MODELS[model]) {
    if (typeof data.output_text === 'string') return data.output_text;
    const output = Array.isArray(data.output) ? data.output : [];
    return output
      .flatMap((item) => Array.isArray(item.content) ? item.content : [])
      .filter((item) => item && item.type === 'output_text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('\n');
  }
  if (ANTHROPIC_MODELS[model]) {
    const content = Array.isArray(data.content) ? data.content : [];
    return content
      .filter((item) => item && item.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('\n');
  }
  if (GROQ_MODELS[model]) {
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  }
  if (model === 'gemini-free') {
    return (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) || '';
  }
  if (OLLAMA_MODELS[model] || OLLAMA_CLOUD_MODELS[model]) {
    return data.response || '';
  }
  return '';
}

module.exports = { call, SUPPORTED_MODELS };
