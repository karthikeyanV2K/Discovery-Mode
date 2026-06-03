'use strict';

const fs = require('fs');
const path = require('path');

const RESULTS_PATH = path.join(__dirname, '..', 'tests', 'results.json');

/**
 * Read and parse tests/results.json.
 * Returns [] if the file doesn't exist or is unparseable JSON.
 * @returns {Promise<Array>}
 */
async function read() {
  try {
    const raw = await fs.promises.readFile(RESULTS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    // JSON.parse failure or any other read error
    console.warn('Warning: results.json was unreadable; prior records could not be preserved.');
    return [];
  }
}

/**
 * Overwrite tests/results.json with the given records array.
 * Creates the file if it doesn't exist.
 * @param {Array} records
 * @returns {Promise<void>}
 */
async function write(records) {
  await fs.promises.writeFile(RESULTS_PATH, JSON.stringify(records, null, 2), 'utf8');
}

/**
 * Merge a single record into results.json by (test_id, model) composite key.
 * Replaces an existing matching record or appends if not found.
 * @param {Object} newRecord
 * @returns {Promise<void>}
 */
async function merge(newRecord) {
  const records = await read();
  const idx = records.findIndex(
    (r) => r.test_id === newRecord.test_id && r.model === newRecord.model
  );
  if (idx !== -1) {
    records[idx] = newRecord;
  } else {
    records.push(newRecord);
  }
  await write(records);
}

module.exports = { read, write, merge };
