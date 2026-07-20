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

const ART_DONORS = { 40980: 20744, 40981: 20744, 40982: 1004 };
const artId = id => ART_DONORS[Number(id)] || Number(id);
export const itemIconUrl = id => `https://static.divine-pride.net/images/items/item/${artId(id)}.png`;
export const itemArtUrl = id => `https://static.divine-pride.net/images/items/collection/${artId(id)}.png`;
export const monsterArtUrl = id => `https://static.divine-pride.net/images/mobs/png/${Number(id)}.png`;

export function skillAttackAmplifiers(script = '') {
  const amplifiers = [];
  let conditionalDepth = 0;
  let skipNextStatement = false;
  for (const rawLine of String(script).split('\n')) {
    let line = rawLine.replace(/\/\/.*$/, '').trim();
    if (!line) continue;
    const leadingCloses = line.match(/^}+\s*/)?.[0].match(/}/g)?.length || 0;
    if (leadingCloses) {
      conditionalDepth = Math.max(0, conditionalDepth - leadingCloses);
      line = line.replace(/^}+\s*/, '');
    }
    if (!line) continue;
    if (/^(if|else)\b/i.test(line)) {
      const opens = (line.match(/{/g) || []).length;
      const closes = (line.match(/}/g) || []).length;
      conditionalDepth = Math.max(0, conditionalDepth + opens - closes);
      if (!opens && !line.includes(';')) skipNextStatement = true;
      continue;
    }
    if (skipNextStatement) {
      skipNextStatement = false;
      continue;
    }
    if (conditionalDepth === 0) {
      for (const match of line.matchAll(/bonus2\s+bSkillAtk,\s*"([^"]+)",\s*(-?\d+)/ig)) {
        amplifiers.push({ skill: match[1], percent: Number(match[2]) });
      }
    }
    conditionalDepth = Math.max(0, conditionalDepth + (line.match(/{/g) || []).length - (line.match(/}/g) || []).length);
  }
  return amplifiers;
}

export function estimateDamage(before, percent) {
  const base = Math.max(0, Number(before) || 0);
  const bonus = Number(percent) || 0;
  return { before: base, after: Math.round(base * (1 + bonus / 100)), percent: bonus };
}

export function rarityInfo(rate) {
  const value = Number(rate || 0);
  if (value <= 10) return { label: 'Legendary', width: 100, color: '#df8a1e' };
  if (value <= 50) return { label: 'Very rare', width: 82, color: '#8b5cf6' };
  if (value <= 100) return { label: 'Rare', width: 64, color: '#2f7fd6' };
  if (value <= 1000) return { label: 'Uncommon', width: 42, color: '#13a99a' };
  return { label: 'Common', width: 22, color: '#9aa2b4' };
}

export function elementMatchups(element, level, elements) {
  if (!elements?.matrix || !elements?.order) return [];
  const defender = elements.order.indexOf(element === 'Shadow' ? 'Dark' : element);
  if (defender < 0) return [];
  const layer = Math.max(0, Math.min(3, Number(level || 1) - 1));
  return elements.order.map((name, attacker) => ({ name, percent: elements.matrix[layer][attacker][defender] }))
    .sort((a, b) => b.percent - a.percent);
}

function gearOptionGroup(item) {
  if (item.type === 'Weapon') return 'RZ_DROP_WEAPON';
  if (item.type !== 'Armor') return null;
  const location = (item.loc || []).join(' ');
  if (/Head/.test(location)) return 'RZ_DROP_HEADGEAR';
  if (/Left_Hand/.test(location)) return 'RZ_DROP_SHIELD';
  if (/Garment/.test(location)) return 'RZ_DROP_GARMENT';
  if (/Shoes/.test(location)) return 'RZ_DROP_SHOES';
  if (/Accessory/.test(location)) return 'RZ_DROP_ACCESSORY';
  if (/Armor/.test(location)) return 'RZ_DROP_ARMOR';
  return null;
}

function rateVisual(rate) {
  const rarity = rarityInfo(rate);
  return `<span class="drop-rate"><span class="rarity-track" title="${rarity.label}"><i style="width:${rarity.width}%;background:${rarity.color}"></i></span><b>${formatDropRate(rate)}</b></span>`;
}

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

