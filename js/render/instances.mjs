import { escapeHtml, formatDropRate, itemIconUrl } from './entities.mjs';

const challengeTiers = [
  { name: 'Normal', hp: '×1', atk: '100%', defense: '100%', rewards: '100%', points: '100%' },
  { name: 'Hard', hp: '×2', atk: '130%', defense: '120%', rewards: '150%', points: '200%' },
  { name: 'Nightmare', hp: '×3', atk: '165%', defense: '145%', rewards: '200%', points: '400%' },
];

const ITEM_NAMES = new Map(Object.entries({
  4601: 'Amdarais Card', 617: 'Old Purple Box', 6607: 'Temporal Crystal', 6608: 'Coagulated Spell', 6755: 'Contaminated Magic',
  15117: "Felrock's Armor", 40982: 'Cloak Emblem', 22047: "Felrock's Boots", 19144: "Ferlock's Hat", 12072: 'Whole Roast', 12087: 'Steamed Alligator with Vegetable', 12077: 'Special Royal Jelly Herbal Tea', 27182: 'Felock Card', 607: 'Yggdrasil Berry', 608: 'Yggdrasil Seed',
  6499: 'Ancient Grudge', 969: 'Gold', 4591: 'Bakonawa Card', 4590: 'Bangungot Card', 4592: 'Buwaya Card', 6517: 'Bangungot Doll', 6524: "Piece of Bangungot's Spirit", 2491: 'Bangungot Boots of Nightmare', 2169: 'Kalasag', 6518: 'Buwaya Doll', 6525: "Piece of Buwaya's Spirit", 2590: 'Buwaya Sack Cloth',
  13441: 'Thanos Sword', 21009: 'Thanos Great Sword', 1438: 'Thanos Spear', 1496: 'Thanos Long Spear', 1669: 'Thanos Staff', 2023: 'Thanos Two-Handed Staff', 18119: 'Thanos Bow', 13093: 'Thanos Dagger', 28000: 'Thanos Katar', 1836: 'Thanos Knuckle', 16028: 'Thanos Hammer', 28100: 'Thanos Axe', 1933: 'Thanos Violin', 1988: 'Thanos Whip', 2187: 'Shield of Gray', 15090: 'Armor of Gray', 15091: 'Gray Robe', 20721: 'Cloak of Gray', 22033: 'Boots of Gray', 18820: 'Gray Helmet', 27184: 'Knight Sakray Card',
}).map(([id, name]) => [Number(id), name]));

const temporalTables = [
  { title: 'Fourth-slot enchant ladder', columns: ['Family', 'Best match', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'], rows: [
    ['Fighting Spirit', 'STR', '+15 ATK, +5 Hit', '+18 ATK, +5 Hit', '+21 ATK, +5 Hit', '+24 ATK, +5 Hit'],
    ['Archery', 'DEX', '+2% ranged damage', '+4% ranged damage', '+6% ranged damage', '+8% ranged damage'],
    ['Spell', 'INT', '+9 MATK, -6% cast', '+12 MATK, -8% cast', '+15 MATK, -10% cast', '+18 MATK, -10% cast'],
    ['Vitality', 'VIT', '+2 VIT', '+3 VIT', '+1% Max HP', '+2% Max HP'],
    ['Attack Speed', 'AGI', '+4% ASPD', '+6% ASPD', '+8% ASPD', '+10% ASPD'],
    ['Lucky', 'LUK', '+3 LUK', '+4 LUK', '+5 LUK', '+6 LUK'],
  ] },
  { title: 'Third-slot random bonus effect', columns: ['Card', 'Proc chance', 'Buff', 'Active drain', 'Unequip tax'], rows: [
    ["Bear's Power", '20% weapon hit', '5s: +200 STR', '5% Max HP/sec', '300 HP'],
    ['Runaway Magic', '15% magic cast', '10s: +200 INT', '2% Max SP/sec', '2,000 HP'],
    ['Speed of Light', '10% weapon hit', '5s: +100% ASPD, +100 Flee', '5% Max SP/sec', '300 HP'],
    ['Muscle Fool', '20% weapon hit', '5s: +1000 DEF', '5% Max SP/sec', '300 HP'],
    ['Hawkeye', '30% weapon hit', '5s: +200 DEX', '5% Max SP/sec', '300 HP'],
    ['Lucky Day', '15–16% any hit', '5s: +200 LUK and rare-drop luck', 'None', '300 HP'],
  ] },
];

