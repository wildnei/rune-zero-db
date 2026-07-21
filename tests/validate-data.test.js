const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('committed wiki datasets are complete enough to serve safely', () => {
  const { validateDataDirectory } = require('../tools/validate-data.js');
  const result = validateDataDirectory('data');
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.ok(result.counts.items > 1000);
  assert.ok(result.counts.mobs > 100);
});

test("Ulle's Cap exposes its Falcon Assault percentage in wiki data", () => {
  const items = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  const ulle = items.find(item => item.id === 5123);
  assert.ok(ulle, "Ulle's Cap must be indexed");
  assert.deepEqual(ulle.boosts.find(boost => boost.skill === 'SN_FALCONASSAULT'), {
    skill: 'SN_FALCONASSAULT', percent: 30, t3: false,
  });
});

test('ported level-scaled skill gear is available and evaluated at the level cap', () => {
  const items = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  const emerald = items.find(item => item.id === 28573);
  const bomber = items.find(item => item.id === 490537);
  assert.equal(emerald.reqlv, 99);
  assert.equal(emerald.boosts.find(boost => boost.skill === 'AC_DOUBLE').percent, 99);
  assert.equal(emerald.boosts.some(boost => boost.skill === 'WM_SEVERE_RAINSTORM_MELEE'), false);
  assert.equal(bomber.boosts.find(boost => boost.skill === 'HT_CLAYMORETRAP').percent, 49);
  assert.ok(emerald.acquiredFrom.some(source => source.kind === 'item-shop' && source.currency === 40001));
  assert.ok(emerald.acquiredFrom.some(source => source.kind === 'script-reward'));
  const kungJin = items.find(item => item.id === 15879);
  assert.equal(kungJin.boosts.find(boost => boost.skill === 'SN_SHARPSHOOTING').percent, 45);
});

test('item formulas expose no third- or fourth-class skill boosts', () => {
  const items = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  const laterPrefix = /^(RK|GC|RA|NC|WL|WM|AB|SC|LG|SR|SO|GN|KO|OB|RL|SU|DK|IG|AG|CD|SHC|ABC|WH|TR|EM|MT|BO|HN|NW|SOA)_/;
  const leaked = items.flatMap(item => (item.boosts || [])
    .filter(boost => laterPrefix.test(boost.skill))
    .map(boost => `${item.id}:${boost.skill}`));
  assert.deepEqual(leaked, []);
});

test('cash preparation boxes expose their exact contents and Boutique source', () => {
  const items = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  const expected = new Map([
    [41010, ['12075,3', '12100,3']],
    [41011, ['14534,10', '14535,5', '14537,5']],
    [41012, ['12436,10', '12298,5', '505,25']],
    [41013, ['12208,5', '12210,5', '14534,5', '12436,5']],
    [41014, ['645,10', '656,10', '657,10', '12437,5']],
  ]);
  for (const [id, contents] of expected) {
    const item = items.find(entry => entry.id === id);
    assert.ok(item, `missing preparation box ${id}`);
    assert.ok(item.acquiredFrom.some(source => source.kind === 'cash-shop' && source.name === 'Rune Zero Boutique'));
    for (const content of contents) assert.match(item.script, new RegExp(content));
    assert.match(item.script, /BOUND_ACCOUNT/);
  }
});

test('Golden Gear uses the valid Cart Revolution skill identifier', () => {
  const items = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  const goldenGear = items.find(item => item.id === 5159);
  assert.ok(goldenGear, 'Golden Gear must be indexed');
  assert.match(goldenGear.script, /"MC_CARTREVOLUTION"/);
  assert.doesNotMatch(goldenGear.script, /"BS_CARTREVOLUTION"/);
});

test('every indexed skill item exposes a numeric maximum instead of vague support text', () => {
  const items = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  const missing = items.flatMap(item => (item.boosts || []).filter(boost => boost.percent == null).map(boost => `${item.id}:${boost.skill}`));
  assert.deepEqual(missing, []);
});
