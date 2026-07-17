import { escapeHtml, estimateDamage } from './entities.mjs';

const staticGuides = {
  systems: {
    eyebrow: 'What makes RuneZero different', title: 'Features built around the journey',
    intro: 'Modern conveniences, richer build choices, and long-term goals—without turning a low-rate world into a shortcut.',
    sections: [
      ['Progression', 'Low-rate identity', 'Fixed 5× Base and Job EXP with 3× ordinary drops keeps each find meaningful. Cards remain a hard 1×, always.'],
      ['Buildcraft', 'Enchant Stones', 'Nine leveled enchant families let you shape equipment with a no-fail cost ladder. Stones can be removed for zeny and traded normally.'],
      ['Visibility', 'Rare-drop beams', 'Notable equipment and cards cast a colored pillar on the ground. It changes visibility—not probability.'],
      ['Refining', 'Safe refinement', 'Protected refine options let players plan progression without erasing the value of materials and zeny.'],
      ['Convenience', 'Quality-of-life for everyone', 'Account storage, stylist access, offline vending, practical commands, and clear onboarding reduce friction without inflating rewards.'],
      ['Long-term', 'Hunting milestones', 'Permanent monster, MVP, region, and dedication goals award stats and wearable titles over a character’s full career.'],
      ['Crafting', 'Enchant Stone lifecycle', 'Salvage custom gear into shards, have the Rune Artisan cut runes and four stone tiers, then use the Stone Enchanter to set or level a family. Levels 4–5 consume Old Glast Heim and Ghost Palace materials. Switching families resets that slot to level 1; extraction returns a tradeable stone for a level-scaled zeny fee.'],
      ['Professions', 'Mining, Herbalism & Fishing', 'Each gathering trade levels from 1–100 per character. Mining smelts ores, Herbalism brews potions, and Fishing cooks +3/+5 stat foods. Use @prof for nodes, recipes, and progress; mastering a trade earns a permanent stat and wearable Hall of Titles title.'],
      ['Loot', 'Random options on equipment drops', 'Dropped weapons, armor, shields, garments, shoes, accessories, and headgear roll slot-specific RO Zero options. A second beam reports option count: three green, four purple, five gold.'],
      ['Economy', 'Valor & Hunter Coins', 'Valor Coin is the universal play-earned crafting currency and drops from almost every monster. Hunter Coin comes from Hunter’s Guild contracts. Refining, forging, entries, and signature gear use these currencies.'],
      ['Bounties', 'Monster Hunter weapons', 'Personal marked-target boards unlock signature pieces such as Lord Knight’s Warbreaker, Falcon’s Wing, and Vulcan’s Fanfare that cannot be obtained elsewhere.'],
      ['Growing gear', 'Memorial progression', 'The five-piece Memorial set grows at +3/+6/+9, supports non-destructive option enchanting, and uses level-gated Normal/Hard materials from Orc’s Memory and Nidhoggur’s Nest.'],
      ['Hub', 'Eden HQ services', 'Register for the Eden badge, collect bounty missions, and reach forge, refine, enchant, instance, Monster Hunter, stylist, storage, and other services from one map. Use @go eden.'],
      ['Forging', 'Five properties and an element', 'Forge any weapon with five random properties and a chosen element. Success is approximately 70%; failure consumes the mostly-ore, low-coin material cost.'],
      ['Eden', 'Per-class growing weapons', 'Every class can buy an account-bound Eden weapon with the badge. It arrives with five options, grows at +3/+6/+9, and can reroll its options.'],
      ['Routine', 'Daily and weekly loops', 'Three rotating Daily Tasks reset at server midnight with a day-seven login-streak jackpot. Weekly Hunt rotates a featured MVP, cross-player leaderboard, and tiered rewards.'],
      ['Boutique', 'Pay-to-fast, never pay-to-win', 'The RuneZero Boutique rotates zero-stat cosmetics and convenience. Cash Point or play-earned coin bundles may accelerate EXP or common drops, but never sell stats, cards, MVP loot, or card-rate boosts.'],
      ['Zeny sink', 'Fortune Vault', 'Pull once for 25,000z or ten times for 250,000z. Rewards range from an Old Blue Box to a 0.1% announced costume; a hidden pity counter guarantees a common costume by the 100th miss. No cards or MVP loot appear.'],
      ['World', 'Champion, Lucky & Frenzy monsters', 'About 1.5% of normal kills can create aura-lit special monsters. Champions are roughly 3× threats with top-roll loot, Frenzy variants burst EXP, and Lucky variants are loot piñatas. One to three affixes add modest Valor and EXP.'],
      ['Companions', 'Adventurer Allies', 'Per-class Bond levels 1–10 grow from kills, improve ally buffs, and award Loyal, Devoted, and Sworn titles at levels 4/7/10. A dead ally can be resummoned within five minutes for half price.'],
      ['Competition', 'MVP speedrun boards', 'Normal, Hard, and Nightmare each keep an all-time top five. Only a genuine personal best can earn a leaderboard position; view it through @mvprank.'],
      ['Events', 'A world that moves', 'Find the Mushroom, Speed Quiz, Fever Field, and Disguise rotate through the Event Herald. Fever Field opens a 25-minute hot zone with a guaranteed +3 Valor Coin per kill.'],
      ['Fishing', 'Streaks & Golden Fish', 'Five catches without changing maps or idling for two minutes unlock a bonus-yield roll. Golden Fish have a 2% base chance and 4% at a streak of 10+; trade five to the Profession Master for Valor Coins and Fishing XP.'],
      ['Commands', 'Player tools', '@go and @go eden handle travel; @storage opens account storage; @autotrade keeps a Merchant shop online; @autopot manages consumables; @allies recruits companions; @prof opens profession progress; and @mvprank shows MVP and speedrun boards.'],
    ],
  },
  rates: {
    eyebrow: 'Live server configuration', title: 'Rates & fair play',
    intro: 'The numbers are intentionally simple: 5/5/3, forever. Convenience may move faster; rare power never becomes a purchase.',
  },
  customizations: {
    eyebrow: 'Episode 13 · Transcendent second jobs', title: 'A broader classic meta',
    intro: 'RuneZero changes usability and build potential while protecting the low-rate chase that makes classic Ragnarok memorable.',
  },
};

