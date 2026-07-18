export async function loadJson(path, fetcher = fetch) {
  const response = await fetcher(path);
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
  return response.json();
}

export async function loadWikiData(fetcher = fetch) {
  const required = ['meta', 'items', 'mobs'];
  const optional = ['options', 'skills', 'skillchanges', 'hunting', 'elements'];
  const entries = await Promise.all(
    required.map(async name => [name, await loadJson(`data/${name}.json`, fetcher)]),
  );
  const warnings = [];

  const optionalResults = await Promise.allSettled(optional.map(name => loadJson(`data/${name}.json`, fetcher)));
  optionalResults.forEach((result, index) => {
    const name = optional[index];
    if (result.status === 'fulfilled') entries.push([name, result.value]);
    else {
      warnings.push({ name, message: result.reason.message });
      entries.push([name, name === 'elements' || name === 'options' ? {} : []]);
    }
  });

  return { values: Object.fromEntries(entries), warnings };
}
