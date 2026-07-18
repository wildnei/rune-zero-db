const test = require('node:test');
const assert = require('node:assert/strict');

test('loadJson returns parsed JSON and reports a useful path on failure', async () => {
  const { loadJson } = await import('../js/core/data.mjs');
  const ok = async () => ({ ok: true, json: async () => ({ items: 4 }) });
  assert.deepEqual(await loadJson('data/meta.json', ok), { items: 4 });

  const bad = async () => ({ ok: false, status: 404 });
  await assert.rejects(() => loadJson('data/items.json', bad), /data\/items\.json/);
});

test('optional datasets warn without blocking required wiki data', async () => {
  const { loadWikiData } = await import('../js/core/data.mjs');
  const payloads = {
    'data/meta.json': { items: 1, mobs: 1 },
    'data/items.json': [{ id: 501, name: 'Red Potion' }],
    'data/mobs.json': [{ id: 1002, name: 'Poring' }],
  };
  const fetcher = async path => payloads[path]
    ? { ok: true, json: async () => payloads[path] }
    : { ok: false, status: 404 };

  const result = await loadWikiData(fetcher);
  assert.equal(result.values.items[0].name, 'Red Potion');
  assert.equal(result.warnings.length, 5);
  assert.equal('builds' in result.values, false);
});
