# Skill Rebalance Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public “Fun Mod” experience with a class-first and skill-searchable Rebalanced Builds explorer while preserving database filters and context across item navigation.

**Architecture:** Add a pure skill-gear indexing module and a guarded session-state module, then keep DOM rendering in a focused Rebalanced Builds renderer. Existing routes and generated JSON remain authoritative; the legacy `funmod` field stays internal while every public label uses Skill Rebalance terminology.

**Tech Stack:** Static HTML/CSS, native ES modules, browser `sessionStorage`, Node.js built-in test runner, existing generated JSON datasets.

## Global Constraints

- Keep the project static, dependency-light, and compatible with GitHub Pages at `/rune-zero-db/`.
- Preserve `#builds`, `#skills`, `#items`, and `#item/<id>` hashes.
- Show all skill-enhancing items by default and never invent a damage percentage.
- Use “Skill Rebalance,” “Rebalanced Builds,” and “Rebalanced Gear” in player-facing copy; never show “Fun Mod,” “fun-mod,” or “Fun Builds.”
- Keep legacy fields, source filenames, and build-pipeline constants internal.
- Exclude pure third-class entries from the default Episode 13 experience.
- Preserve keyboard, mobile, reduced-motion, and WCAG-oriented behavior from the redesigned site.

---

### Task 1: Normalize Skill Gear Data

**Files:**
- Create: `js/core/skill-gear.mjs`
- Create: `tests/skill-gear.test.js`

**Interfaces:**
- Consumes: item objects with `id`, `name`, `type`, `sub`, `loc`, `custom`, `funmod`, `script`, and `boosts`; the `data/skills.json` ID-to-name object.
- Produces: `CLASS_FAMILIES`, `classFamilyForSkill(skillId)`, `buildSkillGearIndex(items, skillNames)`, and `filterSkillGear(index, state)`.

- [ ] **Step 1: Write failing class-mapping and index tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('skill families separate the shared CR prefix correctly', async () => {
  const { classFamilyForSkill } = await import('../js/core/skill-gear.mjs');
  assert.equal(classFamilyForSkill('CR_SHIELDBOOMERANG').id, 'paladin');
  assert.equal(classFamilyForSkill('CR_ACIDDEMONSTRATION').id, 'creator');
  assert.equal(classFamilyForSkill('LK_SPIRALPIERCE').id, 'lord-knight');
  assert.equal(classFamilyForSkill('GS_DESPERADO').id, 'gunslinger');
});

test('index includes every non-third-class boosted item and authoritative base amplifier', async () => {
  const { buildSkillGearIndex } = await import('../js/core/skill-gear.mjs');
  const items = [
    { id: 1, name: 'Falchion', type: 'Weapon', funmod: true, script: 'bonus2 bSkillAtk,"SM_MAGNUM",50;', boosts: [{ skill: 'SM_MAGNUM', t3: false }] },
    { id: 2, name: 'Warbreaker', type: 'Weapon', custom: true, script: 'bonus2 bSkillAtk,"KN_BOWLINGBASH",70;', boosts: [{ skill: 'KN_BOWLINGBASH', t3: false }] },
    { id: 3, name: 'Future Gear', type: 'Armor', boosts: [{ skill: 'RK_DRAGONBREATH', t3: true }] },
  ];
  const index = buildSkillGearIndex(items, { SM_MAGNUM: 'Magnum Break', KN_BOWLINGBASH: 'Bowling Bash', RK_DRAGONBREATH: 'Dragon Breath' });
  assert.deepEqual(index.map(group => group.skillId), ['KN_BOWLINGBASH', 'SM_MAGNUM']);
  assert.equal(index.find(group => group.skillId === 'SM_MAGNUM').items[0].percent, 50);
  assert.equal(index.find(group => group.skillId === 'KN_BOWLINGBASH').items[0].rebalanced, false);
});
```

- [ ] **Step 2: Run the tests and confirm the module is missing**

Run: `node --test tests/skill-gear.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/core/skill-gear.mjs`.

- [ ] **Step 3: Implement the mapping and normalized index**

```js
import { skillAttackAmplifiers } from '../render/entities.mjs';

