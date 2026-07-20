const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('committed wiki datasets are complete enough to serve safely', () => {
  const { validateDataDirectory } = require('../tools/validate-data.js');
  const result = validateDataDirectory('data');
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.ok(result.counts.items > 1000);
  assert.ok(result.counts.mobs > 100);
});

test("Ulle's Cap exposes its Falcon Assault percentage in wiki data", () => {
  const items = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  const ulle = items.find(item => item.id === 5123);
  assert.ok(ulle, "Ulle's Cap must be indexed");
  assert.deepEqual(ulle.boosts.find(boost => boost.skill === 'SN_FALCONASSAULT'), {
    skill: 'SN_FALCONASSAULT', percent: 30, t3: false,
  });
});
