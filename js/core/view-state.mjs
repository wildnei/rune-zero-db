const viewKey = name => `runezero:view:${name}`;
const CONTEXT_KEY = 'runezero:item-context';

function browserStorage() {
  try { return globalThis.sessionStorage; } catch { return null; }
}

export function readViewState(name, defaults = {}, storage = browserStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(viewKey(name)) || 'null');
    return parsed && !Array.isArray(parsed) && typeof parsed === 'object' ? { ...defaults, ...parsed } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function writeViewState(name, value, storage = browserStorage()) {
  try {
    storage?.setItem(viewKey(name), JSON.stringify(value));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function readItemContext(storage = browserStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(CONTEXT_KEY) || 'null');
    return parsed && !Array.isArray(parsed) && Number.isFinite(Number(parsed.itemId)) && /^#/.test(parsed.href || '') && parsed.label ? parsed : null;
  } catch {
    return null;
  }
}

export function writeItemContext(context, storage = browserStorage()) {
  try {
    storage?.setItem(CONTEXT_KEY, JSON.stringify(context));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function clearItemContext(storage = browserStorage()) {
  try { storage?.removeItem(CONTEXT_KEY); } catch {}
}
