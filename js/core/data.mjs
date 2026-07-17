export async function loadJson(path, fetcher = fetch) {
  const response = await fetcher(path);
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
  return response.json();
}

export async function loadWikiData(fetcher = fetch) {
  const required = ['meta', 'items', 'mobs'];
  const optional = ['options', 'skills', 'skillchanges', 'builds', 'hunting', 'elements'];
  const entries = await Promise.all(
    required.map(async name => [name, await loadJson(`data/${name}.json`, fetcher)]),
  );
  const warnings = [];

  for (const name of optional) {
    try {
      entries.push([name, await loadJson(`data/${name}.json`, fetcher)]);
    } catch (error) {
      warnings.push({ name, message: error.message });
      entries.push([name, name === 'elements' || name === 'options' ? {} : []]);
    }
  }

  return { values: Object.fromEntries(entries), warnings };
}
