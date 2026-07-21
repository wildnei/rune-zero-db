// ============================================================================
//  Rune Zero — game DB extractor
//  Parses the rAthena item/mob YAML DBs (stock db/pre-re + our custom import) into lean
//  JSON the website consumes: items.json, mobs.json, meta.json.
//  Server is PRE-RENEWAL (switched 2026-07-09) — stock reads point at db/pre-re/, NOT
//  db/re/. Exception: item_randomopt_db/group have no pre-re file, read from db/import only.
//  Builds the item<->monster DROP cross-reference both ways.
//  Run: node wiki/tools/build-db.js   (from project root)
// ============================================================================
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');   // tolerant of rAthena's duplicate keys (uniqueKeys:false)
const { mergeLedgers, parseBarters, parseNpcScript } = require('./acquisition');

const ROOT = path.resolve(__dirname, '..', '..');
// Server runs PRE-RENEWAL (switched 2026-07-09, patch 0017 #define PRERE) — stock db/npc
// load from db/pre-re/ + npc/pre-re/ at compile time, so the wiki must read stock data
// from there too. db/re/ is kept on disk (dormant) but is NOT what the live server loads.
// A few stock files exist ONLY under db/re (no pre-re counterpart) — those are read
// straight from db/import instead (see item_randomopt_db/group below).
const PRE = path.join(ROOT, 'server', 'rathena', 'db', 'pre-re');
const CUSTOM = path.join(ROOT, 'custom', 'db-import');
// The progression generator needs one clean catalog without its own generated
// overlay.  Keep that bootstrap path explicit so normal wiki builds are
// unchanged and the generator never has to rename shared files on disk.
const OUT = process.env.RZ_WIKI_OUT
  ? path.resolve(process.env.RZ_WIKI_OUT)
  : path.join(ROOT, 'wiki', 'data');
const SKIP_SKILL_PROGRESSION = process.env.RZ_SKIP_SKILL_PROGRESSION === '1';

function load(file) {
  if (!fs.existsSync(file)) { console.warn('skip (missing):', file); return []; }
  const doc = YAML.parse(fs.readFileSync(file, 'utf8'), { uniqueKeys: false, maxAliasCount: -1 });
  return (doc && doc.Body) || [];
}

// ---- items -----------------------------------------------------------------
const itemFiles = [
  path.join(PRE, 'item_db_equip.yml'),
  path.join(PRE, 'item_db_usable.yml'),
  path.join(PRE, 'item_db_etc.yml'),
  path.join(CUSTOM, 'item_db.yml'),         // custom items + box overrides
  path.join(CUSTOM, 'item_db_equip.yml'),   // F11 trophy rebalances
  path.join(CUSTOM, 'item_db_essence.yml'), // class essences
  path.join(CUSTOM, 'item_db_alchemist_weapons.yml'), // 2026-07-11: Sword/Mace bSkillAtk love for Bomb/Acid Terror
  path.join(CUSTOM, 'item_db_eden_weapons.yml'), // Eden badge weapons
  path.join(CUSTOM, 'item_db_eden.yml'),         // Eden badge accessories/armor
  path.join(CUSTOM, 'item_db_gems.yml'),         // Rune Socketing gems (e.g. 40902 Rune of Might)
  path.join(CUSTOM, 'item_db_enchantstones.yml'),// enchant-group-37 rescue stones
  path.join(CUSTOM, 'item_db_growing.yml'),      // Memorial Growing Gear set
  path.join(CUSTOM, 'item_db_memorial.yml'),     // memorial dungeon gear
  path.join(CUSTOM, 'item_db_prestige.yml'),     // prestige costumes
  path.join(CUSTOM, 'item_db_cash.yml'),         // cash-shop cosmetics + bundles (merged last)
  path.join(CUSTOM, 'item_db_hubfix.yml'),       // Fortune Vault Use-tab refine package
  path.join(CUSTOM, 'item_db_featured.yml'),     // Featured Build Feast — NEW item 40960 (regular custom, not funmod)
  path.join(CUSTOM, 'item_db_advanced.yml'),         // 2026-07-11: Orlean's set rescue/fix + Abyss Dress (rescued RE-only items)
  path.join(CUSTOM, 'item_db_advanced_weapons.yml'), // 2026-07-11: Advanced Gear trans-class-skill weapons 40985-40990
  path.join(CUSTOM, 'item_db_oldglastheim.yml'),     // 2026-07-13: Amdarais_Card (4601) rescue — Old Glast Heim flagship boss reward
  path.join(CUSTOM, 'item_db_ghostpalace.yml'),      // 2026-07-13: Thanos_* weapon line (13) + Gray armor set + Knight_Sakray_Card + Gray_Shard rescue — Ghost Palace exchange
  path.join(CUSTOM, 'item_db_ferlock.yml'),          // 2026-07-13: Felock_Armor/Cape/Boots/Cap_/Card rescue — Ferlock Ship flagship boss reward
  path.join(CUSTOM, 'item_db_bakonawa.yml'),         // 2026-07-17: Bakonawa_Card rescue - Bakonawa Lake official port
  path.join(CUSTOM, 'item_db_bangungot.yml'),        // 2026-07-17: Bangungot gear/card/mats rescue - Bangungot Hospital official port
  path.join(CUSTOM, 'item_db_buwaya.yml'),           // 2026-07-17: Buwaya gear/card/mats rescue - Buwaya Cave official port
  path.join(CUSTOM, 'item_db_funmods.yml'),         // fun-mod skill-amp overrides (accessories/armor)
  path.join(CUSTOM, 'item_db_funmods_weapons.yml'), // fun-mod skill-amp overrides (weapons, batch 2)
  path.join(CUSTOM, 'item_db_funmods2.yml'),        // fun-mod skill-amp overrides, batch 3: elemental garments/shields + headgear wave 2
  path.join(CUSTOM, 'item_db_funmods_hats.yml'),    // curated obsolete-headgear class/build identity pass
  path.join(CUSTOM, 'item_db_funmods_cards.yml'),   // fun-mod skill-amp overrides, batch 3: low-tier card Script overrides (Type:Card stock items, same merge path)
  path.join(CUSTOM, 'item_db_funmods_lifesteal.yml'), // fun-mod overrides, batch 4: bHPDrainRate vampiric daggers (Dirk/Stiletto/Damascus) — NEW mechanic axis, not bSkillAtk. NOTE: FUNMOD_FAMILIES below has no Dirk/Stiletto/Damascus entries yet — the assertion at the bottom of this file WILL fail until those are added (flagged, not fixed, per this task's scope).
  path.join(CUSTOM, 'item_db_masteries.yml'),       // PvE Mastery inverse-curve weapons + normal cards
  ...(SKIP_SKILL_PROGRESSION ? [] : [
    path.join(CUSTOM, 'item_db_skill_progression.yml'), // generated final inverse-curve weapon overlay
  ]),
  path.join(CUSTOM, 'item_db_enchantcards.yml'),       // Enchant Stone cards and crafting materials
  path.join(CUSTOM, 'item_db_temporal_enchants.yml'),  // rescued Temporal Boots enchant cards
  // NOT read: item_db_dropbeams.yml (flag-only DropEffect overrides, no displayable
  // fields — merging it is a no-op for existing items and can't create phantom ones,
  // since itemArr is filtered to i.name at write time).
  // NOT read: item_enchant.yml — different schema (ITEM_ENCHANT_DB, not ITEM_DB).
];