const rateGroups = [
  ['Experience', [['Base EXP', '5×'], ['Job EXP', '5×'], ['MVP EXP', '5×'], ['Quest EXP', '1×']]],
  ['Drop rates', [['Common drops', '3×'], ['Consumables', '3×'], ['Equipment', '3×'], ['MVP-exclusive loot', '3×'], ['Cards', '1× · always'], ['Treasure boxes', '1×']]],
  ['Death & party', [['Death penalty', '3% · VIP 0%'], ['Party share range', '15 levels'], ['Even-share bonus', '+40% per extra member'], ['Multi-level kills', 'Off']]],
  ['Combat & economy', [['Max ASPD', '190'], ['NPC sell prices', '50%'], ['Sitting recovery', '+3% HP/SP per sec'], ['Town warp', '500z'], ['Field warp', '1,000z'], ['Return to last warp', '300z'], ['Repair', '5,000z']]],
];

export function renderGuide({ view, data, route = {} }) {
  if (view === 'rates') return renderRates();
  if (view === 'balance') return renderBalance(data.skillchanges || []);
  if (view === 'builds') return renderBuilds(data.builds || {});
  if (view === 'hunting') return renderHunting(data.hunting || {});
  if (view === 'skills') return renderSkillItems(data.items || []);
  if (view === 'enchants') return renderEnchants(data.options || {}, route.entity === 'group' ? route.id : null);
  if (view === 'customizations') return renderCustomizations(data.meta || {});
  return renderStaticGuide(staticGuides[view] || staticGuides.systems);
}

function pageHeader(guide) {
  return `<header class="wiki-masthead editorial-masthead"><div class="container"><p class="eyebrow">${escapeHtml(guide.eyebrow)}</p><h1>${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.intro)}</p></div></header>`;
}

