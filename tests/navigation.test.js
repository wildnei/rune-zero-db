const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('desktop navigation uses a grouped left sidebar and mobile keeps the drawer', () => {
  const source = fs.readFileSync('js/ui/navigation.mjs', 'utf8');
  const base = fs.readFileSync('css/base.css', 'utf8');
  const components = fs.readFileSync('css/components.css', 'utf8');
  const responsive = fs.readFileSync('css/responsive.css', 'utf8');
  for (const group of ['Start here', 'Build planning', 'Activities', 'Archives']) assert.match(source, new RegExp(group));
  for (const view of ['monster-hunter', 'items', 'mobs', 'enchants', 'balance']) assert.match(source, new RegExp(`'${view}'`));
  assert.match(components, /\.site-sidebar[\s\S]*position: fixed/);
  assert.match(base, /#app \{[^}]*margin-left: 248px/);
  assert.match(responsive, /\.site-sidebar[^{]*\{ display: none/);
  assert.match(responsive, /#app \{ margin-left: 0/);
});