export const CLASS_FAMILIES = [
  { id: 'lord-knight', name: 'Lord Knight', prefixes: ['SM', 'KN', 'LK'] },
  { id: 'paladin', name: 'Paladin', prefixes: ['CR', 'PA'] },
  { id: 'high-wizard', name: 'High Wizard', prefixes: ['MG', 'WZ', 'HW'] },
  { id: 'high-priest', name: 'High Priest', prefixes: ['AL', 'PR', 'HP'] },
  { id: 'whitesmith', name: 'Whitesmith', prefixes: ['MC', 'BS', 'WS'] },
  { id: 'creator', name: 'Creator', prefixes: ['AM'] },
  { id: 'sniper', name: 'Sniper', prefixes: ['AC', 'HT', 'SN'] },
  { id: 'assassin-cross', name: 'Assassin Cross', prefixes: ['TF', 'AS', 'ASC'] },
  { id: 'stalker', name: 'Stalker', prefixes: ['RG'] },
  { id: 'champion', name: 'Champion', prefixes: ['MO', 'CH'] },
  { id: 'professor', name: 'Professor', prefixes: ['SA', 'PF'] },
  { id: 'performer', name: 'Clown & Gypsy', prefixes: ['BA', 'DC', 'CG'] },
  { id: 'taekwon', name: 'Taekwon Family', prefixes: ['TK', 'SG', 'SL'], expanded: true },
  { id: 'gunslinger', name: 'Gunslinger', prefixes: ['GS'], expanded: true },
  { id: 'ninja', name: 'Ninja', prefixes: ['NJ'], expanded: true },
];

const CREATOR_CR_SKILLS = new Set(['CR_ACIDDEMONSTRATION', 'CR_CULTIVATION', 'CR_SLIMPITCHER', 'CR_FULLPROTECTION']);
const normalize = value => String(value ?? '').trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');

export function classFamilyForSkill(skillId) {
  if (CREATOR_CR_SKILLS.has(skillId)) return CLASS_FAMILIES.find(family => family.id === 'creator');
  const prefix = String(skillId).split('_')[0];
  return CLASS_FAMILIES.find(family => family.prefixes.includes(prefix)) || { id: 'other', name: 'Other', prefixes: [] };
}

