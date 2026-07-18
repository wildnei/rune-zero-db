const test = require('node:test');
const assert = require('node:assert/strict');

test('skill families separate the shared CR prefix correctly', async () => {
  const { classFamilyForSkill } = await import('../js/core/skill-gear.mjs');
  assert.equal(classFamilyForSkill('CR_SHIELDBOOMERANG').id, 'paladin');
  assert.equal(classFamilyForSkill('CR_ACIDDEMONSTRATION').id, 'creator');
  assert.equal(classFamilyForSkill('LK_SPIRALPIERCE').id, 'lord-knight');
  assert.equal(classFamilyForSkill('GS_DESPERADO').id, 'gunslinger');
});

test('index includes every non-third-class boosted item and authoritative base amplifier', async () => {
  const { buildSkillGearIndex } = await import('../js/core/skill-gear.mjs');
  const items = [
    { id: 1, name: 'Falchion', type: 'Weapon', funmod: true, script: 'bonus2 bSkillAtk,"SM_MAGNUM",50;', boosts: [{ skill: 'SM_MAGNUM', t3: false }] },
    { id: 2, name: 'Warbreaker', type: 'Weapon', custom: true, script: 'bonus2 bSkillAtk,"KN_BOWLINGBASH",70;', boosts: [{ skill: 'KN_BOWLINGBASH', t3: false }] },
    { id: 3, name: 'Future Gear', type: 'Armor', boosts: [{ skill: 'RK_DRAGONBREATH', t3: true }] },
  ];
  const index = buildSkillGearIndex(items, { SM_MAGNUM: 'Magnum Break', KN_BOWLINGBASH: 'Bowling Bash', RK_DRAGONBREATH: 'Dragon Breath' });
  assert.deepEqual(index.map(group => group.skillId), ['KN_BOWLINGBASH', 'SM_MAGNUM']);
  assert.equal(index.find(group => group.skillId === 'SM_MAGNUM').items[0].percent, 50);
  assert.equal(index.find(group => group.skillId === 'KN_BOWLINGBASH').items[0].rebalanced, false);
});

test('filters by class, readable skill name, internal id, item name, category, and rebalance flag', async () => {
  const { filterSkillGear } = await import('../js/core/skill-gear.mjs');
  const index = [{ skillId: 'KN_BOWLINGBASH', name: 'Bowling Bash', family: { id: 'lord-knight', name: 'Lord Knight' }, items: [
    { id: 1, name: 'Warbreaker', category: 'Weapon', rebalanced: false },
    { id: 2, name: 'Bowling Card', category: 'Card', rebalanced: true },
  ] }];
  assert.equal(filterSkillGear(index, { classId: 'lord-knight' }).length, 1);
  assert.equal(filterSkillGear(index, { query: 'KN_BOWLINGBASH' }).length, 1);
  assert.equal(filterSkillGear(index, { query: 'warbreaker' })[0].items.length, 1);
  assert.equal(filterSkillGear(index, { category: 'Card', rebalancedOnly: true })[0].items[0].id, 2);
});

test('mercenary-only skill aliases are not promoted as player class skills', async () => {
  const { buildSkillGearIndex } = await import('../js/core/skill-gear.mjs');
  const items = [{ id: 1, name: 'Mercenary Gear', boosts: [{ skill: 'MA_LANDMINE', t3: false }], script: 'bonus2 bSkillAtk,"MA_LANDMINE",100;' }];
  assert.deepEqual(buildSkillGearIndex(items, { MA_LANDMINE: 'Land_Mine' }), []);
});

test('result totals count unique items even when one item supports several skills', async () => {
  const { countSkillGearItems } = await import('../js/core/skill-gear.mjs');
  const groups = [
    { items: [{ id: 1 }, { id: 2 }] },
    { items: [{ id: 1 }] },
  ];
  assert.equal(countSkillGearItems(groups), 2);
});