// Keep the player database aligned with the live server import chain. Files
// explicitly ignored here must be metadata-only overlays with no fields the
// wiki displays. Any new item import otherwise has to be added above.
const ignoredServerItemImports = new Set(['item_db_dropbeams.yml']);
const serverItemRoot = fs.readFileSync(path.join(CUSTOM, 'item_db.yml'), 'utf8');
const serverItemImports = [...serverItemRoot.matchAll(/Path:\s+db\/import\/(item_db[^\s#]+\.yml)/g)].map(match => match[1]);
// Recompose the effective list from the Footer so membership and overlay order
// exactly match the server. The declarations above remain useful annotations,
// but are not trusted as runtime configuration.
itemFiles.splice(3, itemFiles.length - 3,
  path.join(CUSTOM, 'item_db.yml'),
  ...serverItemImports
    .filter(file => !ignoredServerItemImports.has(file))
    .filter(file => !(SKIP_SKILL_PROGRESSION && file === 'item_db_skill_progression.yml'))
    .map(file => path.join(CUSTOM, file)));
const wikiItemImports = new Set(itemFiles.map(file => path.basename(file)));
const missingWikiImports = serverItemImports.filter(file =>
  !(SKIP_SKILL_PROGRESSION && file === 'item_db_skill_progression.yml')
  && !ignoredServerItemImports.has(file)
  && !wikiItemImports.has(file));
if (missingWikiImports.length) throw new Error(`wiki item source list is missing live server imports: ${missingWikiImports.join(', ')}`);
// Fun-mod files only restate { Id, AegisName, Script } on existing STOCK items (see their
// file headers) — they never introduce new Ids, so reading them above just merges the new
// Script onto the item already created from db/pre-re (same per-Id deep-merge every other
// custom/db-import override file relies on, e.g. item_db_equip.yml's trophy rebalances).
// Both funmod files still set `custom:true` too (same as every other db-import override,
// trophies included) — that flag just means "loaded from our db-import overrides", not
// "brand-new Id". `funmod` is an additional, narrower flag so the wiki can badge
// specifically "this classic item got a fun-mod skill amp" without a new filter category
// colliding with the existing Custom/RZ badge semantics.
const FUNMOD_RE = /item_db_funmods/;

const items = new Map();   // id -> item
function keys(obj) { return obj && typeof obj === 'object' ? Object.keys(obj).filter(k => obj[k]) : []; }

for (const f of itemFiles) {
  const custom = f.includes('db-import');
  for (const e of load(f)) {
    if (e.Id == null) continue;
    const prev = items.get(e.Id) || {};
    const it = Object.assign({}, prev, {
      id: e.Id,
      aegis: e.AegisName ?? prev.aegis,
      name: e.Name ?? prev.name,
      type: e.Type ?? prev.type ?? 'Etc',
      sub: e.SubType ?? prev.sub,
      slots: e.Slots ?? prev.slots ?? 0,
      buy: e.Buy ?? prev.buy,
      weight: e.Weight ?? prev.weight ?? 0,
      atk: e.Attack ?? prev.atk,
      matk: e.MagicAttack ?? prev.matk,
      def: e.Defense ?? prev.def,
      wlv: e.WeaponLevel ?? prev.wlv,
      alv: e.ArmorLevel ?? prev.alv,
      range: e.Range ?? prev.range,
      reqlv: e.EquipLevelMin ?? prev.reqlv,
      jobs: e.Jobs ? keys(e.Jobs) : (prev.jobs),         // [] / undefined = All
      loc: e.Locations ? keys(e.Locations) : prev.loc,
      classes: e.Classes ? keys(e.Classes) : prev.classes,
      refine: e.Refineable != null ? e.Refineable : prev.refine,
      view: e.View ?? prev.view,
      script: e.Script != null ? e.Script.trim() : prev.script,
      custom: custom ? true : (prev.custom || false),
      funmod: FUNMOD_RE.test(f) ? true : (prev.funmod || false),
      droppedBy: prev.droppedBy || [],
    });
    items.set(e.Id, it);
  }
}

// quick lookup by aegis for drop cross-ref
const byAegis = new Map();
for (const it of items.values()) if (it.aegis) byAegis.set(it.aegis, it);

// ---- acquisition ledger ---------------------------------------------------
// Only scan scripts the live loader actually includes. Direct numeric grants
// are high-confidence; dynamic variables remain intentionally unresolved.
const acquisition = new Map();
const loader = fs.readFileSync(path.join(ROOT, 'custom', 'npc', 'scripts_newro.conf'), 'utf8');
const loadedNpcPaths = [...loader.matchAll(/^\s*npc:\s+([^\s]+\.txt)/gm)].map(match => match[1]);
for (const npcPath of loadedNpcPaths) {
  const file = npcPath.startsWith('npc/newro/')
    ? path.join(ROOT, 'custom', 'npc', path.basename(npcPath))
    : path.join(ROOT, 'server', 'rathena', ...npcPath.split('/'));
  if (!fs.existsSync(file)) {
    console.warn('acquisition: loaded NPC file missing:', npcPath);
    continue;
  }
  mergeLedgers(acquisition, parseNpcScript(fs.readFileSync(file, 'utf8'), file));
}
mergeLedgers(acquisition, parseBarters(load(path.join(CUSTOM, 'barter_db.yml')), byAegis));
for (const it of items.values()) it.acquiredFrom = (acquisition.get(Number(it.id)) || []).map(source => ({
  ...source,
  currencyName: source.currency ? items.get(Number(source.currency))?.name : undefined,
}));

// ---- item set combos (item_combos.yml) --------------------------------
// Fun-mods batch 2: pairs of fun-mod items grant a bonus skill amp when worn together.
// COMBO_DB has a different schema than ITEM_DB (Combos: [{ Combo: [AegisName,...] }],
// Script shared across the entry) so it's parsed separately, then cross-referenced onto
// each participating item via byAegis (built just above) the same way drops are.
for (const it of items.values()) it.combos = [];
let comboCount = 0;
const combosRaw = []; // captured for builds.json (Fun Builds tab) — script resolved to human text later, once skillNames is loaded
for (const e of load(path.join(CUSTOM, 'item_combos.yml'))) {
  const script = (e.Script || '').trim();
  for (const c of (e.Combos || [])) {
    const members = (c.Combo || []).map(a => byAegis.get(a)).filter(Boolean);
    if (members.length < 2) continue; // unresolved aegis name(s) — skip a broken/partial combo
    comboCount++;
    for (const m of members) {
      m.combos.push({ script, with: members.filter(x => x.id !== m.id).map(x => ({ id: x.id, name: x.name })) });
    }
    combosRaw.push({ script, members: members.map(m => ({ id: m.id, name: m.name, aegis: m.aegis })) });
  }
}

// ---- mobs ------------------------------------------------------------------
const RE = path.join(ROOT, 'server', 'rathena', 'db', 're');
const mobFiles = [ path.join(PRE, 'mob_db.yml'), path.join(CUSTOM, 'mob_db.yml') ];
const mobs = new Map();

function mapDrops(list, previous = []) {
  if (!Array.isArray(list)) return [];
  const merged = previous.map(drop => ({ ...drop }));
  list.forEach((d, position) => {
    const index = Number.isInteger(d.Index) ? d.Index : position;
    const prior = merged[index] || {};
    const item = d.Item ?? prior.item;
    merged[index] = {
      item,
      name: (byAegis.get(item) || {}).name || item,
      id: (byAegis.get(item) || {}).id || null,
      rate: d.Rate ?? prior.rate ?? 0,
    };
  });
  return merged.filter(drop => drop.item);
}

// A mob is "genuinely custom" (no guaranteed real divine-pride art) only if its Id
// never appears in ANY real rAthena stock mob_db — not just db/pre-re (what the
// live server loads) but ALSO db/re (kept on disk, dormant under PRERE). Several of
// our "flagship" bosses (e.g. Captain Ferlock 3181, Torturous Redeemer 2959) are
// real kRO mob ids that only ever shipped in db/re/mob_db.yml and were rescued into
// custom/db-import/mob_db.yml the same way rescued items work (item_db_advanced.yml
// etc.) — those are real ids with real art, just retuned/relocated, same as Amdarais
// (2476, present in both pre-re and re) and Doppelganger (1046, ditto). Only an id
// absent from BOTH stock files (our allocated custom range 20020-31999, e.g. 31030
// Reliquary Warden) is truly invented and has no guaranteed real art — divine-pride
// returns a fixed 5610-byte placeholder image for those (verified 2026-07-13, see
// wiki/tools/build-db.js header notes / task report, NOT a 404, so it can't be
// caught with a plain client-side onerror).
const stockMobIds = new Set([
  ...load(path.join(PRE, 'mob_db.yml')).map(e => e.Id),
  ...load(path.join(RE, 'mob_db.yml')).map(e => e.Id),
].filter(id => id != null));

for (const f of mobFiles) {
  const custom = f.includes('db-import');
  for (const e of load(f)) {
    if (e.Id == null) continue;
    const prev = mobs.get(e.Id) || {};
    const m = Object.assign({}, prev, {
      id: e.Id, aegis: e.AegisName ?? prev.aegis, name: e.Name ?? prev.name,
      lvl: e.Level ?? prev.lvl, hp: e.Hp ?? prev.hp, sp: e.Sp ?? prev.sp,
      atkMin: e.Attack ?? prev.atkMin, atkMax: e.Attack2 ?? prev.atkMax,
      def: e.Defense ?? prev.def, mdef: e.MagicDefense ?? prev.mdef,
      baseExp: e.BaseExp ?? prev.baseExp, jobExp: e.JobExp ?? prev.jobExp,
      race: e.Race ?? prev.race, element: e.Element ?? prev.element,
      eleLv: e.ElementLevel ?? prev.eleLv, size: e.Size ?? prev.size,
      mvp: e.Class === 'Boss' || !!e.MvpDrops || prev.mvp || false,
      stats: e.Str != null ? { str:e.Str,agi:e.Agi,vit:e.Vit,int:e.Int,dex:e.Dex,luk:e.Luk } : prev.stats,
      drops: e.Drops ? mapDrops(e.Drops, prev.drops) : (prev.drops || []),
      mvpDrops: e.MvpDrops ? mapDrops(e.MvpDrops, prev.mvpDrops) : (prev.mvpDrops || []),
      custom: custom && !stockMobIds.has(e.Id),
    });
    mobs.set(e.Id, m);
  }
}

// ---- drop cross-reference (item.droppedBy) ---------------------------------
for (const m of mobs.values()) {
  for (const d of [...(m.drops||[]), ...(m.mvpDrops||[])]) {
    const it = byAegis.get(d.item);
    if (it) it.droppedBy.push({ mob: m.name, id: m.id, rate: d.rate, mvp: m.mvp });
  }
}

// ---- skill-boost detection (LegionBR-style skill items) --------------------
// Any item whose script boosts a skill's damage (bSkillAtk) is a "skill item".
// Tier by skill prefix: 3rd-class (+expanded) vs up-to-trans.
const TIER3 = /^(RK_|WL_|RA_|AB_|GC_|SC_|LG_|SR_|SO_|GN_|NC_|WM_|KO_|RL_|SP_|EM_|SU_|HN_)/;
function maxQualifiedVariables(script) {
  const values = { r: 10 };
  const evaluate = expression => {
    let value = String(expression)
      .replace(/BaseLevel\s*\/\s*(\d+)/g, (_all, divisor) => String(Math.trunc(99 / Number(divisor))))
      .replace(/BaseLevel/g, '99')
      .replace(/getrefine\(\)/gi, '10')
      .replace(/getskilllv\("[A-Z0-9_]+"\)/gi, '10')
      .replace(/\.@([a-zA-Z0-9_]+)/g, (_all, name) => values[name] == null ? '0' : String(values[name]));
    if (!/^[\d\s()+*/-]+$/.test(value)) return null;
    try { return Math.trunc(Function(`"use strict"; return (${value})`)()); }
    catch { return null; }
  };
  for (const match of String(script).matchAll(/\.@([a-zA-Z0-9_]+)\s*(=|\+=|-=)\s*([^;]+);/g)) {
    const result = evaluate(match[3]);
    if (result == null) continue;
    if (match[2] === '=') values[match[1]] = result;
    else if (match[2] === '+=') values[match[1]] = (values[match[1]] || 0) + result;
    else values[match[1]] = (values[match[1]] || 0) - result;
  }
  return values;
}
function level99SkillPercent(expression, variables = {}) {
  let value = expression.trim()
    .replace(/BaseLevel\s*\/\s*(\d+)/g, (_all, divisor) => String(Math.trunc(99 / Number(divisor))))
    .replace(/BaseLevel/g, '99')
    .replace(/getrefine\(\)/gi, '10')
    .replace(/getskilllv\("[A-Z0-9_]+"\)/gi, '10')
    .replace(/\.@([a-zA-Z0-9_]+)/g, (_all, name) => variables[name] == null ? '0' : String(variables[name]));
  if (!/^[\d\s()+*/-]+$/.test(value)) return null;
  try { return Math.trunc(Function(`"use strict"; return (${value})`)()); }
  catch { return null; }
}
for (const it of items.values()) {
  it.boosts = [];
  if (!it.script) continue;
    const variables = maxQualifiedVariables(it.script);
    const boosts = new Map(); let m; const re = /bSkillAtk,"([A-Z_0-9]+)",([^;]+)/g;
    while ((m = re.exec(it.script))) {
      const percent = level99SkillPercent(m[2], variables);
      const previous = boosts.get(m[1]);
      // Separate bSkillAtk statements stack in rAthena, including cumulative
      // +7/+8/+9 refine tiers. Show the fully-qualified build potential.
      boosts.set(m[1], percent == null ? previous ?? null : (previous ?? 0) + percent);
    }
    it.boosts = [...boosts].map(([skill, percent]) => ({ skill, percent, t3: TIER3.test(skill) }));
}

// ---- spawn locations (npc/re/mobs/**) --------------------------------------
function walkTxt(dir){ let r=[]; if(!fs.existsSync(dir))return r; for(const e of fs.readdirSync(dir,{withFileTypes:true})){const fp=path.join(dir,e.name); if(e.isDirectory())r=r.concat(walkTxt(fp)); else if(e.name.endsWith('.txt'))r.push(fp);} return r; }
const spawnByMob = new Map();
const reSpawn = /^([a-zA-Z0-9_@]+),\d+,\d+[^\t]*\t(?:boss_)?monster\t[^\t]*\t(\d+),(\d+)/;
for (const f of walkTxt(path.join(ROOT,'server','rathena','npc','pre-re','mobs'))) {
  for (const line of fs.readFileSync(f,'utf8').split('\n')) {
    const mt = reSpawn.exec(line); if(!mt) continue;
    const id=+mt[2], map=mt[1], amt=+mt[3];
    if(!spawnByMob.has(id)) spawnByMob.set(id, new Map());
    const mm=spawnByMob.get(id); mm.set(map,(mm.get(map)||0)+amt);
  }
}
for (const m of mobs.values()){ const s=spawnByMob.get(m.id); m.spawns = s?[...s.entries()].map(([map,amt])=>({map,amt})).sort((a,b)=>b.amt-a.amt):[]; }

// ---- skill names (aegis -> English, from skill_db Description) — load early
//      so random-option skill-damage descriptions can resolve real skill names.
const skillNames = {};
for (const e of load(path.join(PRE,'skill_db.yml'))) if(e.Name && e.Description) skillNames[e.Name]=e.Description;

// ---- random options / enchants ---------------------------------------------
// Describe an option by what its SCRIPT actually does (reliable + reads in plain
// English) rather than guessing from the aegis name. Value placeholder -> "N",
// which the site replaces with the option's min–max range.
const RC={RC_Formless:'Formless',RC_Undead:'Undead',RC_Brute:'Brute',RC_Plant:'Plant',RC_Insect:'Insect',RC_Fish:'Fish',RC_Demon:'Demon',RC_DemiHuman:'Demi-Human',RC_Angel:'Angel',RC_Dragon:'Dragon',RC_Player_Human:'players',RC_Player_Doram:'Doram players',RC_All:'all races',RC_NonBoss:'non-Boss',RC_NonPlayer:'monsters'};
const EL={Ele_Neutral:'Neutral',Ele_Water:'Water',Ele_Earth:'Earth',Ele_Fire:'Fire',Ele_Wind:'Wind',Ele_Poison:'Poison',Ele_Holy:'Holy',Ele_Dark:'Shadow',Ele_Ghost:'Ghost',Ele_Undead:'Undead',Ele_All:'all elements'};
const SZ={Size_Small:'Small',Size_Medium:'Medium',Size_Large:'Large',Size_All:'all'};
const CL={Class_Normal:'Normal monsters',Class_Boss:'Boss monsters',Class_All:'all monsters'};
const EF={Eff_Stun:'Stun',Eff_Freeze:'Freeze',Eff_Stone:'Stone Curse',Eff_Sleep:'Sleep',Eff_Silence:'Silence',Eff_Curse:'Curse',Eff_Poison:'Poison',Eff_Blind:'Blind',Eff_Bleeding:'Bleeding',Eff_Confusion:'Confusion'};
const prettySkill=s=>(skillNames[s]||s.replace(/^[A-Z]{1,3}_/,'').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()));
const STAT={bStr:'STR',bAgi:'AGI',bVit:'VIT',bInt:'INT',bDex:'DEX',bLuk:'LUK',bMaxHP:'Max HP',bMaxSP:'Max SP',bAtk:'ATK',bBaseAtk:'ATK',bMatk:'MATK',bDef:'DEF',bMdef:'MDEF',bHit:'Hit',bFlee:'Flee',bFlee2:'Perfect Dodge',bCritical:'Critical',bAspd:'ASPD',bPow:'POW',bSpl:'SPL',bSta:'STA',bWis:'WIS',bCon:'CON',bCrt:'CRT',bPAtk:'P.Atk',bSMatk:'S.Matk',bRes:'Res',bMRes:'M.Res',bHPlus:'H.Plus',bCRate:'C.Rate'};
const PCT={bMaxHPrate:'Max HP',bMaxSPrate:'Max SP',bHPrecovRate:'HP Recovery',bSPrecovRate:'SP Recovery',bAtkRate:'ATK',bMatkRate:'MATK',bAspdRate:'ASPD',bCritAtkRate:'Critical Damage',bShortAtkRate:'Melee Damage',bLongAtkRate:'Ranged Damage',bHealPower:'Heal Power',bHealPower2:'Healing Received'};
const PCT_TAKEN={bNearAtkDef:'Melee Damage Taken',bLongAtkDef:'Ranged Damage Taken',bMagicAtkDef:'Magic Damage Taken',bCritDefRate:'Critical Damage Taken',bReduceDamageReturn:'Reflected Damage Taken'};
const FLAG={bUnbreakableWeapon:'Weapon is indestructible',bUnbreakableArmor:'Armor is indestructible',bUnbreakableHelm:'Headgear is indestructible',bUnbreakableShield:'Shield is indestructible',bUnbreakableGarment:'Garment is indestructible',bUnbreakableShoes:'Footgear is indestructible',bNoSizeFix:'Ignores the size damage penalty',bNoKnockback:'Immune to knockback',bNoWalkDelay:'No movement delay when hit'};
function transOpt(s){
  let m;
  if(/^for\b/.test(s)||/bSubEle,\.@/.test(s)) return 'All-element Resistance +N%';
  if(m=/bSkillAtk,"([A-Z_0-9]+)"/.exec(s)) return prettySkill(m[1])+' Damage +N%';
  if(m=/bSubEle,(Ele_\w+)/.exec(s)) return (EL[m[1]]||m[1])+' Resistance +N%';
  if(m=/b(Magic)?(?:Add|SubDef)Ele,(Ele_\w+)/.exec(s)) return (m[1]?'Magic damage':'Damage')+' to '+(EL[m[2]]||m[2])+'-property enemies +N%';
  if(m=/bMagicAtkEle,(Ele_\w+)/.exec(s)) return (EL[m[1]]||m[1])+'-property Magic Attack +N%';
  if(m=/bDefEle,(Ele_\w+)/.exec(s)) return 'Armor element becomes '+(EL[m[1]]||m[1]);
  if(m=/bAtkEle,(Ele_\w+)/.exec(s)) return 'Weapon element becomes '+(EL[m[1]]||m[1]);
  if(m=/bExpAddRace,(RC_\w+)/.exec(s)) return 'EXP from '+(RC[m[1]]||m[1])+' +N%';
  if(m=/bMagicAddRace,(RC_\w+)/.exec(s)) return 'Magic damage to '+(RC[m[1]]||m[1])+' +N%';
  if(m=/bAddRace,(RC_\w+)/.exec(s)) return 'Damage to '+(RC[m[1]]||m[1])+' +N%';
  if(m=/bSubRace,(RC_\w+)/.exec(s)) return 'Damage taken from '+(RC[m[1]]||m[1])+' -N%';
  if(m=/bCriticalAddRace,(RC_\w+)/.exec(s)) return 'Critical vs '+(RC[m[1]]||m[1])+' +N';
  if(m=/bIgnoreDefRaceRate,(RC_\w+)/.exec(s)) return 'Ignore '+(RC[m[1]]||m[1])+' DEF +N%';
  if(m=/bIgnoreMdefRaceRate,(RC_\w+)/.exec(s)) return 'Ignore '+(RC[m[1]]||m[1])+' MDEF +N%';
  if(m=/bMagicAddSize,(Size_\w+)/.exec(s)) return 'Magic damage to '+(SZ[m[1]]||m[1])+' size +N%';
  if(m=/bMagicSubSize,(Size_\w+)/.exec(s)) return 'Magic damage taken from '+(SZ[m[1]]||m[1])+' size -N%';
  if(m=/bAddSize,(Size_\w+)/.exec(s)) return 'Damage to '+(SZ[m[1]]||m[1])+' size +N%';
  if(m=/bSubSize,(Size_\w+)/.exec(s)) return 'Damage taken from '+(SZ[m[1]]||m[1])+' size -N%';
  if(m=/bMagicAddClass,(Class_\w+)/.exec(s)) return 'Magic damage to '+(CL[m[1]]||m[1])+' +N%';
  if(m=/bAddClass,(Class_\w+)/.exec(s)) return 'Damage to '+(CL[m[1]]||m[1])+' +N%';
  if(m=/bSubClass,(Class_\w+)/.exec(s)) return 'Damage taken from '+(CL[m[1]]||m[1])+' -N%';
  if(m=/bIgnoreDefClassRate,(Class_\w+)/.exec(s)) return 'Ignore '+(CL[m[1]]||m[1])+' DEF +N%';
  if(m=/bIgnoreMdefClassRate,(Class_\w+)/.exec(s)) return 'Ignore '+(CL[m[1]]||m[1])+' MDEF +N%';
  if(m=/bResEff,(Eff_\w+)/.exec(s)) return (EF[m[1]]||m[1])+' Resistance +N%';
  if(m=/bVariableCastrate/.test(s)) return 'Variable Cast -N%';
  if(m=/bFixedCastrate/.test(s)) return 'Fixed Cast -N%';
  if(/bDelayrate/.test(s)) return 'After-cast Delay -N%';
  if(/bUseSPrate/.test(s)) return 'SP Cost -N%';
  // single-token bonus  bX,N  /  bX,1 (flag)
  if(m=/bonus (b\w+)\b/.exec(s)){
    const k=m[1];
    if(FLAG[k]) return FLAG[k];
    if(STAT[k]) return STAT[k]+' +N';
    if(PCT[k]) return PCT[k]+' +N%';
    if(PCT_TAKEN[k]) return PCT_TAKEN[k]+' -N%';
  }
  return null;
}
function humanizeOpt(name,script){
  let s=(script||'').trim();
  if(s){ s=s.replace(/getrandomoptinfo\([A-Z_0-9]+\)/g,'N');
    for(const part of s.split(/;\s*/)){ const t=transOpt(part.trim()); if(t) return t; } }
  // fallback: prettify the raw aegis so it's at least readable
  return (name||'').replace(/^RZ_RDMOPT_/,'').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}
// item_randomopt_db.yml / item_randomopt_group.yml have NO db/pre-re counterpart (rAthena
// only ships them under db/re). custom/db-import/item_randomopt_db.yml already re-hosts the
// 57 stock option defs our groups need (copied verbatim from db/re, see that file's header),
// so read ONLY the db/import (custom) copy here — reading stale db/re on top would just
// re-add the same Ids from a file the live server never loads.
const optTypes = {};
for (const f of [path.join(CUSTOM,'item_randomopt_db.yml')])
  for (const e of load(f)) if(e.Option) optTypes[e.Option] = { name:e.Option, desc:humanizeOpt(e.Option,e.Script), script:(e.Script||'').trim() };
// bResEff (status-resist %, e.g. RZ_RDMOPT_RES_FREEZE) stores its value at 1/100 of a
// percent (10000 = 100%, so a "real" 10-50% roll is stored as 1000-5000) — same raw-unit
// convention getrandomoptinfo(ROA_VALUE) uses everywhere else, but bResEff is the ONLY
// bonus in our option pools with that /100 relationship to the displayed percent (verified
// by a server-side units audit 2026-07-10: every other bonus2/bonus in item_randomopt_db.yml
// displays its raw value as-is). Divide by 100 here so the wiki shows the real percent
// ("Freeze Resistance +10-50%") instead of the raw script units ("+1000-5000%").
const RESEFF_RE = /bResEff,/;
function displayVal(optName, raw) {
  const t = optTypes[optName];
  if (t && RESEFF_RE.test(t.script)) return raw / 100;
  return raw;
}
const optGroups = [];
for (const f of [path.join(CUSTOM,'item_randomopt_group.yml')])
  for (const g of load(f)) {
    const opts=[];
    for (const slot of (g.Slots||[])) for(const o of (slot.Options||[])) opts.push({name:o.Option,min:displayVal(o.Option,o.MinValue||0),max:displayVal(o.Option,o.MaxValue||0),chance:o.Chance||0,fixed:true});
    for (const o of (g.Random||[])) opts.push({name:o.Option,min:displayVal(o.Option,o.MinValue||0),max:displayVal(o.Option,o.MaxValue||0),chance:o.Chance||0,fixed:false});
    optGroups.push({ id:g.Id, name:g.Group, maxRandom:g.MaxRandom||0, custom:f.includes('db-import'), options:opts });
  }

// ---- element damage table (attr_fix.yml) -----------------------------------
// matrix[defLevel-1][attackEleIdx][defendEleIdx] = damage % (100 = normal).
// Powers the wiki's "what to hit it with" matchup. Element order = RO index 0-9
// (note: index 7 is "Dark"/Shadow in the YAML).
const ELE_ORDER=['Neutral','Water','Earth','Fire','Wind','Poison','Holy','Dark','Ghost','Undead'];
const elemMatrix=[];
for (const lvl of load(path.join(PRE,'attr_fix.yml'))) {
  const li=(lvl.Level||1)-1; elemMatrix[li]=[];
  ELE_ORDER.forEach((atk,ai)=>{ const row=lvl[atk]||{}; elemMatrix[li][ai]=ELE_ORDER.map(def=>row[def]!=null?row[def]:100); });
}

// ---- Hunting Log quests (custom IDs 710000-719999) -------------------------
// Mirrors custom/db-import/quest_db.yml so the wiki can show every milestone.
// Reward text is parsed from the quest Title's "(...)" suffix.
const mobByAegis = new Map();
// "true MVP" = has an MVP reward drop (excludes Boss-protocol mini-bosses like Kasa)
for (const m of mobs.values()) if (m.aegis) mobByAegis.set(m.aegis, { name: m.name, id: m.id, mvp: !!(m.mvpDrops && m.mvpDrops.length) });
const hunting = { monster: [], region: [], dedication: [] };
for (const q of load(path.join(CUSTOM, 'quest_db.yml'))) {
  if (q.Id == null || q.Id < 710000 || q.Id > 719999) continue;
  const mt = /(?:Hunting Log:|Region:)\s*(.+?)\s*\(([^)]+)\)\s*$/.exec(q.Title || '');
  const title = mt ? mt[1].trim() : (q.Title || '');
  const reward = mt ? mt[2].trim() : '';
  const targets = (q.Targets || []).map(t => {
    const mob = t.Mob ? mobByAegis.get(t.Mob) : null;
    return { mob: mob ? mob.name : (t.Mob || null), mobId: mob ? mob.id : null, mvp: mob ? mob.mvp : false,
             count: t.Count || 0, map: t.Location || null, mapName: t.MapName || t.Location || null };
  });
  const rec = { id: q.Id, title, reward, targets, mvp: targets.some(t => t.mvp) };
  const isRegion = targets.some(t => t.map);
  const isTotal = !isRegion && targets.every(t => !t.mob);   // no mob + no map = any monster
  (isRegion ? hunting.region : isTotal ? hunting.dedication : hunting.monster).push(rec);
}

// ---- Fun Pass builds (builds.json) ------------------------------------------
// The fun-mod files (item_db_funmods.yml + item_db_funmods_weapons.yml) restate
// { Id, AegisName, Script } on existing stock items in "families": an unslotted
// item + its "_"-suffixed slotted twin (whose amp is ~2x), or a single item that's
// already-slotted in stock db (flat amp, no pair). The family's build-fantasy name
// and its class-group bucket only exist as prose (YAML comments in those files /
// docs/FUN_PASS_BUILDS.md) — not machine-readable — so that mapping is hardcoded
// here from docs/FUN_PASS_BUILDS.md's own section structure. If a fun-mod item
// shows up whose AegisName isn't in this table, it's logged as a warning below
// (rather than silently dropped) so a future fun-mod batch doesn't go missing.
const FUNMOD_FAMILY = {
  // --- accessories/armor (item_db_funmods.yml) ---
  Earring:            { group: 'Mage / Wizard / Sage',                fantasy: 'Fireball Mage' },
  Ring:                { group: 'Spear Knight (Knight/Crusader)',      fantasy: 'Spear Knight' },
  Necklace:            { group: 'Crusader / Monk (Shield)',            fantasy: 'Paladin Zealot' },
  Glove:                { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Bard/Dancer Skirmisher' },
  Brooch:              { group: 'Thief / Assassin / Rogue',            fantasy: 'Assassin Bomber' },
  Rosary:              { group: 'Acolyte / Priest / Monk',             fantasy: 'Priest Zealot Support' },
  Belt:                { group: 'Merchant',                            fantasy: 'Merchant Brawler' },
  Clip:                { group: 'Mage / Wizard / Sage',                fantasy: 'Wizard Bolt-Slinger' },
  Silk_Robe:            { group: 'Novice / Any Class',                  fantasy: 'Caster Sustain Robe' },
  Padded_Armor:        { group: 'Novice / Any Class',                  fantasy: 'Tank Padding' },
  Shoes:                { group: 'Novice / Any Class',                  fantasy: "Traveler's Endurance" },
  Boots:                { group: 'Novice / Any Class',                  fantasy: "Caster's Stride" },
  Sandals:              { group: 'Novice / Any Class',                  fantasy: 'Novice All-Rounder' },
  Guard:                { group: 'Swordsman / Knight',                  fantasy: 'Novice Swordsman Tank' },
  Buckler:              { group: 'Crusader / Monk (Shield)',            fantasy: 'Battle-Monk Shieldbearer' },
  Sunglasses:          { group: 'Thief / Assassin / Rogue',            fantasy: 'Shades Rogue Ambusher' },
  Ribbon:              { group: 'Mage / Wizard / Sage',                fantasy: 'Battle Mage Grimoire' },
  Bandana:              { group: 'Gunslinger',                          fantasy: 'Wild West Gunslinger' },
  Cap:                  { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Ranger Scout' },
  Flower_Ring:          { group: 'Novice / Any Class',                  fantasy: 'Elemental Apprentice' },
  Skul_Ring:            { group: 'Ninja',                              fantasy: 'Ninja Skirmisher' },
  Thimble_Of_Archer:    { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Falconer' },
  Ring_Of_Rogue:        { group: 'Thief / Assassin / Rogue',            fantasy: "Shadow Skirmisher's Toolkit" },
  Cotton_Shirt:        { group: 'Novice / Any Class',                  fantasy: "Novice Survivor's Shirt" },
  Leather_Jacket:      { group: 'Novice / Any Class',                  fantasy: 'Early Adventurer' },
  Chain_Mail:          { group: 'Swordsman / Knight',                  fantasy: 'Armored Bruiser' },
  Hood:                { group: 'Novice / Any Class',                  fantasy: "Novice Caster's Hood" },
  Muffler:              { group: 'Novice / Any Class',                  fantasy: 'All-Class Traveler' },
  Manteau:              { group: 'Novice / Any Class',                  fantasy: "Rogue's Stamina Cloak" },
  Novice_Armlet:        { group: 'Novice / Any Class',                  fantasy: 'SuperNovice Jack-of-All-Trades' },
  // --- weapons (item_db_funmods_weapons.yml) ---
  Main_Gauche:          { group: 'Thief / Assassin / Rogue',            fantasy: 'Poison Dagger' },
  Blade:                { group: 'Swordsman / Knight',                  fantasy: 'Swordsman Basher' },
  Falchion:            { group: 'Swordsman / Knight',                  fantasy: 'Magnum Berserker' },
  Pike:                { group: 'Swordsman / Knight',                  fantasy: 'Spear Piercer' },
  Javelin:              { group: 'Swordsman / Knight',                  fantasy: 'Javelin Thrower' },
  Mace:                { group: 'Acolyte / Priest / Monk',             fantasy: 'Battle Priest' },
  Waghnakh:            { group: 'Acolyte / Priest / Monk',             fantasy: 'Monk Combo Fists' },
  Arc_Wand:            { group: 'Mage / Wizard / Sage',                fantasy: 'Frost Bolter' },
  Wand:                { group: 'Mage / Wizard / Sage',                fantasy: 'Fireball Slinger' },
  Rod:                  { group: 'Mage / Wizard / Sage',                fantasy: 'Napalm & Soul Nuker' },
  CrossBow:            { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Volley Archer' },
  Kakkung:              { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Charge Archer' },
  Book:                { group: 'Mage / Wizard / Sage',                fantasy: "Heaven's Drive Preacher" },
  Axe:                  { group: 'Merchant',                            fantasy: 'Mammonite Merchant' },
  Jamadhar:            { group: 'Thief / Assassin / Rogue',            fantasy: 'Venom Splasher Assassin' },
  // 2026-07-10 audit: Grimtooth (Katar-only skill) moved off Main_Gauche (a Dagger, could never
  // legally cast it) onto Jur/Jur_ (real stock Katar) — new family entry so builds.json's
  // dynamic sanity check (funmodItemCount vs. expectedFunmodCount, near the bottom of this file)
  // doesn't flag these two ids as unmapped.
  Jur:                  { group: 'Thief / Assassin / Rogue',            fantasy: 'Grimtooth Lurker' },
  Knuckle_Duster:      { group: 'Acolyte / Priest / Monk',             fantasy: 'Monk Combo Chainer' },
  Mandolin:            { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Bard Melody Striker' },
  Whip:                { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Dancer Melody Striker' },
  Six_Shooter:          { group: 'Gunslinger',                          fantasy: 'Wild West Gunslinger' },
  Huuma_Giant_Wheel:    { group: 'Ninja',                              fantasy: 'Ninja Shuriken Thrower' },
  Zweihander:          { group: 'Swordsman / Knight',                  fantasy: 'Two-Handed Berserker' },
  Staff_Of_Soul:        { group: 'Mage / Wizard / Sage',                fantasy: 'Stave Crasher' },
  // --- weapons wave 3 (2026-07-10, item_db_funmods_weapons.yml "ROUND 3" additions) ---
  // Owner-locked additions: Hunter Bow (Double Strafe override) + Two-Handed Axe x3
  // (Hammer Fall, patch 0020). Two_Handed_Axe's 3rd stock form (Two_Handed_Axe__) strips
  // to famKey "Two_Handed_Axe_" (famKey only strips ONE trailing "_"), same as every other
  // 3-slot-tier family below — needs its own map entry alongside the base key.
  Hunter_Bow:          { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Double Strafe Hunter' },
  Two_Handed_Axe:      { group: 'Merchant',                            fantasy: 'Hammerfall Berserker' },
  Two_Handed_Axe_:      { group: 'Merchant',                            fantasy: 'Hammerfall Berserker' },
  // Round-3 sweep (19 previously-uncovered weapon families, incl. first-ever Rifle/
  // Shotgun/Gatling/Grenade/2hSpear coverage). Several stock lines have THREE AegisName
  // forms (fewest-slot form flat, others double per the file's convention) whose
  // famKey() strips only ONE trailing "_" — those need two map entries (base + "_").
  Arbalest:            { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Beast-Strafing Marksman' },
  Gladius:              { group: 'Thief / Assassin / Rogue',            fantasy: 'Back-Stabbing Poniard' },
  Gladius_:            { group: 'Thief / Assassin / Rogue',            fantasy: 'Back-Stabbing Poniard' },
  Haedonggum:          { group: 'Swordsman / Crusader',                fantasy: 'Grand Cross Blade' },
  Hae_Dong_Gum:        { group: 'Swordsman / Crusader',                fantasy: 'Grand Cross Blade' },
  Tsurugi:              { group: 'Swordsman / Assassin Cross',          fantasy: 'Soul Breaker Edge' },
  Tsurugi_:            { group: 'Swordsman / Assassin Cross',          fantasy: 'Soul Breaker Edge' },
  Partizan:            { group: 'Spear Knight (Knight/Crusader)',      fantasy: 'Holy Lance Pikeman' }, // 2026-07-11: +Holy Cross (moved from Chain)
  Partizan_:            { group: 'Spear Knight (Knight/Crusader)',      fantasy: 'Holy Lance Pikeman' }, // 2026-07-11: +Holy Cross (moved from Chain)
  Spear:                { group: 'Spear Knight (Knight/Crusader)',      fantasy: 'Brandish Spear Lancer' },
  Spear_:              { group: 'Spear Knight (Knight/Crusader)',      fantasy: 'Brandish Spear Lancer' },
  Hammer:              { group: 'Merchant',                            fantasy: 'Skull-Crushing Maul' },
  Hammer_:              { group: 'Merchant',                            fantasy: 'Skull-Crushing Maul' },
  Chain:                { group: 'Acolyte / Priest / Monk',            fantasy: 'Chain Crush Monk' }, // 2026-07-11: was Holy Cross, moved to Partizan (spear-only per owner)
  Chain_:              { group: 'Crusader / Monk (Shield)',            fantasy: 'Holy Cross Crusader' },
  Stunner:              { group: 'Crusader / Monk (Shield)',            fantasy: 'Shield-Smiting Stunner' },
  Flail:                { group: 'Crusader / Monk (Shield)',            fantasy: 'Shield-Slinging Crusader' },
  Flail_:              { group: 'Crusader / Monk (Shield)',            fantasy: 'Shield-Slinging Crusader' },
  Lute:                  { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Melody Striker' },
  Rope:                  { group: 'Archer / Hunter / Bard-Dancer',      fantasy: "Entangling Dancer's Rope" },
  Katar:                { group: 'Thief / Assassin / Rogue',            fantasy: 'Counter-Slash Assassin' },
  Fist:                  { group: 'Acolyte / Priest / Monk',             fantasy: 'Spirit-Sphere Slinger' },
  Claymore:            { group: 'Swordsman / Knight',                  fantasy: 'Charging Greatsword' },
  Rolling_Stone:        { group: 'Gunslinger',                          fantasy: 'Shotgun Duster' },
  Gate_Keeper:          { group: 'Gunslinger',                          fantasy: 'Shotgun Spread Gunner' },
  Destroyer:            { group: 'Gunslinger',                          fantasy: 'Grenade-Drift Demolisher' },
  Drifter:              { group: 'Gunslinger',                          fantasy: 'Rapid-Fire Gatling' },
  The_Cyclone:          { group: 'Gunslinger',                          fantasy: 'Precision Rifle' },
  // --- batch 3: elemental garment/shield + headgear wave 2 (item_db_funmods2.yml) ---
  // Muffler/Hood/Manteau/Guard/Buckler got a bSubEle resist appended in-place to their
  // existing item_db_funmods.yml entries (2026-07-10 addendum) — no new family keys
  // needed for those five, they already exist above.
  Mirror_Shield:        { group: 'Crusader / Monk (Shield)',            fantasy: 'Radiant Aegis' },
  Ragamuffin_Cape:      { group: 'Novice / Any Class',                  fantasy: "Vagrant's Ward" },
  Glasses:              { group: 'Mage / Wizard / Sage',                fantasy: "Battle Scholar's Spectacles" },
  "Diver's_Goggles":    { group: 'Archer / Hunter / Bard-Dancer',      fantasy: 'Deep-Sea Sharpshooter' },
  Hair_Band:            { group: 'Ninja',                              fantasy: "Wandering Ninja's Talisman" },
  Eye_Bandage:          { group: 'Gunslinger',                          fantasy: 'One-Eyed Gunslinger' },
  Biretta:              { group: 'Acolyte / Priest / Monk',             fantasy: 'Martial Cleric' },
  Hat:                  { group: 'Thief / Assassin / Rogue',            fantasy: 'Sticky-Fingered Vagrant' },
  Turban:                { group: 'Ninja',                              fantasy: 'Desert Wanderer' },
  Goggle:                { group: 'Merchant',                            fantasy: 'Battle-Ready Adventurer' },
  Gemmed_Sallet:        { group: 'Thief / Assassin / Rogue',            fantasy: 'Jeweled Duelist' },
  Flu_Mask:            { group: 'Thief / Assassin / Rogue',            fantasy: "Plague Doctor's Mask" },
  // --- curated obsolete/MVP headgear identities (item_db_funmods_hats.yml) ---
  Helm_Of_Angel:       { group: 'Thief / Assassin / Rogue',            fantasy: 'Angelic Assassin' },
  Angelic_Helm:        { group: 'Thief / Assassin / Rogue',            fantasy: 'Angelic Assassin' },
  Headgear_Of_Queen:   { group: 'Mage / Wizard / Sage',                fantasy: 'Royal Spellcaster' },
  Mistress_Crown:      { group: 'Mage / Wizard / Sage',                fantasy: 'Mistress of Storms' },
  Coronet:             { group: 'Mage / Wizard / Sage',                fantasy: 'Psychic Coronet' },
  Assassin_Mask:       { group: 'Thief / Assassin / Rogue',            fantasy: 'Masked Assassin' },
  'Ph.D_Hat':          { group: 'Mage / Wizard / Sage',                fantasy: 'Arcane Scholar' },
  Gemmed_Crown:        { group: 'Mage / Wizard / Sage',                fantasy: 'Gemmed Exorcist' },
  Mr_Scream:           { group: 'Acolyte / Priest / Monk',             fantasy: 'Screaming Brawler' },
  Blue_Coif:           { group: 'Mage / Wizard / Sage',                fantasy: 'Soul Coif' },
  Magician_Hat:        { group: 'Mage / Wizard / Sage',                fantasy: 'Elemental Magician' },
  Loard_Circlet:       { group: 'Swordsman / Crusader',                fantasy: 'Lordly Spellblade' },
  Helm:                { group: 'Swordsman / Crusader',                fantasy: 'Valkyrie Vanguard' },
  Ulle_Cap:            { group: 'Archer / Hunter / Bard-Dancer',       fantasy: "Atroce's Sharpshooter" },
  Kiss_Of_Angel:       { group: 'Novice / Any Class',                  fantasy: "Angel's Apprentice" },
  Golden_Gear:         { group: 'Merchant / Crusader',                 fantasy: 'Golden Bulwark' },
  Bone_Helm:           { group: 'Swordsman / Merchant',                fantasy: 'Dark Vanguard' },
  Bone_Head:           { group: 'Swordsman / Merchant',                fantasy: 'Mammoth Vanguard' },
  Diabolus_Helmet:     { group: 'Swordsman / Mage / Thief',            fantasy: 'Morroc Conqueror' },
  // --- batch 3: universally-skipped low-tier CARDS (item_db_funmods_cards.yml) ---
  // Each card is its own single-item family (no unslotted/slotted pairing — cards
  // don't come in a "_"-suffixed twin), grouped under a dedicated "Fun Cards" bucket
  // rather than shoehorned into a class-fantasy group (a card's off-meta skill amp
  // is a small flavor topper, not a build's centerpiece — see that file's header).
  Poring_Card:          { group: 'Fun Cards', fantasy: "Novice's First Kill" },
  Fabre_Card:            { group: 'Fun Cards', fantasy: "Fuzzy Worm's Headbutt" },
  Pupa_Card:            { group: 'Fun Cards', fantasy: 'The Legendary Punching Bag' },
  Lunatic_Card:          { group: 'Fun Cards', fantasy: "Lucky Rabbit's Foot" },
  Pecopeco_Egg_Card:    { group: 'Fun Cards', fantasy: "Future Mount's Ambition" },
  Andre_Egg_Card:        { group: 'Fun Cards', fantasy: 'Latent Ant Venom' },
  Roda_Frog_Card:        { group: 'Fun Cards', fantasy: 'Mud-Slick Leap' },
  Chonchon_Card:        { group: 'Fun Cards', fantasy: 'Tiny Aerial Ambusher' },
  Thief_Bug_Card:        { group: 'Fun Cards', fantasy: "Ambush Bug's Pounce" },
  Spore_Card:            { group: 'Fun Cards', fantasy: 'Regenerative Spores' },
  Ambernite_Card:        { group: 'Fun Cards', fantasy: 'Armored Shell Brawler' },
  Zombie_Card:          { group: 'Fun Cards', fantasy: 'Shambling Irony' },
  Skeleton_Card:        { group: 'Fun Cards', fantasy: 'Brittle Bones' },
  Kukre_Card:            { group: 'Fun Cards', fantasy: "Merchant's Classic Target" },
  Muka_Card:            { group: 'Fun Cards', fantasy: 'Numbing Ooze' },
  Vadon_Card:            { group: 'Fun Cards', fantasy: 'Ember Breath' },
  Metaller_Card:        { group: 'Fun Cards', fantasy: 'Piercing Gaze' },
  Drainliar_Card:        { group: 'Fun Cards', fantasy: 'Chilling Drain' },
  Farmiliar_Card:        { group: 'Fun Cards', fantasy: 'Shadowy Presence' }, // AegisName is genuinely "Farmiliar_Card" (verified typo)

  // 2026-07-11 policy-reversal wave: any-tier/any-skill retrofits + new life-steal axis.
  Dirk:                  { group: 'Thief / Assassin / Rogue',       fantasy: 'Vampiric Blade' },
  Dirk_:                { group: 'Thief / Assassin / Rogue',       fantasy: 'Vampiric Blade' },
  Stiletto:              { group: 'Thief / Assassin / Rogue',       fantasy: 'Vampiric Assassin' },
  Stiletto_:            { group: 'Thief / Assassin / Rogue',       fantasy: 'Vampiric Assassin' },
  Damascus:              { group: 'Thief / Assassin / Rogue',       fantasy: 'Undying Blade' },
  Various_Jur:          { group: 'Thief / Assassin / Rogue',       fantasy: 'Sonic Blow Jur' },
  Lance:                { group: 'Spear Knight (Knight/Crusader)',  fantasy: 'Spiral Pierce Lancer' },
  Lance_:                { group: 'Spear Knight (Knight/Crusader)',  fantasy: 'Spiral Pierce Lancer' },
  Circlet:              { group: 'Mage / Wizard / Sage',            fantasy: 'High Wizard Nuker' },
  Circlet_:              { group: 'Mage / Wizard / Sage',            fantasy: 'High Wizard Nuker' },
  Mitten_Of_Presbyter:  { group: 'Merchant',                        fantasy: 'Alchemist / Hunter Utility' },

  // 2026-07-12: card-coverage gap closure (90 skills, 3 parallel agents + 5 manual)
  Pasana_Card:            { group: 'Mage / Wizard / Sage', fantasy: 'Fire Bolt Card' },
  Rocker_Card:            { group: 'Mage / Wizard / Sage', fantasy: 'Lightning Bolt Card' },
  Marina_Card:            { group: 'Mage / Wizard / Sage', fantasy: 'Frost Diver Card' },
  Kaho_Card:              { group: 'Mage / Wizard / Sage', fantasy: 'Heaven\'s Drive Card' },
  Mandragora_Card:        { group: 'Mage / Wizard / Sage', fantasy: 'Lord of Vermilion Card' },
  Sword_Fish_Card:        { group: 'Mage / Wizard / Sage', fantasy: 'Water Ball Card' },
  Eggyra_Card:            { group: 'Mage / Wizard / Sage', fantasy: 'Sightrasher Card' },
  Ghostring_Card:         { group: 'Mage / Wizard / Sage', fantasy: 'Soul Strike Card' },
  Golem_Card:             { group: 'Mage / Wizard / Sage', fantasy: 'Stave Crasher Card' },
  Desert_Wolf_Babe_Card:  { group: 'Spear Knight (Knight/Crusader)', fantasy: 'Counter Attack Card' },
  Hydra_Card:             { group: 'Spear Knight (Knight/Crusader)', fantasy: 'Bowling Bash Card' },
  Pecopeco_Card:          { group: 'Spear Knight (Knight/Crusader)', fantasy: 'Brandish Spear Card' },
  Wolf_Card:              { group: 'Spear Knight (Knight/Crusader)', fantasy: 'Charge Attack Card' },
  Condor_Card:            { group: 'Spear Knight (Knight/Crusader)', fantasy: 'Spear Boomerang Card' },
  Hornet_Card:            { group: 'Spear Knight (Knight/Crusader)', fantasy: 'Spear Stab Card' },
  Horn_Card:              { group: 'Spear Knight (Knight/Crusader)', fantasy: 'Traumatic Blow Card' },
  Worm_Tail_Card:         { group: 'Spear Knight (Knight/Crusader)', fantasy: 'Spiral Pierce Card' },
  Soldier_Andre_Card:     { group: 'Crusader / Monk (Shield)', fantasy: 'Grand Cross Card' },
  Coco_Card:              { group: 'Crusader / Monk (Shield)', fantasy: 'Holy Cross Card' },
  Steel_Chonchon_Card:    { group: 'Crusader / Monk (Shield)', fantasy: 'Smite Card' },
  Vitata_Card:            { group: 'Crusader / Monk (Shield)', fantasy: 'Gloria Domini Card' },
  Yoyo_Card:              { group: 'Crusader / Monk (Shield)', fantasy: 'Shield Chain Card' },
  Smokie_Card:            { group: 'Merchant', fantasy: 'Magnum Break Card' },
  Tarou_Card:             { group: 'Merchant', fantasy: 'Cart Revolution Card' },
  Andre_Larva_Card:       { group: 'Merchant', fantasy: 'Hammer Fall Card' },
  Goblin_Card:            { group: 'Merchant', fantasy: 'Cart Termination Card' },
  Rafflesia_Card:         { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Arrow Repel Card' },
  Desert_Wolf_Card:       { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Double Strafe Card' },
  Argos_Card:             { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Arrow Shower Card' },
  Orc_Warrior_Card:       { group: 'Thief / Assassin / Rogue', fantasy: 'Sonic Blow Card' },
  Verit_Card:             { group: 'Thief / Assassin / Rogue', fantasy: 'Venom Splasher Card' },
  Sasquatch_Card:         { group: 'Thief / Assassin / Rogue', fantasy: 'Soul Destroyer Card' },
  Requiem_Card:           { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Melody Strike Card' },
  Jakk_Card:              { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Vulcan Arrow Card' },
  Skel_Worker_Card:       { group: 'Acolyte / Priest / Monk', fantasy: 'Chain Crush Combo Card' },
  Matyr_Card:             { group: 'Acolyte / Priest / Monk', fantasy: 'Raging Palm Strike Card' },
  Toad_Card:              { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Slinging Arrow Card' },
  Vagabond_Wolf_Card:     { group: 'Gunslinger', fantasy: 'Bulls Eye Card' },
  Antique_Firelock_Card:  { group: 'Gunslinger', fantasy: 'Desperado Card' },
  Snake_Card:             { group: 'Gunslinger', fantasy: 'Dust Card' },
  Frilldora_Card:         { group: 'Gunslinger', fantasy: 'Ground Drift Card' },
  Dragon_Tail_Card:       { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Double Strafe Card' },
  Dustiness_Card:         { group: 'Gunslinger', fantasy: 'Rapid Shower Card' },
  Poison_Spore_Card:      { group: 'Gunslinger', fantasy: 'Spread Attack Card' },
  Poporing_Card:          { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Blast Mine Card' },
  Giearth_Card:           { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Claymore Trap Card' },
  Freezer_Card:           { group: 'Merchant', fantasy: 'Bash Card' },
  Andre_Card:             { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Land Mine Card' },
  Whisper_Card:           { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Phantasmic Arrow Card' },
  Alligator_Card:         { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Beast Strafing Card' },
  Kobold_Card:            { group: 'Acolyte / Priest / Monk', fantasy: 'Raging Quadruple Blow Card' },
  Zombie_Prisoner_Card:   { group: 'Acolyte / Priest / Monk', fantasy: 'Raging Thrust Card' },
  Savage_Card:            { group: 'Acolyte / Priest / Monk', fantasy: 'Asura Strike Card' },
  Chepet_Card:            { group: 'Acolyte / Priest / Monk', fantasy: 'Throw Spirit Sphere Card' },
  Cornutus_Card:          { group: 'Ninja', fantasy: 'Throw Huuma Shuriken Card' },
  Anopheles_Card:         { group: 'Ninja', fantasy: 'Final Strike Card' },
  Marduk_Card:            { group: 'Ninja', fantasy: 'Crimson Fire Petal Card' },
  Savage_Babe_Card:       { group: 'Ninja', fantasy: 'Throw Kunai Card' },
  Zenorc_Card:            { group: 'Ninja', fantasy: 'Throw Shuriken Card' },
  Cramp_Card:             { group: 'Ninja', fantasy: 'Throw Zeny Card' },
  Zerom_Card:             { group: 'Thief / Assassin / Rogue', fantasy: 'Snatch Card' },
  Pest_Card:              { group: 'Thief / Assassin / Rogue', fantasy: 'Sightless Mind Card' },
  Vocal_Card:             { group: 'Star Gladiator', fantasy: 'Warmth of the Moon Card' },
  Nightmare_Card:         { group: 'Star Gladiator', fantasy: 'Warmth of the Stars Card' },
  Flora_Card:             { group: 'Star Gladiator', fantasy: 'Warmth of the Sun Card' },
  Deviruchi_Card:         { group: 'Soul Linker', fantasy: 'Esma Card' },
  Munak_Card:             { group: 'Soul Linker', fantasy: 'Estin Card' },
  Dokebi_Card:            { group: 'Soul Linker', fantasy: 'Estun Card' },
  Roween_Card:            { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Falcon Assault Card' },
  Wild_Rose_Card:         { group: 'Archer / Hunter / Bard-Dancer', fantasy: 'Focused Arrow Strike Card' },
  Anacondaq_Card:         { group: 'Thief / Assassin / Rogue', fantasy: 'Sand Attack Card' },
  Wooden_Golem_Card:      { group: 'Taekwon', fantasy: 'Counter Kick Card' },
  Hode_Card:              { group: 'Taekwon', fantasy: 'Heel Drop Card' },
  Marc_Card:              { group: 'Taekwon', fantasy: 'Tornado Kick Card' },
  Scorpion_Card:          { group: 'Merchant', fantasy: 'Acid Terror Card' },
  Mummy_Card:             { group: 'Acolyte / Priest / Monk', fantasy: 'Turn Undead Card' },
};
// display order of class-group buckets on the wiki page (matches docs/FUN_PASS_BUILDS.md order)
const FUNMOD_GROUP_ORDER = [
  'Novice / Any Class', 'Swordsman / Knight', 'Crusader / Monk (Shield)', 'Mage / Wizard / Sage',
  'Acolyte / Priest / Monk', 'Merchant', 'Archer / Hunter / Bard-Dancer', 'Thief / Assassin / Rogue',
  'Ninja', 'Gunslinger', 'Spear Knight (Knight/Crusader)', 'Fun Cards',
];
function famKey(aegis) { return aegis.replace(/_$/, ''); } // strip the "_" slotted suffix -> family key
// Every fun-mod file only ever appends 3 kinds of bonus lines: skill-damage amps
// (accessories/weapons) and HP/SP recovery-rate boosts (armor/footgear/garment,
// e.g. Cotton Shirt, Muffler — no bSkillAtk at all). Capture all 3 so no family
// silently renders an empty amp list.
function skillAmps(script) {
  const out = []; if (!script) return out;
  // 2026-07-10 owner consistency audit: several refinable fun-mod items now carry `+7`/`+9`
  // refine-tier kicker lines (`if (getrefine()>=7) bonus2 bSkillAtk,"X",N;`) that restate the
  // SAME skill at a smaller bump on top of the base line. Left in, the regexes below would match
  // those lines too and list them as extra, unconditional amp entries — e.g. Mirror Shield would
  // show three separate "Holy Cross +30%/+15%/+15%" lines here instead of one base +30% (the
  // +15%/+15% only apply at +7/+9 refine, which this flat per-family amp list has no way to
  // express). Strip any line containing a literal "getrefine" call before running the regexes —
  // the base (unconditional) line is kept, the refine-gated kicker is excluded from this list.
  // (The item detail page's conditional `plainEffect()` translator in wiki/index.html DOES show
  // these tiers correctly, with the "if refined to +N" condition attached.)
  const baseScript = script.split('\n').filter(l => !/getrefine/.test(l)).join('\n');
  let m;
  const reSkill = /bonus2 bSkillAtk,"([A-Z_0-9]+)",(-?\d+)/g;
  while ((m = reSkill.exec(baseScript))) out.push({ kind: 'skill', skill: m[1], name: prettySkill(m[1]), pct: +m[2] });
  const reHP = /bonus bHPrecovRate,(-?\d+)/g;
  while ((m = reHP.exec(baseScript))) out.push({ kind: 'recov', name: 'HP Recovery', pct: +m[1] });
  const reSP = /bonus bSPrecovRate,(-?\d+)/g;
  while ((m = reSP.exec(baseScript))) out.push({ kind: 'recov', name: 'SP Recovery', pct: +m[1] });
  // Funmods batch 3 elemental-identity pass (item_db_funmods2.yml + the 2026-07-10
  // addendum in item_db_funmods.yml) appends bonus2 bSubEle,<Ele>,N defensive resist
  // lines — those aren't bSkillAtk so they'd otherwise vanish from the Fun Builds tab.
  // Minimal "resist" pill, reuses the EL element-name table already defined above.
  const reResist = /bonus2 bSubEle,(Ele_\w+),(-?\d+)/g;
  while ((m = reResist.exec(baseScript))) out.push({ kind: 'resist', name: (EL[m[1]] || m[1]) + ' Resistance', pct: +m[2] });
  return out;
}
const families = new Map(); // family key -> { fantasy, group, items:[] }
for (const it of items.values()) {
  if (!it.funmod || !it.aegis) continue;
  const key = famKey(it.aegis);
  const meta = FUNMOD_FAMILY[key];
  if (!meta) { console.warn('builds.json: fun-mod item with no family mapping —', key, it.id); continue; }
  if (!families.has(key)) families.set(key, { key, fantasy: meta.fantasy, group: meta.group, items: [] });
  families.get(key).items.push({
    id: it.id, name: it.name, slots: it.slots || 0,
    slotted: it.aegis.endsWith('_'), // the fun-mod "_"-suffixed (~2x amp) twin, NOT raw card-slot count (weapons have those regardless)
    amps: skillAmps(it.script),
  });
}
for (const f of families.values()) f.items.sort((a, b) => (a.slotted ? 1 : 0) - (b.slotted ? 1 : 0) || a.id - b.id);
const buildsByGroup = {};
for (const f of families.values()) (buildsByGroup[f.group] = buildsByGroup[f.group] || []).push(f);
for (const g in buildsByGroup) buildsByGroup[g].sort((a, b) => a.fantasy.localeCompare(b.fantasy));
const buildGroups = FUNMOD_GROUP_ORDER.filter(g => buildsByGroup[g]).map(g => ({ group: g, builds: buildsByGroup[g] }));
const buildCombos = combosRaw.map(c => ({ members: c.members.map(m => ({ id: m.id, name: m.name })), amps: skillAmps(c.script) }));
const funmodFamilyCount = families.size;
const funmodItemCount = [...families.values()].reduce((n, f) => n + f.items.length, 0);
// Dynamic sanity check (was a hardcoded "expect 96" magic number that went stale the
// moment a new funmod batch shipped) — count the DISTINCT Ids actually present across
// every itemFiles entry that matches FUNMOD_RE, straight from disk, independent of the
// families map above. If this ever diverges from funmodItemCount it means some
// funmod-flagged item silently failed to resolve to a FUNMOD_FAMILY entry (see the
// console.warn a few lines up) — a real bug, not a number to just bump.
const funmodSourceIds = new Set();
for (const f of itemFiles.filter(f => FUNMOD_RE.test(f)))
  for (const e of load(f)) if (e.Id != null) funmodSourceIds.add(e.Id);
const expectedFunmodCount = funmodSourceIds.size;

// ---- write -----------------------------------------------------------------
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const itemArr = [...items.values()].filter(i => i.name).sort((a,b)=>a.id-b.id);
const mobArr  = [...mobs.values()].filter(m => m.name).sort((a,b)=>a.id-b.id);
const supportedSkillCount = new Set(itemArr.flatMap(i => (i.boosts || []).filter(boost => !boost.t3).map(boost => boost.skill))).size;
const weapons = itemArr.filter(i => i.type === 'Weapon');

fs.writeFileSync(path.join(OUT,'items.json'), JSON.stringify(itemArr));
fs.writeFileSync(path.join(OUT,'mobs.json'),  JSON.stringify(mobArr));
fs.writeFileSync(path.join(OUT,'options.json'), JSON.stringify({ types:optTypes, groups:optGroups }));
fs.writeFileSync(path.join(OUT,'skills.json'), JSON.stringify(skillNames));
fs.writeFileSync(path.join(OUT,'elements.json'), JSON.stringify({ order:ELE_ORDER, matrix:elemMatrix }));
fs.writeFileSync(path.join(OUT,'hunting.json'), JSON.stringify(hunting));
fs.writeFileSync(path.join(OUT,'builds.json'), JSON.stringify({ groups: buildGroups, combos: buildCombos }));
fs.writeFileSync(path.join(OUT,'meta.json'), JSON.stringify({
  built: new Date().toISOString().slice(0,10),
  items: itemArr.length, mobs: mobArr.length,
  customItems: itemArr.filter(i=>i.custom).length,
  funmodItems: itemArr.filter(i=>i.funmod).length,
  comboSets: comboCount,
  funmodFamilies: funmodFamilyCount,
  spawnedMobs: mobArr.filter(m=>m.spawns&&m.spawns.length).length,
  optionGroups: optGroups.length, optionTypes: Object.keys(optTypes).length,
  skillItems: itemArr.filter(i=>i.boosts&&i.boosts.length).length,
  acquisitionItems: itemArr.filter(i=>(i.acquiredFrom||[]).length).length,
  confirmedSourceItems: itemArr.filter(i=>(i.droppedBy||[]).length || (i.acquiredFrom||[]).length).length,
  supportedSkills: supportedSkillCount,
  weaponSkillItems: weapons.filter(i=>i.boosts&&i.boosts.length).length,
  weapons: weapons.length,
}));

console.log(`items: ${itemArr.length}  (custom: ${itemArr.filter(i=>i.custom).length}, funmod: ${itemArr.filter(i=>i.funmod).length})`);
console.log(`mobs:  ${mobArr.length}  (with spawns: ${mobArr.filter(m=>m.spawns&&m.spawns.length).length})`);
console.log(`combos: ${comboCount} set(s)`);
console.log(`options: ${Object.keys(optTypes).length} types, ${optGroups.length} groups`);
console.log(`fun builds: ${funmodFamilyCount} families, ${funmodItemCount} items, ${buildCombos.length} combos`);
if (funmodItemCount !== expectedFunmodCount) {
  console.error(`ASSERTION FAILED: expected ${expectedFunmodCount} fun-mod item ids (counted live from the ${itemFiles.filter(f=>FUNMOD_RE.test(f)).length} FUNMOD_RE source files), builds.json has ${funmodItemCount}`);
  process.exitCode = 1;
}
console.log('sizes:',
  (fs.statSync(path.join(OUT,'items.json')).size/1048576).toFixed(2)+'MB items,',
  (fs.statSync(path.join(OUT,'mobs.json')).size/1048576).toFixed(2)+'MB mobs');
