const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('homepage carries the approved player journey and avoids unsupported actions', () => {
  const source = fs.readFileSync('js/render/home.mjs', 'utf8');
  assert.match(source, /A classic adventure,[\s\S]*thoughtfully reimagined/);
  assert.match(source, /The RuneZero promise/);
  assert.match(source, /Signature experiences/);
  assert.match(source, /Your first adventure/);
  assert.match(source, /Find your path/);
  assert.match(source, /Explore the archives/);
  assert.doesNotMatch(source, />Play Now</);
});

test('homepage derives database totals from metadata instead of hard-coding them', () => {
  const source = fs.readFileSync('js/render/home.mjs', 'utf8');
  assert.match(source, /meta\.items/);
  assert.match(source, /meta\.mobs/);
  assert.doesNotMatch(source, /6,486|1,089/);
});