function renderStaticGuide(guide) {
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader(guide)}<div class="container editorial-grid">${guide.sections.map(([label, title, body], index) => `<article class="editorial-feature"><span>${String(index + 1).padStart(2, '0')}</span><div><p class="eyebrow">${escapeHtml(label)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></div></article>`).join('')}</div>`;
  return page;
}

function renderRates() {
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader(staticGuides.rates)}<div class="container article-stack">${rateGroups.map(([title, cells]) => `<section class="article-section"><h2>${title}</h2><div class="rate-grid">${cells.map(([label, value]) => `<div class="rate-card${label === 'Cards' ? ' is-guardrail' : ''}"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div></section>`).join('')}
  <section class="article-section vip-split"><div><p class="eyebrow">VIP gives</p><h2>Speed and comfort</h2><ul><li>+15% Base and Job EXP</li><li>0% death penalty</li><li>300 extra storage slots</li><li>Gemstone-free skill casting</li><li>10% common-drop-only bonus</li><li>Waived warp and repair tolls</li></ul></div><div><p class="eyebrow">VIP never gives</p><h2>Rare power</h2><ul><li>No stats, ATK, or MATK</li><li>No card or MVP-loot boost</li><li>No forge success boost</li><li>No paywalled best-in-slot gear</li><li>No easier or exclusive MVP access</li></ul></div></section></div>`;
  return page;
}

function renderCustomizations(meta) {
  const cards = [
    ['Skills rebalanced', '119', 'Usability and damage passes open more viable class fantasies.'],
    ['Custom items', Number(meta.customItems || 0).toLocaleString(), 'New and rescued gear supports Episode 13 progression.'],
    ['Fun-mod items', Number(meta.funmodItems || 0).toLocaleString(), 'Classic items gain off-meta skill amplifiers.'],
    ['Set combinations', Number(meta.comboSets || 0).toLocaleString(), 'Paired pieces create intentional build packages.'],
  ];
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader(staticGuides.customizations)}<div class="container article-stack"><div class="metric-grid">${cards.map(([label, value, body]) => `<article><strong>${value}</strong><h2>${label}</h2><p>${body}</p></article>`).join('')}</div>
  <section class="article-section"><p class="eyebrow">Balance philosophy</p><h2>More routes, worthy enemies</h2><p>52 overlooked skills were made cheaper or more usable and 15 received meaningful damage; 26 MVPs were strengthened to roughly 2.5–3× HP so the broader build ceiling still has opponents worth mastering. Eighteen usability-only changes include party-wide Impositio Manus and Suffragium, reliable Sage endows, a 5×5 Bowling Bash, and compatible Kyrie Eleison and Assumptio.</p></section>
  <section class="article-section"><p class="eyebrow">Design guardrails</p><h2>Rules the customization never breaks</h2><div class="rule-list"><article><h3>Asura Strike caps at +50% per item</h3><p>No single fun-mod piece pushes it beyond that special-case ceiling.</p></article><article><h3>Transcendent skills earn larger amplifiers</h3><p>Deeper class investment receives stronger item support than comparable early-class skills.</p></article><article><h3>Customization never means rate inflation</h3><p>Damage and usability may change. Card rates never do.</p></article><article><h3>Every supported skill has card coverage</h3><p>95 fun-mod cards prevent an off-meta route from depending on one exact base item.</p></article></div></section></div>`;
  return page;
}

function renderBalance(changes) {
  const byClass = Map.groupBy ? Map.groupBy(changes, change => change.class) : changes.reduce((map, change) => map.set(change.class, [...(map.get(change.class) || []), change]), new Map());
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader({ eyebrow: 'Before → after', title: 'Skill changes', intro: `${changes.length} targeted changes make overlooked skills more usable, affordable, or powerful.` })}<div class="container class-change-list">${[...byClass].map(([name, rows]) => `<details class="change-group"><summary><strong>${escapeHtml(name)}</strong><span>${rows.length} changes</span></summary><div>${rows.map(row => `<article><h3>${escapeHtml(row.skill)}</h3><p>${escapeHtml(row.build || '')}</p><div class="change-chips">${(row.usability || []).map(change => `<span><small>${escapeHtml(change.field)}</small><s>${escapeHtml(change.before)}</s><b>${escapeHtml(change.after)}</b></span>`).join('')}${row.damage ? `<span><small>Damage</small><s>${escapeHtml(row.damage.before)}</s><b>${escapeHtml(row.damage.after)}</b></span>` : ''}</div></article>`).join('')}</div></details>`).join('')}</div>`;
  return page;
}

function renderBuilds(buildData) {
  const groups = buildData.groups || [];
  const total = groups.reduce((sum, group) => sum + (group.builds || []).length, 0);
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader({ eyebrow: 'Off-meta, fully supported', title: 'Fun builds', intro: `${total} build fantasies turn familiar gear into a reason to play skills the classic meta left behind.` })}<div class="container build-groups">${groups.map(group => `<section><header><p class="eyebrow">Class family</p><h2>${escapeHtml(group.group)}</h2></header><div class="build-grid">${(group.builds || []).map(build => { const skillAmps = (build.items || []).flatMap(item => (item.amps || []).filter(amp => amp.kind === 'skill').map(amp => ({ ...amp, item: item.name, slots: item.slots }))); return `<article><h3>${escapeHtml(build.fantasy)}</h3><div class="build-variants">${(build.items || []).map(item => `<section><h4><a href="#item/${Number(item.id)}">${escapeHtml(item.name)}${item.slots ? ` [${Number(item.slots)}]` : ''}</a>${item.slotted ? '<small>Slotted counterpart</small>' : ''}</h4><div class="amp-list">${(item.amps || []).map(amp => `<span>${escapeHtml(amp.name)} <b>+${Number(amp.pct)}%</b></span>`).join('')}</div></section>`).join('')}</div>${skillAmps.length ? `<div class="build-estimator"><label>Current average hit <input type="number" min="0" step="1" value="1000" data-build-damage></label>${skillAmps.map(amp => { const estimate = estimateDamage(1000, amp.pct); return `<p><span>${escapeHtml(amp.name)} · ${escapeHtml(amp.item)}${amp.slots ? ` [${Number(amp.slots)}]` : ''}</span><b data-build-result data-percent="${Number(amp.pct)}">${estimate.before.toLocaleString()} → ${estimate.after.toLocaleString()}</b></p>`; }).join('')}</div>` : ''}</article>`; }).join('')}</div></section>`).join('')}</div>`;
  page.querySelectorAll('[data-build-damage]').forEach(input => input.addEventListener('input', () => {
    const card = input.closest('article');
    card.querySelectorAll('[data-build-result]').forEach(result => {
      const estimate = estimateDamage(input.value, result.dataset.percent);
      result.textContent = `${estimate.before.toLocaleString()} → ${estimate.after.toLocaleString()}`;
    });
  }));
  return page;
}

