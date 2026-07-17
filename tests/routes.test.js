const test = require('node:test');
const assert = require('node:assert/strict');

test('legacy hashes resolve to stable views and entity ids', async () => {
  const { parseRoute } = await import('../js/core/routes.mjs');
  assert.deepEqual(parseRoute(''), { view: 'home', entity: null, id: null });
  assert.deepEqual(parseRoute('#items'), { view: 'items', entity: null, id: null });
  assert.deepEqual(parseRoute('#item/501'), { view: 'items', entity: 'item', id: 501 });
  assert.deepEqual(parseRoute('#mob/1002'), { view: 'mobs', entity: 'mob', id: 1002 });
  assert.deepEqual(parseRoute('#instance/amdarais'), { view: 'instances', entity: 'instance', id: 'amdarais' });
  assert.deepEqual(parseRoute('#promise'), { view: 'home', entity: 'section', id: 'promise' });
});

test('unknown and invalid hashes return the home route', async () => {
  const { parseRoute } = await import('../js/core/routes.mjs');
  assert.deepEqual(parseRoute('#unknown'), { view: 'home', entity: null, id: null });
  assert.deepEqual(parseRoute('#item/nope'), { view: 'home', entity: null, id: null });
});
