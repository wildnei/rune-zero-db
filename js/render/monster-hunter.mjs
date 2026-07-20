import { acquisitionLabel, escapeHtml, itemIconUrl, translateScript } from './entities.mjs';

const HUNTER_SOURCES = new Set(['Hunter Skill Gear Shop', 'Monster Hunter']);

export function monsterHunterItems(items = []) {
  return items.map(item => ({
    ...item,
    hunterSources: (item.acquiredFrom || []).filter(source => HUNTER_SOURCES.has(source.name)),
  })).filter(item => item.hunterSources.length);
}

function itemCard(item) {
  const source = item.hunterSources[0];
  const skills = (item.boosts || []).map(boost => `${boost.name || boost.skill}${Number.isFinite(boost.percent) ? ` +${boost.percent}%` : ''}`);
  const effects = translateScript(item.script || '').slice(0, 3);
  return `<a class="hunter-item" href="#item/${Number(item.id)}" data-hunter-item data-name="${escapeHtml(`${item.name} ${item.aegis || ''}`.toLowerCase())}" data-type="${escapeHtml(item.type || 'Other')}">
    <img src="${itemIconUrl(item.id)}" alt="" width="48" height="48" loading="lazy">
    <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml([item.type, item.reqlv ? `Lv ${item.reqlv}` : '', effects.join(' · '), skills.slice(0, 2).join(' · ')].filter(Boolean).join(' · '))}</small></span>
    <b>${escapeHtml(source.kind === 'script-reward' ? 'Bounty reward' : acquisitionLabel(source))}</b>
  </a>`;
}

function itemSection(id, title, intro, items) {
  return `<section class="hunter-section" id="${id}"><header><div><p class="eyebrow">${items.length} items</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(intro)}</p></div></header><div class="hunter-item-grid">${items.map(itemCard).join('')}</div></section>`;
}

export function renderMonsterHunter(items = []) {
  const page = document.createElement('section');
  page.className = 'wiki-page hunter-page';
  const all = monsterHunterItems(items);
  const shop = all.filter(item => item.hunterSources.some(source => source.name === 'Hunter Skill Gear Shop'));
  const bounties = all.filter(item => item.hunterSources.some(source => source.name === 'Monster Hunter'));
  const types = [...new Set(all.map(item => item.type || 'Other'))].sort();
  page.innerHTML = `<header class="wiki-masthead editorial-masthead"><div class="container"><p class="eyebrow">Hunter's Guild · dedicated equipment archive</p><h1>Monster Hunter</h1><p>Plan your bounty route without digging through the general database. Signature bounty rewards and the imported Pre-Renewal skill collection are separated below.</p><div class="hunter-metrics"><div><strong>${all.length}</strong><span>unique items</span></div><div><strong>${shop.length}</strong><span>skill-shop choices</span></div><div><strong>${bounties.length}</strong><span>bounty rewards</span></div><div><strong>150</strong><span>Hunter Coins per shop item</span></div></div></div></header>
    <div class="container hunter-layout">
      <aside class="hunter-controls" aria-label="Filter Monster Hunter equipment"><label for="hunter-search">Find equipment</label><input id="hunter-search" type="search" placeholder="Item or Aegis name" data-hunter-search><label for="hunter-type">Equipment type</label><select id="hunter-type" data-hunter-type><option value="">All types</option>${types.map(type => `<option>${escapeHtml(type)}</option>`).join('')}</select><p data-hunter-count>${all.length} items shown</p><nav aria-label="Monster Hunter sections"><a href="#monster-hunter/shop">Skill Gear Shop</a><a href="#monster-hunter/bounties">Bounty rewards</a></nav></aside>
      <div class="hunter-results">${itemSection('hunter-shop', 'Hunter Skill Gear Shop', 'The LegionBR-inspired collection adapted for RuneZero Pre-Renewal. Every item costs 150 Hunter Coins and uses compatible level and skill rules.', shop)}${itemSection('hunter-bounties', 'Monster Hunter bounty rewards', 'Signature equipment granted directly by marked-target contracts. Open an item to see every indexed acquisition path and effect.', bounties)}<p class="hunter-empty" hidden data-hunter-empty>No Monster Hunter equipment matches those filters.</p></div>
    </div>`;

  const update = () => {
    const query = page.querySelector('[data-hunter-search]').value.trim().toLowerCase();
    const type = page.querySelector('[data-hunter-type]').value;
    let visible = 0;
    page.querySelectorAll('[data-hunter-item]').forEach(card => {
      const show = (!query || card.dataset.name.includes(query)) && (!type || card.dataset.type === type);
      card.hidden = !show;
      if (show) visible++;
    });
    page.querySelector('[data-hunter-count]').textContent = `${visible} item${visible === 1 ? '' : 's'} shown`;
    page.querySelector('[data-hunter-empty]').hidden = visible !== 0;
  };
  page.querySelector('[data-hunter-search]').addEventListener('input', update);
  page.querySelector('[data-hunter-type]').addEventListener('change', update);
  return page;
}
