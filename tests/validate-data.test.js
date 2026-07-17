const test = require('node:test');
const assert = require('node:assert/strict');

test('committed wiki datasets are complete enough to serve safely', () => {
  const { validateDataDirectory } = require('../tools/validate-data.js');
  const result = validateDataDirectory('data');
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.ok(result.counts.items > 1000);
  assert.ok(result.counts.mobs > 100);
});