export function itemReturnLink(itemId, returnContext) {
  if (!returnContext || Number(returnContext.itemId) !== Number(itemId)) return '';
  return `<p><a class="back-link entity-context-link" href="${escapeHtml(returnContext.href)}">← ${escapeHtml(returnContext.label)}</a></p>`;
}

export function acquisitionLabel(source = {}) {
  if (source.kind === 'shop') return `${Number(source.price || 0).toLocaleString()} zeny`;
  if (source.kind === 'cash-shop') return `${Number(source.price || 0).toLocaleString()} Cash Points`;
  if (source.kind === 'item-shop') return `${Number(source.price || 0).toLocaleString()} ${source.currencyName || `item ${source.currency}`}`;
  if (source.kind === 'barter') {
    const costs = (source.costs || []).map(cost => `${Number(cost.amount || 1).toLocaleString()}× ${cost.name}`).join(' + ');
    return [source.zeny ? `${Number(source.zeny).toLocaleString()} zeny` : '', costs].filter(Boolean).join(' + ') || 'Barter exchange';
  }
  if (source.kind === 'script-reward') return `${source.amount ? `${Number(source.amount).toLocaleString()}× ` : ''}${source.bound ? 'Bound scripted reward' : 'Scripted reward'}`;
  return 'Confirmed source';
}

function renderAcquisition(item) {
  const drops = item.droppedBy || [];
  const sources = item.acquiredFrom || [];
  if (!drops.length && !sources.length) return '<section class="entity-section"><h2>How to obtain it</h2><p class="muted-copy">No confirmed source is indexed yet. Dynamic quest, crafting, and variable-driven rewards may still apply.</p></section>';
  return `<section class="entity-section"><h2>How to obtain it</h2>
    ${drops.length ? `<p class="muted-copy">Monster drop chances use the live database rate. Colored rarity bars mirror in-game rarity.</p><div class="drop-list">${drops.map(drop => `<a href="#mob/${Number(drop.id)}"><span><i class="beam-dot ${item.type === 'Card' ? (drop.mvp ? 'is-purple' : 'is-blue') : Number(drop.rate) <= 10 ? 'is-red' : Number(drop.rate) <= 100 ? 'is-green' : ''}" aria-hidden="true"></i><strong>${escapeHtml(drop.mob)}</strong>${drop.mvp ? '<small>MVP source</small>' : ''}</span>${rateVisual(drop.rate)}</a>`).join('')}</div>` : ''}
    ${sources.length ? `<p class="muted-copy">Shop, barter, and reward sources are derived from currently loaded server scripts.</p><div class="relation-list acquisition-list">${sources.map(source => `<div><span><strong>${escapeHtml(source.name || 'Server reward')}</strong><small>${escapeHtml([source.kind?.replaceAll('-', ' '), source.map].filter(Boolean).join(' · '))}</small></span><b>${escapeHtml(acquisitionLabel(source))}</b></div>`).join('')}</div>` : ''}
  </section>`;
}

