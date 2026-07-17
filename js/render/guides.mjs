import { escapeHtml } from './entities.mjs';

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
  ['Combat & economy', [['Max ASPD', '190'], ['NPC sell prices', '50%'], ['Sitting recovery', '+3% HP/SP per sec'], ['Town warp', '500z'], ['Field warp', '1,000z'], ['Repair', '5,000z']]],
];

export function renderGuide({ view, data }) {
  if (view === 'rates') return renderRates();
  if (view === 'balance') return renderBalance(data.skillchanges || []);
  if (view === 'builds') return renderBuilds(data.builds || {});
  if (view === 'hunting') return renderHunting(data.hunting || {});
  if (view === 'skills') return renderSkillItems(data.items || []);
  if (view === 'enchants') return renderEnchants(data.options || {});
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
  <section class="article-section"><p class="eyebrow">Design guardrails</p><h2>Rules the customization never breaks</h2><div class="rule-list"><article><h3>Asura Strike caps at +50% per item</h3><p>No single fun-mod piece pushes it beyond that special-case ceiling.</p></article><article><h3>Transcendent skills earn larger amplifiers</h3><p>Deeper class investment receives stronger item support than comparable early-class skills.</p></article><article><h3>Customization never means rate inflation</h3><p>Damage and usability may change. Card rates never do.</p></article></div></section></div>`;
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
  page.innerHTML = `${pageHeader({ eyebrow: 'Off-meta, fully supported', title: 'Fun builds', intro: `${total} build fantasies turn familiar gear into a reason to play skills the classic meta left behind.` })}<div class="container build-groups">${groups.map(group => `<section><header><p class="eyebrow">Class family</p><h2>${escapeHtml(group.group)}</h2></header><div class="build-grid">${(group.builds || []).map(build => `<article><h3>${escapeHtml(build.fantasy)}</h3><p>${(build.items || []).map(item => `<a href="#item/${item.id}">${escapeHtml(item.name)}${item.slots ? ` [${item.slots}]` : ''}</a>`).join(' / ')}</p><div class="amp-list">${(build.items?.[0]?.amps || []).map(amp => `<span>${escapeHtml(amp.name)} <b>+${escapeHtml(amp.pct)}%</b></span>`).join('')}</div></article>`).join('')}</div></section>`).join('')}</div>`;
  return page;
}

function renderHunting(hunting) {
  const quests = [...(hunting.monster || []), ...(hunting.region || []), ...(hunting.dedication || [])];
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader({ eyebrow: 'Permanent progression', title: 'Hunting log', intro: `${quests.length} long-term milestones award permanent stats and wearable titles earned across your whole career.` })}<div class="container milestone-grid">${quests.map(quest => { const target = quest.targets?.[0] || {}; return `<article class="milestone${quest.mvp ? ' is-mvp' : ''}"><span>${quest.mvp ? 'MVP' : target.map ? 'Region' : 'Milestone'}</span><h2>${escapeHtml(quest.title)}</h2><p>${target.mob ? `Defeat ${Number(target.count || 0).toLocaleString()} × ${target.mob}` : target.mapName || 'Career-wide objective'}</p><strong>${escapeHtml(quest.reward)}</strong></article>`; }).join('')}</div>`;
  return page;
}

function renderSkillItems(items) {
  const boosted = items.filter(item => item.boosts?.length);
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader({ eyebrow: 'Buildcraft reference', title: 'Skill-boosting items', intro: `${boosted.length} items connect directly to a class skill. Use this index to begin a build from the skill you want to play.` })}<div class="container reference-grid">${boosted.slice(0, 400).map(item => `<a href="#item/${item.id}"><strong>${escapeHtml(item.name)}</strong><span>${item.boosts.map(boost => escapeHtml(boost.name || boost.skill)).join(' · ')}</span></a>`).join('')}</div>`;
  return page;
}

function renderEnchants(options) {
  const groups = options.groups || [];
  const types = options.types || {};
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `${pageHeader({ eyebrow: 'Equipment possibilities', title: 'Enchants & random options', intro: `${groups.length} option pools define the bonuses equipment can roll. Values and chances below come from the committed server data.` })}<div class="container enchant-grid">${groups.map(group => `<details><summary><strong>${escapeHtml(group.name?.replaceAll('_', ' ') || `Group ${group.id}`)}</strong><span>${group.options?.length || 0} options</span></summary><div>${(group.options || []).map(option => { const type = types[option.option] || {}; return `<p><strong>${escapeHtml(type.desc || option.option)}</strong><span>${option.minValue ?? option.value ?? ''}${option.maxValue != null ? `–${option.maxValue}` : ''}${option.chance != null ? ` · ${(option.chance / 100).toFixed(2)}%` : ''}</span></p>`; }).join('')}</div></details>`).join('')}</div>`;
  return page;
}

export const GUIDE_VIEWS = new Set(['systems', 'rates', 'customizations', 'balance', 'builds', 'hunting', 'skills', 'enchants']);
