export const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const findEntity = (values, id) =>
  values.find(value => Number(value.id) === Number(id)) || null;

export function formatDropRate(rate) {
  const value = Number(rate || 0) / 100;
  return `${value.toFixed(Number.isInteger(value) ? 0 : 2)}%`;
}

export const itemIconUrl = id => `https://static.divine-pride.net/images/items/item/${Number(id)}.png`;
export const itemArtUrl = id => `https://static.divine-pride.net/images/items/collection/${Number(id)}.png`;

function definition(label, value) {
  return value === undefined || value === null || value === ''
    ? ''
    : `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function tags(values = []) {
  return values.length ? `<div class="tag-list">${values.map(value => `<span>${escapeHtml(value)}</span>`).join('')}</div>` : '';
}

function emptyArt(image, fallback) {
  image.addEventListener('error', () => {
    image.hidden = true;
    fallback.hidden = false;
  }, { once: true });
}

export function renderItem(item) {
  if (!item) return renderMissing('item', 'Items');
  const article = document.createElement('article');
  article.className = 'entity-detail';
  article.innerHTML = `
    <header class="entity-header">
      <div class="entity-art">
        <img src="${itemArtUrl(item.id)}" alt="" width="118" height="118">
        <span class="entity-art-fallback" hidden aria-hidden="true">✦</span>
      </div>
      <div><p class="eyebrow">${escapeHtml(item.type || 'Item')} · ID ${escapeHtml(item.id)}</p><h1>${escapeHtml(item.name)}</h1>
      <p class="entity-aegis">${escapeHtml(item.aegis || '')}</p>
      <div class="entity-badges">${item.custom ? '<span>RuneZero</span>' : ''}${item.funmod ? '<span>Fun mod</span>' : ''}${item.slots ? `<span>${item.slots} slot${item.slots === 1 ? '' : 's'}</span>` : ''}</div></div>
    </header>
    <section class="entity-section" aria-labelledby="item-overview"><h2 id="item-overview">At a glance</h2>
      <dl class="entity-stats">
        ${definition('Type', item.type)}${definition('Subtype', item.sub)}${definition('Required level', item.reqlv)}
        ${definition('Attack', item.atk)}${definition('Magic attack', item.matk)}${definition('Defense', item.def)}
        ${definition('Weight', item.weight ? (item.weight / 10).toFixed(1) : null)}${definition('Buy price', item.buy ? `${Number(item.buy).toLocaleString()} z` : null)}
        ${definition('Refineable', item.refine === true ? 'Yes' : item.refine === false ? 'No' : null)}
      </dl>
      ${tags(item.loc || [])}${tags(item.jobs || [])}
    </section>
    ${item.script ? `<section class="entity-section" aria-labelledby="item-effect"><h2 id="item-effect">Effect</h2><p class="effect-summary">${escapeHtml(summarizeScript(item.script))}</p><details><summary>View server script</summary><pre><code>${escapeHtml(item.script)}</code></pre></details></section>` : ''}
    ${(item.boosts || []).length ? `<section class="entity-section"><h2>Skills empowered</h2><div class="relation-list">${item.boosts.map(boost => `<div><strong>${escapeHtml(boost.name || boost.skill)}</strong><span>${boost.t3 ? 'Third class' : 'Up to transcendent'}</span></div>`).join('')}</div></section>` : ''}
    ${(item.droppedBy || []).length ? `<section class="entity-section"><h2>Dropped by</h2><div class="drop-list">${item.droppedBy.map(drop => `<a href="#mob/${drop.id}"><span><strong>${escapeHtml(drop.mob)}</strong>${drop.mvp ? '<small>MVP reward</small>' : ''}</span><b>${formatDropRate(drop.rate)}</b></a>`).join('')}</div></section>` : '<section class="entity-section"><h2>How to obtain it</h2><p class="muted-copy">No monster drop source is recorded for this item.</p></section>'}
    ${(item.combos || []).length ? `<section class="entity-section"><h2>Set combinations</h2><div class="relation-list">${item.combos.map(combo => `<div><strong>${(combo.with || []).map(entry => escapeHtml(entry.name || entry)).join(' + ')}</strong><span>${escapeHtml(summarizeScript(combo.script || ''))}</span></div>`).join('')}</div></section>` : ''}`;
  const image = article.querySelector('.entity-art img');
  emptyArt(image, article.querySelector('.entity-art-fallback'));
  return article;
}

export function renderMonster(mob) {
  if (!mob) return renderMissing('monster', 'Monsters');
  const article = document.createElement('article');
  article.className = 'entity-detail';
  const hp = Number(mob.hp || 0).toLocaleString();
  article.innerHTML = `
    <header class="entity-header monster-header">
      <div class="monster-sigil" aria-hidden="true">${mob.mvp ? '♛' : '◆'}</div>
      <div><p class="eyebrow">${mob.mvp ? 'MVP monster' : 'Monster'} · ID ${escapeHtml(mob.id)}</p><h1>${escapeHtml(mob.name)}</h1><p class="entity-aegis">${escapeHtml(mob.aegis || '')}</p></div>
    </header>
    <section class="entity-section"><h2>Combat profile</h2>
      <dl class="entity-stats">
        ${definition('Level', mob.lvl)}${definition('HP', hp)}${definition('Attack', mob.atkMin || mob.atkMax ? `${mob.atkMin || 0}–${mob.atkMax || 0}` : null)}
        ${definition('Defense', mob.def)}${definition('Magic defense', mob.mdef)}${definition('Base EXP', mob.baseExp ? Number(mob.baseExp).toLocaleString() : null)}
        ${definition('Job EXP', mob.jobExp ? Number(mob.jobExp).toLocaleString() : null)}${definition('Element', mob.element ? `${mob.element} ${mob.eleLv || 1}` : null)}
        ${definition('Race', mob.race)}${definition('Size', mob.size)}
      </dl>
    </section>
    ${(mob.drops || []).length ? `<section class="entity-section"><h2>Drop table</h2><div class="drop-list">${mob.drops.map(drop => `<a href="#item/${drop.id}"><span class="drop-item"><img src="${itemIconUrl(drop.id)}" alt="" width="32" height="32"><strong>${escapeHtml(drop.name)}</strong></span><b>${formatDropRate(drop.rate)}</b></a>`).join('')}</div></section>` : ''}
    ${(mob.mvpDrops || []).length ? `<section class="entity-section reward-section"><h2>MVP rewards</h2><div class="drop-list">${mob.mvpDrops.map(drop => `<a href="#item/${drop.id}"><span class="drop-item"><img src="${itemIconUrl(drop.id)}" alt="" width="32" height="32"><strong>${escapeHtml(drop.name)}</strong></span><b>${formatDropRate(drop.rate)}</b></a>`).join('')}</div></section>` : ''}
    ${(mob.spawns || []).length ? `<section class="entity-section"><h2>Where to find it</h2><div class="spawn-grid">${mob.spawns.map(spawn => `<div><strong>${escapeHtml(spawn.map)}</strong><span>${escapeHtml(spawn.amt)} on map</span></div>`).join('')}</div></section>` : '<section class="entity-section"><h2>Where to find it</h2><p class="muted-copy">No fixed spawn is recorded.</p></section>'}`;
  article.querySelectorAll('.drop-item img').forEach(image => image.addEventListener('error', () => { image.hidden = true; }, { once: true }));
  return article;
}

function renderMissing(kind, returnLabel) {
  const article = document.createElement('article');
  article.className = 'entity-detail entity-missing';
  article.innerHTML = `<p class="eyebrow">Not found</p><h1>This ${kind} isn’t in the archives.</h1><p>The link may be old, or the record may have moved.</p><p><a class="button button-secondary" href="#${kind === 'item' ? 'items' : 'mobs'}">Return to ${returnLabel}</a></p>`;
  return article;
}

function summarizeScript(script) {
  const text = String(script || '')
    .replace(/itemheal\s+rand\((\d+),(\d+)\),0;/i, 'Restores between $1 and $2 HP.')
    .replace(/itemheal\s+0,rand\((\d+),(\d+)\);/i, 'Restores between $1 and $2 SP.')
    .replace(/bonus\s+bAtk,(-?\d+);/gi, 'ATK $1. ')
    .replace(/bonus\s+bMatk,(-?\d+);/gi, 'MATK $1. ')
    .replace(/bonus\s+bDef,(-?\d+);/gi, 'DEF $1. ')
    .replace(/bonus\s+bStr,(-?\d+);/gi, 'STR $1. ')
    .replace(/bonus\s+bAgi,(-?\d+);/gi, 'AGI $1. ')
    .replace(/bonus\s+bVit,(-?\d+);/gi, 'VIT $1. ')
    .replace(/bonus\s+bInt,(-?\d+);/gi, 'INT $1. ')
    .replace(/bonus\s+bDex,(-?\d+);/gi, 'DEX $1. ')
    .replace(/bonus\s+bLuk,(-?\d+);/gi, 'LUK $1. ')
    .replace(/[{}]/g, ' ')
    .replace(/;/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || 'A special effect is defined by the server script below.';
}
