import { escapeHtml, itemIconUrl } from './entities.mjs';

export const RUNE_FAMILIES = [
  { id: 41100, name: 'Warrior', stat: 'Physical ATK', values: ['+10', '+15', '+25', '+35', '+50'], slots: ['Headgear', 'Accessory'], rune: 'Rune of Might' },
  { id: 41105, name: 'Sorcery', stat: 'Magic ATK', values: ['+10', '+15', '+25', '+35', '+50'], slots: ['Headgear', 'Accessory'], rune: 'Rune of Sorcery' },
  { id: 41110, name: 'Haste', stat: 'ASPD', values: ['+1%', '+2%', '+3%', '+4%', '+5%'], slots: ['Garment', 'Footgear'], rune: 'Any rune' },
  { id: 41115, name: 'Sniper', stat: 'Critical', values: ['+3', '+5', '+8', '+12', '+16'], slots: ['Accessory'], rune: 'Rune of Precision' },
  { id: 41120, name: 'Phantom', stat: 'Flee', values: ['+4', '+6', '+9', '+13', '+18'], slots: ['Armor', 'Garment', 'Footgear'], rune: 'Any rune' },
  { id: 41125, name: 'Guardian', stat: 'Max HP', values: ['+2%', '+3%', '+4%', '+6%', '+8%'], slots: ['Armor', 'Garment', 'Footgear'], rune: 'Any rune' },
  { id: 41130, name: 'Cleric', stat: 'Healing power', values: ['+2%', '+4%', '+6%', '+9%', '+12%'], slots: ['Headgear', 'Armor'], rune: 'Any rune' },
  { id: 41135, name: 'Flow', stat: 'After-cast delay', values: ['-3%', '-6%', '-10%', '-15%', '-20%'], slots: ['Headgear', 'Armor', 'Accessory'], rune: 'Rune of Alacrity' },
  { id: 41140, name: 'Focus', stat: 'Variable cast time', values: ['-3%', '-6%', '-9%', '-12%', '-15%'], slots: ['Headgear', 'Accessory'], rune: 'Rune of Focus' },
  { id: 41145, name: 'Windrunner', stat: 'Movement speed', values: ['+2%', '+4%', '+6%', '+8%', '+10%'], slots: ['Garment', 'Footgear'], rune: 'Any rune' },
];

export const RUNE_LEVELS = [
  { level: 1, upgrade: '1 Rough Stone + 50,000z', expanded: '10 Crystal Shards + 75,000z', total: '10 Crystal Shards + 75,000z' },
  { level: 2, upgrade: '1 Rough Stone + 1 matching Normal Rune + 100,000z', expanded: '25 Crystal Shards + 175,000z', total: '35 Crystal Shards + 250,000z' },
  { level: 3, upgrade: '1 Polished Stone + 1 matching Greater Rune + 200,000z', expanded: '55 Crystal Shards + 4 Radiant Crystals + 450,000z', total: '90 Crystal Shards + 4 Radiant Crystals + 700,000z' },
  { level: 4, upgrade: '1 Brilliant Stone + 15 Coagulated Spell + 5 Temporal Crystal + 300,000z', expanded: '5 Radiant Crystals + 10 Gray Shards + 15 Coagulated Spell + 5 Temporal Crystal + 600,000z', total: '90 Crystal Shards + 9 Radiant Crystals + 10 Gray Shards + 15 Coagulated Spell + 5 Temporal Crystal + 1,300,000z' },
  { level: 5, upgrade: '1 Zero Stone + 20 Gray Shards + 2 Polluted Spell + 750,000z; then 500 MVP Points or 10 Temporal Crystals', expanded: '10 Radiant Crystals + 20 Gray Shards + 5 Polluted Spell + 1,250,000z + final payment', total: '90 Crystal Shards + 19 Radiant Crystals + 30 Gray Shards + 15 Coagulated Spell + 5 Polluted Spell + 2,550,000z, plus 500 MVP Points or 15 Temporal Crystals total' },
];

const SLOT_OPTIONS = ['All slots', 'Headgear', 'Armor', 'Garment', 'Footgear', 'Accessory'];

function fuelLabel(family) {
  if (family.rune === 'Any rune') return 'Any Normal rune at Lv.2; any Greater rune at Lv.3.';
  return `${family.rune} at Lv.2; Greater ${family.rune} at Lv.3.`;
}