export function buildSkillGearIndex(items = [], skillNames = {}) {
  const groups = new Map();
  for (const item of items) for (const boost of item.boosts || []) {
    if (boost.t3) continue;
    const skillId = boost.skill;
    const family = classFamilyForSkill(skillId);
    const amp = skillAttackAmplifiers(item.script).find(entry => entry.skill === skillId);
    if (!groups.has(skillId)) groups.set(skillId, { skillId, name: skillNames[skillId] || boost.name || skillId, family, items: [] });
    groups.get(skillId).items.push({ ...item, percent: amp?.percent ?? null, rebalanced: Boolean(item.funmod), category: item.type || 'Other' });
  }
  return [...groups.values()].map(group => ({ ...group, items: group.items.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterSkillGear(index, { classId = 'all', query = '', category = 'all', rebalancedOnly = false, skillId = '' } = {}) {
  const needle = normalize(query);
  return index.flatMap(group => {
    if (classId !== 'all' && group.family.id !== classId) return [];
    if (skillId && group.skillId !== skillId) return [];
    const groupMatches = !needle || normalize(`${group.name} ${group.skillId}`).includes(needle);
    const items = group.items.filter(item => (category === 'all' || item.category === category)
      && (!rebalancedOnly || item.rebalanced)
      && (groupMatches || normalize(`${item.name} ${item.aegis || ''}`).includes(needle)));
    return items.length ? [{ ...group, items }] : [];
  });
}
```

- [ ] **Step 4: Add search/filter tests and run them green**

```js
test('filters by class, readable skill name, internal id, item name, category, and rebalance flag', async () => {
  const { filterSkillGear } = await import('../js/core/skill-gear.mjs');
  const index = [{ skillId: 'KN_BOWLINGBASH', name: 'Bowling Bash', family: { id: 'lord-knight', name: 'Lord Knight' }, items: [
    { id: 1, name: 'Warbreaker', category: 'Weapon', rebalanced: false },
    { id: 2, name: 'Bowling Card', category: 'Card', rebalanced: true },
  ] }];
  assert.equal(filterSkillGear(index, { classId: 'lord-knight' }).length, 1);
  assert.equal(filterSkillGear(index, { query: 'KN_BOWLINGBASH' }).length, 1);
  assert.equal(filterSkillGear(index, { query: 'warbreaker' })[0].items.length, 1);
  assert.equal(filterSkillGear(index, { category: 'Card', rebalancedOnly: true })[0].items[0].id, 2);
});
```

Run: `node --test tests/skill-gear.test.js`

Expected: all skill-gear tests PASS.

- [ ] **Step 5: Commit**

```bash
git add js/core/skill-gear.mjs tests/skill-gear.test.js
git commit -m "feat: index skill gear by class and skill"
```

### Task 2: Add Guarded View-State Persistence

**Files:**
- Create: `js/core/view-state.mjs`
- Create: `tests/view-state.test.js`

**Interfaces:**
- Produces: `readViewState(name, defaults, storage)`, `writeViewState(name, value, storage)`, `readItemContext(storage)`, `writeItemContext(context, storage)`, and `clearItemContext(storage)`.
- Values must be plain JSON objects; malformed, non-object, or inaccessible storage returns the supplied defaults.

- [ ] **Step 1: Write failing storage tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('view state round-trips and malformed data falls back', async () => {
  const { readViewState, writeViewState } = await import('../js/core/view-state.mjs');
  const storage = memoryStorage();
  writeViewState('items', { query: 'falchion', source: 'funmod', scrollTop: 120 }, storage);
  assert.deepEqual(readViewState('items', { query: '', source: 'all', scrollTop: 0 }, storage), { query: 'falchion', source: 'funmod', scrollTop: 120 });
  assert.deepEqual(readViewState('broken', { query: '' }, memoryStorage({ 'runezero:view:broken': '{bad' })), { query: '' });
});

test('item context only accepts a usable item target', async () => {
  const { readItemContext, writeItemContext } = await import('../js/core/view-state.mjs');
  const storage = memoryStorage();
  writeItemContext({ itemId: 1104, href: '#builds', label: 'Back to Lord Knight → Magnum Break gear' }, storage);
  assert.equal(readItemContext(storage).itemId, 1104);
  assert.equal(readItemContext(memoryStorage({ 'runezero:item-context': '[]' })), null);
});
```

- [ ] **Step 2: Run and confirm the missing-module failure**

Run: `node --test tests/view-state.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement guarded storage helpers**

```js
const viewKey = name => `runezero:view:${name}`;
const CONTEXT_KEY = 'runezero:item-context';
const browserStorage = () => { try { return globalThis.sessionStorage; } catch { return null; } };

export function readViewState(name, defaults = {}, storage = browserStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(viewKey(name)) || 'null');
    return parsed && !Array.isArray(parsed) && typeof parsed === 'object' ? { ...defaults, ...parsed } : { ...defaults };
  } catch { return { ...defaults }; }
}

export function writeViewState(name, value, storage = browserStorage()) {
  try { storage?.setItem(viewKey(name), JSON.stringify(value)); return true; } catch { return false; }
}

export function readItemContext(storage = browserStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(CONTEXT_KEY) || 'null');
    return parsed && !Array.isArray(parsed) && Number.isFinite(Number(parsed.itemId)) && /^#/.test(parsed.href || '') && parsed.label ? parsed : null;
  } catch { return null; }
}

export function writeItemContext(context, storage = browserStorage()) {
  try { storage?.setItem(CONTEXT_KEY, JSON.stringify(context)); return true; } catch { return false; }
}

