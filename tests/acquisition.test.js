const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBarters, parseNpcScript } = require('../tools/acquisition');

test('acquisition parser reads zeny, cash, and item-currency shops', () => {
  const source = [
    'prontera,10,20,4\tshop\tArmory#rz\t1_M_SMITH,1201:5000',
    'prontera,11,20,4\tcashshop\tBoutique\t4_F_KAFRA1,40760:200',
    '-\titemshop\tHunterShop#rz\t-1,40001,40450:25',
  ].join('\n');
  const rows = parseNpcScript(source, 'shops.txt');
  assert.equal(rows.get(1201)[0].price, 5000);
  assert.equal(rows.get(40760)[0].kind, 'cash-shop');
  assert.deepEqual(rows.get(40450)[0], { kind: 'item-shop', name: 'Hunter Shop', map: null, price: 25, currency: 40001, file: 'shops.txt' });
});

test('acquisition parser records direct numeric grants and ignores comments', () => {
  const source = 'prontera,1,1,4\tscript\tReward Master\t1_M_01,{\n// getitem 999,1;\ngetitem 40000, 3;\ngetitembound 40795,1,BOUND_ACCOUNT;\n}';
  const rows = parseNpcScript(source, 'rewards.txt');
  assert.equal(rows.has(999), false);
  assert.equal(rows.get(40000)[0].name, 'Reward Master');
  assert.equal(rows.get(40000)[0].amount, 3);
  assert.equal(rows.get(40795)[0].bound, true);
});

test('acquisition parser resolves numeric reward arrays used by loaded scripts', () => {
  const source = 'prontera,1,1,4\tscript\tMonster Hunter#rz\t1_M_01,{\nsetarray .item[0],40985,40986,40988;\ngetitem .item[.@choice],1;\n}';
  const rows = parseNpcScript(source, 'monster_hunter.txt');
  assert.deepEqual([...rows.keys()], [40985, 40986, 40988]);
  assert.equal(rows.get(40988)[0].name, 'Monster Hunter');
});

test('acquisition parser follows a selected array item into a scalar grant', () => {
  const source = 'prontera,1,1,4\tscript\tMonster Hunter#rz\t1_M_01,{\nsetarray .item[0],40985,40986,40988;\n.@it = .item[.@choice];\ngetitem .@it,1;\n}';
  const rows = parseNpcScript(source, 'monster_hunter.txt');
  assert.deepEqual([...rows.keys()], [40985, 40986, 40988]);
});

test('acquisition parser resolves barter costs through item identities', () => {
  const byAegis = new Map([
    ['Wing_Of_Fly', { id: 601, name: 'Fly Wing' }],
    ['Jellopy', { id: 909, name: 'Jellopy' }],
  ]);
  const rows = parseBarters([{ Name: 'barter_RZ_Recycler', Map: 'moc_para01', Items: [{ Item: 'Wing_Of_Fly', RequiredItems: [{ Item: 'Jellopy', Amount: 50 }] }] }], byAegis);
  assert.deepEqual(rows.get(601)[0].costs, [{ id: 909, name: 'Jellopy', amount: 50 }]);
});