function familyCard(family) {
  return `<article class="rune-family" data-rune-family data-slots="${family.slots.join(' ')}"><div class="rune-family-heading"><img src="${itemIconUrl(family.id)}" alt="" width="56" height="56" loading="lazy"><div><p class="eyebrow">${escapeHtml(family.stat)}</p><h2>${escapeHtml(family.name)} Stone</h2></div></div><p><strong>Fits:</strong> ${family.slots.map(escapeHtml).join(' · ')}</p><div class="rune-levels">${family.values.map((value, index) => `<span><small>Lv.${index + 1}</small><strong>${escapeHtml(value)}</strong></span>`).join('')}</div><p class="muted-copy"><strong>Rune fuel:</strong> ${escapeHtml(fuelLabel(family))}</p></article>`;
}

export function renderRunes() {
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page rune-planner';
  page.innerHTML = `<header class="wiki-masthead editorial-masthead"><div class="container"><p class="eyebrow">Ten families · five guaranteed levels</p><h1>Rune & Enchant Stone Planner</h1><p>Compare every bonus, see where it fits, and budget the complete no-fail upgrade path before committing materials.</p></div></header>
  <div class="container article-stack">
    <section class="article-section"><p class="eyebrow">Choose your gear</p><h2>Which stones fit my slot?</h2><div class="rune-filter" role="group" aria-label="Filter rune families by equipment slot">${SLOT_OPTIONS.map((slot, index) => `<button type="button" class="button${index ? ' button-secondary' : ''}" data-rune-slot="${slot}">${slot}</button>`).join('')}</div><p class="muted-copy" data-rune-count>${RUNE_FAMILIES.length} families shown</p><div class="rune-family-grid">${RUNE_FAMILIES.map(familyCard).join('')}</div></section>
    <section class="article-section"><p class="eyebrow">Level-by-level budget</p><h2>What each upgrade requires</h2><div class="rune-materials">${[[41150,'Rough'],[41151,'Polished'],[41152,'Brilliant'],[41153,'Zero']].map(([id,name]) => `<a href="#item/${id}"><img src="${itemIconUrl(id)}" alt="" width="42" height="42" loading="lazy"><span>${name}<small>Enchant Stone</small></span></a>`).join('')}</div><p>The direct cost is what the Stone Enchanter asks for. The crafting-expanded cost includes the Rune Artisan recipes. The running total assumes a fresh stone raised sequentially from Lv.1.</p><div class="data-table-wrap rune-cost-table"><table><thead><tr><th>Target</th><th>Direct upgrade</th><th>Crafting-expanded step</th><th>Running total from scratch</th></tr></thead><tbody>${RUNE_LEVELS.map(level => `<tr><th>Lv.${level.level}</th><td>${escapeHtml(level.upgrade)}</td><td>${escapeHtml(level.expanded)}</td><td>${escapeHtml(level.total)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="article-section"><p class="eyebrow">Rules that affect your build</p><h2>Plan before you socket</h2><div class="rule-list"><article><h3>Eligible gear only</h3><p>Slotted headgear, armor, garments, footgear, and accessories can take these stones. Weapons and shields cannot.</p></article><article><h3>One family per item</h3><p>An item may carry two stones when it has room, but the same family cannot occupy both enchant slots.</p></article><article><h3>Changing family resets</h3><p>Replacing a family starts the new family at Lv.1 and destroys the old stone. Extract first if you want to preserve it.</p></article><article><h3>Stones remain portable</h3><p>Extraction costs 25,000z per stone level. Reinstalling an extracted or traded stone costs 50,000z and preserves its level.</p></article></div></section>
    <section class="article-section"><p class="eyebrow">Where to go</p><h2>Rune Artisan → Stone Enchanter</h2><p>Craft runes and Enchant Stones with the <strong>Rune Artisan at Prontera 164,166</strong>, then install or upgrade them at the neighboring <strong>Stone Enchanter at Prontera 164,163</strong>. Every upgrade succeeds.</p></section>
  </div>`;

  const buttons = [...page.querySelectorAll('[data-rune-slot]')];
  const cards = [...page.querySelectorAll('[data-rune-family]')];
  const count = page.querySelector('[data-rune-count]');
  buttons.forEach(button => button.addEventListener('click', () => {
    const slot = button.dataset.runeSlot;
    buttons.forEach(candidate => candidate.classList.toggle('button-secondary', candidate !== button));
    let visible = 0;
    cards.forEach(card => {
      card.hidden = slot !== 'All slots' && !card.dataset.slots.split(' ').includes(slot);
      if (!card.hidden) visible += 1;
    });
    count.textContent = slot === 'All slots' ? `${visible} families shown` : `${visible} ${visible === 1 ? 'family' : 'families'} shown for ${slot.toLowerCase()}`;
  }));
  return page;
}