const thanosRows = [
  [13441, '1H Sword', 'Grand Cross +200%, Sacrifice +160%, Acid Terror +180%', 'Paladin / Creator'], [21009, '2H Sword', 'Bowling Bash +200%', 'Lord Knight'], [1438, '1H Spear', 'Spiral Pierce +180%, Holy Cross +100%', 'Lord Knight / Paladin'], [1496, '2H Spear', 'Brandish Spear +200%, Holy Cross +200%', 'Knight / Paladin'], [1669, 'Staff', 'Magnus Exorcismus +180%, Heal Power +30, HP/SP regen proc', 'High Priest'], [2023, '2H Staff', 'Meteor Storm, Lord of Vermilion, Storm Gust +150%; +10% MATK', 'High Wizard'], [18119, 'Bow', 'Sharp Shooting +200%, Double Strafe +150%', 'Sniper'], [13093, 'Dagger', 'Soul Breaker +220%, five damage traps +150%', 'Assassin Cross / trap Sniper'], [28000, 'Katar', 'Sonic Blow +200%, Meteor Assault +180%', 'Assassin Cross'], [1836, 'Knuckle', 'Chain Crush +200%, Tiger Knuckle Fist +180%', 'Champion'], [16028, 'Mace', 'Top one-hand ATK/MATK and lifesteal', 'Any Mace class'], [28100, '2H Axe', 'Cart Termination +200%', 'Whitesmith'], [1933, 'Instrument', 'Tarot Card +200%, Arrow Vulcan +150%', 'Clown'], [1988, 'Whip', 'Arrow Vulcan +150%', 'Gypsy'],
].map(([id, ...values]) => [`<a href="#item/${id}">${ITEM_NAMES.get(id)}</a>`, ...values]);

const grayRows = [
  [2187, 'Shield', 'Holy resistance 30 + refine; scaling MDEF'], [15090, 'Heavy body', '+10 MDEF; refine-scaling Holy resistance'], [15091, 'Light body', 'Refine-scaling Holy resistance'], [20721, 'Garment', 'Refine-scaling Holy resistance'], [22033, 'Shoes', 'Refine-scaling Holy resistance'], [18820, 'Headgear', 'Refine-scaling Holy resistance'], [27184, 'Special card · 10,000 shards', '+20 ATK; +30% damage to Demon and Undead'],
].map(([id, ...values]) => [`<a href="#item/${id}">${ITEM_NAMES.get(id)}</a>`, ...values]);

