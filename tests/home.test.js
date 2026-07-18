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

test('player-facing source contains no legacy fun-mod language', () => {
  const files = ['js/render/home.mjs', 'js/render/guides.mjs', 'js/render/entities.mjs', 'js/render/database.mjs', 'js/render/skill-rebalance.mjs', 'js/ui/navigation.mjs'];
  const source = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(source, /Fun Mods|Fun mod|Fun-mod|Fun builds|fun-mod equipment/i);
  assert.match(source, /Rebalanced Builds/);
  assert.match(source, /Rebalanced Gear/);
  assert.match(source, /Skill Rebalance/);
});
