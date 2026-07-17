const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('local preview serves browser modules as JavaScript', () => {
  const source = fs.readFileSync('tools/serve.js', 'utf8');
  assert.match(source, /['"]\.mjs['"]\s*:\s*['"]text\/javascript['"]/);
});
