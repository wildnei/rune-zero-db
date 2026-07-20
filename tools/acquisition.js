'use strict';

const path = require('path');

const cleanName = value => String(value || '')
  .replace(/#.*$/, '')
  .replace(/_/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/(^|\s)([a-z])/g, (_all, space, char) => space + char.toUpperCase())
  .trim();

const rewardName = (actor, fallback) => /^(?:Callb|F RZ\b)|\bCore$/i.test(actor || '') ? fallback : (actor || fallback);

function push(map, itemId, source) {
  const id = Number(itemId);
  if (!Number.isFinite(id) || id <= 0) return;
  const rows = map.get(id) || [];
  const key = JSON.stringify(source);
  if (!rows.some(row => JSON.stringify(row) === key)) rows.push(source);
  map.set(id, rows);
}

function parseNpcScript(source, fileName = 'script.txt') {
  const found = new Map();
  const arrays = new Map();
  const aliases = new Map();
  const fallback = cleanName(path.basename(fileName, path.extname(fileName)));
  let actor = fallback;

  // OnInit tables commonly appear after the dialog code that reads them, so
  // collect every numeric setarray segment before tracing grants.
  for (const match of String(source).matchAll(/\bsetarray\s+([.@$#A-Za-z0-9_]+)\[(\d+)\]\s*,\s*([^;]+);/gi)) {
    const values = [...match[3].matchAll(/(?:^|,)\s*(\d+)\s*(?=,|$)/g)].map(value => Number(value[1]));
    if (!values.length) continue;
    const rows = arrays.get(match[1]) || [];
    values.forEach((value, offset) => { rows[Number(match[2]) + offset] = value; });
    arrays.set(match[1], rows);
  }

  for (const raw of String(source).split(/\r?\n/)) {
    if (/^\s*\/\//.test(raw)) continue;
    const line = raw.replace(/\/\/.*$/, '').trimEnd();
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const kind = parts[1]?.trim();

    if (['script', 'shop', 'cashshop', 'itemshop', 'pointshop', 'marketshop'].includes(kind))
      actor = cleanName(parts[2]) || fallback;

    const alias = line.match(/^\s*([.@$#A-Za-z0-9_]+)\s*=\s*([.@$#A-Za-z0-9_]+)\s*\[[^\]]+\]\s*;/);
    if (alias && arrays.has(alias[2])) aliases.set(alias[1], alias[2]);

    if (['shop', 'cashshop', 'itemshop'].includes(kind) && parts[3]) {
      const location = parts[0].split(',')[0].trim();
      const tokens = parts[3].split(',');
      const currency = kind === 'itemshop' ? Number(tokens[1]) : null;
      const start = kind === 'itemshop' ? 2 : 1;
      for (const token of tokens.slice(start)) {
        const match = token.trim().match(/^(\d+):(-?\d+)$/);
        if (!match) continue;
        push(found, match[1], {
          kind: kind === 'cashshop' ? 'cash-shop' : kind === 'itemshop' ? 'item-shop' : 'shop',
          name: actor,
          map: location === '-' ? null : location,
          price: Number(match[2]),
          currency,
          file: path.basename(fileName),
        });
      }
    }

    const reward = line.match(/\bgetitem(bound)?\s+(\d+)\s*,\s*([^,;]+)/i);
    if (reward) push(found, reward[2], {
      kind: 'script-reward',
      name: rewardName(actor, fallback),
      amount: /^\s*\d+\s*$/.test(reward[3]) ? Number(reward[3].trim()) : null,
      bound: Boolean(reward[1]),
      file: path.basename(fileName),
    });

    const arrayReward = line.match(/\bgetitem(bound)?\s+([.@$#A-Za-z0-9_]+)\s*\[[^\]]+\]\s*,\s*([^,;]+)/i);
    if (arrayReward && arrays.has(arrayReward[2])) for (const itemId of arrays.get(arrayReward[2])) push(found, itemId, {
      kind: 'script-reward',
      name: rewardName(actor, fallback),
      amount: /^\s*\d+\s*$/.test(arrayReward[3]) ? Number(arrayReward[3].trim()) : null,
      bound: Boolean(arrayReward[1]),
      file: path.basename(fileName),
    });
    const aliasReward = line.match(/\bgetitem(bound)?\s+([.@$#A-Za-z0-9_]+)\s*,\s*([^,;]+)/i);
    const aliasedArray = aliasReward && aliases.get(aliasReward[2]);
    if (aliasReward && aliasedArray) for (const itemId of arrays.get(aliasedArray) || []) push(found, itemId, {
      kind: 'script-reward',
      name: rewardName(actor, fallback),
      amount: /^\s*\d+\s*$/.test(aliasReward[3]) ? Number(aliasReward[3].trim()) : null,
      bound: Boolean(aliasReward[1]),
      file: path.basename(fileName),
    });
  }
  return found;
}

function parseBarters(rows = [], byAegis = new Map()) {
  const found = new Map();
  for (const shop of rows) for (const offer of shop.Items || []) {
    const item = byAegis.get(offer.Item);
    if (!item) continue;
    const costs = (offer.RequiredItems || []).flatMap(requirement => {
      const required = byAegis.get(requirement.Item);
      return required ? [{ id: required.id, name: required.name, amount: Number(requirement.Amount || 1) }] : [];
    });
    push(found, item.id, {
      kind: 'barter',
      name: cleanName(shop.Name),
      map: shop.Map || null,
      zeny: Number(offer.Zeny || 0),
      costs,
      file: 'barter_db.yml',
    });
  }
  return found;
}

function mergeLedgers(target, source) {
  for (const [id, rows] of source) for (const row of rows) push(target, id, row);
  return target;
}

module.exports = { cleanName, mergeLedgers, parseBarters, parseNpcScript };
