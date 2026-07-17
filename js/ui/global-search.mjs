import { searchEntities } from '../core/search.mjs';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(event, container) {
  if (event.key !== 'Tab') return;
  const focusable = [...container.querySelectorAll(FOCUSABLE)].filter(element => !element.hidden);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createGlobalSearch({ data }) {
  const trigger = document.querySelector('[data-search-button]');
  if (!trigger || document.querySelector('[data-global-search]')) return;

  const overlay = document.createElement('div');
  overlay.className = 'global-search-overlay';
  overlay.hidden = true;
  overlay.dataset.globalSearch = '';
  overlay.innerHTML = `<section class="global-search" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
    <div class="global-search-head">
      <div><p class="eyebrow">RuneZero archives</p><h2 id="global-search-title">Search the wiki</h2></div>
      <button class="icon-button" type="button" data-search-close><span class="sr-only">Close search</span>×</button>
    </div>
    <label class="global-search-field" for="global-query"><span aria-hidden="true">⌕</span><input id="global-query" type="search" placeholder="Item, monster, aegis name, or ID…" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="global-results" aria-activedescendant=""></label>
    <div class="global-search-results" id="global-results" role="listbox" data-global-results><p>Start typing to explore ${Number(data.meta?.items || 0).toLocaleString()} items and ${Number(data.meta?.mobs || 0).toLocaleString()} monsters.</p></div>
    <footer><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></footer>
  </section>`;
  document.body.append(overlay);

  const input = overlay.querySelector('input');
  const results = overlay.querySelector('[data-global-results]');
  let matches = [];
  let activeIndex = -1;

  function open() {
    overlay.hidden = false;
    [...document.body.children].filter(element => element !== overlay).forEach(element => {
      if (!element.inert) { element.dataset.searchInert = ''; element.inert = true; }
    });
    document.body.classList.add('drawer-open');
    trigger.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => input.focus());
  }

  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.querySelectorAll('[data-search-inert]').forEach(element => {
      element.inert = false;
      delete element.dataset.searchInert;
    });
    document.body.classList.remove('drawer-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }

  function choose(index) {
    const selected = matches[index];
    if (!selected) return;
    window.location.hash = `${selected.kind}/${selected.id}`;
    close();
  }

  function setActive(index) {
    if (!matches.length) return;
    activeIndex = (index + matches.length) % matches.length;
    overlay.querySelectorAll('[role="option"]').forEach((option, optionIndex) => {
      option.setAttribute('aria-selected', String(optionIndex === activeIndex));
    });
    const id = `global-result-${activeIndex}`;
    input.setAttribute('aria-activedescendant', id);
    document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
  }

  function render() {
    matches = searchEntities(data, input.value, 10);
    activeIndex = -1;
    input.setAttribute('aria-expanded', String(matches.length > 0));
    input.setAttribute('aria-activedescendant', '');
    if (!input.value.trim()) {
      results.innerHTML = `<p>Start typing to explore ${Number(data.meta?.items || 0).toLocaleString()} items and ${Number(data.meta?.mobs || 0).toLocaleString()} monsters.</p>`;
      return;
    }
    if (!matches.length) {
      results.innerHTML = '<p>No matching record. Try another name, aegis identifier, or numeric ID.</p>';
      return;
    }
    results.innerHTML = matches.map((record, index) => `<button id="global-result-${index}" type="button" role="option" aria-selected="false" data-result-index="${index}"><span class="search-kind">${record.kind === 'item' ? 'Item' : 'Monster'}</span><span><strong>${escapeHtml(record.name)}</strong><small>ID ${record.id}${record.aegis ? ` · ${escapeHtml(record.aegis)}` : ''}</small></span><i aria-hidden="true">→</i></button>`).join('');
    results.querySelectorAll('[data-result-index]').forEach(button => {
      button.addEventListener('click', () => choose(Number(button.dataset.resultIndex)));
    });
  }

  trigger.setAttribute('aria-expanded', 'false');
  trigger.addEventListener('click', open);
  overlay.querySelector('[data-search-close]').addEventListener('click', close);
  overlay.addEventListener('mousedown', event => { if (event.target === overlay) close(); });
  overlay.addEventListener('keydown', event => trapFocus(event, overlay));
  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(activeIndex + 1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(activeIndex - 1); }
    if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); choose(activeIndex); }
    if (event.key === 'Escape') { event.preventDefault(); close(); }
  });
  document.addEventListener('keydown', event => {
    const tag = event.target?.tagName;
    if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !event.target?.isContentEditable) {
      event.preventDefault();
      open();
    } else if (event.key === 'Escape' && !overlay.hidden) {
      close();
    }
  });
}
