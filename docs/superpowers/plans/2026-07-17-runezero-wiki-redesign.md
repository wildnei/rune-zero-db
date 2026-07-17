# RuneZero Wiki Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing RuneZero database into a spacious, modern-classic fantasy server portal and accessible player wiki while preserving its data, search, filters, calculators, and legacy links.

**Architecture:** Keep the application static and GitHub Pages-compatible. Replace the monolithic document with a semantic shell, shared CSS design system, pure routing/search/data helpers, and focused render modules for the homepage, guides, and database entities; keep the generated JSON files authoritative and migrate behavior in testable slices.

**Tech Stack:** Semantic HTML, CSS custom properties and responsive CSS, browser-native ES modules, Node.js built-in test runner, existing JSON datasets and CommonJS database builder, built-in image generation for the original hero artwork.

## Global Constraints

- Deploy correctly beneath the GitHub Pages subpath `/rune-zero-db/`.
- Preserve all current server information, database values, search behavior, filters, entity cross-links, calculators, and supported hash URLs.
- Never invent server claims, rates, mechanics, links, or numeric values.
- Keep body copy at a minimum of 16 px with WCAG AA contrast, visible focus, semantic controls, keyboard support, reduced motion, and responsive layouts.
- Use an original RuneZero identity and hero; do not copy official Ragnarok Online branding, characters, logos, or promotional compositions.
- Omit registration, download, Discord, server-status, or Play Now actions when no verified destination exists.
- Keep the generated files under `data/` and `tools/build-db.js` authoritative.
- Do not introduce a frontend framework or production runtime dependency.

---

### Task 1: Test harness and pure URL routing

**Files:**
- Modify: `package.json`
- Create: `js/core/routes.js`
- Create: `tests/routes.test.js`

**Interfaces:**
- Consumes: hashes in the forms `#home`, `#items`, `#item/501`, `#mob/1002`, and an empty hash.
- Produces: `parseRoute(hash): { view: string, entity: string | null, id: number | null }` and `routeHash(route): string`.

- [ ] **Step 1: Add the test command and failing route tests**

Add the following script to `package.json`:

```json
"test": "node --test tests/*.test.js"
```

Create `tests/routes.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('legacy hashes resolve to stable views and entity ids', async () => {
  const { parseRoute } = await import('../js/core/routes.js');
  assert.deepEqual(parseRoute(''), { view: 'home', entity: null, id: null });
  assert.deepEqual(parseRoute('#items'), { view: 'items', entity: null, id: null });
  assert.deepEqual(parseRoute('#item/501'), { view: 'items', entity: 'item', id: 501 });
  assert.deepEqual(parseRoute('#mob/1002'), { view: 'mobs', entity: 'mob', id: 1002 });
});

test('unknown and invalid hashes return the home route', async () => {
  const { parseRoute } = await import('../js/core/routes.js');
  assert.deepEqual(parseRoute('#unknown'), { view: 'home', entity: null, id: null });
  assert.deepEqual(parseRoute('#item/nope'), { view: 'home', entity: null, id: null });
});
```

- [ ] **Step 2: Run the route tests and observe the missing-module failure**

Run: `npm test`

Expected: FAIL because `js/core/routes.js` does not exist.

- [ ] **Step 3: Implement the route contract**

Create `js/core/routes.js`:

```js
const VIEWS = new Set([
  'home', 'items', 'builds', 'mobs', 'skills', 'enchants', 'hunting',
  'systems', 'balance', 'rates', 'customizations', 'classes', 'instances'
]);

export function parseRoute(hash = '') {
  const value = String(hash).replace(/^#/, '').replace(/^\//, '');
  if (!value || value === 'home') return { view: 'home', entity: null, id: null };
  if (VIEWS.has(value)) return { view: value, entity: null, id: null };
  const match = /^(item|mob)\/(\d+)$/.exec(value);
  if (!match) return { view: 'home', entity: null, id: null };
  return {
    view: match[1] === 'item' ? 'items' : 'mobs',
    entity: match[1],
    id: Number(match[2])
  };
}

export function routeHash({ view, entity = null, id = null }) {
  if (entity && Number.isInteger(id)) return `#${entity}/${id}`;
  return `#${VIEWS.has(view) ? view : 'home'}`;
}
```

- [ ] **Step 4: Run the tests and commit the routing foundation**

Run: `npm test`

Expected: 2 tests pass.

Commit:

```bash
git add package.json js/core/routes.js tests/routes.test.js
git commit -m "test: establish stable wiki routes"
```

---

### Task 2: Data loading, search, and graceful failure contracts

**Files:**
- Create: `js/core/data.js`
- Create: `js/core/search.js`
- Create: `tests/data.test.js`
- Create: `tests/search.test.js`

**Interfaces:**
- Consumes: a fetch-compatible function, repository-relative JSON path, item and monster records, and free-text queries.
- Produces: `loadJson(path, fetcher)`, `loadWikiData(fetcher)`, `normalizeQuery(value)`, and `searchEntities(data, query, limit)`.

- [ ] **Step 1: Write failing tests for partial data failure and player search**

Create `tests/data.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('loadJson returns parsed JSON and reports a useful path on failure', async () => {
  const { loadJson } = await import('../js/core/data.js');
  const ok = async () => ({ ok: true, json: async () => ({ items: 4 }) });
  assert.deepEqual(await loadJson('data/meta.json', ok), { items: 4 });
  const bad = async () => ({ ok: false, status: 404 });
  await assert.rejects(() => loadJson('data/items.json', bad), /data\/items\.json/);
});
```

Create `tests/search.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('search matches names, ids, and aegis identifiers without case sensitivity', async () => {
  const { searchEntities } = await import('../js/core/search.js');
  const data = {
    items: [{ id: 501, name: 'Red Potion', aegis: 'Red_Potion' }],
    mobs: [{ id: 1002, name: 'Poring' }]
  };
  assert.equal(searchEntities(data, 'red_potion')[0].name, 'Red Potion');
  assert.equal(searchEntities(data, '1002')[0].name, 'Poring');
  assert.equal(searchEntities(data, 'PORING')[0].id, 1002);
});
```

- [ ] **Step 2: Run the tests and observe missing-module failures**

Run: `npm test`

Expected: route tests pass and data/search tests fail because their modules are absent.

- [ ] **Step 3: Implement data loading and normalized search**

Create `js/core/data.js`:

```js
export async function loadJson(path, fetcher = fetch) {
  const response = await fetcher(path);
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
  return response.json();
}

export async function loadWikiData(fetcher = fetch) {
  const required = ['meta', 'items', 'mobs'];
  const optional = ['options', 'skills', 'skillchanges', 'builds', 'hunting', 'elements'];
  const entries = await Promise.all(required.map(async name => [name, await loadJson(`data/${name}.json`, fetcher)]));
  const warnings = [];
  for (const name of optional) {
    try {
      entries.push([name, await loadJson(`data/${name}.json`, fetcher)]);
    } catch (error) {
      warnings.push({ name, message: error.message });
      entries.push([name, name === 'elements' ? {} : []]);
    }
  }
  return { values: Object.fromEntries(entries), warnings };
}
```

Create `js/core/search.js`:

```js
export function normalizeQuery(value) {
  return String(value ?? '').trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');
}

