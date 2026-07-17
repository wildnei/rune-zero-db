# RuneZero Wiki Redesign

**Date:** July 17, 2026  
**Status:** Approved for implementation  
**Target:** `wildnei/rune-zero-db` on GitHub Pages

## Purpose

Rebuild the RuneZero website as a welcoming player wiki and server introduction rather than a dense database utility. The homepage must make players curious about RuneZero, explain why the server is different, and guide them into the wiki. Inner pages must remain fast and information-rich while becoming noticeably more spacious, readable, and navigable.

## Product principles

- Lead with the experience of RuneZero, then provide factual depth.
- Preserve all current server information and database behavior.
- Never invent server claims, rates, mechanics, links, or numeric values.
- Use progressive disclosure: summaries first, deeper detail when requested.
- Keep the project static and compatible with GitHub Pages.
- Treat desktop, mobile, keyboard use, reduced motion, and missing assets as first-class states.

## Visual direction

The visual identity is **modern classic Ragnarok**: bright skies, green fields, distant fantasy architecture, colorful adventurers, and an optimistic sense of discovery. The presentation is original to RuneZero and must not reproduce an official Ragnarok logo or copyrighted promotional composition.

The interface uses warm ivory surfaces, deep navy text, sky blue navigation, leaf green and sunrise gold accents, and restrained coral for important actions. Body copy uses a clean modern sans-serif at a minimum of 16 px. A characterful fantasy serif is limited to major display headings. Reading columns target approximately 70–78 characters per line.

The new RuneZero identity is created from scratch. It consists of a refined wordmark and a simple rune/sun emblem that can work in the hero, navigation, favicon, and image fallbacks. Interface icons use a consistent icon set or small original line icons; emoji are not used as primary interface chrome.

Spacing is generous. Sections have clear visual rhythm, cards are fewer and larger, headings are more distinctive, and explanatory content is not squeezed into database layouts. Motion is restrained to gentle hero depth, small entrance transitions, and refined hover/focus feedback. Reduced-motion preferences disable nonessential movement.

## Homepage

### Opening viewport

The homepage opens with a full-width original hero illustration of adventurers overlooking a bright RuneZero landscape and distant fantasy city. The composition reserves calm sky or atmospheric space for the RuneZero wordmark and copy. Responsive art direction provides an intentional mobile crop rather than shrinking the desktop composition.

The hero contains:

- An original RuneZero wordmark and rune/sun emblem.
- The headline: “A classic adventure, thoughtfully reimagined.”
- A concise server description grounded in current repository content.
- Primary action: **Discover RuneZero**.
- Secondary action: **Explore the Wiki**.
- A **Play Now** action only when a verified destination exists; otherwise the interface must not ship a dead or invented link.

### Page sequence

1. **The RuneZero promise** — three spacious editorial sections covering meaningful low-rate progression, viable class/build variety, and quality-of-life without pay-to-win mechanics.
2. **Signature experiences** — large feature panels for skill rebalancing, fun builds, enchant stones, rare-drop beams, hunting progression, and six endgame instances.
3. **Your first adventure** — a four-step onboarding path from creating a character through selecting a build and entering the wider world. Copy must use only verified server behavior.
4. **Find your path** — class/build discovery using existing server character sprites as supporting art, with links to class and build content.
5. **Explore the archives** — an oversized wiki search and clear destinations for items, monsters, classes, builds, instances, and systems.
6. **Final invitation** — a community/play panel with verified registration, download, Discord, and server-status destinations when those URLs are available. Missing destinations are omitted rather than represented by placeholders.

## Information architecture

The fixed, always-visible database sidebar is replaced by:

- A slim global header containing the RuneZero identity, major destinations, global search, and verified community/play actions.
- A contextual left navigation rail only for sections where it improves orientation, including Features, Classes, Guides, and database categories.
- A mobile navigation drawer with large touch targets, clear hierarchy, focus management, Escape handling, and background scroll locking.

Global search remains available throughout the site. Search results preserve fast access to items, monsters, skills, and enchant pools while also surfacing major wiki sections.

Current URL hashes for items, monsters, and section views remain functional or receive deterministic compatibility redirects. Existing shared links must not silently break.

## Page templates

### Feature and guide pages

Use a wide editorial header, concise summary, optional table of contents, comfortable reading column, visual support, semantic callouts, and related-guide links. Long pages provide clear section anchors.

### Items and monsters

Provide a searchable result list and a spacious entity detail experience. Group identity, primary stats, effects/mechanics, drops, locations, and related entities into separate labeled sections. Dense data remains tabular where tables are the clearest representation, but narrative explanations are not forced into table cells.

### Classes and builds

