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

// ---- skill names (aegis -> English, from skill_db Description) — load early
//      so random-option skill-damage descriptions can resolve real skill names.
const skillNames = {};
for (const e of load(path.join(RE,'skill_db.yml'))) if(e.Name && e.Description) skillNames[e.Name]=e.Description;

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

// ---- element damage table (attr_fix.yml) -----------------------------------
// matrix[defLevel-1][attackEleIdx][defendEleIdx] = damage % (100 = normal).
// Powers the wiki's "what to hit it with" matchup. Element order = RO index 0-9
// (note: index 7 is "Dark"/Shadow in the YAML).
const ELE_ORDER=['Neutral','Water','Earth','Fire','Wind','Poison','Holy','Dark','Ghost','Undead'];
const elemMatrix=[];
for (const lvl of load(path.join(RE,'attr_fix.yml'))) {
  const li=(lvl.Level||1)-1; elemMatrix[li]=[];
  ELE_ORDER.forEach((atk,ai)=>{ const row=lvl[atk]||{}; elemMatrix[li][ai]=ELE_ORDER.map(def=>row[def]!=null?row[def]:100); });
}

// ---- Hunting Log quests (custom IDs 710000-719999) -------------------------
// Mirrors custom/db-import/quest_db.yml so the wiki can show every milestone.
// Reward text is parsed from the quest Title's "(...)" suffix.
const mobByAegis = new Map();
for (const m of mobs.values()) if (m.aegis) mobByAegis.set(m.aegis, { name: m.name, id: m.id });
const hunting = { monster: [], region: [] };
for (const q of load(path.join(CUSTOM, 'quest_db.yml'))) {
  if (q.Id == null || q.Id < 710000 || q.Id > 719999) continue;
  const mt = /(?:Hunting Log:|Region:)\s*(.+?)\s*\(([^)]+)\)\s*$/.exec(q.Title || '');
  const title = mt ? mt[1].trim() : (q.Title || '');
  const reward = mt ? mt[2].trim() : '';
  const targets = (q.Targets || []).map(t => {
    const mob = t.Mob ? mobByAegis.get(t.Mob) : null;
    return { mob: mob ? mob.name : (t.Mob || null), mobId: mob ? mob.id : null,
             count: t.Count || 0, map: t.Location || null, mapName: t.MapName || t.Location || null };
  });
  const rec = { id: q.Id, title, reward, targets };
  (targets.some(t => t.map) ? hunting.region : hunting.monster).push(rec);
}

// ---- write -----------------------------------------------------------------
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const itemArr = [...items.values()].filter(i => i.name).sort((a,b)=>a.id-b.id);
const mobArr  = [...mobs.values()].filter(m => m.name).sort((a,b)=>a.id-b.id);

fs.writeFileSync(path.join(OUT,'items.json'), JSON.stringify(itemArr));
fs.writeFileSync(path.join(OUT,'mobs.json'),  JSON.stringify(mobArr));
fs.writeFileSync(path.join(OUT,'options.json'), JSON.stringify({ types:optTypes, groups:optGroups }));
fs.writeFileSync(path.join(OUT,'skills.json'), JSON.stringify(skillNames));
fs.writeFileSync(path.join(OUT,'elements.json'), JSON.stringify({ order:ELE_ORDER, matrix:elemMatrix }));
fs.writeFileSync(path.join(OUT,'hunting.json'), JSON.stringify(hunting));
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
