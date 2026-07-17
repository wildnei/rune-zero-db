export function normalizeQuery(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
    .replace(/[_-]+/g, ' ');
}

export function searchEntities({ items = [], mobs = [] }, query, limit = 12) {
  const needle = normalizeQuery(query);
  if (!needle) return [];

  const records = [
    ...items.map(value => ({ ...value, kind: 'item' })),
    ...mobs.map(value => ({ ...value, kind: 'mob' })),
  ];

  return records
    .filter(value => normalizeQuery(`${value.id} ${value.name} ${value.aegis || ''}`).includes(needle))
    .slice(0, limit);
}
