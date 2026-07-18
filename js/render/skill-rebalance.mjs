import { CLASS_FAMILIES, buildSkillGearIndex, countSkillGearItems, filterSkillGear } from '../core/skill-gear.mjs';
import { readViewState, writeItemContext, writeViewState } from '../core/view-state.mjs';
import { escapeHtml, itemIconUrl } from './entities.mjs';

const DEFAULT_STATE = { classId: 'all', query: '', category: 'all', rebalancedOnly: false, skillId: '' };

function damageLabel(percent) {
  if (percent == null) return 'Skill support';
  const value = Number(percent);
  return `${value > 0 ? '+' : ''}${value}% damage`;
}

export function renderSkillRebalance({ items = [], skills = {} } = {}) {
  const index = buildSkillGearIndex(items, skills);
  const categories = [...new Set(index.flatMap(group => group.items.map(item => item.category)))].sort();
  const state = readViewState('skill-rebalance', DEFAULT_STATE);
  state.classId = ['all', ...CLASS_FAMILIES.map(family => family.id)].includes(state.classId) ? state.classId : 'all';
  state.query = String(state.query || '');
  state.category = ['all', ...categories].includes(state.category) ? state.category : 'all';
  state.rebalancedOnly = state.rebalancedOnly === true;
  state.skillId = index.some(group => group.skillId === state.skillId) ? state.skillId : '';

  const page = document.createElement('section');
  page.className = 'wiki-page rebalance-page';
  page.innerHTML = `
    <header class="wiki-masthead editorial-masthead"><div class="container"><p class="eyebrow">Skill Rebalance</p><h1>Rebalanced Builds</h1><p>Find the equipment that makes overlooked skills and alternative class paths viable. Start with your class or search the skill you want to play.</p></div></header>
    <div class="container rebalance-layout">
      <aside class="rebalance-controls" aria-label="Rebalanced build filters">
        <label for="rebalance-query">Search skills or gear</label>
        <input id="rebalance-query" type="search" value="${escapeHtml(state.query)}" placeholder="Bowling Bash, KN_BOWLINGBASH, or item name" autocomplete="off" data-rebalance-query>
        <fieldset><legend>Choose your class</legend><div class="rebalance-classes">
          <button type="button" class="rebalance-class" data-rebalance-class="all" aria-pressed="${state.classId === 'all'}">All classes</button>
          ${CLASS_FAMILIES.map(family => `<button type="button" class="rebalance-class" data-rebalance-class="${family.id}" aria-pressed="${state.classId === family.id}">${escapeHtml(family.name)}${family.expanded ? '<small>Expanded</small>' : ''}</button>`).join('')}
        </div></fieldset>
        <label for="rebalance-category">Equipment type</label>
        <select id="rebalance-category" data-rebalance-category><option value="all">All equipment</option>${categories.map(category => `<option value="${escapeHtml(category)}"${state.category === category ? ' selected' : ''}>${escapeHtml(category)}</option>`).join('')}</select>
        <label class="rebalance-check"><input type="checkbox" data-rebalance-only${state.rebalancedOnly ? ' checked' : ''}> Rebalanced Gear only</label>
        <button type="button" class="rebalance-reset" data-rebalance-reset>Reset filters</button>
      </aside>
      <div class="rebalance-results">
        <div class="rebalance-skill-picker" data-rebalance-skills aria-label="Supported skills"></div>
        <p class="rebalance-summary" data-rebalance-summary></p>
        <span class="sr-only" aria-live="polite" aria-atomic="true" data-rebalance-live></span>
        <div class="rebalance-groups" data-rebalance-results></div>
      </div>
    </div>`;

  const query = page.querySelector('[data-rebalance-query]');
  const category = page.querySelector('[data-rebalance-category]');
  const only = page.querySelector('[data-rebalance-only]');
  const skillPicker = page.querySelector('[data-rebalance-skills]');
  const summary = page.querySelector('[data-rebalance-summary]');
  const liveSummary = page.querySelector('[data-rebalance-live]');
  const results = page.querySelector('[data-rebalance-results]');

  const save = () => writeViewState('skill-rebalance', state);

  function refresh() {
    const groups = filterSkillGear(index, state);
    const available = filterSkillGear(index, {
      classId: state.classId,
      query: state.query,
      category: state.category,
      rebalancedOnly: state.rebalancedOnly,
    });
    skillPicker.innerHTML = available.length
      ? `<button type="button" class="rebalance-skill" data-rebalance-skill="" aria-pressed="${!state.skillId}">All supported skills</button>${available.map(group => `<button type="button" class="rebalance-skill" data-rebalance-skill="${escapeHtml(group.skillId)}" aria-pressed="${state.skillId === group.skillId}">${escapeHtml(group.name)} <span>${group.items.length}</span></button>`).join('')}`
      : '';
    const itemCount = countSkillGearItems(groups);
    const activeClass = CLASS_FAMILIES.find(family => family.id === state.classId)?.name || 'All classes';
    const context = state.query ? `${activeClass} · “${state.query}”` : activeClass;
    const summaryText = `${context} · ${groups.length.toLocaleString()} supported skill${groups.length === 1 ? '' : 's'} · ${itemCount.toLocaleString()} item${itemCount === 1 ? '' : 's'}`;
    summary.textContent = summaryText;
    window.clearTimeout(refresh.announceTimer);
    refresh.announceTimer = window.setTimeout(() => { liveSummary.textContent = summaryText; }, 250);
    results.innerHTML = groups.length
      ? groups.map(group => `<section class="rebalance-skill-group" aria-labelledby="rebalance-${escapeHtml(group.skillId)}"><header><div><p class="eyebrow">${escapeHtml(group.family.name)}</p><h2 id="rebalance-${escapeHtml(group.skillId)}">${escapeHtml(group.name)}</h2></div><code>${escapeHtml(group.skillId)}</code></header><div class="rebalance-item-grid">${group.items.map(item => `<a class="rebalance-item" href="#item/${Number(item.id)}" data-rebalance-item="${Number(item.id)}" data-rebalance-family="${escapeHtml(group.family.name)}" data-rebalance-skill-name="${escapeHtml(group.name)}"><img src="${itemIconUrl(item.id)}" alt="" width="42" height="42" loading="lazy"><span><strong>${escapeHtml(item.name)}${item.slots ? ` [${Number(item.slots)}]` : ''}</strong><small>${escapeHtml(item.sub || item.category)}${item.custom ? ' · RuneZero' : ''}${item.rebalanced ? ' · Skill Rebalance' : ''}</small></span><b>${damageLabel(item.percent)}</b></a>`).join('')}</div></section>`).join('')
      : '<div class="database-empty"><strong>No supported gear found</strong><span>Clear a filter or try another class, skill, or item name.</span></div>';
    results.querySelectorAll('img').forEach(image => image.addEventListener('error', () => { image.hidden = true; }, { once: true }));
  }

  function setClass(classId) {
    state.classId = classId;
    state.skillId = '';
    page.querySelectorAll('[data-rebalance-class]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rebalanceClass === classId)));
    save();
    refresh();
  }

  page.querySelectorAll('[data-rebalance-class]').forEach(button => button.addEventListener('click', () => setClass(button.dataset.rebalanceClass)));
  query.addEventListener('input', () => { state.query = query.value; state.skillId = ''; save(); refresh(); });
  category.addEventListener('change', () => { state.category = category.value; save(); refresh(); });
  only.addEventListener('change', () => { state.rebalancedOnly = only.checked; save(); refresh(); });
  skillPicker.addEventListener('click', event => {
    const button = event.target.closest('[data-rebalance-skill]');
    if (!button) return;
    state.skillId = button.dataset.rebalanceSkill;
    save();
    refresh();
  });
  page.querySelector('[data-rebalance-reset]').addEventListener('click', () => {
    Object.assign(state, DEFAULT_STATE);
    query.value = '';
    category.value = 'all';
    only.checked = false;
    setClass('all');
  });
  results.addEventListener('click', event => {
    const link = event.target.closest('[data-rebalance-item]');
    if (!link) return;
    writeItemContext({ itemId: Number(link.dataset.rebalanceItem), href: '#builds', label: `Back to ${link.dataset.rebalanceFamily} → ${link.dataset.rebalanceSkillName} gear` });
  });

  refresh();
  return page;
}
