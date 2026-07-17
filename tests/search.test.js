const test = require('node:test');
const assert = require('node:assert/strict');

test('search matches names, ids, and aegis identifiers without case sensitivity', async () => {
  const { searchEntities } = await import('../js/core/search.mjs');
  const data = {
    items: [{ id: 501, name: 'Red Potion', aegis: 'Red_Potion' }],
    mobs: [{ id: 1002, name: 'Poring' }],
  };

  assert.equal(searchEntities(data, 'red_potion')[0].name, 'Red Potion');
  assert.equal(searchEntities(data, '1002')[0].name, 'Poring');
  assert.equal(searchEntities(data, 'PORING')[0].id, 1002);
});

test('empty searches return no suggestions and limits are respected', async () => {
  const { searchEntities } = await import('../js/core/search.mjs');
  const data = { items: [{ id: 1, name: 'Apple' }, { id: 2, name: 'Apple Juice' }], mobs: [] };
  assert.deepEqual(searchEntities(data, '   '), []);
  assert.equal(searchEntities(data, 'apple', 1).length, 1);
});
