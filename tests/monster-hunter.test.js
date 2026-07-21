const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Monster Hunter archive separates skill-shop gear and bounty rewards', async () => {
  const { monsterHunterItems } = await import('../js/render/monster-hunter.mjs');
  const items = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  const hunterItems = monsterHunterItems(items);
  const shop = hunterItems.filter(item => item.hunterSources.some(source => source.name === 'Hunter Skill Gear Shop'));
  const bounties = hunterItems.filter(item => item.hunterSources.some(source => source.name === 'Monster Hunter'));
  assert.equal(shop.length, 89);
  assert.equal(shop.filter(item => item.jroAddition).length, 41);
  assert.equal(bounties.length, 12);
  assert.ok(shop.some(item => item.id === 28573));
  assert.ok(bounties.some(item => item.id === 28573));
  assert.ok(hunterItems.every(item => item.hunterSources.every(source => ['Hunter Skill Gear Shop', 'Monster Hunter'].includes(source.name))));
});
