const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('critical local brand assets exist', () => {
  for (const file of ['assets/brand/runezero-hero.jpg', 'assets/brand/runezero-hero-mobile.jpg', 'assets/brand/runezero-mark.svg']) {
    assert.equal(fs.existsSync(file), true, `${file} must exist`);
    assert.ok(fs.statSync(file).size > 100, `${file} must not be empty`);
  }
});

test('site assets use GitHub Pages-safe relative paths', () => {
  const files = ['index.html', ...fs.readdirSync('js', { recursive: true }).filter(name => name.endsWith('.mjs')).map(name => `js/${name}`)];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /(?:src|href)=["']\/(?!\/)/, `${file} contains a root-absolute path`);
  }
});