export function searchEntities({ items = [], mobs = [] }, query, limit = 12) {
  const needle = normalizeQuery(query);
  if (!needle) return [];
  const records = [
    ...items.map(value => ({ ...value, kind: 'item' })),
    ...mobs.map(value => ({ ...value, kind: 'mob' }))
  ];
  return records
    .filter(value => normalizeQuery(`${value.id} ${value.name} ${value.aegis || ''}`).includes(needle))
    .slice(0, limit);
}
```

- [ ] **Step 4: Run tests and commit the data foundation**

Run: `npm test`

Expected: 4 tests pass.

Commit:

```bash
git add js/core/data.js js/core/search.js tests/data.test.js tests/search.test.js
git commit -m "feat: add resilient wiki data foundation"
```

---

### Task 3: Semantic application shell and RuneZero design system

**Files:**
- Replace: `index.html`
- Create: `css/tokens.css`
- Create: `css/base.css`
- Create: `css/components.css`
- Create: `css/responsive.css`
- Create: `js/app.js`
- Create: `js/ui/navigation.js`
- Create: `tests/shell.test.js`

**Interfaces:**
- Consumes: route objects from `parseRoute`, loaded wiki datasets, and renderer functions registered by view name.
- Produces: the persistent header, desktop navigation, mobile drawer, global search, main content mount, and accessible status region.

- [ ] **Step 1: Add a failing static-shell contract**

Create `tests/shell.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('document exposes semantic navigation, main content, status, and module entry', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /<header[^>]*class="site-header"/);
  assert.match(html, /<nav[^>]*aria-label="Primary"/);
  assert.match(html, /<main[^>]*id="app"/);
  assert.match(html, /role="status"/);
  assert.match(html, /<script type="module" src="js\/app\.js"><\/script>/);
});

test('document no longer embeds the legacy application script or stylesheet', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /<style>/);
  assert.doesNotMatch(html, /function renderHome\(/);
});
```

- [ ] **Step 2: Run tests and confirm the legacy document fails the new contract**

Run: `npm test`

Expected: `tests/shell.test.js` fails because the old page embeds its CSS and JavaScript.

- [ ] **Step 3: Replace the shell and establish the design tokens**

Replace `index.html` with a semantic document containing this exact shell structure:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Discover RuneZero, a thoughtful low-rate Ragnarok Online adventure, and explore its complete player wiki.">
  <title>RuneZero — A classic adventure, thoughtfully reimagined</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Marcellus&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/responsive.css">
</head>
<body>
  <a class="skip-link" href="#app">Skip to content</a>
  <header class="site-header" data-site-header>
    <a class="brand" href="#home" aria-label="RuneZero home"><span class="brand-mark" aria-hidden="true">RZ</span><span>RuneZero</span></a>
    <nav class="primary-nav" aria-label="Primary" data-primary-nav></nav>
    <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-nav" data-menu-button><span class="sr-only">Open navigation</span></button>
  </header>
  <div class="mobile-drawer" id="mobile-nav" hidden data-mobile-drawer></div>
  <main id="app" tabindex="-1"></main>
  <div class="site-status" role="status" aria-live="polite" data-site-status>Loading RuneZero…</div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

Create `css/tokens.css` with the approved palette and scale:

```css
:root {
  color-scheme: light;
  --sky-50: #eef8ff; --sky-100: #d9efff; --sky-500: #3299dc; --sky-700: #176ca8;
  --leaf-50: #eff8e9; --leaf-500: #5f9f46; --leaf-700: #39702d;
  --sun-100: #fff2bf; --sun-500: #e5ad32; --coral-500: #dd6654;
  --ivory: #fffdf5; --paper: #ffffff; --navy-950: #14253a; --navy-700: #344c63;
  --line: #dce6ea; --shadow: 0 18px 55px rgb(31 68 94 / 12%);
  --font-display: 'Marcellus', Georgia, serif; --font-body: 'DM Sans', system-ui, sans-serif;
  --content: 1200px; --reading: 74ch; --radius-sm: .75rem; --radius-lg: 1.75rem;
}
```

Build `base.css`, `components.css`, and `responsive.css` around these exact constraints: 16 px body copy, 1.65 line height, 44 px controls, strong `:focus-visible`, fluid display typography, a maximum 74ch reading width, no horizontal page overflow, a 960 px desktop-navigation breakpoint, and a reduced-motion media query that removes transition and animation duration.

- [ ] **Step 4: Implement accessible navigation and app bootstrapping**

Create `js/ui/navigation.js` exporting `createNavigation({ onNavigate })`, `openDrawer()`, and `closeDrawer({ restoreFocus })`. Use actual `<a href="#view">` links, synchronize `aria-expanded`, close on Escape and link activation, lock document scrolling only while open, and restore focus to the menu button.

Create `js/app.js` to load data with `loadWikiData`, parse the initial hash, render the matching registered page into `#app`, update `[data-site-status]`, and rerender on `hashchange`. If core loading fails, render a heading, a brief player-facing explanation, and a Retry button that calls the same bootstrap function.

