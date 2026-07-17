import { escapeHtml, findEntity, itemIconUrl, renderItem, renderMonster } from './entities.mjs';

function normalize(value) {
  return String(value ?? '').trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');
}

export function armorSlotOf(loc = []) {
  const slots = Array.isArray(loc) ? loc : [loc];
  return ['Armor', 'Head_Top', 'Head_Mid', 'Head_Low', 'Garment', 'Shoes', 'Left_Hand', 'Accessory'].find(slot => slots.includes(slot)) || '';
}

export function filterItems(items, { query = '', type = 'all', source = 'all', subtype = 'all', slot = 'all', sort = '', direction = 'asc' } = {}) {
  const needle = normalize(query);
  const filtered = items.filter(item => {
    const matchesType = type === 'all' || item.type === type;
    const matchesSource = source === 'all' || (source === 'custom' && item.custom) || (source === 'funmod' && item.funmod);
    const matchesSubtype = subtype === 'all' || item.sub === subtype;
    const matchesSlot = slot === 'all' || armorSlotOf(item.loc) === slot;
    const haystack = normalize(`${item.id} ${item.name} ${item.aegis || ''} ${item.type || ''}`);
    return matchesType && matchesSource && matchesSubtype && matchesSlot && (!needle || haystack.includes(needle));
  });
  if (!sort) return filtered;
  const factor = direction === 'desc' ? -1 : 1;
  return filtered.sort((a, b) => factor * (sort === 'name'
    ? String(a.name || '').localeCompare(String(b.name || ''))
    : Number(a[sort] || 0) - Number(b[sort] || 0)));
}

export function filterMonsters(mobs, { query = '', kind = 'all' } = {}) {
  const needle = normalize(query);
  return mobs.filter(mob => {
    const matchesKind = kind === 'all' || (kind === 'mvp' && mob.mvp) || (kind === 'normal' && !mob.mvp);
    return matchesKind && (!needle || normalize(`${mob.id} ${mob.name} ${mob.aegis || ''} ${mob.race || ''} ${mob.element || ''} ${mob.size || ''}`).includes(needle));
  });
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
        ${isItems ? `<label for="item-source">Source</label><select id="item-source" data-item-source><option value="all">All items</option><option value="custom">RuneZero custom</option><option value="funmod">Fun Mods</option></select><label for="item-type">Item type</label><select id="item-type" data-item-type><option value="all">All types</option>${[...new Set(records.map(item => item.type).filter(Boolean))].sort().map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}</select><label for="item-subtype">Weapon subtype</label><select id="item-subtype" data-item-subtype><option value="all">All subtypes</option>${[...new Set(records.map(item => item.sub).filter(Boolean))].sort().map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select><label for="item-slot">Armor slot</label><select id="item-slot" data-item-slot><option value="all">All slots</option>${[...new Set(records.map(item => armorSlotOf(item.loc)).filter(Boolean))].sort().map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value.replaceAll('_', ' '))}</option>`).join('')}</select><label for="item-sort">Sort</label><select id="item-sort" data-item-sort><option value="">Database order</option><option value="name">Name</option><option value="id">ID</option><option value="atk">ATK</option><option value="def">DEF</option><option value="weight">Weight</option><option value="reqlv">Required level</option><option value="slots">Card slots</option></select><button type="button" class="filter-direction" data-sort-direction value="asc">↑ Asc</button>` : `<label for="mob-kind">Monster kind</label><select id="mob-kind" data-mob-kind><option value="all">All monsters</option><option value="mvp">MVP only</option><option value="normal">Normal only</option></select>`}</div>
        <p class="database-count" data-database-count></p>
        <div class="entity-results" data-entity-results></div>
      </aside>
      <div class="entity-detail-panel" data-entity-detail></div>
    </div>`;

  const queryInput = shell.querySelector('[data-database-query]');
  const typeInput = shell.querySelector('[data-item-type]');
  const sourceInput = shell.querySelector('[data-item-source]');
  const subtypeInput = shell.querySelector('[data-item-subtype]');
  const slotInput = shell.querySelector('[data-item-slot]');
  const sortInput = shell.querySelector('[data-item-sort]');
  const directionInput = shell.querySelector('[data-sort-direction]');
  const kindInput = shell.querySelector('[data-mob-kind]');
  const results = shell.querySelector('[data-entity-results]');
  const count = shell.querySelector('[data-database-count]');
  const detail = shell.querySelector('[data-entity-detail]');
  const storedQuery = sessionStorage.getItem('runezero:search');
  if (storedQuery) {
    queryInput.value = storedQuery;
    sessionStorage.removeItem('runezero:search');
  }

  function showDetail(selected) {
    detail.replaceChildren(isItems ? renderItem(selected, { items: data.items, options: data.options }) : renderMonster(selected, { elements: data.elements }));
  }

  function refresh() {
    const filtered = isItems
      ? filterItems(records, { query: queryInput.value, type: typeInput?.value || 'all', source: sourceInput?.value || 'all', subtype: subtypeInput?.value || 'all', slot: slotInput?.value || 'all', sort: sortInput?.value || '', direction: directionInput?.value || 'asc' })
      : filterMonsters(records, { query: queryInput.value, kind: kindInput?.value || 'all' });
    const visible = filtered.slice(0, 300);
    count.textContent = `${filtered.length.toLocaleString()} ${isItems ? 'items' : 'monsters'}${filtered.length > visible.length ? ' · showing first 300' : ''}`;
    results.innerHTML = visible.length ? visible.map(record => isItems
      ? `<a class="entity-result${Number(record.id) === Number(route.id) ? ' is-active' : ''}" href="#item/${record.id}"><img src="${itemIconUrl(record.id)}" alt="" width="34" height="34" loading="lazy"><span><strong>${escapeHtml(record.name)}</strong><small>ID ${record.id} · ${escapeHtml(record.type || 'Item')}</small></span>${record.custom ? '<i>RZ</i>' : ''}</a>`
      : `<a class="entity-result${Number(record.id) === Number(route.id) ? ' is-active' : ''}" href="#mob/${record.id}"><span class="mob-dot${record.mvp ? ' is-mvp' : ''}" aria-hidden="true"></span><span><strong>${escapeHtml(record.name)}</strong><small>Lv ${record.lvl || '—'} · ${escapeHtml(record.element || 'Neutral')} · ${escapeHtml(record.race || '')}</small></span>${record.mvp ? '<i>MVP</i>' : ''}</a>`).join('')
      : '<div class="database-empty"><strong>No records found</strong><span>Try another name, ID, or filter.</span></div>';
    results.querySelectorAll('img').forEach(image => image.addEventListener('error', () => { image.hidden = true; }, { once: true }));
  }

  queryInput.addEventListener('input', refresh);
  typeInput?.addEventListener('change', refresh);
  [sourceInput, subtypeInput, slotInput, sortInput, kindInput].forEach(input => input?.addEventListener('change', refresh));
  directionInput?.addEventListener('click', () => {
    directionInput.value = directionInput.value === 'asc' ? 'desc' : 'asc';
    directionInput.textContent = directionInput.value === 'asc' ? '↑ Asc' : '↓ Desc';
    refresh();
  });
  refresh();
  if (route.entity) showDetail(entity);
  else detail.innerHTML = `<div class="entity-welcome"><img src="assets/brand/runezero-mark.svg" alt="" width="58" height="58"><p class="eyebrow">Choose a record</p><h2>${isItems ? 'Every item tells part of the story.' : 'Know what you’re hunting.'}</h2><p>Select ${isItems ? 'an item' : 'a monster'} to see its complete RuneZero details.</p></div>`;
  return shell;
}