export function renderItem(item, context = {}) {
  if (!item) return renderMissing('item', 'Items');
  const article = document.createElement('article');
  article.className = 'entity-detail';
  article.innerHTML = `
    ${itemReturnLink(item.id, context.returnContext)}
    <header class="entity-header">
      <div class="entity-art">
        <img src="${itemArtUrl(item.id)}" alt="" width="118" height="118">
        <span class="entity-art-fallback" hidden aria-hidden="true">✦</span>
      </div>
      <div><p class="eyebrow">${escapeHtml(item.type || 'Item')} · ID ${escapeHtml(item.id)}</p><h1>${escapeHtml(item.name)}</h1>
      <p class="entity-aegis">${escapeHtml(item.aegis || '')}</p>
      <div class="entity-badges">${item.custom ? '<span>RuneZero</span>' : ''}${item.funmod ? '<span>Skill Rebalance</span>' : ''}${item.slots ? `<span>${item.slots} slot${item.slots === 1 ? '' : 's'}</span>` : ''}</div></div>
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
    ${item.script ? `<section class="entity-section" aria-labelledby="item-effect"><h2 id="item-effect">Effect</h2><div class="effect-list">${translateScript(item.script).map(effect => `<p>${escapeHtml(effect)}</p>`).join('') || `<p>${escapeHtml(summarizeScript(item.script))}</p>`}</div><details><summary>View server script</summary><pre><code>${escapeHtml(item.script)}</code></pre></details></section>` : ''}
    ${renderDamageEstimator(item)}
    ${(item.boosts || []).length ? `<section class="entity-section"><h2>Skills empowered</h2><div class="relation-list">${item.boosts.map(boost => `<div><strong>${escapeHtml(boost.name || boost.skill)}</strong><span>${boost.t3 ? 'Third class' : 'Up to transcendent'}</span></div>`).join('')}</div></section>` : ''}
    ${renderAcquisition(item)}
    ${(item.combos || []).length ? `<section class="entity-section"><h2>Set combinations</h2><div class="relation-list">${item.combos.map(combo => `<div><strong>${(combo.with || []).map(entry => entry.id ? `<a href="#item/${Number(entry.id)}">${escapeHtml(entry.name || entry.id)}</a>` : escapeHtml(entry.name || entry)).join(' + ')}</strong><span>${escapeHtml(summarizeScript(combo.script || ''))}</span></div>`).join('')}</div></section>` : ''}
    ${renderSibling(item, context.items)}
    ${renderOptionPool(item, context.options)}`;
  const image = article.querySelector('.entity-art img');
  emptyArt(image, article.querySelector('.entity-art-fallback'));
  const damageInput = article.querySelector('[data-damage-input]');
  damageInput?.addEventListener('input', () => updateDamageEstimate(article, damageInput.value));
  return article;
}

export function renderMonster(mob, context = {}) {
  if (!mob) return renderMissing('monster', 'Monsters');
  const article = document.createElement('article');
  article.className = 'entity-detail';
  const hp = Number(mob.hp || 0).toLocaleString();
  article.innerHTML = `
    <header class="entity-header monster-header">
      <div class="entity-art monster-art"><img src="${monsterArtUrl(mob.custom && mob.id === 31030 ? 1046 : mob.id)}" alt="" width="118" height="118"><span class="entity-art-fallback" hidden aria-hidden="true">${mob.mvp ? '♛' : '◆'}</span></div>
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
    ${renderMonsterStats(mob.stats)}
    ${renderElementMatchup(mob, context.elements)}
    ${(mob.drops || []).length ? `<section class="entity-section"><h2>Drop table</h2><div class="drop-list">${mob.drops.slice().sort((a, b) => b.rate - a.rate).map(drop => `<a href="#item/${Number(drop.id)}"><span class="drop-item"><img src="${itemIconUrl(drop.id)}" alt="" width="32" height="32"><strong>${escapeHtml(drop.name)}</strong></span>${rateVisual(drop.rate)}</a>`).join('')}</div></section>` : ''}
    ${(mob.mvpDrops || []).length ? `<section class="entity-section reward-section"><h2>MVP rewards</h2><div class="drop-list">${mob.mvpDrops.map(drop => `<a href="#item/${drop.id}"><span class="drop-item"><img src="${itemIconUrl(drop.id)}" alt="" width="32" height="32"><strong>${escapeHtml(drop.name)}</strong></span><b>${formatDropRate(drop.rate)}</b></a>`).join('')}</div></section>` : ''}
    ${(mob.spawns || []).length ? `<section class="entity-section"><h2>Where to find it</h2><div class="spawn-grid">${mob.spawns.map(spawn => `<div><strong>${escapeHtml(spawn.map)}</strong><span>${escapeHtml(spawn.amt)} on map</span></div>`).join('')}</div></section>` : '<section class="entity-section"><h2>Where to find it</h2><p class="muted-copy">No fixed spawn is recorded.</p></section>'}`;
  article.querySelectorAll('.drop-item img').forEach(image => image.addEventListener('error', () => { image.hidden = true; }, { once: true }));
  const portrait = article.querySelector('.monster-art img');
  emptyArt(portrait, article.querySelector('.monster-art .entity-art-fallback'));
  return article;
}