- [ ] **Step 5: Run checks and commit the shell**

Run: `npm test && npm run build`

Expected: all tests pass and the existing database builder completes without errors.

Commit:

```bash
git add index.html css js/app.js js/ui/navigation.js tests/shell.test.js
git commit -m "feat: introduce RuneZero wiki design system"
```

---

### Task 4: Original hero artwork and discovery-led homepage

**Files:**
- Create: `assets/brand/runezero-hero.webp`
- Create: `assets/brand/runezero-hero-mobile.webp`
- Create: `assets/brand/runezero-mark.svg`
- Create: `js/render/home.js`
- Create: `tests/home.test.js`
- Modify: `css/components.css`
- Modify: `css/responsive.css`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `meta`, `classes`, and verified repository content plus `navigate(view)`.
- Produces: `renderHome({ data, navigate }): HTMLElement` and responsive brand assets.

- [ ] **Step 1: Write the failing homepage content contract**

Create `tests/home.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('homepage module contains the approved journey and no unsupported play link', () => {
  const source = fs.readFileSync('js/render/home.js', 'utf8');
  assert.match(source, /A classic adventure, thoughtfully reimagined/);
  assert.match(source, /The RuneZero promise/);
  assert.match(source, /Signature experiences/);
  assert.match(source, /Your first adventure/);
  assert.match(source, /Explore the archives/);
  assert.doesNotMatch(source, /href=["']#["'][^>]*>Play Now/);
});
```

- [ ] **Step 2: Run tests and observe the missing homepage module**

Run: `npm test`

Expected: homepage test fails because `js/render/home.js` is absent.

- [ ] **Step 3: Generate and validate the original hero**

Use the built-in image-generation tool with one landscape request. The prompt must specify an original bright classic-fantasy MMORPG scene: three distinct adventurers seen from behind on a grassy overlook, a luminous distant fantasy city, blue sky, soft clouds, warm morning light, optimistic party-adventure mood, high-detail painterly illustration, wide 16:9 composition, and uncluttered copy-safe sky on the left. It must explicitly exclude text, logos, watermarks, recognizable copyrighted characters, official Ragnarok costumes, and copied promotional compositions.

Inspect the returned asset at original detail. Reject it if it contains malformed anatomy, unintended text, trademark-like emblems, insufficient copy space, or unusable cropping. Copy the accepted image into `assets/brand/runezero-hero.webp`, create an intentional portrait/mobile crop at `assets/brand/runezero-hero-mobile.webp`, and retain enough resolution for high-density displays while optimizing file size.

Create `assets/brand/runezero-mark.svg` as an original accessible rune/sun emblem made from simple circles and four tapered rays. It must contain no borrowed game insignia and must use `currentColor` so it can adapt to navigation and fallback contexts.

- [ ] **Step 4: Implement the full homepage sequence**

Create `js/render/home.js` with DOM helpers rather than unescaped string interpolation. The renderer must produce, in order:

1. A hero with the original mark, approved headline, verified low-rate description, Discover RuneZero anchor, and Explore the Wiki action.
2. “The RuneZero promise” with meaningful progression, many viable builds, and quality-of-life without pay-to-win.
3. “Signature experiences” linking skill changes, fun builds, enchant stones/features, rare-drop beams, hunting, and instances.
4. “Your first adventure” using the verified Training Grounds, starter fun-mod weapon, Weapon Sage, Build Librarian, and `@allies` flow already present in the repository.
5. “Find your path” using six representative existing class sprites with links to Classes and Fun Builds.
6. “Explore the archives” with a large search control and destinations for items, monsters, classes, builds, instances, and features.
7. A final invitation containing only verified destinations; with the current repository state, it links back to wiki discovery and does not render registration, download, Discord, status, or Play Now controls.

Use counts from `data.meta` and escape every data-derived label before insertion. Wire the renderer into the `home` route in `js/app.js`.