export function clearItemContext(storage = browserStorage()) {
  try { storage?.removeItem(CONTEXT_KEY); } catch {}
}
```

- [ ] **Step 4: Run the focused tests green**

Run: `node --test tests/view-state.test.js`

Expected: all view-state tests PASS.

- [ ] **Step 5: Commit**

```bash
git add js/core/view-state.mjs tests/view-state.test.js
git commit -m "feat: preserve wiki view state safely"
```

### Task 3: Build the Rebalanced Builds Explorer

**Files:**
- Create: `js/render/skill-rebalance.mjs`
- Modify: `js/render/guides.mjs`
- Modify: `tests/guides.test.js`

**Interfaces:**
- Consumes: `CLASS_FAMILIES`, `buildSkillGearIndex`, `filterSkillGear`, and view-state helpers.
- Produces: `renderSkillRebalance({ items, skills })` returning the route's `<section>` element.

- [ ] **Step 1: Replace the legacy build-renderer contract test with failing explorer contracts**

```js
test('rebalanced builds explorer supports both class and skill discovery', () => {
  const source = fs.readFileSync('js/render/skill-rebalance.mjs', 'utf8');
  for (const contract of ['data-rebalance-class', 'data-rebalance-query', 'data-rebalance-skill', 'data-rebalance-category', 'data-rebalance-only', 'aria-live="polite"']) {
    assert.match(source, new RegExp(contract));
  }
});
```

Run: `node --test tests/guides.test.js`

Expected: FAIL because `js/render/skill-rebalance.mjs` does not exist.

- [ ] **Step 2: Implement the renderer shell and state-driven refresh**

Create a renderer that:

```js
import { CLASS_FAMILIES, buildSkillGearIndex, filterSkillGear } from '../core/skill-gear.mjs';
import { readViewState, writeItemContext, writeViewState } from '../core/view-state.mjs';
import { escapeHtml, itemIconUrl } from './entities.mjs';

const DEFAULT_STATE = { classId: 'all', query: '', category: 'all', rebalancedOnly: false, skillId: '', scrollTop: 0 };

