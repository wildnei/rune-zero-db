export const VIEWS = Object.freeze([
  'home', 'items', 'builds', 'mobs', 'skills', 'enchants', 'hunting',
  'systems', 'balance', 'rates', 'customizations', 'classes', 'instances'
]);

const VIEW_SET = new Set(VIEWS);

export function parseRoute(hash = '') {
  const value = String(hash).replace(/^#/, '').replace(/^\//, '');
  if (!value || value === 'home') return { view: 'home', entity: null, id: null };
  if (VIEW_SET.has(value)) return { view: value, entity: null, id: null };

  const match = /^(item|mob)\/(\d+)$/.exec(value);
  if (!match) return { view: 'home', entity: null, id: null };

  return {
    view: match[1] === 'item' ? 'items' : 'mobs',
    entity: match[1],
    id: Number(match[2]),
  };
}

export function routeHash({ view, entity = null, id = null }) {
  if (entity && Number.isInteger(id)) return `#${entity}/${id}`;
  return `#${VIEW_SET.has(view) ? view : 'home'}`;
}