const instances = [
  {
    slug: 'amdarais', name: 'Old Glast Heim — Amdarais', kind: 'Flagship raid', level: 99, hp: 7500000, npc: 'Hugin', npcSprite: '4_M_SAGE_C.gif', location: 'Eden HQ entrance hall, just north of where you arrive', map: 'Old Glast Heim — the castle, then its second floor', availability: '1/day · VIP +1', party: 'Solo or party; a solo player must organize a party of one.', extraEntry: '1 Summon Scroll, 30 Valor Coin, or 8 Hunter Coin. Challenge Tier never costs an extra entry.', fastMode: 'Fast Mode trims dialogue only; every sector, rescue, boss, and both Commanders still occur.', tiers: challengeTiers,
    summary: 'Three besieged sectors, the Root of Corruption, twin guardian wings, and Amdarais’s reinforcement-heavy finale.',
    mechanics: [
      'Report to Sir Varmundt at the gate, then convince Sir Heinrich while his corrupted Khalitzburg and Abysmal Knight honor guard comes alive.',
      'Clear the west chapel and rescue Altar boy Domun. In the east refinery, avoid maggot swarms from the bodies and reach Holgren the Destroyer. Break the north courtyard garrison last.',
      'Defeat the Root of Corruption to reach the second floor. Clear the west and east wings; each can call its Commander of Destruction during the fight.',
      'Amdarais calls a new Khalitzburg, Abysmal Knight, Bloody Knight, or archer wave every 10% HP lost and heals while any reinforcement remains alive.',
      'Four Varmundt’s Ghost stations rotate with his HP, granting a shield, attack opening, heal/resource surge, or defensive ward.',
      'The first clear opens a hidden treasure room with gemstone caches and bonus enchanting material.',
    ],
    reward: 'Every clear guarantees 45% of the next Base and Job EXP bars plus Valor Coin, Hunter Coin, and MVP Points. Hard scales coins/EXP ×1.5 and points ×2; Nightmare scales coins/EXP ×2 and points ×4. Drop rates and cards never scale.',
    drops: [
      { id: 4601, rate: 1, note: 'Amdarais Card: +15% all-class damage and +15% MATK; drains 666 HP every 4 seconds.' },
      { id: 617, rate: 3000, note: 'Classic equipment, card, and consumable loot box.' },
      { id: 6607, rate: 150, note: 'Core Temporal Boots crafting material.' },
      { id: 6608, rate: 300, note: 'Temporal Boots enchant material.' },
      { id: 6755, rate: 50, note: 'Deeper Dark magic master enchant material.' },
    ],
    mvpDrops: [{ id: 617, rate: 5000, note: 'Separate MVP bonus roll for an Old Purple Box.' }],
    tables: temporalTables,
    extra: 'Temporal Boots chain: Amdarais drops Temporal Crystal at about 1.5%. Hugin’s Butler trades 1 crystal for base boots, then 5 more to convert them to STR/INT/AGI/VIT/DEX/LUK boots (refine resets). Hugin’s Magician applies a chosen four-tier enchant family for 1 / 4 / 15 / 30 Coagulated Spell; this unslotted ladder never fails. Hugin’s Craftsman sockets them for 5 crystals at 50% success—failure destroys the boots and every enchant. Slotted boots continue with the Dark magic master using Coagulated Spell, Contaminated Magic, and 100,000 zeny per attempt: tier one succeeds, later tiers and the final random bonus-effect roll are 70%, with failure destroying the boots. Portrait Collector exchanges White Knight Card for 3,000 Coagulated Spell OR 70 Contaminated Magic, and Khalitzburg Knight Card for 5,000 OR 100; these exchanges have no RNG.',
  },
  {
    slug: 'ferlock', name: 'Assault on the Airship — Captain Ferlock', kind: 'Flagship raid', level: 99, hp: 6500000, npc: 'Sky Warden', npcSprite: '4_M_JOB_KNIGHT1.gif', location: 'Eden HQ entrance hall, just north of where you arrive', map: 'The airship’s upper deck and engine room', availability: '1/day · VIP +1', party: 'Solo or party; solo play needs no extra steps.', extraEntry: '1 Summon Scroll, 30 Valor Coin, or 8 Hunter Coin. Challenge Tier never costs an extra entry.', tiers: challengeTiers,
    summary: 'Defend both decks, cut down a Wyvern gatekeeper, and corner the colossal Dragon commander of the ship.',
    mechanics: [
      'Loki and Fenrir wave you aboard. Ferlock explains the Tear of Ymir engine before Gremlins storm the ship.',
      'Clear Rotar Zairo and Beholders, then Gremlins and Acidus on the top deck. Descend after the engine is damaged and clear two more lower-deck waves.',
      'Shiva, Basara, and Laksmi crash Arcana’s fight. Defeat the Wyvern miniboss and the Gremlins behind it before Ferlock returns.',
      'At 75% HP, two Sky Sentinels appear; Ferlock heals every few seconds while either lives.',
      'At 40% HP he gains +30% ATK and breathes fire at a chosen player’s exact tile roughly every 10 seconds. Use the cast bar to dodge.',
      'The tier timers are 10/8/6 min for Normal/Hard/Nightmare. Timing out adds another permanent +20% ATK.',
    ],
    reward: 'Every clear guarantees 45% of the next Base and Job EXP bars plus tier-scaled coins and MVP Points. The closing scene adds 100,000 Base / 65,000 Job EXP. Item rates and the Ferlock Card remain fixed.',
    drops: [
      { id: 15117, rate: 100, note: 'Refine-scaling HP, SP, MDEF, and All Stats armor.' },
      { id: 40982, rate: 100, note: 'Cloak Emblem—exchange with Sky Warden for one cape, with no RNG.' },
      { id: 22047, rate: 100, note: 'Refine-scaling ASPD boots, reaching +1 ASPD at +10.' },
      { id: 19144, rate: 1000, note: 'One-slot headgear.' },
      { id: 12072, rate: 3000, note: '20-minute STR food and instant healing.' },
      { id: 12087, rate: 3000, note: '20-minute AGI food and instant healing.' },
      { id: 12077, rate: 3000, note: '20-minute INT food and instant healing.' },
      { id: 27182, rate: 1, note: 'Ferlock Card: +30 ATK/MATK and +15% physical and magic Dragon damage.' },
    ],
    mvpDrops: [{ id: 607, rate: 5000, note: 'Separate MVP roll: full HP and SP restoration.' }, { id: 608, rate: 5000, note: 'Separate MVP roll: half HP and SP restoration.' }],
    extra: 'Cloak Emblem choices: spellcaster cape (cast-time cuts and MATK), physical cape (Flee and ASPD), or neutral hybrid cape. All three grant 10% Neutral resistance, one slot, and require level 99.',
  },
  {
    slug: 'ghostpalace', name: 'Ghost Palace — Reliquary Warden', kind: 'Flagship raid', level: 99, hp: 8500000, npc: 'Palace Keeper', npcSprite: '4_F_VALKYRIE.gif', location: 'Eden HQ entrance hall, just north of where you arrive', map: 'Ghost Palace — five floors, then the reliquary depths', availability: '1/day · VIP +1', party: 'Solo or party; any party member can start it.', extraEntry: '1 Summon Scroll, 30 Valor Coin, or 8 Hunter Coin.', fastMode: 'Fast Mode skips dialogue waits only; all five floors and fights remain.', tiers: challengeTiers,
    summary: 'Sakray’s five-floor tragedy ends with a choice: leave after the story, or challenge the optional Reliquary Warden.',
    mechanics: [
      'Floor 1 brings three Cursed Soldier and Gatekeeper waves while the King asks you to guard Princess Tiara.',
      'Floor 2 tells of Tiara’s forced marriage through three waves of Broken Promise, Floating Sorrow, and Unfulfilled Love.',
      'On floor 3, Magic Sword Tartanos reveals itself. Two waves lead into a 35-monster swarm as floor 4 opens.',
      'Floor 4 has two waves, the royal aftermath, and a real Torturous Redeemer mid-boss with Sweet Slaughter.',
      'Floor 5 closes Tiara’s story with three waves, Sakray, and the final words of the palace ghosts.',
      'The optional Warden summons healing reinforcements at 75% HP, enrages with ice breath at 40%, and periodically gains a Reliquary Ward. Kill both Anchor Wisps before it completes or the boss regains 3% HP.',
    ],
    reward: 'The first story exit awards 900,000 Base / 500,000 Job EXP plus 2 Gray Shard; repeats award 1 shard. The Warden guarantees tier-scaled EXP, coins, and points plus 40 (Normal) / 80 (Hard) / 150 (Nightmare) Gray Shard.',
    drops: [{ id: 617, rate: 6000, note: 'MVP-exclusive classic equipment, card, and consumable loot box.' }],
    tables: [
      { title: 'Thanos weapons · 200 Gray Shard each', columns: ['Weapon', 'Subtype', 'Signature effects', 'Classes'], rows: thanosRows, html: true },
      { title: 'Gray armor · 100 shards each & special exchange', columns: ['Item', 'Slot / cost', 'Effect'], rows: grayRows, html: true },
    ],
    extra: 'Gray Shard exchange: 14 Thanos weapon subtypes cost 200 shards each; the five-piece Gray armor line costs 100 shards per piece; Knight Sakray Card costs 10,000 shards. Thanos weapons provide lifesteal and class-focused skill power but drain 100 HP every 10 seconds while equipped.',
  },
  {
    slug: 'bakonawa', name: 'Bakonawa Lake', kind: 'Malaya hunt', level: 85, bossLevel: 92, hp: 2900000, npc: 'Taho', npcSprite: '4_M_OILMAN.gif', location: 'Eden HQ entrance hall, next to the flagship recruiters', map: 'Bakonawa Lake', availability: '1 clear · 24-hour cooldown', party: 'Solo or party; solo players become their own party leader.', summary: 'A three-phase drum ritual against a moon-eating dragon.',
    mechanics: ['Talk to Taho at the water’s edge to begin.', 'Phase 1 has a 10-minute clock and Bakonawa’s Will hazards. Bring the boss low before it dives.', 'Phase 2 gives five minutes to destroy two Caldrons and two Gongs while Enraged Bakonawa interferes.', 'Phase 3 is a final 10-minute stand; Wakwak puppets grow from 10 to 50 as time runs down.', 'Open the treasure box and report to Taho after the kill.'],
    reward: 'Phase 3 pays 1,600,000 Base EXP / 1,750,000 Job EXP. Taho adds 100,000 EXP and 5 Ancient Grudge, or 7 with VIP.', drops: [{ id: 6499, rate: 10000, note: 'Guaranteed Ancient Grudge from the treasure box.' }, { id: 969, rate: 1, note: 'Rare zeny jackpot.' }, { id: 4591, rate: 1, note: 'Bakonawa Card: +4 STR and a bleeding proc.' }, { id: 617, rate: 3000, note: 'MVP bonus loot box.' }],
  },
  {
    slug: 'bangungot', name: 'Bangungot Hospital', kind: 'Malaya hunt', level: 85, bossLevel: 93, hp: 2500000, npc: 'Nurse Maenne', npcSprite: '1_F_04.gif', location: 'Eden HQ entrance hall, next to the flagship recruiters', map: 'Bangungot Hospital, second floor', availability: '1 clear · 24-hour cooldown', party: 'Solo or party.', summary: 'Six haunted wards lead to a heal-race against Bangungot’s own spirit.',
    mechanics: ['Mangkukulam ambushes the party on entry.', 'Clear six wards of undead; the last includes a Manananggal.', 'At low HP, Bangungot retreats through shifting warp tiles and curses another ward.', 'Clear the curse-touched ward to reveal the Pillar of Spirit.', 'Destroy the low-HP Pillar in about 30 seconds or it fully heals Bangungot and restarts the fight.'],
    reward: 'A clear pays 1,200,000 Base EXP / 1,300,000 Job EXP / 500,000 MVP EXP and guaranteed Ancient Grudge.', drops: [{ id: 6499, rate: 10000, note: 'Guaranteed Ancient Grudge.' }, { id: 6517, rate: 2000, note: 'Bangungot Doll.' }, { id: 6524, rate: 2000, note: 'Piece of Bangungot’s spirit.' }, { id: 2491, rate: 1000, note: 'Refine-scaling MDEF boots with a speed bonus at +14.' }, { id: 2169, rate: 100, note: 'Kalasag shield with refine-scaling Boss resistance.' }, { id: 4590, rate: 1, note: 'Bangungot Card: +4 INT and sleep proc.' }, { id: 617, rate: 3000, note: 'MVP bonus loot box.' }],
  },
  {
    slug: 'buwaya', name: 'Buwaya Cave', kind: 'Malaya hunt', level: 85, bossLevel: 99, hp: 2500000, npc: 'Buwaya Cave Warden', npcSprite: '4_M_JOB_KNIGHT1.gif', location: 'Eden HQ entrance hall, next to the flagship recruiters', map: 'Buwaya’s cave', availability: '1 clear · 23-hour cooldown', party: 'Solo or party.', summary: 'Break hit-count armor, use captive buffs, and identify the real crocodile god among decoys.',
    mechanics: ['Buwaya waits beside kidnapped villagers on entry.', 'When the trap warning appears, break both exposed Weakness points with 20 solid hits apiece—damage does not matter.', 'Breaking them in time opens a chance to speak with captives for a buff.', 'Four decoy Buwayas arrive after about a minute and periodically thereafter; only the original counts.', 'Defeat the original to free the villagers.'],
    reward: 'A clear pays 1,100,000 Base EXP / 1,150,000 Job EXP / 600,000 MVP EXP and guaranteed Ancient Grudge.', drops: [{ id: 6499, rate: 10000, note: 'Guaranteed Ancient Grudge.' }, { id: 6518, rate: 2000, note: 'Buwaya Doll.' }, { id: 6525, rate: 2000, note: 'Piece of Buwaya’s spirit.' }, { id: 2590, rate: 1000, note: 'Heal power and elemental resistance garment.' }, { id: 2169, rate: 100, note: 'Kalasag shield with refine-scaling Boss resistance.' }, { id: 4592, rate: 1, note: 'Buwaya Card: +4 VIT and stone curse proc.' }, { id: 617, rate: 5500, note: 'MVP bonus loot box.' }],
  },
];

