import { escapeHtml, findEntity, itemIconUrl, renderItem, renderMonster } from './entities.mjs';

function normalize(value) {
  return String(value ?? '').trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');
}

export function filterItems(items, { query = '', type = 'all' } = {}) {
  const needle = normalize(query);
  return items.filter(item => {
    const matchesType = type === 'all' || item.type === type;
    const haystack = normalize(`${item.id} ${item.name} ${item.aegis || ''} ${item.type || ''}`);
    return matchesType && (!needle || haystack.includes(needle));
  });
}

export function filterMonsters(mobs, { query = '' } = {}) {
  const needle = normalize(query);
  return mobs.filter(mob => !needle || normalize(`${mob.id} ${mob.name} ${mob.aegis || ''} ${mob.race || ''} ${mob.element || ''} ${mob.size || ''}`).includes(needle));
}

export function renderDatabase({ view, data, route }) {
  const isItems = view === 'items';
  const records = isItems ? data.items : data.mobs;
  const entity = route.entity ? findEntity(records, route.id) : null;
  const shell = document.createElement('section');
  shell.className = 'wiki-page database-page';
  shell.innerHTML = `
    <header class="wiki-masthead"><div class="container"><p class="eyebrow">RuneZero database</p><h1>${isItems ? 'Item archive' : 'Monster bestiary'}</h1><p>${isItems ? 'Find equipment, consumables, effects, drop sources, and every custom RuneZero item.' : 'Study levels, elements, combat stats, spawn locations, and complete drop tables.'}</p></div></header>
    <div class="container entity-browser">
      <aside class="entity-list-panel" aria-label="${isItems ? 'Items' : 'Monsters'}">
        <div class="database-tools"><label for="database-query">Search ${isItems ? 'items' : 'monsters'}</label><input id="database-query" type="search" placeholder="Name, ID${isItems ? ', aegis, or type' : ', race, or element'}…" autocomplete="off" data-database-query>
        ${isItems ? `<label for="item-type">Item type</label><select id="item-type" data-item-type><option value="all">All types</option>${[...new Set(records.map(item => item.type).filter(Boolean))].sort().map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}</select>` : ''}</div>
        <p class="database-count" data-database-count></p>
        <div class="entity-results" data-entity-results></div>
      </aside>
      <div class="entity-detail-panel" data-entity-detail></div>
    </div>`;

  const queryInput = shell.querySelector('[data-database-query]');
  const typeInput = shell.querySelector('[data-item-type]');
  const results = shell.querySelector('[data-entity-results]');
  const count = shell.querySelector('[data-database-count]');
  const detail = shell.querySelector('[data-entity-detail]');
  const storedQuery = sessionStorage.getItem('runezero:search');
  if (storedQuery) {
    queryInput.value = storedQuery;
    sessionStorage.removeItem('runezero:search');
  }

  function showDetail(selected) {
    detail.replaceChildren(isItems ? renderItem(selected) : renderMonster(selected));
  }

  function refresh() {
    const filtered = isItems
      ? filterItems(records, { query: queryInput.value, type: typeInput?.value || 'all' })
      : filterMonsters(records, { query: queryInput.value });
    const visible = filtered.slice(0, 250);
    count.textContent = `${filtered.length.toLocaleString()} ${isItems ? 'items' : 'monsters'}${filtered.length > visible.length ? ' · showing first 250' : ''}`;
    results.innerHTML = visible.length ? visible.map(record => isItems
      ? `<a class="entity-result${Number(record.id) === Number(route.id) ? ' is-active' : ''}" href="#item/${record.id}"><img src="${itemIconUrl(record.id)}" alt="" width="34" height="34" loading="lazy"><span><strong>${escapeHtml(record.name)}</strong><small>ID ${record.id} · ${escapeHtml(record.type || 'Item')}</small></span>${record.custom ? '<i>RZ</i>' : ''}</a>`
      : `<a class="entity-result${Number(record.id) === Number(route.id) ? ' is-active' : ''}" href="#mob/${record.id}"><span class="mob-dot${record.mvp ? ' is-mvp' : ''}" aria-hidden="true"></span><span><strong>${escapeHtml(record.name)}</strong><small>Lv ${record.lvl || '—'} · ${escapeHtml(record.element || 'Neutral')} · ${escapeHtml(record.race || '')}</small></span>${record.mvp ? '<i>MVP</i>' : ''}</a>`).join('')
      : '<div class="database-empty"><strong>No records found</strong><span>Try another name, ID, or filter.</span></div>';
    results.querySelectorAll('img').forEach(image => image.addEventListener('error', () => { image.hidden = true; }, { once: true }));
  }

  queryInput.addEventListener('input', refresh);
  typeInput?.addEventListener('change', refresh);
  refresh();
  if (entity) showDetail(entity);
  else detail.innerHTML = `<div class="entity-welcome"><img src="assets/brand/runezero-mark.svg" alt="" width="58" height="58"><p class="eyebrow">Choose a record</p><h2>${isItems ? 'Every item tells part of the story.' : 'Know what you’re hunting.'}</h2><p>Select ${isItems ? 'an item' : 'a monster'} to see its complete RuneZero details.</p></div>`;
  return shell;
}
