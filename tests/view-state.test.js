const test = require('node:test');
const assert = require('node:assert/strict');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('view state round-trips and malformed data falls back', async () => {
  const { readViewState, writeViewState } = await import('../js/core/view-state.mjs');
  const storage = memoryStorage();
  writeViewState('items', { query: 'falchion', source: 'funmod', scrollTop: 120 }, storage);
  assert.deepEqual(readViewState('items', { query: '', source: 'all', scrollTop: 0 }, storage), { query: 'falchion', source: 'funmod', scrollTop: 120 });
  assert.deepEqual(readViewState('broken', { query: '' }, memoryStorage({ 'runezero:view:broken': '{bad' })), { query: '' });
});

test('storage access failures fall back without breaking navigation', async () => {
  const { readViewState, writeViewState } = await import('../js/core/view-state.mjs');
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(readViewState('items', { query: '', source: 'all' }, storage), { query: '', source: 'all' });
  assert.equal(writeViewState('items', { query: 'knife' }, storage), false);
});

test('item context only accepts a usable item target', async () => {
  const { readItemContext, writeItemContext, clearItemContext } = await import('../js/core/view-state.mjs');
  const storage = memoryStorage();
  writeItemContext({ itemId: 1104, href: '#builds', label: 'Back to Lord Knight → Magnum Break gear' }, storage);
  assert.equal(readItemContext(storage).itemId, 1104);
  clearItemContext(storage);
  assert.equal(readItemContext(storage), null);
  assert.equal(readItemContext(memoryStorage({ 'runezero:item-context': '[]' })), null);
});
