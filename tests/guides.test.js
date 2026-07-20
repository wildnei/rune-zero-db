const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('guide registry covers every non-database legacy section', () => {
  const source = fs.readFileSync('js/render/guides.mjs', 'utf8');
  for (const view of ['systems', 'rates', 'customizations', 'balance', 'builds', 'hunting', 'skills', 'enchants']) {
    assert.match(source, new RegExp(`['\"]${view}['\"]`), `${view} must have a renderer`);
  }
});

test('rune planner exposes every family, level, slot, and cumulative budget', async () => {
  const { RUNE_FAMILIES, RUNE_LEVELS } = await import('../js/render/runes.mjs');
  assert.equal(RUNE_FAMILIES.length, 10);
  assert.equal(RUNE_LEVELS.length, 5);
  assert.deepEqual(RUNE_FAMILIES.find(family => family.name === 'Flow').values, ['-3%', '-6%', '-10%', '-15%', '-20%']);
  assert.deepEqual(RUNE_FAMILIES.find(family => family.name === 'Haste').slots, ['Garment', 'Footgear']);
  assert.deepEqual(RUNE_FAMILIES.find(family => family.name === 'Flow').slots, ['Headgear', 'Armor', 'Accessory']);
  assert.deepEqual(RUNE_FAMILIES.find(family => family.name === 'Windrunner').values, ['+2%', '+4%', '+6%', '+8%', '+10%']);
  assert.match(RUNE_LEVELS[4].total, /2,550,000z/);
  assert.match(RUNE_LEVELS[4].total, /500 MVP Points or 15 Temporal Crystals/);
});

test('instances preserve all six current dungeon names', () => {
  const source = fs.readFileSync('js/render/instances.mjs', 'utf8');
  for (const name of ['Old Glast Heim', 'Assault on the Airship', 'Ghost Palace', 'Bakonawa Lake', 'Bangungot Hospital', 'Buwaya Cave']) {
    assert.match(source, new RegExp(name));
  }
});

test('instance guides retain requirements, tiers, mechanics, and concrete rewards', () => {
  const source = fs.readFileSync('js/render/instances.mjs', 'utf8');
  for (const fact of ['30 Valor Coin', '10/8/6 min', '40 (Normal) / 80 (Hard) / 150 (Nightmare)', '1,600,000 Base EXP', '20 solid hits apiece', '1 / 4 / 15 / 30 Coagulated Spell', '50% success', '100,000 zeny', '3,000 Coagulated Spell OR 70']) {
    assert.match(source, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('class guides retain progression, early gear, essence costs, and next steps', () => {
  const source = fs.readFileSync('js/render/classes.mjs', 'utf8');
  for (const fact of ['Best early grabs', '60 / 150 Hunter Coins', 'Build Librarian', 'Monster Hunter']) assert.match(source, new RegExp(fact));
});

test('rebalanced builds explorer supports both class and skill discovery', () => {
  const source = fs.readFileSync('js/render/skill-rebalance.mjs', 'utf8');
  for (const contract of ['data-rebalance-class', 'data-rebalance-query', 'data-rebalance-skill', 'data-rebalance-category', 'data-rebalance-only', 'aria-live="polite"']) {
    assert.match(source, new RegExp(contract));
  }
  assert.doesNotMatch(source, /<main class="rebalance-results">/);
  assert.match(source, /<div class="rebalance-results">/);
  for (const contract of ['data-rebalance-live', 'category: state.category', 'rebalancedOnly: state.rebalancedOnly', 'window.clearTimeout', 'window.setTimeout']) {
    assert.match(source, new RegExp(contract));
  }
});

test('rebalanced builds reports availability from the skills dataset it consumes', () => {
  const source = fs.readFileSync('js/app.mjs', 'utf8');
  assert.match(source, /builds:\s*'skills'/);
  assert.doesNotMatch(source, /builds:\s*'builds'/);
});

test('classes are represented with existing repository sprites', () => {
  const source = fs.readFileSync('js/render/classes.mjs', 'utf8');
  assert.match(source, /assets\/classes/);
  assert.match(source, /Lord Knight/);
  assert.match(source, /High Wizard/);
  assert.match(source, /Professor/);
});

test('enchant option formatting uses the committed option schema', async () => {
  const { formatEnchantOption } = await import('../js/render/guides.mjs');
  const result = formatEnchantOption(
    { name: 'VAR_STRAMOUNT', min: 1, max: 4, chance: 104 },
    { VAR_STRAMOUNT: { desc: 'STR +N' } },
  );
  assert.deepEqual(result, { description: 'STR +N', value: '1–4', chance: '1.04%' });
});
