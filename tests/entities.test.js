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

test('damage estimates and skill amplifiers preserve legacy semantics', async () => {
  const { estimateDamage, skillAttackAmplifiers } = await import('../js/render/entities.mjs');
  assert.deepEqual(skillAttackAmplifiers('bonus2 bSkillAtk,"SM_MAGNUM",50;'), [{ skill: 'SM_MAGNUM', percent: 50 }]);
  assert.deepEqual(estimateDamage(1000, 50), { before: 1000, after: 1500, percent: 50 });
});

test('refine-gated skill bonuses stay conditional and do not inflate estimates', async () => {
  const { skillAttackAmplifiers, translateScript } = await import('../js/render/entities.mjs');
  const script = 'bonus2 bSkillAtk,"CR_HOLYCROSS",30;\nif (getrefine()>=7) bonus2 bSkillAtk,"CR_HOLYCROSS",15;\nif (getrefine()>=9) bonus2 bSkillAtk,"CR_HOLYCROSS",15;';
  assert.deepEqual(skillAttackAmplifiers(script), [{ skill: 'CR_HOLYCROSS', percent: 30 }]);
  assert.deepEqual(translateScript(script), [
    'HOLYCROSS damage +30%',
    'If refined to +7 or higher: HOLYCROSS damage +15%',
    'If refined to +9 or higher: HOLYCROSS damage +15%',
  ]);
});

test('effect translation covers race, element, status, cooldown, and drain bonuses', async () => {
  const { translateScript } = await import('../js/render/entities.mjs');
  const effects = translateScript('bonus2 bAddRace,RC_Dragon,15;\nbonus2 bSubEle,Ele_Fire,20;\nbonus2 bResEff,Eff_Stun,5000;\nbonus2 bSkillCooldown,"SM_BASH",-1000;\nbonus2 bHPDrainValue,5;');
  assert.deepEqual(effects, ['Damage to Dragon race +15%', 'Fire resistance +20%', 'Stun resistance +50%', 'BASH cooldown -1s', 'Recover 5 HP per attack']);
});

test('multiline refine blocks and else branches keep their conditions', async () => {
  const { translateScript } = await import('../js/render/entities.mjs');
  const skullCap = 'bonus bMatkRate,2;\nif (getrefine() >= 5) {\n bonus bMatkRate,3;\n}\nif (getrefine() >= 7) {\n bonus bMatkRate,3;\n}';
  assert.deepEqual(translateScript(skullCap), ['MATK +2%', 'If refined to +5 or higher: MATK +3%', 'If refined to +7 or higher: MATK +3%']);
  const orcBaby = 'if (getrefine()>=9) {\n bonus bFlee,15;\n}\nelse {\n bonus bFlee,10;\n}';
  assert.deepEqual(translateScript(orcBaby), ['If refined to +9 or higher: Flee +15', 'Otherwise (refined to +9 or higher is false): Flee +10']);
});

test('item details render a contextual return link only for the selected item', async () => {
  const { itemReturnLink } = await import('../js/render/entities.mjs');
  assert.match(itemReturnLink(1104, { itemId: 1104, href: '#builds', label: 'Back to Lord Knight → Magnum Break gear' }), /href="#builds"/);
  assert.match(itemReturnLink(1104, { itemId: 1104, href: '#builds', label: '<unsafe>' }), /&lt;unsafe&gt;/);
  assert.equal(itemReturnLink(1105, { itemId: 1104, href: '#builds', label: 'Back' }), '');
});
