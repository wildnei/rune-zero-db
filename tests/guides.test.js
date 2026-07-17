const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('guide registry covers every non-database legacy section', () => {
  const source = fs.readFileSync('js/render/guides.mjs', 'utf8');
  for (const view of ['systems', 'rates', 'customizations', 'balance', 'builds', 'hunting', 'skills', 'enchants']) {
    assert.match(source, new RegExp(`['\"]${view}['\"]`), `${view} must have a renderer`);
  }
});

test('instances preserve all six current dungeon names', () => {
  const source = fs.readFileSync('js/render/instances.mjs', 'utf8');
  for (const name of ['Old Glast Heim', 'Assault on the Airship', 'Ghost Palace', 'Bakonawa Lake', 'Bangungot Hospital', 'Buwaya Cave']) {
    assert.match(source, new RegExp(name));
  }
});

test('classes are represented with existing repository sprites', () => {
  const source = fs.readFileSync('js/render/classes.mjs', 'utf8');
  assert.match(source, /assets\/classes/);
  assert.match(source, /Lord Knight/);
  assert.match(source, /High Wizard/);
  assert.match(source, /Professor/);
});