function renderHunting(hunting) {
  const quests = [...(hunting.monster || []), ...(hunting.region || []), ...(hunting.dedication || [])];
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader({ eyebrow: 'Permanent progression', title: 'Hunting log', intro: `${quests.length} long-term milestones award permanent stats and wearable titles earned across your whole career.` })}<div class="container milestone-grid">${quests.map(quest => `<article class="milestone${quest.mvp ? ' is-mvp' : ''}"><span>${quest.mvp ? 'MVP' : quest.targets?.some(target => target.map) ? 'Region' : 'Milestone'}</span><h2>${escapeHtml(quest.title)}</h2><ul>${(quest.targets || []).map(target => `<li>${target.mob ? `Defeat ${Number(target.count || 0).toLocaleString()} × ${escapeHtml(target.mob)}` : escapeHtml(target.mapName || target.map || 'Career-wide objective')}</li>`).join('')}</ul><strong>${escapeHtml(quest.reward)}</strong></article>`).join('')}</div>`;
  return page;
}

function renderSkillItems(items) {
  const boosted = items.filter(item => item.boosts?.length);
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader({ eyebrow: 'Buildcraft reference', title: 'Skill-boosting items', intro: `${boosted.length} items connect directly to a class skill. Use this index to begin a build from the skill you want to play.` })}<div class="container reference-grid">${boosted.slice(0, 400).map(item => `<a href="#item/${item.id}"><strong>${escapeHtml(item.name)}</strong><span>${item.boosts.map(boost => escapeHtml(boost.name || boost.skill)).join(' · ')}</span></a>`).join('')}</div>`;
  return page;
}

export function formatEnchantOption(option, types) {
  const type = types[option.name] || {};
  const min = option.min ?? option.value ?? '';
  const max = option.max ?? min;
  return {
    description: type.desc || option.name,
    value: min === '' ? '' : String(min === max ? min : `${min}–${max}`),
    chance: option.chance == null ? '' : `${(option.chance / 100).toFixed(2).replace(/\.00$/, '')}%`,
  };
}

function renderEnchants(options, selectedId = null) {
  const groups = options.groups || [];
  const types = options.types || {};
  const selected = groups.find(group => Number(group.id) === Number(selectedId));
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  const groupCard = (group, open = false) => `<details${open ? ' open' : ''}><summary><strong><a href="#group/${Number(group.id)}">${escapeHtml(group.name?.replaceAll('_', ' ') || `Group ${group.id}`)}</a></strong><span>${group.options?.length || 0} options · up to ${Number(group.maxRandom || 0)} random</span></summary><div>${['Guaranteed slot', 'Random extras'].map((label, fixed) => { const choices = (group.options || []).filter(option => Boolean(option.fixed) === (fixed === 0)); return choices.length ? `<h3>${label}</h3>${choices.map(option => { const formatted = formatEnchantOption(option, types); const description = formatted.description.replace('+N', formatted.value ? `+${formatted.value}` : '').replace('-N', formatted.value ? `-${formatted.value}` : ''); return `<p><strong>${escapeHtml(description)}</strong><span>${formatted.chance ? escapeHtml(formatted.chance) : ''}</span></p>`; }).join('')}` : ''; }).join('')}${String(group.name).startsWith('RZ_DROP_') ? '<p class="muted-copy">Auto-applied to dropped equipment. Option count controls the second floor beam: 3 green · 4 purple · 5 gold.</p>' : ''}</div></details>`;
  page.innerHTML = `${pageHeader({ eyebrow: 'Equipment possibilities', title: selected ? selected.name.replaceAll('_', ' ') : 'Enchants & random options', intro: selected ? `Group ${selected.id} · ${selected.options?.length || 0} possible bonuses · up to ${selected.maxRandom || 0} random extras.` : `${groups.length} option pools define the bonuses equipment can roll. Values and chances below come from the committed server data.` })}<div class="container enchant-grid">${selected ? `<p><a class="back-link" href="#enchants">← All option pools</a></p>${groupCard(selected, true)}` : groups.map(group => groupCard(group)).join('')}</div>`;
  return page;
}

export const GUIDE_VIEWS = new Set(['systems', 'rates', 'customizations', 'balance', 'builds', 'hunting', 'skills', 'enchants']);