function renderDamageEstimator(item) {
  const amplifiers = skillAttackAmplifiers(item.script);
  if (!amplifiers.length) return '';
  return `<section class="entity-section damage-estimator"><h2>Damage estimate</h2><label>Current average skill hit <input type="number" min="0" step="1" value="1000" data-damage-input></label>${amplifiers.map(entry => { const result = estimateDamage(1000, entry.percent); return `<p><strong>${escapeHtml(entry.skill.replace(/^[A-Z]{1,3}_/, '').replaceAll('_', ' '))}</strong><span data-damage-result data-percent="${entry.percent}">${result.before.toLocaleString()} → ${result.after.toLocaleString()} (+${entry.percent}%)</span></p>`; }).join('')}</section>`;
}

function updateDamageEstimate(root, value) {
  root.querySelectorAll('[data-damage-result]').forEach(output => {
    const result = estimateDamage(value, output.dataset.percent);
    output.textContent = `${result.before.toLocaleString()} → ${result.after.toLocaleString()} (+${result.percent}%)`;
  });
}

function renderSibling(item, items = []) {
  const sibling = items.find(candidate => candidate.id !== item.id && candidate.name === item.name && candidate.slots !== item.slots);
  if (!sibling) return '';
  return `<section class="entity-section"><h2>Related version</h2><p><a href="#item/${Number(sibling.id)}">${escapeHtml(sibling.name)} [${Number(sibling.slots || 0)}]</a> is the ${Number(sibling.slots || 0) > Number(item.slots || 0) ? 'slotted' : 'unslotted'} counterpart.</p></section>`;
}

function renderOptionPool(item, options = {}) {
  const name = gearOptionGroup(item);
  const group = (options.groups || []).find(candidate => candidate.name === name);
  return group ? `<section class="entity-section"><h2>Possible random options</h2><p>Dropped copies can roll from <a href="#group/${Number(group.id)}">${escapeHtml(name.replaceAll('_', ' '))}</a>, with up to ${Number(group.maxRandom || 0)} random extras. The option count drives the floor-beam color: 3 green · 4 purple · 5 gold.</p></section>` : '';
}

function renderMonsterStats(stats) {
  if (!stats) return '';
  const values = [['STR', stats.str], ['AGI', stats.agi], ['VIT', stats.vit], ['INT', stats.int], ['DEX', stats.dex], ['LUK', stats.luk]];
  const max = Math.max(120, ...values.map(([, value]) => Number(value || 0)));
  return `<section class="entity-section"><h2>Stats</h2><div class="stat-bars">${values.map(([name, value]) => `<div><span>${name}</span><b>${Number(value || 0)}</b><i><em style="width:${Math.max(4, Math.round(Number(value || 0) / max * 100))}%"></em></i></div>`).join('')}</div></section>`;
}

function renderElementMatchup(mob, elements) {
  const rows = elementMatchups(mob.element, mob.eleLv, elements);
  return rows.length ? `<section class="entity-section"><h2>Element matchup</h2><p class="muted-copy">What to hit ${escapeHtml(mob.element)} ${Number(mob.eleLv || 1)} with.</p><div class="matchup-grid">${rows.map(row => `<span class="${row.percent > 100 ? 'is-strong' : row.percent < 100 ? 'is-weak' : ''}">${escapeHtml(row.name)} <b>${row.percent < 0 ? 'heals' : `${row.percent}%`}</b></span>`).join('')}</div></section>` : '';
}

export function translateScript(script) {
  const effects = [];
  const conditions = [];
  let depth = 0;
  let pendingCondition = '';
  let lastClosedCondition = '';
  for (const rawLine of String(script).split('\n')) {
    let line = rawLine.replace(/\/\/.*$/, '').trim();
    if (!line) continue;

    const leadingCloses = line.match(/^}+\s*/)?.[0].match(/}/g)?.length || 0;
    if (leadingCloses) {
      depth = Math.max(0, depth - leadingCloses);
      line = line.replace(/^}+\s*/, '');
      while (conditions.length && conditions.at(-1).depth > depth) lastClosedCondition = conditions.pop().label;
    }

    if (/^else\b/i.test(line)) {
      const label = lastClosedCondition ? `Otherwise (${lastClosedCondition.replace(/^If /, '').replace(/:$/, '')} is false)` : 'Otherwise';
      if (line.includes('{')) conditions.push({ label, depth: depth + 1 });
      else pendingCondition = label;
      depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      continue;
    }

    const refineMatch = /if\s*\(getrefine\(\)\s*(>=|>|<=|<|==)\s*(\d+)\s*\)/i.exec(line);
    if (refineMatch) {
      const label = refineConditionLabel(refineMatch[1], Number(refineMatch[2]));
      lastClosedCondition = label;
      const statement = line.slice((refineMatch.index || 0) + refineMatch[0].length).replace(/^\s*{?\s*/, '');
      const inlineEffect = translateBonusLine(statement);
      if (inlineEffect) effects.push(`${label}: ${inlineEffect}`);
      else if (line.includes('{')) conditions.push({ label, depth: depth + 1 });
      else pendingCondition = label;
      depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      continue;
    }

    const effect = translateBonusLine(line);
    const activeCondition = pendingCondition || conditions.at(-1)?.label || '';
    if (effect) effects.push(activeCondition ? `${activeCondition}: ${effect}` : effect);
    if (pendingCondition && effect) pendingCondition = '';

    depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    while (conditions.length && conditions.at(-1).depth > depth) lastClosedCondition = conditions.pop().label;
  }
  return effects;
}