export function renderSkillRebalance({ items = [], skills = {} } = {}) {
  const index = buildSkillGearIndex(items, skills);
  const state = readViewState('skill-rebalance', DEFAULT_STATE);
  const categories = [...new Set(index.flatMap(group => group.items.map(item => item.category)))].sort();
  if (!['all', ...CLASS_FAMILIES.map(family => family.id)].includes(state.classId)) state.classId = 'all';
  if (!['all', ...categories].includes(state.category)) state.category = 'all';
  const page = document.createElement('section');
  page.className = 'wiki-page rebalance-page';
  page.innerHTML = `<header class="wiki-masthead editorial-masthead"><div class="container"><p class="eyebrow">Skill Rebalance</p><h1>Rebalanced Builds</h1><p>Find the equipment that makes overlooked skills and alternative class paths viable.</p></div></header>
    <div class="container rebalance-layout">
      <aside class="rebalance-controls" aria-label="Rebalanced build filters">
        <label for="rebalance-query">Search skills or gear</label>
        <input id="rebalance-query" type="search" value="${escapeHtml(state.query)}" placeholder="Bowling Bash, KN_BOWLINGBASH, or item name" data-rebalance-query>
        <fieldset><legend>Choose your class</legend><div class="rebalance-classes">
          <button type="button" class="rebalance-class" data-rebalance-class="all" aria-pressed="${state.classId === 'all'}">All classes</button>
          ${CLASS_FAMILIES.map(family => `<button type="button" class="rebalance-class" data-rebalance-class="${family.id}" aria-pressed="${state.classId === family.id}">${escapeHtml(family.name)}</button>`).join('')}
        </div></fieldset>
        <label for="rebalance-category">Equipment type</label>
        <select id="rebalance-category" data-rebalance-category><option value="all">All equipment</option>${categories.map(category => `<option value="${escapeHtml(category)}"${state.category === category ? ' selected' : ''}>${escapeHtml(category)}</option>`).join('')}</select>
        <label class="rebalance-check"><input type="checkbox" data-rebalance-only${state.rebalancedOnly ? ' checked' : ''}> Rebalanced Gear only</label>
        <button type="button" class="rebalance-reset" data-rebalance-reset>Reset filters</button>
      </aside>
      <main class="rebalance-results">
        <div class="rebalance-skill-picker" data-rebalance-skills></div>
        <p class="rebalance-summary" aria-live="polite" data-rebalance-summary></p>
        <div class="rebalance-groups" data-rebalance-results></div>
      </main>
    </div>`;
  const query = page.querySelector('[data-rebalance-query]');
  const category = page.querySelector('[data-rebalance-category]');
  const only = page.querySelector('[data-rebalance-only]');
  const skillPicker = page.querySelector('[data-rebalance-skills]');
  const summary = page.querySelector('[data-rebalance-summary]');
  const results = page.querySelector('[data-rebalance-results]');

  const save = () => writeViewState('skill-rebalance', state);
  const setClass = classId => {
    state.classId = classId;
    state.skillId = '';
    page.querySelectorAll('[data-rebalance-class]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rebalanceClass === classId)));
    save();
    refresh();
  };

  function refresh() {
    const groups = filterSkillGear(index, state);
    const available = filterSkillGear(index, { classId: state.classId, query: state.query });
    skillPicker.innerHTML = available.length ? `<button type="button" class="rebalance-skill" data-rebalance-skill="" aria-pressed="${!state.skillId}">All supported skills</button>${available.map(group => `<button type="button" class="rebalance-skill" data-rebalance-skill="${escapeHtml(group.skillId)}" aria-pressed="${state.skillId === group.skillId}">${escapeHtml(group.name)} <span>${group.items.length}</span></button>`).join('')}` : '';
    const itemCount = groups.reduce((sum, group) => sum + group.items.length, 0);
    summary.textContent = `${groups.length.toLocaleString()} skills · ${itemCount.toLocaleString()} items`;
    results.innerHTML = groups.length ? groups.map(group => `<section class="rebalance-skill-group" aria-labelledby="rebalance-${escapeHtml(group.skillId)}"><header><div><p class="eyebrow">${escapeHtml(group.family.name)}</p><h2 id="rebalance-${escapeHtml(group.skillId)}">${escapeHtml(group.name)}</h2></div><code>${escapeHtml(group.skillId)}</code></header><div class="rebalance-item-grid">${group.items.map(item => `<a class="rebalance-item" href="#item/${Number(item.id)}" data-rebalance-item="${Number(item.id)}" data-rebalance-family="${escapeHtml(group.family.name)}" data-rebalance-skill-name="${escapeHtml(group.name)}"><img src="${itemIconUrl(item.id)}" alt="" width="42" height="42" loading="lazy"><span><strong>${escapeHtml(item.name)}${item.slots ? ` [${Number(item.slots)}]` : ''}</strong><small>${escapeHtml(item.sub || item.category)}${item.custom ? ' · RuneZero' : ''}${item.rebalanced ? ' · Skill Rebalance' : ''}</small></span><b>${item.percent == null ? 'Skill support' : `+${Number(item.percent)}%`}</b></a>`).join('')}</div></section>`).join('') : '<div class="database-empty"><strong>No supported gear found</strong><span>Clear a filter or try another class, skill, or item name.</span></div>';
    results.querySelectorAll('img').forEach(image => image.addEventListener('error', () => { image.hidden = true; }, { once: true }));
  }

  page.querySelectorAll('[data-rebalance-class]').forEach(button => button.addEventListener('click', () => setClass(button.dataset.rebalanceClass)));
  query.addEventListener('input', () => { state.query = query.value; state.skillId = ''; save(); refresh(); });
  category.addEventListener('change', () => { state.category = category.value; save(); refresh(); });
  only.addEventListener('change', () => { state.rebalancedOnly = only.checked; save(); refresh(); });
  skillPicker.addEventListener('click', event => {
    const button = event.target.closest('[data-rebalance-skill]');
    if (!button) return;
    state.skillId = button.dataset.rebalanceSkill;
    save();
    refresh();
  });
  page.querySelector('[data-rebalance-reset]').addEventListener('click', () => {
    Object.assign(state, DEFAULT_STATE);
    query.value = '';
    category.value = 'all';
    only.checked = false;
    setClass('all');
  });
  results.addEventListener('click', event => {
    const link = event.target.closest('[data-rebalance-item]');
    if (!link) return;
    writeItemContext({ itemId: Number(link.dataset.rebalanceItem), href: '#builds', label: `Back to ${link.dataset.rebalanceFamily} → ${link.dataset.rebalanceSkillName} gear` });
  });
  refresh();
  return page;
}
```

The concrete markup must use buttons with `aria-pressed`, an explicit `<label>` for search, a labeled category `<select>`, a checkbox for Rebalanced Gear only, and `<section aria-labelledby>` per skill group. Item cards include icon, item name, category/subtype, slot count, RuneZero/Skill Rebalance badges, and either `+N% skill damage` or `Skill support`.

- [ ] **Step 3: Route both legacy destinations to the new explorer**

In `js/render/guides.mjs`, import the renderer and change dispatch to:

```js
if (view === 'builds' || view === 'skills') return renderSkillRebalance({ items: data.items || [], skills: data.skills || {} });
```

Remove the old `renderBuilds` and `renderSkillItems` functions after their behavior is superseded. Keep `GUIDE_VIEWS` hashes unchanged.

- [ ] **Step 4: Run guide, skill-gear, and full tests**

Run: `node --test tests/guides.test.js tests/skill-gear.test.js`

Expected: PASS.

Run: `npm test`

Expected: all existing tests PASS.

- [ ] **Step 5: Commit**

```bash
git add js/render/skill-rebalance.mjs js/render/guides.mjs tests/guides.test.js
git commit -m "feat: add class and skill gear explorer"
```

### Task 4: Preserve Database Filters and Item Context

**Files:**
- Modify: `js/render/database.mjs`
- Modify: `js/render/entities.mjs`
- Modify: `tests/database.test.js`
- Modify: `tests/entities.test.js`

**Interfaces:**
- Consumes: view-state helpers and the context written by Rebalanced Builds.
- `renderItem(item, context)` accepts `context.returnContext` with `href` and `label`.

- [ ] **Step 1: Write failing validation and context tests**

Add pure exports `sanitizeItemState` and `itemReturnLink` and test them:

```js
test('saved item archive state is validated against available controls', async () => {
  const { sanitizeItemState } = await import('../js/render/database.mjs');
  assert.deepEqual(sanitizeItemState({ source: 'broken', direction: 'sideways', query: 'knife', scrollTop: -4 }), {
    query: 'knife', type: 'all', source: 'all', subtype: 'all', slot: 'all', sort: '', direction: 'asc', scrollTop: 0,
  });
});

test('item details render a contextual return link only for the selected item', async () => {
  const { itemReturnLink } = await import('../js/render/entities.mjs');
  assert.match(itemReturnLink(1104, { itemId: 1104, href: '#builds', label: 'Back to Lord Knight → Magnum Break gear' }), /href="#builds"/);
  assert.equal(itemReturnLink(1105, { itemId: 1104, href: '#builds', label: 'Back' }), '');
});
```

Run: `node --test tests/database.test.js tests/entities.test.js`

Expected: FAIL because both exports are missing.

- [ ] **Step 2: Restore controls before the first database refresh**

In `js/render/database.mjs`:

```js
import { readItemContext, readViewState, writeViewState } from '../core/view-state.mjs';

const ITEM_DEFAULTS = { query: '', type: 'all', source: 'all', subtype: 'all', slot: 'all', sort: '', direction: 'asc', scrollTop: 0 };
const oneOf = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;

export function sanitizeItemState(value = {}) {
  return {
    query: String(value.query || ''),
    type: String(value.type || 'all'),
    source: oneOf(value.source, ['all', 'custom', 'funmod'], 'all'),
    subtype: String(value.subtype || 'all'),
    slot: String(value.slot || 'all'),
    sort: oneOf(value.sort, ['', 'name', 'id', 'atk', 'def', 'weight', 'reqlv', 'slots'], ''),
    direction: oneOf(value.direction, ['asc', 'desc'], 'asc'),
    scrollTop: Math.max(0, Number(value.scrollTop) || 0),
  };
}
```

Read and sanitize `runezero:view:items`, assign every control value and direction label, then call `refresh()`. On input/change/direction click, serialize the current control values. On result-list scroll, persist `results.scrollTop`; restore it in `requestAnimationFrame` after results render. Preserve the existing one-shot global-search query by merging it into the restored query.

Change the source option's visible label from `Fun Mods` to `Rebalanced Gear` while keeping `value="funmod"`.

- [ ] **Step 3: Render the contextual return link**

In `js/render/entities.mjs`:

```js
export function itemReturnLink(itemId, returnContext) {
  if (!returnContext || Number(returnContext.itemId) !== Number(itemId)) return '';
  return `<p><a class="back-link entity-context-link" href="${escapeHtml(returnContext.href)}">← ${escapeHtml(returnContext.label)}</a></p>`;
}
```

Place `itemReturnLink(item.id, context.returnContext)` before the item header. In `renderDatabase`, pass `returnContext: readItemContext()` when rendering an item detail. Result clicks from the ordinary archive overwrite context with `{ itemId, href: '#items', label: 'Back to filtered item results' }` after saving the current archive state.

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/database.test.js tests/entities.test.js tests/view-state.test.js`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add js/render/database.mjs js/render/entities.mjs tests/database.test.js tests/entities.test.js
git commit -m "fix: retain database context across item navigation"
```

### Task 5: Complete Public Terminology Migration

**Files:**
- Modify: `js/render/home.mjs`
- Modify: `js/render/guides.mjs`
- Modify: `js/render/entities.mjs`
- Modify: `js/ui/navigation.mjs`
- Modify: `tests/home.test.js`
- Modify: `tests/guides.test.js`

**Interfaces:**
- Public copy changes only; legacy data identifiers remain unchanged.

- [ ] **Step 1: Add a failing public-copy audit**

```js
test('player-facing source contains no legacy fun-mod language', () => {
  const files = ['js/render/home.mjs', 'js/render/guides.mjs', 'js/render/entities.mjs', 'js/render/database.mjs', 'js/render/skill-rebalance.mjs', 'js/ui/navigation.mjs'];
  const source = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(source, /Fun Mods|Fun mod|Fun-mod|Fun builds|fun-mod equipment/i);
  assert.match(source, /Rebalanced Builds/);
  assert.match(source, /Rebalanced Gear/);
  assert.match(source, /Skill Rebalance/);
});
```

Run: `node --test tests/home.test.js tests/guides.test.js`

Expected: FAIL on the current homepage, customization guide, item badge, and navigation copy.

- [ ] **Step 2: Replace every visible legacy phrase**

Use these exact replacements:

- `Find a fun build` → `Find rebalanced gear`
- `Fun builds` → `Rebalanced Builds`
- `fun-mod equipment` → `skill-rebalanced equipment`
- `starter fun-mod weapon` → `starter rebalanced weapon`
- `Fun-mod items` → `Rebalanced gear`
- Item badge `Fun mod` → `Skill Rebalance`
- Navigation `Builds` → `Rebalanced Builds`
- Guardrail copy describes “rebalanced pieces” and “skill-rebalance cards.”

Do not rename `item.funmod`, `meta.funmodItems`, test fixtures, data files, or build-tool constants.

- [ ] **Step 3: Make the item estimator apply to all authoritative skill amplifiers**

Change `renderDamageEstimator` from:

```js
if (!item.funmod || !amplifiers.length) return '';
```

to:

```js
if (!amplifiers.length) return '';
```

This lets non-legacy custom skill gear show the same exact estimator without changing server data.

- [ ] **Step 4: Run copy audit and full tests**

Run: `node --test tests/home.test.js tests/guides.test.js tests/entities.test.js`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add js/render/home.mjs js/render/guides.mjs js/render/entities.mjs js/ui/navigation.mjs tests/home.test.js tests/guides.test.js tests/entities.test.js
git commit -m "refactor: present skill changes as intentional rebalancing"
```

### Task 6: Style and Verify the Explorer

**Files:**
- Modify: `css/components.css`
- Modify: `css/responsive.css`
- Modify: `tests/accessibility-contract.test.js`

**Interfaces:**
- Styles the semantic `rebalance-*` hooks created in Task 3.

- [ ] **Step 1: Add failing responsive/accessibility style contracts**

```js
test('skill rebalance explorer has responsive and visible-state contracts', () => {
  const componentCss = fs.readFileSync('css/components.css', 'utf8');
  const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');
  assert.match(componentCss, /\.rebalance-layout/);
  assert.match(componentCss, /\.rebalance-class\[aria-pressed="true"\]/);
  assert.match(componentCss, /\.rebalance-results/);
  assert.match(responsiveCss, /\.rebalance-layout/);
});
```

Run: `node --test tests/accessibility-contract.test.js`

Expected: FAIL because the new style hooks are absent.

- [ ] **Step 2: Add spacious desktop styles**

Add component rules for:

```css
.rebalance-layout { display: grid; grid-template-columns: minmax(250px, .7fr) minmax(0, 1.3fr); gap: 1.5rem; padding-block: clamp(2rem, 5vw, 5rem); }
.rebalance-controls, .rebalance-results { min-width: 0; }
.rebalance-classes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }
.rebalance-class[aria-pressed="true"], .rebalance-skill[aria-pressed="true"] { border-color: var(--sky-500); background: var(--sky-100); color: var(--sky-700); }
.rebalance-skill-group { padding: 1.5rem; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--paper); box-shadow: var(--shadow-sm); }
.rebalance-item-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
```

Add explicit rules for `.rebalance-controls label`, `.rebalance-controls input`, `.rebalance-controls select`, `.rebalance-check`, `.rebalance-reset`, `.rebalance-skill-picker`, `.rebalance-skill`, `.rebalance-summary`, `.rebalance-groups`, `.rebalance-skill-group > header`, `.rebalance-item`, `.rebalance-item img`, and `.rebalance-item b`. Use `var(--line-strong)` borders, `var(--sky-50)` active/hover surfaces, `var(--sky-500)` focus borders, `var(--navy-950)` primary text, `var(--navy-500)` secondary text, and the existing three-pixel `var(--sky-100)` focus ring.

- [ ] **Step 3: Add mobile stacking without horizontal overflow**

Inside the existing tablet/mobile media queries:

```css
.rebalance-layout { grid-template-columns: 1fr; }
.rebalance-item-grid { grid-template-columns: 1fr; }
.rebalance-classes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
```

At the narrowest breakpoint, use one class button per row if labels overflow. Keep controls at least 44px high.

- [ ] **Step 4: Run automated and browser verification**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run validate:data`

Expected: validation succeeds for the committed item and monster totals.

Run: `node --check js/core/skill-gear.mjs && node --check js/core/view-state.mjs && node --check js/render/skill-rebalance.mjs && node --check js/render/database.mjs && node --check js/render/entities.mjs && node --check js/render/guides.mjs`

Expected: no output and exit code 0.

Serve locally with `npm run serve`, then inspect `#builds`, a representative class, skill search, `#items`, and `#item/1104` at desktop and mobile widths. Confirm keyboard focus, Browser Back, preserved filters, contextual return link, no console errors, and no player-facing legacy phrase.

- [ ] **Step 5: Commit**

```bash
git add css/components.css css/responsive.css tests/accessibility-contract.test.js
git commit -m "style: polish the skill rebalance explorer"
```

### Task 7: Final Review and Deployment

**Files:**
- Modify only files required by verified review findings.

**Interfaces:**
- Produces a reviewed, tested commit fast-forwarded to `origin/master`.

- [ ] **Step 1: Run the complete verification suite from a clean process**

```bash
npm test
npm run validate:data
git diff --check
git status --short
```

Expected: all tests and validation PASS, `git diff --check` is silent, and status contains only intentional changes (or is clean after commits).

- [ ] **Step 2: Review against the acceptance criteria**

Inspect the diff and confirm: class/skill/item search paths work; Acid Demonstration maps to Creator; all boosted non-third-class items are indexed; percentages are authoritative; malformed storage is safe; archive and explorer state restore; legacy hashes work; all visible terminology is migrated; mobile and keyboard behavior remain usable.

- [ ] **Step 3: Fix review findings test-first and re-run verification**

For each finding, add or tighten the smallest failing test, make the minimal implementation correction, and repeat Step 1. If no findings exist, make no additional code change.

- [ ] **Step 4: Commit any review corrections**

```bash
git add js/core/skill-gear.mjs js/core/view-state.mjs js/render/skill-rebalance.mjs js/render/database.mjs js/render/entities.mjs js/render/guides.mjs js/render/home.mjs js/ui/navigation.mjs css/components.css css/responsive.css tests/skill-gear.test.js tests/view-state.test.js tests/database.test.js tests/entities.test.js tests/guides.test.js tests/home.test.js tests/accessibility-contract.test.js
git commit -m "fix: address skill rebalance review findings"
```

Skip this commit when review finds nothing.

- [ ] **Step 5: Fetch and deploy only by fast-forward**

```bash
git fetch origin master
git merge-base --is-ancestor origin/master HEAD
git push origin HEAD:master
```

Expected: the ancestor check exits 0 and the push fast-forwards `master`. Never force-push.

- [ ] **Step 6: Verify the live GitHub Pages deployment**

Open `https://wildnei.github.io/rune-zero-db/#builds`, confirm the Rebalanced Builds heading and class/search controls, then reproduce the original filter-navigation case on the live site. Confirm item detail context and the hero asset return HTTP 200.
