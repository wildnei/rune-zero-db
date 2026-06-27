// ============================================================================
//  Rune Zero — game DB extractor
//  Parses the rAthena item/mob YAML DBs (base RE + our custom import) into lean
//  JSON the website consumes: items.json, mobs.json, meta.json.
//  Builds the item<->monster DROP cross-reference both ways.
//  Run: node wiki/tools/build-db.js   (from project root)
// ============================================================================
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');   // tolerant of rAthena's duplicate keys (uniqueKeys:false)

const ROOT = path.resolve(__dirname, '..', '..');
const RE = path.join(ROOT, 'server', 'rathena', 'db', 're');
const CUSTOM = path.join(ROOT, 'custom', 'db-import');
const OUT = path.join(ROOT, 'wiki', 'data');

function load(file) {
  if (!fs.existsSync(file)) { console.warn('skip (missing):', file); return []; }
  const doc = YAML.parse(fs.readFileSync(file, 'utf8'), { uniqueKeys: false, maxAliasCount: -1 });
  return (doc && doc.Body) || [];
}

// ---- items -----------------------------------------------------------------
const itemFiles = [
  path.join(RE, 'item_db_equip.yml'),
  path.join(RE, 'item_db_usable.yml'),
  path.join(RE, 'item_db_etc.yml'),
  path.join(CUSTOM, 'item_db.yml'),         // custom items + box overrides
  path.join(CUSTOM, 'item_db_equip.yml'),   // F11 trophy rebalances
  path.join(CUSTOM, 'item_db_essence.yml'), // class essences
  path.join(CUSTOM, 'item_db_eden_weapons.yml'), // Eden badge weapons
  path.join(CUSTOM, 'item_db_cash.yml'),         // cash-shop cosmetics + bundles (merged last)
];

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
      jobs: e.Jobs ? keys(e.Jobs) : (prev.jobs),         // [] / undefined = All
      loc: e.Locations ? keys(e.Locations) : prev.loc,
      classes: e.Classes ? keys(e.Classes) : prev.classes,
      refine: e.Refineable != null ? e.Refineable : prev.refine,
      view: e.View ?? prev.view,
      script: e.Script != null ? e.Script.trim() : prev.script,
      custom: custom ? true : (prev.custom || false),
      droppedBy: prev.droppedBy || [],
    });
    items.set(e.Id, it);
  }
}

// quick lookup by aegis for drop cross-ref
const byAegis = new Map();
for (const it of items.values()) if (it.aegis) byAegis.set(it.aegis, it);

// ---- mobs ------------------------------------------------------------------
const mobFiles = [ path.join(RE, 'mob_db.yml'), path.join(CUSTOM, 'mob_db.yml') ];
const mobs = new Map();

function mapDrops(list) {
  if (!Array.isArray(list)) return [];
  return list.map(d => ({
    item: d.Item, name: (byAegis.get(d.Item) || {}).name || d.Item,
    id: (byAegis.get(d.Item) || {}).id || null,
    rate: d.Rate || 0,
  }));
}

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
      drops: e.Drops ? mapDrops(e.Drops) : (prev.drops || []),
      mvpDrops: e.MvpDrops ? mapDrops(e.MvpDrops) : (prev.mvpDrops || []),
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
for (const it of items.values()) {
  it.boosts = [];
  if (!it.script) continue;
  const set = new Set(); let m; const re = /bSkillAtk,"([A-Z_0-9]+)"/g;
  while ((m = re.exec(it.script))) set.add(m[1]);
  it.boosts = [...set].map(s => ({ skill: s, t3: TIER3.test(s) }));
}

// ---- spawn locations (npc/re/mobs/**) --------------------------------------
function walkTxt(dir){ let r=[]; if(!fs.existsSync(dir))return r; for(const e of fs.readdirSync(dir,{withFileTypes:true})){const fp=path.join(dir,e.name); if(e.isDirectory())r=r.concat(walkTxt(fp)); else if(e.name.endsWith('.txt'))r.push(fp);} return r; }
const spawnByMob = new Map();
const reSpawn = /^([a-zA-Z0-9_@]+),\d+,\d+[^\t]*\t(?:boss_)?monster\t[^\t]*\t(\d+),(\d+)/;
for (const f of walkTxt(path.join(ROOT,'server','rathena','npc','re','mobs'))) {
  for (const line of fs.readFileSync(f,'utf8').split('\n')) {
    const mt = reSpawn.exec(line); if(!mt) continue;
    const id=+mt[2], map=mt[1], amt=+mt[3];
    if(!spawnByMob.has(id)) spawnByMob.set(id, new Map());
    const mm=spawnByMob.get(id); mm.set(map,(mm.get(map)||0)+amt);
  }
}
for (const m of mobs.values()){ const s=spawnByMob.get(m.id); m.spawns = s?[...s.entries()].map(([map,amt])=>({map,amt})).sort((a,b)=>b.amt-a.amt):[]; }

