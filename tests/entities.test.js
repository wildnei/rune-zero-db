const test = require('node:test');
const assert = require('node:assert/strict');

test('entity lookup tolerates numeric strings and missing ids', async () => {
  const { findEntity } = await import('../js/render/entities.mjs');
  const values = [{ id: 501, name: 'Red Potion' }];
  assert.equal(findEntity(values, '501').name, 'Red Potion');
  assert.equal(findEntity(values, 999), null);
});

test('text escaping protects data-derived entity labels', async () => {
  const { escapeHtml } = await import('../js/render/entities.mjs');
  assert.equal(escapeHtml('<img onerror="alert(1)">'), '&lt;img onerror=&quot;alert(1)&quot;&gt;');
});

test('drop rates use server ten-thousandths as percentages', async () => {
  const { formatDropRate } = await import('../js/render/entities.mjs');
  assert.equal(formatDropRate(10000), '100%');
  assert.equal(formatDropRate(5500), '55%');
  assert.equal(formatDropRate(1), '0.01%');
});
