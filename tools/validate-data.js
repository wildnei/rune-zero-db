const fs = require('node:fs');
const path = require('node:path');

const REQUIRED = ['meta', 'items', 'mobs', 'options', 'skills', 'skillchanges', 'builds', 'hunting', 'elements'];

function validateDataDirectory(directory) {
  const root = path.resolve(directory);
  const errors = [];
  const values = {};

  for (const name of REQUIRED) {
    const file = path.join(root, `${name}.json`);
    if (!fs.existsSync(file)) {
      errors.push(`Missing ${name}.json`);
      continue;
    }
    try {
      values[name] = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      errors.push(`Invalid ${name}.json: ${error.message}`);
    }
  }

  if (values.items && !Array.isArray(values.items)) errors.push('items.json must contain an array');
  if (values.mobs && !Array.isArray(values.mobs)) errors.push('mobs.json must contain an array');
  if (values.meta && (typeof values.meta !== 'object' || Array.isArray(values.meta))) {
    errors.push('meta.json must contain an object');
  }

  const counts = {
    items: Array.isArray(values.items) ? values.items.length : 0,
    mobs: Array.isArray(values.mobs) ? values.mobs.length : 0,
  };

  if (values.meta && counts.items && Number(values.meta.items) !== counts.items) {
    errors.push(`meta.json items count ${values.meta.items} does not match ${counts.items}`);
  }
  if (values.meta && counts.mobs && Number(values.meta.mobs) !== counts.mobs) {
    errors.push(`meta.json mobs count ${values.meta.mobs} does not match ${counts.mobs}`);
  }

  return { ok: errors.length === 0, errors, counts };
}

if (require.main === module) {
  const result = validateDataDirectory(path.resolve(__dirname, '..', 'data'));
  if (!result.ok) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`data ok: ${result.counts.items} items, ${result.counts.mobs} monsters`);
  }
}

module.exports = { validateDataDirectory };
