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

test('item archive preserves source, subtype, slot, and sort controls', async () => {
  const { filterItems } = await import('../js/render/database.mjs');
  const items = [
    { id: 2, name: 'Zeta Blade', type: 'Weapon', sub: '1hSword', custom: true, funmod: true, atk: 20, loc: ['Right_Hand'] },
    { id: 1, name: 'Alpha Mail', type: 'Armor', custom: false, funmod: false, def: 8, loc: ['Armor'] },
  ];
  assert.deepEqual(filterItems(items, { source: 'funmod' }).map(item => item.id), [2]);
  assert.deepEqual(filterItems(items, { type: 'Weapon', subtype: '1hSword' }).map(item => item.id), [2]);
  assert.deepEqual(filterItems(items, { type: 'Armor', slot: 'Armor' }).map(item => item.id), [1]);
  assert.deepEqual(filterItems(items, { sort: 'name', direction: 'asc' }).map(item => item.id), [1, 2]);
});

test('monster archive preserves MVP and normal filters', async () => {
  const { filterMonsters } = await import('../js/render/database.mjs');
  const mobs = [{ id: 1, name: 'Poring', mvp: false }, { id: 2, name: 'Baphomet', mvp: true }];
  assert.deepEqual(filterMonsters(mobs, { kind: 'mvp' }).map(mob => mob.id), [2]);
  assert.deepEqual(filterMonsters(mobs, { kind: 'normal' }).map(mob => mob.id), [1]);
});

test('saved item archive state rejects unsupported control values', async () => {
  const { sanitizeItemState } = await import('../js/render/database.mjs');
  assert.deepEqual(sanitizeItemState({ source: 'broken', direction: 'sideways', query: 'knife', scrollTop: -4 }), {
    query: 'knife', type: 'all', source: 'all', subtype: 'all', slot: 'all', sort: '', direction: 'asc', scrollTop: 0,
  });
});
