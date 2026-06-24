# Rune Zero — Game Database (website)

A searchable item & monster database for the live server: search any item, see its stats and
script effect, **what drops it** (cross-linked to the monster), and what each monster drops —
built straight from the server's own rAthena DBs, **including our custom items**.

## Run it locally
```bash
cd wiki
node tools/build-db.js     # parse the rAthena DBs -> data/*.json (re-run after DB changes)
node tools/serve.js        # serve at http://localhost:8731
```
Open <http://localhost:8731>. (It must be served over http — browsers block `fetch()` of local
files when you double-click the HTML. `npx serve` or `python -m http.server` also work.)

## Host it publicly
It's a static site — drop `index.html` + the `data/` folder on any static host (GitHub Pages,
Netlify, Cloudflare Pages, S3). No backend, no database server.

## How it's built
- `tools/build-db.js` — parses `server/rathena/db/re/item_db_*.yml` + `mob_db.yml` **and** our
  `custom/db-import/*.yml` (merged last, so overrides + custom items are included), then writes
  lean `data/items.json`, `data/mobs.json`, `data/meta.json`. It builds the **drop cross-reference
  both ways** (item ↔ monster). Uses the `yaml` package with `uniqueKeys:false` to tolerate
  rAthena's duplicate keys.
- `index.html` — a single self-contained page (search, filters, detail panel, item↔monster
  cross-links, a Systems wiki tab). Matches the Server Codex aesthetic.

## What it shows
- **Items:** id, aegis, type, slot, jobs, ATK/MATK/DEF, weight, refineable, the full script effect,
  a **"Dropped by"** list (click a monster to jump to it), and the **possible random options** this
  gear can roll on drop (links to its enchant pool). Custom items are tagged `RZ`.
- **Monsters:** level, HP, element/race/size, EXP, stats, **drops**, **MVP rewards**, and
  **spawn locations** (which maps + how many).
- **Enchants:** browse every **random-option pool** (132 groups) — our Zero-native drop groups and
  the F9 themed pools — each showing its options, value ranges, and chances. Filter to **Rune Zero**.
- **Systems:** a short wiki of Rune Zero's customizations (random options on drops, refine,
  currencies, variable rates), linking back to the full Server Codex.

## Deploy (pick one)
- **Netlify (easiest):** drag the whole `wiki/` folder onto <https://app.netlify.com/drop> → instant URL.
- **GitHub Pages:** push the `wiki/` contents to a repo, enable Pages on the branch/root.
- **Cloudflare Pages / S3 / any static host:** upload `index.html` + `data/` (+ `tools/` optional).
No backend needed. Re-run `node tools/build-db.js` and re-upload `data/` to refresh.

## Refresh the data
Re-run `node tools/build-db.js` whenever the server DBs or `custom/db-import/` change. Counts and
the build date show on the Systems tab.

## Roadmap (next iterations)
- [x] Enchant/random-option browser (our drop + F9 groups, with value ranges & chances)
- [x] Spawn locations (parsed from `npc/re/mobs/`)
- [ ] Skill-item reference (wire in the `SKILL_ITEMS_*` lists as a "skill boosters" view)
- [ ] Readable map names + `/navi`-style links
- [ ] Card → "completes set" and combo info
- [ ] Trim `items.json` (lazy-load scripts) if load time matters on mobile