// ---- random options / enchants ---------------------------------------------
const SIZE={SMALL:'Small',MIDIUM:'Medium',LARGE:'Large'};
function humanizeOpt(name,script){
  const n=name||''; script=script||'';
  const sk=/bSkillAtk,"([A-Z_0-9]+)"/.exec(script);
  if(sk) return 'Skill Damage: '+sk[1]+' +N%';
  if(n.startsWith('RZ_RDMOPT_RES_')) return n.replace('RZ_RDMOPT_RES_','')[0]+n.replace('RZ_RDMOPT_RES_','').slice(1).toLowerCase()+' Resist';
  if(n==='RZ_RDMOPT_NORESIST_MOVE') return 'Resist Movement Slow';
  const map={VAR_MAXHPAMOUNT:'Max HP +N',VAR_MAXSPAMOUNT:'Max SP +N',VAR_ATTPOWER:'ATK +N',VAR_ATTMPOWER:'MATK +N',
    VAR_PLUSASPD:'ASPD +N',VAR_CRITICALSUCCESSVALUE:'Crit +N',DAMAGE_CRI_TARGET:'Crit Damage +N%',VAR_ITEMDEFPOWER:'DEF +N',
    DEC_SPELL_CAST_TIME:'Variable Cast -N%',DEC_SPELL_DELAY_TIME:'After-cast Delay -N%',DEC_SP_CONSUMPTION:'SP Cost -N%',
    RANGE_ATTACK_DAMAGE_USER:'Ranged Damage +N%',RANGE_ATTACK_DAMAGE_TARGET:'Ranged Damage Taken -N%',
    CLASS_DAMAGE_BOSS_USER:'Boss Damage Taken -N%',HEAL_MODIFY_PERCENT:'Heal Power +N%',MELEE_ATTACK_DAMAGE_USER:'Melee Damage +N%',
    ADDEXPPERCENT_KILLRACE_ALL:'EXP +N%',BODY_INDESTRUCTIBLE:'Indestructible',
    VAR_STRAMOUNT:'STR +N',VAR_AGIAMOUNT:'AGI +N',VAR_VITAMOUNT:'VIT +N',VAR_INTAMOUNT:'INT +N',VAR_DEXAMOUNT:'DEX +N',VAR_LUKAMOUNT:'LUK +N'};
  if(map[n]) return map[n];
  let mm=/^DAMAGE_SIZE_([A-Z]+)_TARGET$/.exec(n); if(mm) return 'Damage vs '+(SIZE[mm[1]]||mm[1])+' +N%';
  mm=/^DAMAGE_PROPERTY_([A-Z]+)_TARGET$/.exec(n); if(mm) return 'Damage vs '+mm[1][0]+mm[1].slice(1).toLowerCase()+' property +N%';
  mm=/^RACE_DAMAGE_([A-Z]+)$/.exec(n); if(mm) return 'Damage vs '+mm[1][0]+mm[1].slice(1).toLowerCase()+' race +N%';
  mm=/^ATTR_TOLERACE_([A-Z]+)$/.exec(n); if(mm) return mm[1][0]+mm[1].slice(1).toLowerCase()+' Resist +N%';
  mm=/^RACE_TOLERACE_([A-Z]+)$/.exec(n); if(mm) return mm[1][0]+mm[1].slice(1).toLowerCase()+' race Resist +N%';
  return n;   // fallback: raw option name
}
const optTypes = {};
for (const f of [path.join(RE,'item_randomopt_db.yml'), path.join(CUSTOM,'item_randomopt_db.yml')])
  for (const e of load(f)) if(e.Option) optTypes[e.Option] = { name:e.Option, desc:humanizeOpt(e.Option,e.Script), script:(e.Script||'').trim() };
const optGroups = [];
for (const f of [path.join(RE,'item_randomopt_group.yml'), path.join(CUSTOM,'item_randomopt_group.yml')])
  for (const g of load(f)) {
    const opts=[];
    for (const slot of (g.Slots||[])) for(const o of (slot.Options||[])) opts.push({name:o.Option,min:o.MinValue||0,max:o.MaxValue||0,chance:o.Chance||0,fixed:true});
    for (const o of (g.Random||[])) opts.push({name:o.Option,min:o.MinValue||0,max:o.MaxValue||0,chance:o.Chance||0,fixed:false});
    optGroups.push({ id:g.Id, name:g.Group, maxRandom:g.MaxRandom||0, custom:f.includes('db-import'), options:opts });
  }

// ---- skill names (aegis -> English, from skill_db Description) --------------
const skillNames = {};
for (const e of load(path.join(RE,'skill_db.yml'))) if(e.Name && e.Description) skillNames[e.Name]=e.Description;

// ---- write -----------------------------------------------------------------
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const itemArr = [...items.values()].filter(i => i.name).sort((a,b)=>a.id-b.id);
const mobArr  = [...mobs.values()].filter(m => m.name).sort((a,b)=>a.id-b.id);

fs.writeFileSync(path.join(OUT,'items.json'), JSON.stringify(itemArr));
fs.writeFileSync(path.join(OUT,'mobs.json'),  JSON.stringify(mobArr));
fs.writeFileSync(path.join(OUT,'options.json'), JSON.stringify({ types:optTypes, groups:optGroups }));
fs.writeFileSync(path.join(OUT,'skills.json'), JSON.stringify(skillNames));
fs.writeFileSync(path.join(OUT,'meta.json'), JSON.stringify({
  built: new Date().toISOString().slice(0,10),
  items: itemArr.length, mobs: mobArr.length,
  customItems: itemArr.filter(i=>i.custom).length,
  spawnedMobs: mobArr.filter(m=>m.spawns&&m.spawns.length).length,
  optionGroups: optGroups.length, optionTypes: Object.keys(optTypes).length,
  skillItems: itemArr.filter(i=>i.boosts&&i.boosts.length).length,
}));

console.log(`items: ${itemArr.length}  (custom: ${itemArr.filter(i=>i.custom).length})`);
console.log(`mobs:  ${mobArr.length}  (with spawns: ${mobArr.filter(m=>m.spawns&&m.spawns.length).length})`);
console.log(`options: ${Object.keys(optTypes).length} types, ${optGroups.length} groups`);
console.log('sizes:',
  (fs.statSync(path.join(OUT,'items.json')).size/1048576).toFixed(2)+'MB items,',
  (fs.statSync(path.join(OUT,'mobs.json')).size/1048576).toFixed(2)+'MB mobs');
