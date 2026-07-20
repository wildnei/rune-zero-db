export const VIEWS = Object.freeze([
  'home', 'items', 'builds', 'mobs', 'skills', 'enchants', 'hunting',
  'systems', 'runes', 'masteries', 'monster-hunter', 'balance', 'rates', 'customizations', 'classes', 'instances'
]);

const VIEW_SET = new Set(VIEWS);

export function parseRoute(hash = '') {
  const value = String(hash).replace(/^#/, '').replace(/^\//, '');
  if (!value || value === 'home') return { view: 'home', entity: null, id: null };
  if (value === 'promise') return { view: 'home', entity: 'section', id: 'promise' };
  if (VIEW_SET.has(value)) return { view: value, entity: null, id: null };

  const match = /^(item|mob)\/(\d+)$/.exec(value);
  const group = /^group\/(\d+)$/.exec(value);
  const instance = /^instance\/([a-z0-9-]+)$/.exec(value);
  const hunter = /^monster-hunter\/(shop|bounties)$/.exec(value);
  if (hunter) return { view: 'monster-hunter', entity: 'section', id: `hunter-${hunter[1]}` };
  if (instance) return { view: 'instances', entity: 'instance', id: instance[1] };
  if (group) return { view: 'enchants', entity: 'group', id: Number(group[1]) };
  if (!match) return { view: 'home', entity: null, id: null };

  return {
    view: match[1] === 'item' ? 'items' : 'mobs',
    entity: match[1],
    id: Number(match[2]),
  };
}

export function routeHash({ view, entity = null, id = null }) {
  if (entity === 'group' && Number.isInteger(id)) return `#group/${id}`;
  if (entity && Number.isInteger(id)) return `#${entity}/${id}`;
  return `#${VIEW_SET.has(view) ? view : 'home'}`;
}
