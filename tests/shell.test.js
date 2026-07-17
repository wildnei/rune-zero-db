const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('document exposes semantic navigation, main content, status, and module entry', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /<header[^>]*class="site-header"/);
  assert.match(html, /<nav[^>]*aria-label="Primary"/);
  assert.match(html, /<main[^>]*id="app"/);
  assert.match(html, /role="status"/);
  assert.match(html, /<script type="module" src="js\/app\.mjs"><\/script>/);
});

test('document no longer embeds the legacy application script or stylesheet', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /<style>/);
  assert.doesNotMatch(html, /function renderHome\(/);
});
