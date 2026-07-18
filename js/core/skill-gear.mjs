import { skillAttackAmplifiers } from '../render/entities.mjs';

export const CLASS_FAMILIES = [
  { id: 'lord-knight', name: 'Lord Knight', prefixes: ['SM', 'KN', 'LK'] },
  { id: 'paladin', name: 'Paladin', prefixes: ['CR', 'PA'] },
  { id: 'high-wizard', name: 'High Wizard', prefixes: ['MG', 'WZ', 'HW'] },
  { id: 'high-priest', name: 'High Priest', prefixes: ['AL', 'PR', 'HP'] },
  { id: 'whitesmith', name: 'Whitesmith', prefixes: ['MC', 'BS', 'WS'] },
  { id: 'creator', name: 'Creator', prefixes: ['AM'] },
  { id: 'sniper', name: 'Sniper', prefixes: ['AC', 'HT', 'SN'] },
  { id: 'assassin-cross', name: 'Assassin Cross', prefixes: ['TF', 'AS', 'ASC'] },
  { id: 'stalker', name: 'Stalker', prefixes: ['RG'] },
  { id: 'champion', name: 'Champion', prefixes: ['MO', 'CH'] },
  { id: 'professor', name: 'Professor', prefixes: ['SA', 'PF'] },
  { id: 'performer', name: 'Clown & Gypsy', prefixes: ['BA', 'DC', 'CG'] },
  { id: 'taekwon', name: 'Taekwon Family', prefixes: ['TK', 'SG', 'SL'], expanded: true },
  { id: 'gunslinger', name: 'Gunslinger', prefixes: ['GS'], expanded: true },
  { id: 'ninja', name: 'Ninja', prefixes: ['NJ'], expanded: true },
];

const CREATOR_CR_SKILLS = new Set(['CR_ACIDDEMONSTRATION', 'CR_CULTIVATION', 'CR_SLIMPITCHER', 'CR_FULLPROTECTION']);
const NON_PLAYER_PREFIXES = new Set(['MA']);
const normalize = value => String(value ?? '').trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');

export function classFamilyForSkill(skillId) {
  if (CREATOR_CR_SKILLS.has(skillId)) return CLASS_FAMILIES.find(family => family.id === 'creator');
  const prefix = String(skillId).split('_')[0];
  return CLASS_FAMILIES.find(family => family.prefixes.includes(prefix)) || { id: 'other', name: 'Other', prefixes: [] };
}

export function buildSkillGearIndex(items = [], skillNames = {}) {
  const groups = new Map();
  for (const item of items) {
    const amplifiers = skillAttackAmplifiers(item.script);
    for (const boost of item.boosts || []) {
      if (boost.t3) continue;
      const skillId = boost.skill;
      if (NON_PLAYER_PREFIXES.has(String(skillId).split('_')[0])) continue;
      const family = classFamilyForSkill(skillId);
      const amp = amplifiers.find(entry => entry.skill === skillId);
      if (!groups.has(skillId)) groups.set(skillId, { skillId, name: skillNames[skillId] || boost.name || skillId, family, items: [] });
      groups.get(skillId).items.push({ ...item, percent: amp?.percent ?? null, rebalanced: Boolean(item.funmod), category: item.type || 'Other' });
    }
  }
  return [...groups.values()]
    .map(group => ({ ...group, items: group.items.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterSkillGear(index, { classId = 'all', query = '', category = 'all', rebalancedOnly = false, skillId = '' } = {}) {
  const needle = normalize(query);
  return index.flatMap(group => {
    if (classId !== 'all' && group.family.id !== classId) return [];
    if (skillId && group.skillId !== skillId) return [];
    const groupMatches = !needle || normalize(`${group.name} ${group.skillId}`).includes(needle);
    const items = group.items.filter(item => (category === 'all' || item.category === category)
      && (!rebalancedOnly || item.rebalanced)
      && (groupMatches || normalize(`${item.name} ${item.aegis || ''}`).includes(needle)));
    return items.length ? [{ ...group, items }] : [];
  });
}
