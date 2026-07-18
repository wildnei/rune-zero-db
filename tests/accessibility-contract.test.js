const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('application shell includes core keyboard and landmark contracts', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = `${fs.readFileSync('css/base.css', 'utf8')}\n${fs.readFileSync('css/responsive.css', 'utf8')}`;
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main id="app" tabindex="-1"/);
  assert.match(html, /aria-label="Primary"/);
  assert.match(html, /aria-controls="mobile-nav"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test('production markup contains no inline event handlers', () => {
  const files = ['index.html', ...fs.readdirSync('js', { recursive: true }).filter(name => name.endsWith('.mjs')).map(name => `js/${name}`)];
  for (const file of files) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /\son(?:click|input|change|error)=/i, file);
});

test('global search supports its keyboard interaction contract', () => {
  const source = fs.readFileSync('js/ui/global-search.mjs', 'utf8');
  assert.match(source, /ArrowDown/);
  assert.match(source, /ArrowUp/);
  assert.match(source, /Escape/);
  assert.match(source, /event\.key === '\/'/);
  assert.match(source, /aria-activedescendant/);
  assert.match(source, /trapFocus/);
  assert.match(source, /\.inert = true/);
});

test('mobile drawer traps focus and makes the page inert while open', () => {
  const source = fs.readFileSync('js/ui/navigation.mjs', 'utf8');
  assert.match(source, /trapFocus/);
  assert.match(source, /setPageInert\(true\)/);
  assert.match(source, /setPageInert\(false\)/);
});

test('skill rebalance explorer has responsive and visible-state contracts', () => {
  const componentCss = fs.readFileSync('css/components.css', 'utf8');
  const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');
  assert.match(componentCss, /\.rebalance-layout/);
  assert.match(componentCss, /\.rebalance-class\[aria-pressed="true"\]/);
  assert.match(componentCss, /\.rebalance-results/);
  assert.match(responsiveCss, /\.rebalance-layout/);
});