- [ ] **Step 5: Style the homepage and verify it**

In `css/components.css`, add isolated styles for `.home-hero`, `.promise`, `.feature-story`, `.journey`, `.class-paths`, and `.archive-search`. Use `picture` with mobile and desktop sources, a readable overlay scrim, substantial section spacing, and no more than three equal columns at desktop widths. In `css/responsive.css`, stack editorial sections, preserve readable source order, and use the mobile hero crop below 640 px.

Run: `npm test && npm run build`

Expected: all tests pass, data generation succeeds, and both hero files exist in `assets/brand/`.

Commit:

```bash
git add assets/brand js/render/home.js js/app.js css tests/home.test.js
git commit -m "feat: create RuneZero adventure homepage"
```

---

### Task 5: Wiki sections, database views, and entity detail migration

**Files:**
- Create: `js/render/database.js`
- Create: `js/render/entities.js`
- Create: `js/render/guides.js`
- Create: `js/render/classes.js`
- Create: `js/render/instances.js`
- Create: `js/ui/search.js`
- Create: `js/ui/entity-list.js`
- Create: `tests/entities.test.js`
- Create: `tests/legacy-content.test.js`
- Modify: `js/app.js`
- Modify: `css/components.css`
- Modify: `css/responsive.css`

**Interfaces:**
- Consumes: the values returned by `loadWikiData`, a parsed route, and `navigate(route)`.
- Produces: `renderDatabaseView(context)`, `renderItem(item, context)`, `renderMonster(monster, context)`, `renderGuide(view, context)`, `renderClasses(context)`, `renderInstances(context)`, and `createGlobalSearch(context)`.

- [ ] **Step 1: Write failing entity and legacy-content tests**

Create `tests/entities.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('entity lookup tolerates numeric strings and missing ids', async () => {
  const { findEntity } = await import('../js/render/entities.js');
  const values = [{ id: 501, name: 'Red Potion' }];
  assert.equal(findEntity(values, '501').name, 'Red Potion');
  assert.equal(findEntity(values, 999), null);
});

test('text escaping protects data-derived entity labels', async () => {
  const { escapeHtml } = await import('../js/render/entities.js');
  assert.equal(escapeHtml('<img onerror=alert(1)>'), '&lt;img onerror=alert(1)&gt;');
});
```

Create `tests/legacy-content.test.js` to load `index.html` from the parent commit with `git show HEAD^:index.html`, extract all current view identifiers and player-facing sections, and assert that the new renderer registry covers `items`, `mobs`, `skills`, `enchants`, `builds`, `hunting`, `systems`, `balance`, `rates`, `customizations`, `classes`, and `instances`.

- [ ] **Step 2: Run tests and confirm the render modules are missing**

Run: `npm test`

Expected: entity and renderer-registry tests fail while Tasks 1–4 remain green.

- [ ] **Step 3: Migrate database and entity behavior without changing facts**

Move item, monster, skill-item, and enchant-pool listing behavior into `js/render/database.js`. Move item and monster detail behavior, effects parsing, drop cross-links, element matchup, rarity bars, stat bars, item art fallbacks, and damage estimates into `js/render/entities.js`. Export:

```js
export const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export const findEntity = (values, id) =>
  values.find(value => Number(value.id) === Number(id)) || null;
```

Preserve the existing item type, slot, source, and sort filters; monster element/race/size filtering; 300-row rendering limit; item-to-monster and monster-to-item links; skill booster tiers; enchant option chances; raw script disclosure; drop rarity visualization; and calculation semantics. Replace inline event handlers with delegated `data-action` attributes and registered listeners.

- [ ] **Step 4: Migrate editorial views into focused renderers**

Move Features, Rates, Customizations, Skill Changes, Hunting Log, and Fun Builds into `js/render/guides.js`; Classes into `js/render/classes.js`; and all six dungeon guides into `js/render/instances.js`. Preserve every current numeric value, NPC location, requirement, reward, and explanation. Reshape markup to the approved templates: editorial page header, summary, anchored sections, readable article width, clear walkthrough/reward separation, and related links.