Use a visual class header followed by role, playstyle, progression guidance, changed skills, build routes, and linked equipment. Existing class sprites are decorative support and retain crisp pixel rendering.

### Instances

Use a strong dungeon header with requirements, entry location, encounter sequence, boss mechanics, rewards, and linked database entities. Separate walkthrough steps from reward information.

### Rates and server rules

Prefer simple comparison tables, definition lists, and plain-language explanations. Avoid grids of equal-weight cards when the information has a natural hierarchy.

## Technical architecture

The website remains a static application deployable at the GitHub Pages subpath `/rune-zero-db/`. The existing JSON data files and `tools/build-db.js` generation workflow remain authoritative.

The current monolithic `index.html` is separated into focused files:

- A small semantic HTML document that defines the application shell and essential metadata.
- A design-system stylesheet plus focused responsive/component styles where useful.
- JavaScript modules for state/routing, data loading, search/filtering, navigation, wiki page rendering, and entity rendering.
- Reusable render helpers or components with narrow responsibilities instead of one large collection of inline HTML strings.

The implementation remains dependency-light. A framework is not introduced unless the approved implementation plan demonstrates that it materially reduces complexity without compromising the existing static deployment and data workflow.

## Artwork and assets

Create one original landscape hero image specifically for RuneZero. The prompt must request a bright, optimistic classic fantasy MMORPG atmosphere, party-based adventure, distant city, and clear copy-safe space. It must not request an exact Ragnarok Online art style, official characters, official logo, or copied scene.

Inspect the generated image before use. Validate anatomy, composition, unintended text, trademark-like marks, mobile cropping, and contrast behind overlay copy. Save the accepted optimized asset inside the repository with responsive derivatives where necessary. Do not leave project-referenced artwork only in an external generation directory.

Use existing repository sprites for classes and NPCs when they support comprehension. Preserve pixelated rendering and intrinsic aspect ratio. Missing art receives a polished RuneZero rune/sun fallback with reserved dimensions to prevent layout shift.

## Loading and error states

- Reserve image dimensions to prevent cumulative layout shift.
- Show a branded loading state while core data files load.
- When one nonessential dataset fails, keep unaffected wiki areas usable and identify the unavailable section.
- When core data fails, show a friendly retry/recovery state without exposing local development commands to players.
- Protect renderers from missing optional fields and unknown route identifiers.
- Provide meaningful empty-search and no-filter-results states.

## Accessibility and responsive behavior

- Use semantic landmarks, headings, buttons, links, tables, and labels.
- Maintain visible keyboard focus and logical tab order.
- Meet WCAG AA contrast for body text, controls, and essential states.
- Provide meaningful alt text for informative artwork; mark decorative art appropriately.
- Support keyboard navigation for menus, drawers, search results, and dialogs/panels.
- Honor `prefers-reduced-motion`.
- Test narrow mobile, large mobile, tablet, laptop, and wide desktop layouts.
- Keep primary touch targets at least 44 px where practical.
- Ensure tables and long identifiers do not force viewport-wide horizontal overflow.

## Content rules

- Preserve all existing factual content and database values.
- Rewrite headings, summaries, and navigation labels for clarity when the underlying meaning is unchanged.
- Use player-facing language and remove development-oriented instructions from production error states.
- Derive counts and build dates from current metadata.
- Omit unverified registration, download, Discord, status, or account links until they are supplied or found in authoritative project context.

## Verification

Automated checks must cover routing and legacy hashes, search and filtering, key render helpers, missing-data fallbacks, and safe URL/path behavior under `/rune-zero-db/`. Existing database-generation behavior must continue to work.

Final verification includes:

- Data build completes successfully.
- Production/static site validation succeeds without console-breaking errors.
- Direct loading of the homepage, wiki sections, item routes, and monster routes succeeds.
- Search, filters, entity cross-links, comparison/calculator interactions, and navigation work.
- Hero and sprite assets load from the GitHub Pages subpath.
- Keyboard, focus, reduced motion, responsive layouts, contrast, and long-content behavior are checked.
- No dead placeholder action, invented claim, or unverified server URL ships.

## Out of scope

- Server-side accounts, authentication, forums, or live server status infrastructure.
- Changing rAthena database generation or server mechanics unrelated to presentation.
- Inventing new game systems, rates, rewards, or community destinations.
- Copying official Ragnarok Online branding, promotional artwork, or proprietary site designs.

## Success criteria

The redesign succeeds when a new visitor can understand RuneZero’s identity and major differentiators from the homepage, choose a relevant learning path without confronting a wall of cards, and reach accurate wiki detail quickly. Existing players must retain the search, database depth, and direct links they rely on. The finished interface must feel recognizably RuneZero, remain fast on GitHub Pages, and be notably more spacious and readable on both desktop and mobile.