function tierTable(tiers) {
  if (!tiers?.length) return '';
  return `<section><p class="eyebrow">Difficulty</p><h2>Challenge Tiers</h2><div class="data-table-wrap"><table><thead><tr><th>Tier</th><th>Boss HP</th><th>ATK</th><th>DEF/MDEF</th><th>Coin & EXP</th><th>MVP Points</th></tr></thead><tbody>${tiers.map(tier => `<tr><th>${tier.name}</th><td>${tier.hp}</td><td>${tier.atk}</td><td>${tier.defense}</td><td>${tier.rewards}</td><td>${tier.points}</td></tr>`).join('')}</tbody></table></div><p class="muted-copy">Harder tiers scale guaranteed rewards, never item or card drop rates.</p></section>`;
}

function dropTable(drops = [], title = 'Drop table') {
  return drops.length ? `<section><p class="eyebrow">Complete rewards</p><h2>${escapeHtml(title)}</h2><div class="drop-list">${drops.map(drop => `<a href="#item/${Number(drop.id)}"><span class="drop-item"><img src="${itemIconUrl(drop.id)}" alt="" width="32" height="32" loading="lazy"><span><strong>${escapeHtml(ITEM_NAMES.get(Number(drop.id)) || `Item ${Number(drop.id)}`)}</strong><small>${escapeHtml(drop.note)}</small></span></span><b>${formatDropRate(drop.rate)}</b></a>`).join('')}</div></section>` : '';
}

