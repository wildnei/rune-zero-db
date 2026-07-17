# RuneZero player wiki

RuneZero’s public server introduction, player guides, item database, and monster bestiary. The site is a dependency-light static application designed for GitHub Pages.

## Local preview

```bash
npm install
npm start
```

Open <http://localhost:8731>. `npm start` validates the committed JSON datasets before serving the site; it does not regenerate them.

## Checks

```bash
npm test
npm run validate:data
```

The test suite covers legacy routes, data loading, search and filtering, entity safety, page coverage, local module serving, accessibility contracts, and GitHub Pages-safe asset paths.

## Project structure

- `index.html` — semantic application shell and metadata.
- `css/` — design tokens, base rules, components, and responsive behavior.
- `js/core/` — routing, resilient data loading, and search.
- `js/render/` — homepage, database, entity, guide, class, and instance renderers.
- `js/ui/` — navigation and global keyboard search.
- `assets/brand/` — original RuneZero hero artwork and rune/sun mark.
- `assets/classes/`, `assets/npcs/` — in-game sprite references used by guides.
- `data/` — committed player-facing datasets.
- `tools/build-db.js` — full extractor for the parent RuneZero server workspace.
- `tools/validate-data.js` — safe standalone validation for this repository.

## Database refresh

The full data builder expects this website to be located as `wiki/` inside the larger RuneZero server workspace, alongside `server/rathena/` and `custom/db-import/`. Run it only in that environment:

```bash
npm run build
```

In the standalone website repository, use `npm run validate:data`. This prevents absent server sources from replacing the committed data with empty output.

## Deployment

GitHub Pages serves the repository as a static site. All application and asset URLs are relative so they work beneath `/rune-zero-db/`. Registration, download, Discord, status, and Play Now actions are intentionally omitted until authoritative destinations are added.
