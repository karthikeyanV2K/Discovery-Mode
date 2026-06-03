'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Loads and validates all three prompt template files.
 *
 * @param {string} baseDir - Directory containing prompt files (default: 'prompts')
 * @returns {Promise<{ standard: string, hypothesis: string, validate: string }>}
 * @throws {Error} If any prompt file is missing, empty, or unreadable
 */
async function loadAll(baseDir = path.join(__dirname, '..', 'prompts')) {
  const files = {
    standard: 'standard.txt',
    hypothesis: 'hypothesis.txt',
    validate: 'validate.txt',
  };

  const result = {};

  for (const [key, filename] of Object.entries(files)) {
    const filePath = path.join(baseDir, filename);
    const displayPath = `prompts/${filename}`;

    let content;
    try {
      content = await fs.promises.readFile(filePath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`Error: Required prompt file not found: ${displayPath}`);
      }
      throw new Error(
        `Error: Cannot read prompt file: ${displayPath} — ${err.message}`
      );
    }

    if (content.trim().length === 0) {
      throw new Error(`Error: Prompt file is empty: ${displayPath}`);
    }

    result[key] = content;
  }

  return result;
}

module.exports = { loadAll };