Create `js/ui/entity-list.js` for sortable/filterable result lists and `js/ui/search.js` for a global combobox-style search. The search control must expose a label, maintain `aria-expanded` and `aria-activedescendant`, support Arrow Up/Down, Enter, and Escape, and navigate to the selected item or monster hash.

- [ ] **Step 5: Wire all routes and style the inner wiki**

Register every view in `js/app.js`. Unknown entity ids render a friendly not-found article with links back to Items or Monsters. Build `.wiki-layout`, `.context-nav`, `.article`, `.entity-browser`, `.entity-list`, `.entity-detail`, `.stat-group`, `.walkthrough`, `.reward-section`, and `.data-table-wrap` components in `css/components.css`. On desktop, use a contextual rail only for guide/database sections; on mobile, collapse it into a section menu. Allow local horizontal scrolling only inside table wrappers.

- [ ] **Step 6: Run regression checks and commit the wiki migration**

Run: `npm test && npm run build`

Expected: all tests pass; data builds successfully; every renderer is registered; existing entity and section hashes are accepted.

Commit:

```bash
git add js css tests
git commit -m "feat: rebuild RuneZero player wiki experience"
```

---

### Task 6: Accessibility, asset-path, and final production verification

**Files:**
- Create: `tests/accessibility-contract.test.js`
- Create: `tests/assets.test.js`
- Modify: `index.html`
- Modify: `css/base.css`
- Modify: `css/components.css`
- Modify: `css/responsive.css`
- Modify: `js/app.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: the completed static application and all generated/local assets.
- Produces: a verified GitHub Pages-ready site and updated contributor instructions.

- [ ] **Step 1: Add failing production-contract tests**

Create `tests/assets.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('critical local assets exist and repository paths remain relative', () => {
  for (const file of [
    'assets/brand/runezero-hero.webp',
    'assets/brand/runezero-hero-mobile.webp',
    'assets/brand/runezero-mark.svg'
  ]) assert.equal(fs.existsSync(file), true, `${file} must exist`);
  for (const file of ['index.html', ...fs.readdirSync('js', { recursive: true }).filter(name => name.endsWith('.js')).map(name => `js/${name}`)]) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /(?:src|href)=["']\/(?!\/)/, `${file} contains a root-absolute asset path`);
  }
});
```

Create `tests/accessibility-contract.test.js` to assert the skip link, main landmark, labeled primary navigation, live status, mobile drawer relationship, reduced-motion rule, visible `:focus-visible` rule, and absence of inline `onclick=` attributes.

- [ ] **Step 2: Run tests and observe any remaining contract failures**

Run: `npm test`

Expected: new tests identify any remaining root-absolute paths, inline handlers, or missing accessibility rules.

- [ ] **Step 3: Resolve every contract failure and update documentation**

Use repository-relative asset/data URLs. Ensure decorative hero art has empty alt text while the nearby text conveys its meaning. Verify drawer focus restoration, search keyboard handling, unknown routes, empty results, optional dataset warnings, and the core-data retry action.

Update `README.md` to describe the redesigned portal, ES module structure, `npm test`, local `npm start`, data refresh, and GitHub Pages deployment. State that registration/community links are intentionally absent until authoritative destinations are added.

- [ ] **Step 4: Run the complete verification suite**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: tests pass, the database build exits successfully, and `git diff --check` prints no errors.

Start the existing server with `npm start`, retain the process, and verify these URLs through the local site:

```text
http://localhost:8731/#home
http://localhost:8731/#items
http://localhost:8731/#item/501
http://localhost:8731/#mobs
http://localhost:8731/#mob/1002
http://localhost:8731/#instances
```

Confirm no uncaught browser error appears, search and navigation work, the hero uses the intended desktop/mobile source, and direct hashes render the correct view.

- [ ] **Step 5: Commit the verified redesign**

```bash
git add index.html css js assets/brand tests README.md package.json package-lock.json
git commit -m "feat: complete RuneZero wiki redesign"
```

Do not push or publish until the user has reviewed the completed local redesign.