function detailTables(tables = []) {
  return tables.map(table => `<section><p class="eyebrow">Detailed reference</p><h2>${escapeHtml(table.title)}</h2><div class="data-table-wrap"><table><thead><tr>${table.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map((cell, index) => `${index === 0 ? '<th>' : '<td>'}${table.html ? cell : escapeHtml(cell)}${index === 0 ? '</th>' : '</td>'}`).join('')}</tr>`).join('')}</tbody></table></div></section>`).join('');
}

export function renderInstances(slug = null) {
  const selected = slug ? instances.find(instance => instance.slug === slug) : null;
  if (selected) return renderInstance(selected);
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page';
  page.innerHTML = `<header class="wiki-masthead editorial-masthead"><div class="container"><p class="eyebrow">Endgame adventures</p><h1>Instances with a story to tell</h1><p>Three staged flagship raids and three shorter Malaya hunts, with every requirement, encounter beat, and reward preserved.</p></div></header><div class="container instance-grid">${instances.map(instance => `<a href="#instance/${instance.slug}"><span class="instance-npc"><img src="assets/npcs/${instance.npcSprite}" alt="" loading="lazy"></span><p class="eyebrow">${instance.kind}</p><h2>${escapeHtml(instance.name)}</h2><p>${escapeHtml(instance.summary)}</p><dl><div><dt>Level</dt><dd>${instance.level}+</dd></div><div><dt>Boss HP</dt><dd>${(instance.hp / 1000000).toFixed(1)}M</dd></div><div><dt>Entry</dt><dd>${escapeHtml(instance.availability)}</dd></div></dl><strong>View full guide →</strong></a>`).join('')}</div>`;
  return page;
}

function renderInstance(instance) {
  const page = document.createElement('section');
  page.className = 'wiki-page editorial-page instance-detail-page';
  page.innerHTML = `<header class="wiki-masthead instance-masthead"><div class="container"><a class="back-link" href="#instances">← All instances</a><p class="eyebrow">${instance.kind}</p><h1>${escapeHtml(instance.name)}</h1><p>${escapeHtml(instance.summary)}</p><dl class="instance-facts"><div><dt>Required level</dt><dd>${instance.level}+</dd></div><div><dt>Boss level / HP</dt><dd>${instance.bossLevel || instance.level} · ${instance.hp.toLocaleString()}</dd></div><div><dt>Availability</dt><dd>${escapeHtml(instance.availability)}</dd></div></dl></div></header><div class="container instance-article"><aside><img src="assets/npcs/${instance.npcSprite}" alt="" loading="lazy"><p class="eyebrow">Entry NPC</p><h2>${escapeHtml(instance.npc)}</h2><p>${escapeHtml(instance.location)}</p><p><strong>Map:</strong> ${escapeHtml(instance.map)}</p></aside><article><section><p class="eyebrow">Requirements</p><h2>How to enter</h2><p>${escapeHtml(instance.party)}</p>${instance.extraEntry ? `<p>${escapeHtml(instance.extraEntry)}</p>` : ''}${instance.fastMode ? `<p>${escapeHtml(instance.fastMode)}</p>` : ''}</section>${tierTable(instance.tiers)}<section><p class="eyebrow">Walkthrough</p><h2>How the encounter unfolds</h2><ol class="walkthrough">${instance.mechanics.map((step, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><p>${escapeHtml(step)}</p></li>`).join('')}</ol></section><section class="reward-callout"><p class="eyebrow">Guaranteed payout</p><h2>What you take home</h2><p>${escapeHtml(instance.reward)}</p></section>${dropTable(instance.drops)}${dropTable(instance.mvpDrops, 'MVP-exclusive bonus rolls')}${instance.extra ? `<section><p class="eyebrow">Exchange & crafting</p><h2>What the materials unlock</h2><p>${escapeHtml(instance.extra)}</p></section>` : ''}${detailTables(instance.tables)}</article></div>`;
  page.querySelectorAll('.drop-item img').forEach(image => image.addEventListener('error', () => { image.hidden = true; }, { once: true }));
  return page;
}