function refineConditionLabel(operator, value) {
  if (operator === '>=') return `If refined to +${value} or higher`;
  if (operator === '>') return `If refined to +${value + 1} or higher`;
  if (operator === '<=') return `If refined to +${value} or lower`;
  if (operator === '<') return `If refined to +${Math.max(0, value - 1)} or lower`;
  return `If refined to exactly +${value}`;
}

function translateBonusLine(line) {
  const nice = value => String(value).replace(/^(RC|Ele|Size|Class|Eff)_/, '').replace('DemiHuman', 'Demi-Human').replace('Dark', 'Shadow').replaceAll('_', ' ');
  const skillName = value => String(value).replace(/^[A-Z]{1,3}_/, '').replaceAll('_', ' ');
  let match;
  if ((match = /bonus2\s+bSkillAtk,"([^"]+)",(-?\d+)/i.exec(line))) return `${skillName(match[1])} damage ${Number(match[2]) >= 0 ? '+' : ''}${match[2]}%`;
  if ((match = /bonus2\s+bSkillCooldown,"([^"]+)",(-?\d+)/i.exec(line))) return `${skillName(match[1])} cooldown ${Number(match[2]) / 1000}s`;
  if ((match = /bonus2\s+bSkillUseSP(rate)?,"([^"]+)",(-?\d+)/i.exec(line))) return `${skillName(match[2])} SP cost ${match[3]}${match[1] ? '%' : ''}`;
  if ((match = /bonus2\s+bVariableCastrate,"([^"]+)",(-?\d+)/i.exec(line))) return `${skillName(match[1])} variable cast ${match[2]}%`;
  if ((match = /bonus2\s+b(Magic)?AddRace2?,(RC_\w+),(-?\d+)/i.exec(line))) return `${match[1] ? 'Magic d' : 'D'}amage to ${nice(match[2])} race +${match[3]}%`;
  if ((match = /bonus2\s+bSubRace2?,(RC_\w+),(-?\d+)/i.exec(line))) return `Damage taken from ${nice(match[1])} race ${-Number(match[2])}%`;
  if ((match = /bonus2\s+b(Magic)?AddSize,(Size_\w+),(-?\d+)/i.exec(line))) return `${match[1] ? 'Magic d' : 'D'}amage to ${nice(match[2])} size +${match[3]}%`;
  if ((match = /bonus2\s+bSubSize,(Size_\w+),(-?\d+)/i.exec(line))) return `Damage taken from ${nice(match[1])} size ${-Number(match[2])}%`;
  if ((match = /bonus2\s+b(Magic)?AddEle,(Ele_\w+),(-?\d+)/i.exec(line))) return `${match[1] ? 'Magic d' : 'D'}amage to ${nice(match[2])} property +${match[3]}%`;
  if ((match = /bonus2\s+bSubEle,(Ele_\w+),(-?\d+)/i.exec(line))) return `${nice(match[1])} resistance +${match[2]}%`;
  if ((match = /bonus2\s+b(Magic)?AddClass,(Class_\w+),(-?\d+)/i.exec(line))) return `${match[1] ? 'Magic d' : 'D'}amage to ${nice(match[2])} +${match[3]}%`;
  if ((match = /bonus2\s+bSubClass,(Class_\w+),(-?\d+)/i.exec(line))) return `Damage taken from ${nice(match[1])} ${-Number(match[2])}%`;
  if ((match = /bonus2\s+bResEff,(Eff_\w+),(-?\d+)/i.exec(line))) return `${nice(match[1])} resistance +${Number(match[2]) / 100}%`;
  if ((match = /bonus2\s+bAddEff(WhenHit)?,(Eff_\w+),(-?\d+)/i.exec(line))) return `${Number(match[3]) / 100}% chance to inflict ${nice(match[2])}${match[1] ? ' when hit' : ''}`;
  if ((match = /bonus2\s+bSkillHeal2?,"([^"]+)",(-?\d+)/i.exec(line))) return `${skillName(match[1])} healing +${match[2]}%`;
  if ((match = /bonus2\s+b(HP|SP)DrainValue,(-?\d+)/i.exec(line))) return `Recover ${match[2]} ${match[1].toUpperCase()} per attack`;
  if ((match = /bonus2\s+bExpAddRace,(RC_\w+),(-?\d+)/i.exec(line))) return `EXP from ${nice(match[1])} race +${match[2]}%`;
  if ((match = /bonus2\s+bDropAddRace,(RC_\w+),(-?\d+)/i.exec(line))) return `Drop rate from ${nice(match[1])} race +${Number(match[2]) / 100}%`;
  if ((match = /bonus3\s+bAutoSpell\w*,"([^"]+)",(\d+),(\d+)/i.exec(line))) return `${Number(match[3]) / 100}% chance to autocast ${skillName(match[1])} Lv${match[2]}`;

  const flat = { bStr: 'STR', bAgi: 'AGI', bVit: 'VIT', bInt: 'INT', bDex: 'DEX', bLuk: 'LUK', bAllStats: 'All Stats', bMaxHP: 'Max HP', bMaxSP: 'Max SP', bBaseAtk: 'ATK', bAtk: 'ATK', bMatk: 'MATK', bDef: 'DEF', bMdef: 'MDEF', bCritical: 'Critical', bHit: 'Hit', bFlee: 'Flee', bFlee2: 'Perfect Dodge', bAspd: 'ASPD' };
  const percent = { bMaxHPrate: 'Max HP', bMaxSPrate: 'Max SP', bAtkRate: 'ATK', bMatkRate: 'MATK', bAspdRate: 'ASPD', bDefRate: 'DEF', bCritAtkRate: 'Critical Damage', bHealPower: 'Heal Power', bHealPower2: 'Healing Received', bLongAtkRate: 'Ranged Damage', bHPrecovRate: 'HP Recovery', bSPrecovRate: 'SP Recovery', bVariableCastrate: 'Variable Cast', bFixedCastrate: 'Fixed Cast', bDelayrate: 'After-cast Delay', bUseSPrate: 'SP Cost' };
  if ((match = /bonus\s+(b\w+),(-?\d+)/i.exec(line))) {
    const [, key, rawValue] = match;
    const value = Number(rawValue);
    if (flat[key]) return `${flat[key]} ${value >= 0 ? '+' : ''}${value}`;
    if (percent[key]) return `${percent[key]} ${value >= 0 ? '+' : ''}${value}%`;
    if (key === 'bNearAtkDef') return `Melee damage taken -${value}%`;
    if (key === 'bLongAtkDef') return `Ranged damage taken -${value}%`;
    if (key === 'bMagicAtkDef') return `Magic damage taken -${value}%`;
    return `${nice(key.replace(/^b/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2'))} ${value >= 0 ? '+' : ''}${value}${/Rate$/.test(key) ? '%' : ''}`;
  }
  const flags = { bUnbreakableWeapon: 'Weapon is indestructible', bUnbreakableArmor: 'Armor is indestructible', bUnbreakableHelm: 'Headgear is indestructible', bUnbreakableShield: 'Shield is indestructible', bNoSizeFix: 'Ignores the size damage penalty', bNoCastCancel: 'Casting cannot be interrupted', bNoWalkDelay: 'No movement delay when hit', bNoKnockback: 'Immune to knockback' };
  if ((match = /bonus\s+(b\w+)/i.exec(line))) return flags[match[1]] || '';
  return '';
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
