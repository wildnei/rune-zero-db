const test = require('node:test');
const assert = require('node:assert/strict');

test('database filtering matches item names, ids, aegis names, and types', async () => {
  const { filterItems } = await import('../js/render/database.mjs');
  const items = [
    { id: 501, name: 'Red Potion', aegis: 'Red_Potion', type: 'Healing' },
    { id: 1201, name: 'Knife', aegis: 'Knife', type: 'Weapon' },
  ];
  assert.equal(filterItems(items, { query: 'red_potion' }).length, 1);
  assert.equal(filterItems(items, { query: '1201' })[0].name, 'Knife');
  assert.equal(filterItems(items, { type: 'Weapon' })[0].name, 'Knife');
});

test('monster filtering matches common combat traits', async () => {
  const { filterMonsters } = await import('../js/render/database.mjs');
  const mobs = [{ id: 1002, name: 'Poring', race: 'Plant', element: 'Water', size: 'Medium' }];
  assert.equal(filterMonsters(mobs, { query: 'water' }).length, 1);
  assert.equal(filterMonsters(mobs, { query: 'plant' }).length, 1);
});
