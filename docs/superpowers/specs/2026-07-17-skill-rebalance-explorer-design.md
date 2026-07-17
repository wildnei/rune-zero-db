# RuneZero Skill Rebalance Explorer

**Date:** July 17, 2026  
**Status:** Design approved; written specification pending review  
**Target:** `wildnei/rune-zero-db` on GitHub Pages

## Purpose

Make RuneZero's deliberate skill-balancing work easy for players to discover. Players must be able to begin with their class or search for a skill directly, then understand which equipment supports that skill and by how much.

The same work also fixes the database navigation defect that currently discards the selected source, filters, sorting, and result context when a player opens an item.

## Product language

“Fun Mod,” “fun-mod,” and “Fun Builds” are removed from every player-facing surface. They undersell an intentional balance system and make the affected equipment sound experimental.

Use these public terms consistently:

- **Skill Rebalance** for the overall RuneZero system.
- **Rebalanced Builds** for the guide and navigation destination.
- **Rebalanced Gear** for the item database source filter.
- **Skill Rebalance** for the small badge on affected item details.
- **Explore Rebalanced Builds** or **Find Skill Gear** for calls to action.

Existing internal fields and build-pipeline identifiers such as `funmod`, `FUNMOD_RE`, and source filenames may remain during this feature. They are implementation details, are already embedded in generated data and tooling, and do not appear to players. Renaming those internals is a separate data-migration task and is not required to deliver the public terminology change safely.

## Chosen experience

Create one dedicated **Rebalanced Builds** explorer that treats class browsing and direct skill search as equal entry points. This is preferred over adding more controls only to the dense item archive or maintaining a separate editorial page for every class.

The page introduces the system in plain language: RuneZero uses carefully rebalanced equipment to make overlooked skills and alternative character fantasies viable without erasing classic progression.

### Entry points

The opening section contains:

- A concise explanation of the Skill Rebalance system.
- A class selector using readable class-family names.
- A prominent search field accepting human-readable skill names, internal skill IDs, and item names.
- A visible result summary that explains the active class, query, and number of matching skills/items.

Neither path is subordinate. Selecting a class immediately reveals its supported skills; typing a query searches across the complete explorer.

### Class-first discovery

Class choices represent player-recognizable progression families rather than raw script prefixes. A class family includes its relevant first, second, and transcendent skill prefixes. Expanded classes are presented in their own clearly labeled group.

The initial mapping is derived from the skill IDs present in `data/skills.json` and the skill boosts found on items. It must cover the playable pre-renewal families represented by the current dataset, including shared Bard/Dancer and expanded-class skills. Pure third-class or otherwise unsupported future skills are not promoted in the default Episode 13 experience.

After choosing a class, players see:

- Supported skills for that family, ordered alphabetically by display name.
- The number of matching items per skill.
- Direct selection of a skill without leaving the page.
- A clear way to reset the class and return to all supported skills.

The class association comes primarily from the skill prefix, not the item's broad `jobs` restriction. Item job restrictions remain visible as equipment facts but cannot be trusted as the sole source for skill ownership.

### Skill and item search

Search is case-insensitive and matches:

- Human skill names, such as “Bowling Bash.”
- Internal IDs, such as `KN_BOWLINGBASH`.
- Item names that provide skill support.

When a class is selected, search narrows that class's results. With no class selected, search spans the full supported dataset. An empty query does not hide the class-first experience.

### Results

Results are grouped by skill. Each skill group shows its display name, internal ID as secondary technical information, and the number of matching items. Its item cards show:

- Item name and slot count where relevant.
- Equipment category, subtype, or location when available.
- The exact skill-damage increase parsed from the authoritative generated build/item data.
- Public badges such as **Skill Rebalance** and **RuneZero**, without “Fun Mod.”
- A link to the existing item detail route.

All skill-enhancing items are included by default, not only items carrying the legacy `funmod` flag. Players can narrow results by useful equipment categories such as weapon, armor, card/enchant, or other RuneZero gear. A **Rebalanced Gear only** control may use the legacy flag internally, but its label and explanation use the approved public terminology.

No result invents a percentage. If an item is known to support a skill but a numeric amplifier cannot be extracted reliably, the interface states that it supports the skill and defers to the authoritative item script/detail rather than displaying a guessed value.

## Database and navigation-state repair

The current defect occurs because filter controls are recreated with their default values after every hash-route render. Opening `#item/<id>` therefore destroys the player's previous archive or build context.

Store database view state independently of the transient DOM. The item view preserves:

- Search query.
- Source selection.
- Item type, weapon subtype, and armor-slot filters.
- Sort field and direction.
- Selected class and skill when navigation began in Rebalanced Builds.
- Result scroll position when practical.

Session-scoped browser storage is preferred because it survives hash navigation and page refreshes without producing long, fragile URLs. Access must be guarded so the site still works when storage is unavailable or contains malformed/obsolete data. Unknown saved values fall back safely to supported defaults.

When an item is opened from the explorer, its detail page receives contextual navigation such as **Back to Knight → Bowling Bash gear**. When it is opened from the item archive, the return action restores the exact archive filters and sort. Browser Back must also restore the rendered controls and result set instead of silently returning to the standard database state.

Monster database state may use the same small persistence abstraction for consistency, but this feature must not introduce unrelated monster-filter behavior.

## Integration with the redesigned wiki

Update all visible legacy language in the current site, including:

- Homepage quick actions, feature labels, promise copy, and onboarding copy.
- Primary navigation and guide headings.
- Database source-filter options.
- Item-detail badges and Skill Rebalance explanations.
- Empty states, summaries, and calls to action.

Historical design documents, test names, source comments, generated JSON keys, and server filenames are not public UI and need not be mechanically renamed in this feature.

The existing `#builds` route remains valid and becomes the Rebalanced Builds explorer so bookmarks do not break. Existing `#skills`, `#items`, and `#item/<id>` links remain valid.

## Data and architecture

Keep the site static and dependency-light. The implementation should introduce small pure helpers for:

- Mapping skill prefixes to class families.
- Building a normalized skill-to-items index from `items` and `skills`.
- Extracting authoritative amplifier values from existing item/build data.
- Filtering the normalized index by class, query, and equipment category.
- Serializing, validating, and restoring database/explorer state.

Rendering consumes the normalized index instead of repeatedly scanning and interpreting scripts in event handlers. The underlying generated JSON files remain authoritative.

Unknown skill prefixes are not silently discarded. They appear in a safe **Other** group during development/validation so data drift can be detected, while third-class entries marked by existing metadata remain excluded from the default player view.

## Responsive and accessible behavior

- Class choices and filters use semantic buttons, labels, or form controls with visible keyboard focus.
- Search has an explicit label and a clear/reset action.
- Active class, active skill, and filter state are conveyed by text and accessible state, not color alone.
- Result counts update in an appropriate live region without announcing every keystroke excessively.
- Skill groups use a valid heading hierarchy and item links have descriptive accessible names.
- Mobile presents class choices and filters without horizontal page overflow; large result sets remain readable rather than compressed into dense rows.
- Empty states explain whether no skill support exists or whether active filters removed all matches, and offer a direct reset.
- Reduced-motion preferences continue to be respected.

## Verification

Automated tests must be written before implementation changes and cover:

- Class-family mapping for representative first, second, transcendent, shared, and expanded skills.
- Search by human skill name, internal skill ID, and item name.
- Inclusion of all skill-enhancing items by default.
- Rebalanced Gear filtering through the legacy data flag without exposing legacy wording.
- Exact amplifier extraction where authoritative data supplies it and safe fallback where it does not.
- Persistence and validation of archive/explorer state.
- Restoring filters and context after navigating to and from an item.
- Absence of “Fun Mod,” “fun-mod,” and “Fun Builds” in rendered player-facing content.
- Legacy routes and item links remaining functional.

Final verification includes the complete existing test suite, database validation/build checks, syntax checks, responsive visual inspection, keyboard navigation, direct hash loading, browser Back behavior, and a repository-wide audit that distinguishes public copy from permitted internal legacy identifiers.

## Out of scope

- Changing actual server balance values or item scripts.
- Renaming rAthena source files, generated JSON keys, or build-pipeline constants.
- Creating complete editorial build guides, stat allocations, leveling plans, or player-submitted builds for every class.
- Introducing accounts, favorites, saved cloud builds, or server-side search.
- Promoting third-class content that is outside the current Episode 13 player experience.

## Acceptance criteria

The feature is complete when:

1. No player-facing page uses “Fun Mod,” “fun-mod,” or “Fun Builds.”
2. A player can choose a class and reach all supported skills and equipment for that class.
3. A player can find the same information by directly searching a skill or item.
4. Every displayed percentage comes from authoritative project data.
5. Opening an item and returning preserves the player's class, skill, filters, sorting, and result context.
6. Existing shared hashes continue to load correctly on GitHub Pages.
7. The explorer remains clear and usable on mobile, with keyboard navigation, accessible states, and useful empty/error behavior.
